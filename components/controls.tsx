import React from "react";
import { Mic, MicOff, Wifi } from "lucide-react";

interface ControlsProps {
  isConnected: boolean;
  isListening: boolean;
  handleConnectClick: () => void;
  handleMicToggleClick: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  isConnected,
  isListening,
  handleConnectClick,
  handleMicToggleClick,
}) => {
  return (
    <div className="absolute top-4 right-4 flex items-center z-10">
      <div
        className="flex bg-slate-800 p-2.5 items-center rounded-full mr-2 cursor-pointer"
        onClick={handleConnectClick}
      >
        <Wifi
          className={`h-6 w-6 ${
            isConnected ? "text-green-500" : "text-red-500"
          }`}
        />
      </div>
      <div
        className={`flex bg-slate-800 p-2.5 items-center rounded-full ${
          isConnected ? "cursor-pointer" : "cursor-not-allowed"
        }`}
        onClick={handleMicToggleClick}
      >
        {isListening ? (
          <Mic className="h-6 w-6 text-green-500" />
        ) : (
          <MicOff className="h-6 w-6 text-red-500" />
        )}
      </div>
    </div>
  );
};

export default Controls;
