"use client"

// imports from reply-gremlin app
import { useEffect, useRef, useState, useCallback } from "react";
import { INSTRUCTIONS, TOOLS } from "@/lib/config";
import { BASE_URL, MODEL } from "@/lib/constants";
import { MCP_SERVER } from "@/lib/mcp";

// imports from email-voice-ai app
import { LeftPanel } from "@/components/left-panel"
import { RightPanel } from "@/components/right-panel"
import type { Email, ActionResult } from "@/types/email"
import { mockEmails } from "@/data/mock-emails"

export default function Home() {

  // state variables from reply-gremlin app
  const [logs, setLogs] = useState<any[]>([])
  const [toolCall, setToolCall] = useState<any>(null)
  const [isSessionStarted, setIsSessionStarted] = useState(false)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null)

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

  // functions from reply-gremlin app
  // Start a new realtime session
  async function startSession() {
    try {
      if (!isSessionStarted) {
        setIsSessionStarted(true);
        
        // Connect to Gmail WebSocket server
        const ws = new WebSocket('ws://localhost:8000/ws/gmail');
        
        ws.onopen = () => {
          setIsSessionActive(true);
          setIsListening(true);
          setLogs([]);
          
          // Send session config
          const sessionUpdate = {
            type: "session.update",
            session: {
              tools: TOOLS,
              instructions: INSTRUCTIONS,
              mcp_servers: [MCP_SERVER],
            },
          };
          ws.send(JSON.stringify(sessionUpdate));
          console.log("Session update sent:", sessionUpdate);
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === "response.done") {
            const output = data.response.output[0];
            setLogs((prev: any[]) => [output, ...prev]);
            if (output?.type === "function_call") {
              handleToolCall(output);
            }
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        ws.onclose = () => {
          setIsSessionActive(false);
          setIsListening(false);
          setWebSocket(null);
        };

        setWebSocket(ws);
      }
    } catch (error) {
      console.error("Error starting session:", error);
    }
  }

  // Stop current session
  function stopSession() {
    if (webSocket) {
      webSocket.close();
    }
    setIsSessionStarted(false);
    setIsSessionActive(false);
    setWebSocket(null);
    setIsListening(false);
  }

  // Send a message to the model
  const sendClientEvent = useCallback(
    (message: any) => {
      if (webSocket && webSocket.readyState === WebSocket.OPEN) {
        message.event_id = message.event_id || crypto.randomUUID();
        webSocket.send(JSON.stringify(message));
      } else {
        console.error(
          "Failed to send message - no WebSocket connection available",
          message
        );
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
    const toolCall = {
      name: output.name,
      arguments: output.arguments,
    };
    console.log("Tool call:", toolCall);
    setToolCall(toolCall);

    // Initialize toolCallOutput with a default response
    const toolCallOutput: ToolCallOutput = {
      response: `Tool call ${toolCall.name} executed successfully.`,
    };

    sendClientEvent({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: output.call_id,
        output: JSON.stringify(toolCallOutput),
      },
    });

    // Force a model response
    sendClientEvent({
      type: "response.create",
    });
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
      isListening 
    });
    
    if (isSessionActive) {
      console.log("Stopping active session...");
      stopSession();
    } else {
      console.log("Starting new session...");
      startSession();
    }
    
    // Log WebSocket state after action
    setTimeout(() => {
      console.log("WebSocket state after action:", {
        isOpen: webSocket?.readyState === WebSocket.OPEN,
        readyState: webSocket?.readyState,
        isSessionActive,
        isListening
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

