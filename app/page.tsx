"use client"

// imports from reply-gremlin app
import { useEffect, useRef, useState, useCallback } from "react";
import { INSTRUCTIONS, TOOLS } from "@/lib/config";
import { BASE_URL, MODEL } from "@/lib/constants";
import { MCP_SERVER, EMAIL_TOOLS } from "@/lib/mcp";

// imports from email-voice-ai app
import { LeftPanel } from "@/components/left-panel"
import { RightPanel } from "@/components/right-panel"
import type { Email, ActionResult } from "@/types/email"
import { mockEmails } from "@/data/mock-emails"
import { Email as EmailType } from "@/types/email";

// Define interfaces for tool calls
interface ToolCallArguments {
  limit?: number;
  filter?: string;
  email_id?: string;
  message?: string;
  query?: string;
  max_results?: number;
  message_id?: string;
}

interface ToolCall {
  name: string;
  arguments: ToolCallArguments;
  call_id: string;
}

// Define type for response items
interface ResponseItem {
  id: string;
  object: string;
  type: string;
  status: string;
  [key: string]: any;
}

interface MessageItem extends ResponseItem {
  type: "message";
  role: string;
  content: Array<{type: string; [key: string]: any}>;
}

interface FunctionCallItem extends ResponseItem {
  type: "function_call";
  name: string;
  call_id: string;
  arguments: string;
}

