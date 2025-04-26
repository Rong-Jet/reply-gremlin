import Spline from "@splinetool/react-spline";
import React, { useEffect, useState, useRef } from "react";
import type { Application } from "@splinetool/runtime";
import "./scene.css";
import { getComponent } from "@/lib/components-mapping";

interface ToolCall {
  name: string;
  arguments: any;
}

interface SceneProps {
  toolCall: ToolCall;
}

const Scene: React.FC<SceneProps> = ({ toolCall }) => {
  const spline = useRef<Application | null>(null);
  const [currentCamera, setCurrentCamera] = useState<string>("main");
  const [displayComponent, setDisplayComponent] =
    useState<React.ReactNode | null>(null);

  // Set the Spline scene on load
  const onLoad = (splineApp: Application) => {
    spline.current = splineApp;
  };

  // Keydown listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Reset UI when "d" key is pressed, to clear data without tool calls from the model
      if (event.code === "d") {
        setDisplayComponent(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Tool calls handling
  useEffect(() => {
    if (!toolCall) return;

    // Parse arguments
    const { name, arguments: toolArgs } = toolCall;
    let args: any = {};
    try {
      args = JSON.parse(toolArgs);
    } catch (error) {
      console.error("Failed to parse toolCall arguments:", error);
      return;
    }

    // Trigger animation in spline for a given object
    // The mouseDown events need to be set up in the spline scene
    function triggerAnimation(objectName: string) {
      if (spline.current) {
        try {
          spline.current.emitEvent("mouseDown", objectName);
        } catch (error) {
          console.error("Failed to trigger animation:", error);
        }
      }
    }

    function displayData() {
      try {
        const { chart, title, text, data } = JSON.parse(toolCall.arguments);
        const component = getComponent({ chart, title, text, data });
        setDisplayComponent(component || null);
      } catch (error) {
        console.error("Failed to parse toolCall arguments:", error);
      }
    }

    // Show moons in sequence
    async function showMoons(moons: string[]) {
      for (const moon of moons) {
        triggerAnimation(moon);
        // small delay to make the moons appear sequentially
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    function resetCamera() {
      console.log("Resetting camera to initial position");
      triggerAnimation("trigger_reset");
      if (currentCamera !== "main") {
        triggerAnimation("trigger_camera_main");
        setCurrentCamera("main");
      }
    }

    // Reset UI before handling a tool call
    setDisplayComponent(null);

    switch (name) {
      case "focus_planet":
        triggerAnimation(args.planet);
        break;

      case "display_data":
        displayData();
        break;

      case "show_moons":
        showMoons(args.moons);
        break;

      case "get_iss_position":
        triggerAnimation("ISS");
        break;

      case "reset_camera":
        resetCamera();
        break;

      case "show_orbit":
        triggerAnimation("trigger_camera_high_level");
        setCurrentCamera("high_level");
        break;

      default:
        // No matching toolCall
        break;
    }
  }, [toolCall, currentCamera]);

  return (
    <div className="size-full relative scene-bg">
      <Spline
        scene="https://prod.spline.design/yH4ADQUBzWTJ2ITk/scene.splinecode"
        onLoad={onLoad}
      />

      {displayComponent && (
        <div className="absolute top-0 text-white right-16 h-full flex items-center justify-center">
          {displayComponent}
        </div>
      )}
    </div>
  );
};

export default Scene;
