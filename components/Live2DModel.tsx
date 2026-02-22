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
  text?: string; // The actual text the bot is saying
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  enableTTS?: boolean;
}

export function Live2DModel({ emotion, speakTrigger = 0, text = "", onSpeechStart, onSpeechEnd, enableTTS = false }: Live2DModelProps) {
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

        // Import cubism4-only build directly (main entry requires Cubism 2 runtime)
        // @ts-expect-error - no subpath exports in package.json, but file exists
        const { Live2DModel: L2DModel } = await import("pixi-live2d-display/lib/cubism4");

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
        // destroy(false) prevents PIXI from removing the canvas element from DOM, 
        // which prevents React "insertBefore" errors when Strict Mode unmounts.
        app.destroy(false, { children: true });
      }
    };
  }, []);

  // Handle speaking - play emotion-specific Speak motion (with sound) and Text-to-Speech when triggered
  const prevSpeakTriggerRef = useRef(speakTrigger);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsUrlRef = useRef<string | null>(null);

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

    // Stop currently playing audio and TTS if any
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.currentTime = 0;
    }
    if (ttsUrlRef.current) {
      URL.revokeObjectURL(ttsUrlRef.current);
      ttsUrlRef.current = null;
    }
    window.speechSynthesis?.cancel(); // Fallback cleanup

    // Map the emotion to the actual sound file name
    let filename = emotion.toLowerCase();

    // There isn't a "sad.mp3", but there is "happy_shy" and "greeting_rude" - fallback to neutral if needed, 
    // or map Sad specifically if we want to fallback gracefully. Let's try standardizing to fallback files.
    if (filename === 'sad') {
      filename = 'neutral';
    }

    const audio = new Audio(`/assets/sounds/${filename}.mp3`);
    audioRef.current = audio;

    // Get the speak motion group for the current emotion
    const speakGroup = speakMotionMap[emotion];
    const duration = motionDurations[emotion];

    try {
      // 1. Play background emotion sound effect
      audio.play().catch(e => console.error("Audio play failed:", e));

      // 2. Play the emotion-specific Speak motion (Live2D animation)
      motionManager.startMotion(speakGroup, 0, 3); // Priority 3 (highest)
      console.log(`🔊 Speaking! Emotion: ${emotion}, Motion: ${speakGroup}, Duration: ${duration}ms, Text: ${text}`);
      setSoundEnabled(true);

      // 3. Play Text-to-Speech (OpenAI API Proxy)
      if (text && enableTTS) {
        // Run async fetch without blocking the emotion sound/animation above
        const playTTS = async () => {
          try {
            const response = await fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text }),
            });

            if (!response.ok) throw new Error("TTS fetch failed");

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            // Create playable audio element for the voice
            const ttsAudio = new Audio(url);
            ttsAudioRef.current = ttsAudio; // Store ref
            ttsUrlRef.current = url; // Store URL for cleanup

            // Ensure Live2D motion stays active until voice finishes speaking
            ttsAudio.onended = () => {
              console.log("🔇 TTS Speech complete - ready for next");
              setSoundEnabled(false);
              URL.revokeObjectURL(url); // Clean up memory
              ttsUrlRef.current = null;
              ttsAudioRef.current = null;
              onSpeechEnd?.();
            };

            onSpeechStart?.();
            await ttsAudio.play();

            // Store reference if we need to cancel it on next trigger
            // Using the existing audioRef might conflict with background emotion noise
            // so we don't strictly bind it unless we add a new ref, but keeping it 
            // simple for now since reactions are short.
          } catch (err) {
            console.error("OpenAI TTS failed to play:", err);
            // Fallback reset if TTS fails
            setTimeout(() => {
              setSoundEnabled(false);
              onSpeechEnd?.();
            }, duration + 500);
          }
        };

        playTTS();
      } else {
        // Reset sound enabled state after motion completes if no text
        setTimeout(() => {
          console.log("🔇 Motion complete - ready for next");
          setSoundEnabled(false);
          onSpeechEnd?.();
        }, duration + 500); // Add 500ms buffer
      }
    } catch (err) {
      console.error("Speak motion error:", err);
      setSoundEnabled(false);
      onSpeechEnd?.();
    }
  }, [speakTrigger, emotion, text, onSpeechStart, onSpeechEnd, enableTTS]);

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
          <div className="animate-pulse text-sm uppercase tracking-[0.2em] text-cyber-accent">
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
