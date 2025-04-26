import React, { useState } from "react";
import { CodeXml, SidebarClose } from "lucide-react";

interface LogsProps {
  messages: any[];
}

const Logs: React.FC<LogsProps> = ({ messages }) => {
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  const toggleConsole = () => {
    setIsConsoleOpen(!isConsoleOpen);
  };

  return (
    <div className="absolute top-4 left-4">
      <div
        onClick={toggleConsole}
        className="cursor-pointer bg-slate-800 text-white rounded-full p-2.5 flex items-center justify-center"
      >
        <CodeXml size={24} />
      </div>
      <div
        className={`fixed top-0 left-0 h-screen bg-slate-900 font-mono text-white transform ${
          isConsoleOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out`}
        style={{ width: "350px" }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Logs</h2>
            <SidebarClose onClick={toggleConsole} />
          </div>
          <div className="h-[90vh] overflow-x-scroll overflow-y-scroll">
            <pre className="mt-4 text-xs">
              {messages.map((message, index) => (
                <div key={index} className="mb-2">
                  <pre>{JSON.stringify(message, null, 2)}</pre>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;