export default function Home() {

  // state variables from reply-gremlin app
  const [logs, setLogs] = useState<any[]>([])
  const [toolCall, setToolCall] = useState<any>(null)
  const [isSessionStarted, setIsSessionStarted] = useState(false)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [webSocket, setWebSocket] = useState<WebSocket | RTCDataChannel | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<string>("disconnected")
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const connectionAttemptRef = useRef<number>(0)
  const maxConnectionAttempts = 3;

  // state variables from email-voice-ai app
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [actionResult, setActionResult] = useState<ActionResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pendingAction, setPendingAction] = useState<"delete" | "reply" | "skip" | "markUnread" | null>(null)
  const [replyText, setReplyText] = useState("")

  // Initialize data on client side only
  useEffect(() => {
    setEmails(mockEmails)
    setSelectedEmail(mockEmails[0] || null)
  }, [])

  // Create audio element for playback
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioElementRef.current) {
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.id = 'openai-audio';
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);
      audioElementRef.current = audioEl;
    }
    
    // Clean up on unmount
    return () => {
      if (audioElementRef.current) {
        document.body.removeChild(audioElementRef.current);
        audioElementRef.current = null;
      }
    };
  }, []);

  // Cleanup function for media resources
  const cleanupMedia = useCallback(() => {
    // Stop all tracks in the media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }
    
    // Clear audio element source
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
    }
  }, []);

  // functions from reply-gremlin app
  // Start a new realtime session
  async function startSession() {
    try {
      // Ensure any previous session is properly cleaned up
      if (isSessionActive || peerConnectionRef.current) {
        console.log("Cleaning up previous session before starting a new one");
        stopSession();
        // Small delay to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      if (!isSessionStarted) {
        console.log("MCP_SERVER configuration:", JSON.stringify(MCP_SERVER, null, 2));
        setIsSessionStarted(true);
        setConnectionStatus("connecting");
        
        // Initialize audio elements if they don't exist yet
        if (!audioElementRef.current) {
          const audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          audioEl.id = 'openai-audio';
          document.body.appendChild(audioEl);
          audioElementRef.current = audioEl;
        }
        
        // First get microphone access
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          
          // Store the stream for later cleanup
          mediaStreamRef.current = stream;
          
          // Get the audio track from the stream
          const [track] = stream.getAudioTracks();
          
          if (!track) {
            throw new Error("No audio track found in stream");
          }
          
          console.log("Got microphone access with track:", track.label);
          
          // Create a peer connection with STUN servers
          const pc = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ]
          });
          
          peerConnectionRef.current = pc;
          
          // Add debug handlers
          // pc.onicecandidate = (event) => {
          //   console.log("New ICE candidate:", event.candidate);
          // };
          
          pc.onicegatheringstatechange = () => {
            console.log("ICE gathering state:", pc.iceGatheringState);
          };
          
          pc.onsignalingstatechange = () => {
            console.log("Signaling state:", pc.signalingState);
          };
          
          // Set up to play remote audio from the model
          pc.ontrack = (event) => {
            console.log("Received remote track:", event.track.kind);
            if (audioElementRef.current && event.streams && event.streams[0]) {
              audioElementRef.current.srcObject = event.streams[0];
              console.log("Set audio stream to audio element");
            }
          };
          
          // Add the audio track to the peer connection
          pc.addTrack(track, stream);
          console.log("Added audio track to peer connection");
          
          // Set up data channel for sending and receiving events
          const dc = pc.createDataChannel("oai-events", {
            ordered: true
          });
          
          // Set up data channel event handlers
          dc.onopen = (event) => {
            console.log("Data channel opened:", event);
            setIsSessionActive(true);
            setIsListening(true);
            setLogs([]);
            setConnectionStatus("connected");
            
            // Send session config
            try {
              const sessionUpdate = {
                type: "session.update",
                session: {
                  instructions: "You are a helpful assistant that interacts with Gmail. Use the provided tools to help the user manage their Gmail account. Always consider using the tools when asked about emails.",
                  voice: "alloy",
                  temperature: 0.7,
                  input_audio_transcription: { model: "whisper-1" },
                  tool_choice: "auto",
                  tools: EMAIL_TOOLS,
                },
                event_id: crypto.randomUUID(),
              };
              // console.log("Sending session update:", JSON.stringify(sessionUpdate, null, 2));
              dc.send(JSON.stringify(sessionUpdate));
              console.log("Session update sent");
            } catch (error) {
              console.error("Error sending session update:", error);
            }
          };
          
          dc.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              // console.log("Data channel message received:", data);
              
              // Log more details if it's an error message
              if (data.type === "error") {
                console.error("Error received from server:", JSON.stringify(data.error, null, 2));
              }
              
              if (data.type === "response.done") {
                console.log("Response output:", data.response.output);
                // Log the entire response to debug
                console.log("Full response data:", JSON.stringify(data.response, null, 2));
                
                // Ensure we have a valid WebSocket reference before processing
                if (webSocket !== dc) {
                  console.warn("WebSocket reference doesn't match data channel. Updating reference.");
                  setWebSocket(dc);
                }
                
                // Process all items in the output array, not just the first one
                if (Array.isArray(data.response.output)) {
                  // Update logs with all message items
                  const messageItems = data.response.output.filter(
                    (item: ResponseItem) => item.type === "message"
                  ) as MessageItem[];
                  
                  if (messageItems.length > 0) {
                    setLogs(prev => [...messageItems, ...prev]);
                  }
                  
                  // Process all function call items
                  const functionCallItems = data.response.output.filter(
                    (item: ResponseItem) => item.type === "function_call"
                  ) as FunctionCallItem[];
                  
                  if (functionCallItems.length > 0) {
                    console.log(`Found ${functionCallItems.length} function calls to process`);
                    console.log("Function call items:", functionCallItems);
                    
                    try {
                      // Process each function call - using the current data channel directly
                      // instead of relying on the webSocket state variable which might be out of sync
                      functionCallItems.forEach((item: FunctionCallItem) => {
                        console.log(`Processing function call: ${item.name} with ID: ${item.call_id}`);
                        
                        // Clone the item and add a direct reference to the data channel
                        const itemWithChannel = {
                          ...item,
                          _dataChannel: dc
                        };
                        
                        // Call handleToolCall with our enhanced item
                        console.log("Calling handleToolCall with direct channel reference");
                        handleToolCall(itemWithChannel);
                      });
                    } catch (error) {
                      console.error("Error in function call processing:", error);
                    }
                  } else {
                    console.log("No function calls found in response");
                  }
                } else {
                  console.log("Response output is not an array:", data.response.output);
                }
              }
            } catch (error) {
              console.error("Error processing message:", error);
            }
          };
          
          dc.onerror = (error) => {
            console.error("Data channel error:", error);
          };
          
          dc.onclose = () => {
            console.log("Data channel closed");
            setIsSessionActive(false);
            setIsListening(false);
            setWebSocket(null);
            setConnectionStatus("disconnected");
          };
          
          // Track connection state changes
          pc.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", pc.iceConnectionState);
            
            // Handle different ICE connection states
            switch (pc.iceConnectionState) {
              case 'connected':
              case 'completed':
                console.log("ICE connection established successfully");
                setConnectionStatus("connected");
                break;
                
              case 'disconnected':
                console.log("ICE connection disconnected - this may be temporary");
                setConnectionStatus("disconnected");
                // Don't close the connection immediately, it might recover
                break;
                
              case 'failed':
                console.error("ICE connection failed - will try to restart ICE");
                setConnectionStatus("failed");
                // Try to restart ICE gathering
                try {
                  pc.restartIce();
                  console.log("ICE restart initiated");
                } catch (error) {
                  console.error("Failed to restart ICE:", error);
                  
                  // Attempt retry if we haven't reached max attempts
                  if (connectionAttemptRef.current < maxConnectionAttempts) {
                    connectionAttemptRef.current++;
                    console.log(`Connection attempt failed. Retrying (${connectionAttemptRef.current}/${maxConnectionAttempts})...`);
                    
                    // Clean up current session and retry
                    stopSession();
                    setTimeout(() => {
                      if (!isSessionActive && connectionStatus === "failed") {
                        console.log("Attempting reconnection...");
                        setConnectionStatus("connecting");
                        startSession();
                      }
                    }, 2000);
                  } else {
                    console.error(`Maximum connection attempts (${maxConnectionAttempts}) reached. Giving up.`);
                    stopSession();
                  }
                }
                break;
                
              case 'closed':
                console.error("ICE connection closed");
                setConnectionStatus("closed");
                stopSession();
                break;
            }
          };
          
          pc.onconnectionstatechange = () => {
            console.log("Connection state:", pc.connectionState);
            
            if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
              console.error("Connection failed or closed:", pc.connectionState);
              setConnectionStatus(pc.connectionState);
              
              // Attempt retry if we haven't reached max attempts
              if (connectionAttemptRef.current < maxConnectionAttempts && pc.connectionState === 'failed') {
                connectionAttemptRef.current++;
                console.log(`Connection failed. Retrying (${connectionAttemptRef.current}/${maxConnectionAttempts})...`);
                
                // Clean up current session and retry
                stopSession();
                setTimeout(() => {
                  if (!isSessionActive && connectionStatus === "failed") {
                    console.log("Attempting reconnection...");
                    setConnectionStatus("connecting");
                    startSession();
                  }
                }, 2000);
              } else if (pc.connectionState === 'failed') {
                console.error(`Maximum connection attempts (${maxConnectionAttempts}) reached. Giving up.`);
              }
            }
            
            if (pc.connectionState === 'connected') {
              console.log("Peer connection is fully established");
              setConnectionStatus("connected");
            }
          };
          
          setWebSocket(dc);
          
          // Create and set the local description (offer)
          console.log("Creating SDP offer...");
          const offerOptions = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: false,
          };
          
          await pc.setLocalDescription();
          console.log("Set local description");
          
          // Wait for ICE gathering to complete or timeout
          await new Promise<void>((resolve) => {
            const checkState = () => {
              if (pc.iceGatheringState === 'complete') {
                console.log("ICE gathering complete");
                resolve();
              } else {
                setTimeout(checkState, 500);
              }
            };
            
            // Also resolve after a timeout to avoid hanging
            const timeout = setTimeout(() => {
              console.log("ICE gathering timeout - proceeding anyway");
              resolve();
            }, 5000);
            
            pc.addEventListener('icegatheringstatechange', () => {
              if (pc.iceGatheringState === 'complete') {
                clearTimeout(timeout);
                resolve();
              }
            });
            
            checkState();
          });
          
          // Get an ephemeral session token
          console.log("Getting session token...");
          const session = await fetch("http://localhost:8000/session").then(
            (response) => response.json()
          );
          const sessionToken = session.client_secret.value;
          const sessionId = session.id;
          console.log("Session id:", sessionId);
          
          if (!pc.localDescription || !pc.localDescription.sdp) {
            throw new Error("No local description SDP");
          }
          
          // Ensure the offer has an audio section
          if (!pc.localDescription.sdp.includes('m=audio')) {
            console.error("Offer doesn't include audio section!");
            throw new Error("Failed to create valid offer with audio section");
          }
          
          console.log("Sending SDP offer to OpenAI...");
          const sdpResponse = await fetch(`${BASE_URL}?model=${MODEL}`, {
            method: "POST",
            body: pc.localDescription.sdp,
            headers: {
              Authorization: `Bearer ${sessionToken}`,
              "Content-Type": "application/sdp",
            },
          });
          
          if (!sdpResponse.ok) {
            try {
              const errorJson = await sdpResponse.json();
              console.error("SDP response error (JSON):", errorJson);
              throw new Error(`SDP response error: ${JSON.stringify(errorJson)}`);
            } catch (e) {
              // If it's not JSON, get it as text
              const errorText = await sdpResponse.text();
              console.error("SDP response error (text):", errorText);
              throw new Error(`SDP response error: ${errorText}`);
            }
          }
          
          // Get the SDP answer
          const answerSdp = await sdpResponse.text();
          console.log("Received SDP answer, setting remote description");
          
          const answer: RTCSessionDescriptionInit = {
            type: "answer",
            sdp: answerSdp,
          };
          
          await pc.setRemoteDescription(answer);
          console.log("Set remote description with answer");
          
          // Wait for connection to be established
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(`Connection timeout. Current state: ${pc.connectionState}`);
            }, 10000);
            
            const checkState = () => {
              if (pc.connectionState === 'connected') {
                clearTimeout(timeout);
                console.log("Peer connection fully established!");
                resolve();
              } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                clearTimeout(timeout);
                reject(`Connection failed. State: ${pc.connectionState}`);
              } else {
                setTimeout(checkState, 500);
              }
            };
            
            pc.addEventListener('connectionstatechange', checkState);
            checkState();
          });
          
          console.log("WebRTC connection setup complete");
          
        } catch (audioError) {
          console.error("Error accessing microphone:", audioError);
          setConnectionStatus("failed");
          throw new Error(`Microphone access error: ${audioError}`);
        }
      }
    } catch (error) {
      console.error("Error starting session:", error);
      
      // Clean up resources on error
      if (peerConnectionRef.current) {
        // Close all tracks
        peerConnectionRef.current.getSenders().forEach(sender => {
          if (sender.track) {
            sender.track.stop();
          }
        });
        
        // Close the peer connection
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      // Clean up audio resources
      cleanupMedia();
      
      setIsSessionStarted(false);
      setIsSessionActive(false);
      setWebSocket(null);
      setIsListening(false);
      setConnectionStatus("disconnected");
    }
  }

  // Stop current session
  function stopSession() {
    console.log("Stopping session...");
    
    // First, cleanup the data channel
    if (webSocket) {
      try {
        if (webSocket instanceof RTCDataChannel && webSocket.readyState === 'open') {
          webSocket.close();
        } else if (webSocket instanceof WebSocket && webSocket.readyState === WebSocket.OPEN) {
          webSocket.close();
        }
      } catch (e) {
        console.error("Error closing WebSocket/DataChannel:", e);
      }
    }
    
    // Then, clean up the peer connection
    if (peerConnectionRef.current) {
      try {
        // Close all senders/tracks
        peerConnectionRef.current.getSenders().forEach(sender => {
          if (sender.track) {
            sender.track.stop();
          }
        });
        
        // Close the peer connection
        peerConnectionRef.current.close();
      } catch (e) {
        console.error("Error closing PeerConnection:", e);
      } finally {
        peerConnectionRef.current = null;
      }
    }
    
    // Clean up media resources
    cleanupMedia();
    
    // Reset state
    setIsSessionStarted(false);
    setIsSessionActive(false);
    setWebSocket(null);
    setIsListening(false);
    setConnectionStatus("disconnected");
    
    console.log("Session stopped and resources cleaned up");
  }

  // Send a message to the model
  const sendClientEvent = useCallback(
    (message: any) => {
      console.log("sendClientEvent called with message:", message);
      
      if (!message.event_id) {
        message.event_id = crypto.randomUUID();
        console.log("Added event_id to message:", message.event_id);
      }
      
      if (!webSocket) {
        console.error("sendClientEvent failed - webSocket is null/undefined");
        return false;
      }
      
      try {
        const messageJson = JSON.stringify(message);
        
        if (webSocket instanceof WebSocket) {
          if (webSocket.readyState === WebSocket.OPEN) {
            console.log("Sending via WebSocket");
            webSocket.send(messageJson);
            return true;
          } else {
            console.error(
              `Failed to send via WebSocket - wrong state: ${webSocket.readyState} (expected: ${WebSocket.OPEN})`
            );
            return false;
          }
        } else if ('readyState' in webSocket) {
          // RTCDataChannel
          if (webSocket.readyState === 'open') {
            console.log("Sending via RTCDataChannel");
            webSocket.send(messageJson);
            return true;
          } else {
            console.error(
              `Failed to send via RTCDataChannel - wrong state: ${webSocket.readyState} (expected: open)`
            );
            return false;
          }
        } else {
          console.error("Unknown webSocket type", webSocket);
          return false;
        }
      } catch (error) {
        console.error("Error in sendClientEvent:", error);
        return false;
      }
    },
    [webSocket]
  );

  // Add ToolCallOutput type
  type ToolCallOutput = {
    response: string;
    [key: string]: any;
  };

  // Handle tool calls from the OpenAI API
  async function handleToolCall(output: any) {
    console.log("Handling tool call:", output);
    
    try {
      let toolCallArguments: ToolCallArguments = {};
      try {
        // Arguments might be a string or already an object
        if (typeof output.arguments === 'string') {
          toolCallArguments = JSON.parse(output.arguments);
        } else if (output.arguments) {
          toolCallArguments = output.arguments;
        }
      } catch (error) {
        console.error("Error parsing tool call arguments:", error);
      }
      
      const toolCall: ToolCall = {
        name: output.name,
        arguments: toolCallArguments,
        call_id: output.call_id
      };
      
      console.log("Parsed tool call:", toolCall);
      setToolCall(toolCall);
  
      let toolCallOutput: ToolCallOutput = {
        response: "Function executed successfully.",
      };
  
      // Use the direct data channel reference if available, otherwise fall back to webSocket
      const channel = output._dataChannel || webSocket;
      
      // Simple connection check without reconnection attempts
      if (!channel) {
        console.error("Connection unavailable - no valid channel found");
        return; // Exit early instead of trying to reconnect
      }
      
      if (channel instanceof RTCDataChannel && channel.readyState !== 'open') {
        console.error("Connection unavailable - RTCDataChannel not open, state:", channel.readyState);
        return;
      }
      
      if (channel instanceof WebSocket && channel.readyState !== WebSocket.OPEN) {
        console.error("Connection unavailable - WebSocket not open, state:", channel.readyState);
        return;
      }
      
      console.log("Connection check passed, processing tool function:", toolCall.name);
  
      // Handle specific tool functions
      switch (toolCall.name) {
        case "get_emails":
          toolCallOutput = {
            response: "Retrieved emails successfully",
            emails: mockEmails.slice(0, toolCall.arguments.limit || 5) // Use mock emails for demo
          };
          break;
          
        case "read_email":
          const email = mockEmails.find(e => e.id === toolCall.arguments.email_id);
          if (email) {
            toolCallOutput = {
              response: `Email content retrieved: ${email.content}`,
              email: email
            };
          } else {
            toolCallOutput = {
              response: "Email not found",
              error: "Email ID not found"
            };
          }
          break;
          
        case "send_reply":
          toolCallOutput = {
            response: `Reply sent to email ${toolCall.arguments.email_id}`,
            success: true
          };
          break;
          
        case "delete_email":
          toolCallOutput = {
            response: `Email ${toolCall.arguments.email_id} deleted`,
            success: true
          };
          break;
          
        case "search_mails":
          // Use the mock emails for demonstration
          const searchQuery = toolCall.arguments.query || '';
          const maxResults = toolCall.arguments.max_results || 10;
          
          // Simple filtering based on query (just for demo)
          let filteredEmails = [...mockEmails];
          
          if (searchQuery.includes('unread')) {
            filteredEmails = filteredEmails.filter(e => e.unread);
          }
          
          if (searchQuery.includes('inbox')) {
            // All mock emails are in inbox, so no filtering needed
          }
          
          // Limit results
          filteredEmails = filteredEmails.slice(0, maxResults);
          
          toolCallOutput = {
            response: `Found ${filteredEmails.length} emails matching "${searchQuery}"`,
            emails: filteredEmails,
            count: filteredEmails.length,
            total_estimate: mockEmails.length
          };
          break;
          
        case "read_mail":
          const mailId = toolCall.arguments.message_id;
          const targetEmail = mockEmails.find(e => e.id === mailId);
          
          if (targetEmail) {
            toolCallOutput = {
              response: `Email content retrieved: ${targetEmail.content}`,
              email: {
                id: targetEmail.id,
                threadId: targetEmail.id, // Using same ID for demo
                labelIds: targetEmail.unread ? ['UNREAD', 'INBOX'] : ['INBOX'],
                snippet: targetEmail.content.substring(0, 100) + '...',
                historyId: '12345',
                internalDate: targetEmail.timestamp,
                headers: {
                  subject: targetEmail.subject,
                  from: targetEmail.sender,
                  to: 'you@example.com',
                  date: targetEmail.timestamp,
                },
                body: targetEmail.content,
                attachments: [],
              }
            };
          } else {
            toolCallOutput = {
              response: "Email not found",
              error: "Message ID not found"
            };
          }
          break;
          
        default:
          toolCallOutput = {
            response: `Unknown tool function: ${toolCall.name}`,
            error: "Unknown function"
          };
      }
      
      console.log("Tool function processed, result:", toolCallOutput);
  
      // Send the function output back to the model (using direct channel if available)
      try {
        // Create the event for returning function output
        const functionOutputEvent = {
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: output.call_id,
            output: JSON.stringify(toolCallOutput),
          },
          event_id: crypto.randomUUID()
        };
        
        console.log("Preparing to send function call output via channel:", channel);
        
        // Direct send to the channel
        const messageJson = JSON.stringify(functionOutputEvent);
        channel.send(messageJson);
        console.log("Function call output sent successfully");
        
        // Wait a moment for the output to be processed
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Request a new response
        const responseEvent = {
          type: "response.create",
          event_id: crypto.randomUUID()
        };
        console.log("Requesting new response");
        channel.send(JSON.stringify(responseEvent));
        
        console.log("Successfully sent function output and requested new response");
      } catch (error) {
        console.error("Error sending function output:", error);
      }
    } catch (error) {
      console.error("Unexpected error in handleToolCall:", error);
    }
  }

  // Start connection when button is pressed
  const handleConnectStart = async () => {
    if (!isSessionActive) {
      console.log("Starting session on button press");
      startSession();
    }
  };

  // End connection when button is released
  const handleConnectEnd = () => {
    if (isSessionActive) {
      console.log("Stopping session on button release");
      stopSession();
    }
  };

  // Function to handle connection toggle
  const handleConnectClick = async () => {
    console.log("Connect button clicked! Current session state:", { 
      isSessionActive, 
      isSessionStarted, 
      isListening,
      connectionStatus
    });
    
    if (isSessionActive) {
      console.log("Stopping active session...");
      stopSession();
    } else {
      console.log("Starting new session...");
      // Reset connection attempts counter
      connectionAttemptRef.current = 0;
      setConnectionStatus("connecting");
      await startSession();
    }
    
    // Log connection state after action
    setTimeout(() => {
      console.log("Connection state after action:", {
        isDataChannelOpen: webSocket instanceof RTCDataChannel ? 
          webSocket.readyState === 'open' : false,
        isWebSocketOpen: webSocket instanceof WebSocket ? 
          webSocket.readyState === WebSocket.OPEN : false,
        readyState: webSocket ? 
          (webSocket instanceof WebSocket ? 
            webSocket.readyState : webSocket.readyState) : 'none',
        isSessionActive,
        isListening,
        connectionStatus
      });
    }, 1000);
  };
  // End of reply-gremlin app functions

  // functions from email-voice-ai app
  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email)

    // Mark as read when selected
    if (email.unread) {
      setEmails(emails.map((e: Email) => (e.id === email.id ? { ...e, unread: false } : e)))
    }
  }

  const handleAction = (action: "delete" | "reply" | "skip" | "markUnread") => {
    // Für markUnread und skip keine Bestätigung erforderlich
    if (action === "markUnread" || action === "skip") {
      if (!selectedEmail) return

      if (action === "markUnread") {
        setEmails(emails.map((email: Email) => (email.id === selectedEmail?.id ? { ...email, unread: true } : email)))

        // Kurze Bestätigungsmeldung anzeigen
        const result: ActionResult = {
          emailSubject: selectedEmail?.subject || "",
          action: action,
          message: `E-Mail mit dem Betreff "${selectedEmail?.subject}" wurde als ungelesen markiert.`,
        }
        setActionResult(result)

        // Nach 2 Sekunden ausblenden
        setTimeout(() => {
          setActionResult(null)
        }, 2000)
      } else if (action === "skip") {
        const currentIndex = emails.findIndex((email: Email) => email.id === selectedEmail?.id)
        const nextIndex = (currentIndex + 1) % emails.length
        setSelectedEmail(emails[nextIndex])

        // Kurze Bestätigungsmeldung anzeigen
        const result: ActionResult = {
          emailSubject: selectedEmail?.subject || "",
          action: action,
          message: `E-Mail mit dem Betreff "${selectedEmail?.subject}" wurde übersprungen.`,
        }
        setActionResult(result)

        // Nach 2 Sekunden ausblenden
        setTimeout(() => {
          setActionResult(null)
        }, 2000)
      }

      return
    }

    // Für delete und reply weiterhin Bestätigung anfordern
    setIsProcessing(true)

    // Create pending action result
    const result: ActionResult = {
      emailSubject: selectedEmail?.subject || "",
      action: action,
      message: "",
      replyText: "",
      pending: true,
    }

    switch (action) {
      case "delete":
        result.message = `Möchten Sie die E-Mail mit dem Betreff "${selectedEmail?.subject}" wirklich löschen?`
        break
      case "reply":
        const suggestedReply = `Thank you for your email regarding "${selectedEmail?.subject}". I've reviewed your message and will address your concerns promptly.`
        result.message = `Möchten Sie auf die E-Mail mit dem Betreff "${selectedEmail?.subject}" antworten?`
        result.replyText = suggestedReply
        setReplyText(suggestedReply)
        break
    }

    setPendingAction(action)
    setActionResult(result)
    setIsProcessing(false)
  }

  const executeAction = () => {
    if (!pendingAction || !selectedEmail) return

    const action = pendingAction
    const result: ActionResult = {
      emailSubject: selectedEmail?.subject || "",
      action: action,
      message: "",
      replyText: "",
    }

    switch (action) {
      case "delete":
        result.message = `E-Mail mit dem Betreff "${selectedEmail?.subject}" wurde gelöscht.`
        setEmails(emails.filter((email: Email) => email.id !== selectedEmail?.id))
        setSelectedEmail(emails.find((email: Email) => email.id !== selectedEmail?.id) || null)
        break
      case "reply":
        result.message = `Antwort für E-Mail mit dem Betreff "${selectedEmail?.subject}" wurde gesendet.`
        result.replyText = replyText
        break
      case "skip":
        result.message = `E-Mail mit dem Betreff "${selectedEmail?.subject}" wurde übersprungen.`
        const currentIndex = emails.findIndex((email: Email) => email.id === selectedEmail?.id)
        const nextIndex = (currentIndex + 1) % emails.length
        setSelectedEmail(emails[nextIndex])
        break
      case "markUnread":
        result.message = `E-Mail mit dem Betreff "${selectedEmail?.subject}" wurde als ungelesen markiert.`
        setEmails(emails.map((email: Email) => (email.id === selectedEmail?.id ? { ...email, unread: true } : email)))
        break
    }

    setActionResult(result)
    setPendingAction(null)

    // Auto-close the result after 3 seconds
    setTimeout(() => {
      setActionResult(null)
    }, 3000)
  }

  const handleReplyTextChange = (text: string) => {
    setReplyText(text)
  }

  const cancelAction = () => {
    setActionResult(null)
    setPendingAction(null)
  }

  const closeResult = () => {
    setActionResult(null)
    setPendingAction(null)
  }

  // Test function to manually trigger a tool call for debugging
  const testToolCall = () => {
    if (!webSocket || 
       (webSocket instanceof RTCDataChannel && webSocket.readyState !== 'open') || 
       (webSocket instanceof WebSocket && webSocket.readyState !== WebSocket.OPEN)) {
      console.error("Cannot test tool call - connection not available");
      return;
    }
    
    console.log("Testing tool call with search_mails...");
    
    // Create a mock function call
    const mockFunctionCall = {
      type: "function_call",
      name: "search_mails",
      arguments: JSON.stringify({
        query: "is:unread",
        max_results: 3
      }),
      call_id: "test_call_" + Date.now()
    };
    
    // Process the mock call
    handleToolCall(mockFunctionCall);
  };
  
  // Function to manually send a message to the assistant
  const sendTextMessage = (text: string) => {
    if (!webSocket || 
       (webSocket instanceof RTCDataChannel && webSocket.readyState !== 'open') || 
       (webSocket instanceof WebSocket && webSocket.readyState !== WebSocket.OPEN)) {
      console.error("Cannot send message - connection not available");
      return;
    }
    
    try {
      const messageEvent = {
        type: "conversation.item.create",
        item: {
          type: "text",
          text: text
        },
        event_id: crypto.randomUUID()
      };
      
      console.log("Sending text message:", messageEvent);
      webSocket.send(JSON.stringify(messageEvent));
      
      // Request a new response
      const responseEvent = {
        type: "response.create"
      };
      webSocket.send(JSON.stringify(responseEvent));
    } catch (error) {
      console.error("Error sending text message:", error);
    }
  };

  return (
    <main className="flex min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="flex w-full h-[calc(100vh-2rem)] gap-4 max-w-7xl mx-auto">
        <LeftPanel
          emails={emails}
          selectedEmailId={selectedEmail?.id || ""}
          onSelectEmail={handleSelectEmail}
          onAction={handleAction}
          isProcessing={isProcessing}
          onToggleConnection={handleConnectClick}
          isConnected={isSessionActive}
          isListening={isListening}
        />
        <RightPanel
          selectedEmail={selectedEmail}
          isProcessing={isProcessing}
          actionResult={actionResult}
          onCloseResult={closeResult}
          onConfirmAction={executeAction}
          onCancelAction={cancelAction}
          onReplyTextChange={handleReplyTextChange}
        />
        
        {/* Debug Controls
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button 
              onClick={testToolCall}
              className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm"
            >
              Test Tool Call
            </button>
            <button
              onClick={() => sendTextMessage("Show me my unread emails")}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              Send Test Query
            </button>
          </div>
        )} */}
      </div>
    </main>
  )

  // return (
  //   <div className="relative size-full">
  //     <Scene toolCall={toolCall} />
  //     <Controls
  //       handleConnectClick={handleConnectClick}
  //       handleMicToggleClick={() => {}}
  //       isConnected={isSessionActive}
  //       isListening={isListening}
  //     />
  //     <Logs messages={logs} />
  //   </div>
  // );
}

