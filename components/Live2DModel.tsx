"use client";

import { useEffect, useRef, useState } from "react";

export type EmotionType = "Neutral" | "Happy" | "Angry" | "Smug" | "Sad";

// Map our emotion tags to the model's expression files
const expressionMap: Record<EmotionType, string> = {
  Neutral: "Normal",
  Happy: "Blushing",    // Using Blushing for happy/cheerful
  Angry: "Angry",
  Smug: "Surprised",    // Using Surprised for smug (closest match)
  Sad: "Sad",
};

// Map emotions to motions for more dynamic reactions (silent)
const motionMap: Record<EmotionType, string> = {
  Neutral: "Neutral",
  Happy: "Happy",
  Angry: "Angry",
  Smug: "Smug",
  Sad: "Sad",
};

// Map emotions to speak motions (with sound)
const speakMotionMap: Record<EmotionType, string> = {
  Neutral: "SpeakNeutral",
  Happy: "SpeakHappy",
  Angry: "SpeakAngry",
  Smug: "SpeakSmug",
  Sad: "SpeakSad",
};

// Motion durations for timeout (in ms)
const motionDurations: Record<EmotionType, number> = {
  Neutral: 1600,   // hibiki_01: 1.6s
  Happy: 2333,     // hibiki_02: 2.3s
  Angry: 3600,     // hibiki_03: 3.6s
  Smug: 3167,      // hibiki_04: 3.2s
  Sad: 3333,       // hibiki_05: 3.3s
};

interface Live2DModelProps {
  emotion: EmotionType;
  speakTrigger?: number; // Increment to trigger speech
}

export function Live2DModel({ emotion, speakTrigger = 0 }: Live2DModelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let app: any;
    let destroyed = false;

    async function initLive2D() {
      // Wait for Live2DCubismCore to be available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      
      let attempts = 0;
      while (typeof win.Live2DCubismCore === "undefined" && attempts < 10) {
        console.log("Waiting for Live2DCubismCore...", attempts);
        await new Promise((resolve) => setTimeout(resolve, 200));
        attempts++;
      }
      
      if (typeof win.Live2DCubismCore === "undefined") {
        setError("Live2DCubismCore not loaded");
        setIsLoading(false);
        return;
      }

      if (destroyed) return;

      try {
        // Dynamically import to avoid SSR issues
        const PIXI = await import("pixi.js");
        
        // Register PIXI globally (required by pixi-live2d-display)
        win.PIXI = PIXI;
        
        const { Live2DModel: L2DModel } = await import("pixi-live2d-display/cubism4");

        if (destroyed) return;

        // Create PIXI Application
        app = new PIXI.Application({
          view: canvasRef.current!,
          width: 400,
          height: 600,
          backgroundAlpha: 0,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });
        appRef.current = app;

        // Load the model with sound disabled (using silent config)
        const model = await L2DModel.from(
          "/Resources/hibiki/runtime/hibiki-silent.model3.json",
          { autoInteract: false }
        );
        
        if (destroyed) {
          model.destroy();
          return;
        }
        
        modelRef.current = model;

        // Sound is enabled by default - Speak motions will play sound
        // Idle/Flick/Tap motions don't have sound in the silent config

        // Position and scale the model
        model.x = 200;
        model.y = 550;
        model.scale.set(0.25);
        model.anchor.set(0.5, 0.9);

        // Add to stage
        app.stage.addChild(model);

        setIsLoading(false);
        console.log("Live2D model loaded successfully!");
      } catch (err) {
        console.error("Failed to load Live2D model:", err);
        setError(err instanceof Error ? err.message : "Failed to load model");
        setIsLoading(false);
      }
    }

    initLive2D();

    return () => {
      destroyed = true;
      if (app) {
        app.destroy(true);
      }
    };
  }, []);

  // Handle speaking - play emotion-specific Speak motion (with sound) when triggered
  const prevSpeakTriggerRef = useRef(speakTrigger);
  useEffect(() => {
    // Only trigger on actual change (not initial mount)
    if (speakTrigger === prevSpeakTriggerRef.current || speakTrigger === 0) {
      prevSpeakTriggerRef.current = speakTrigger;
      return;
    }
    prevSpeakTriggerRef.current = speakTrigger;

    const model = modelRef.current;
    if (!model) return;

    const motionManager = model.internalModel?.motionManager;
    if (!motionManager) return;

    // Get the speak motion group for the current emotion
    const speakGroup = speakMotionMap[emotion];
    const duration = motionDurations[emotion];

    try {
      // Play the emotion-specific Speak motion (with sound)
      motionManager.startMotion(speakGroup, 0, 3); // Priority 3 (highest)
      console.log(`🔊 Speaking! Emotion: ${emotion}, Motion: ${speakGroup}, Duration: ${duration}ms`);
      setSoundEnabled(true);
      
      // Reset sound enabled state after motion completes
      setTimeout(() => {
        console.log("🔇 Speech complete - ready for next");
        setSoundEnabled(false);
      }, duration + 500); // Add 500ms buffer
    } catch (err) {
      console.error("Speak motion error:", err);
    }
  }, [speakTrigger, emotion]);

  // React to emotion changes - trigger expression and motion (without sound)
  useEffect(() => {
    const model = modelRef.current;
    if (!model) return;

    // Set the facial expression
    const expressionName = expressionMap[emotion];
    if (expressionName && model.internalModel?.motionManager) {
      try {
        // Find the expression index by name
        const expressionManager = model.internalModel.motionManager.expressionManager;
        if (expressionManager) {
          const expressionIndex = expressionManager.definitions?.findIndex(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (exp: any) => exp.Name === expressionName
          );
          if (expressionIndex !== undefined && expressionIndex >= 0) {
            expressionManager.setExpression(expressionIndex);
            console.log(`Expression set: ${expressionName}`);
          }
        }
      } catch {
        console.log("Expression not available:", expressionName);
      }
    }

    // Trigger motion only if not speaking (to avoid interrupting speech)
    if (!soundEnabled) {
      const motionGroup = motionMap[emotion];
      if (motionGroup && model.internalModel?.motionManager) {
        try {
          model.internalModel.motionManager.startMotion(motionGroup, 0);
          console.log(`Motion set: ${motionGroup}`);
        } catch {
          console.log("Motion not available:", motionGroup);
        }
      }
    }
  }, [emotion, soundEnabled]);

  return (
    <div className="pointer-events-none">
      {isLoading && (
        <div className="flex h-[600px] w-[400px] items-center justify-center">
          <div className="animate-pulse text-sm uppercase tracking-[0.2em] text-[#00ff41]">
            Loading Neural Link...
          </div>
        </div>
      )}
      {error && (
        <div className="flex h-[600px] w-[400px] items-center justify-center">
          <div className="text-sm text-red-500">{error}</div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={400}
        height={600}
        className="pointer-events-auto"
        style={{ display: isLoading || error ? "none" : "block" }}
      />
    </div>
  );
}
