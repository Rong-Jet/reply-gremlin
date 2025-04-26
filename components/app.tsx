"use client";

import Controls from "@/components/controls";
import Scene from "@/components/scene";
import Logs from "@/components/logs";
import { useEffect, useRef, useState, useCallback } from "react";
import { INSTRUCTIONS, TOOLS } from "@/lib/config";
import { BASE_URL, MODEL } from "@/lib/constants";
import { MCP_SERVER } from "@/lib/mcp";

type ToolCallOutput = {
  response: string;
  [key: string]: any;
};

export default function App() {
  const [logs, setLogs] = useState<any[]>([]);
  const [toolCall, setToolCall] = useState<any>(null);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

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

  const handleConnectClick = async () => {
    if (isSessionActive) {
      console.log("Stopping session.");
      stopSession();
    } else {
      console.log("Starting session.");
      startSession();
    }
  };

  return (
    <div className="relative size-full">
      <Scene toolCall={toolCall} />
      <Controls
        handleConnectClick={handleConnectClick}
        handleMicToggleClick={() => {}}
        isConnected={isSessionActive}
        isListening={isListening}
      />
      <Logs messages={logs} />
    </div>
  );
}
