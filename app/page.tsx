"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { PersonalitySelector, type PersonaType } from "@/components/PersonalitySelector";
import { StreakCounter } from "@/components/StreakCounter";
import { useStreak } from "@/hooks/useStreak";

// Dynamic import for Live2D Model to avoid SSR issues
const Live2DModel = dynamic(
  () => import("@/components/Live2DModel").then((m) => m.Live2DModel),
  {
    ssr: false,
    loading: () => (
      <div className="absolute bottom-0 left-0 z-[1] flex h-[80vh] w-[50vw] items-center justify-center">
        <div className="animate-pulse text-sm uppercase tracking-[0.2em] text-[#00ff41]">
          Initializing Neural Link...
        </div>
      </div>
    ),
  }
);

type MoodTag = "Neutral" | "Happy" | "Angry" | "Smug" | "Sad";

type ParsedMessage = {
  mood?: MoodTag;
  text: string;
};

const ANGRY_SHAKE = {
  x: [0, -8, 8, -8, 8, 0],
  transition: { duration: 0.6, ease: "easeInOut" as const },
};

// Persona display names for header
const PERSONA_NAMES: Record<PersonaType, string> = {
  outlaw: "Digital Outlaw",
  menhera: "Menhera",
  sister: "Onee-san",
};

function normalizeContent(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part && typeof (part as any).text === "string") {
          return (part as any).text;
        }
        return "";
      })
      .join("");
  }
  if (raw && typeof raw === "object" && "text" in raw && typeof (raw as any).text === "string") {
    return (raw as any).text;
  }
  return "";
}

function parseMessage(content: unknown): ParsedMessage {
  const textContent = normalizeContent(content);
  const match = textContent.match(/^\[(Neutral|Happy|Angry|Smug|Sad)\]\s*/);

  if (!match) {
    return { text: textContent };
  }

  const [, mood] = match;
  return {
    mood: mood as MoodTag,
    text: textContent.slice(match[0].length),
  };
}

export default function Home() {
  // Persona selection state
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>("outlaw");
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);

  // Streak system
  const { streak, flameTier, recordChat, isLoaded: streakLoaded } = useStreak();

  // Chat state with persona in body - AI SDK v5 pattern
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { persona: selectedPersona },
      }),
    [selectedPersona]
  );

  const { messages, sendMessage, stop, status, error } = useChat({ transport });
  const isLoading = status === "streaming" || status === "submitted";

  // AI SDK v5 no longer manages input state internally
  const [input, setInput] = useState("");

  const [currentEmotion, setCurrentEmotion] = useState<MoodTag>("Neutral");
  const [speakTrigger, setSpeakTrigger] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load persona from localStorage
  useEffect(() => {
    const savedPersona = localStorage.getItem("kyohansha_persona");
    if (savedPersona && ["outlaw", "menhera", "sister"].includes(savedPersona)) {
      setSelectedPersona(savedPersona as PersonaType);
    }
  }, []);

  // Save persona to localStorage
  const handleSelectPersona = (persona: PersonaType) => {
    setSelectedPersona(persona);
    localStorage.setItem("kyohansha_persona", persona);
  };

  // Custom submit handler that also records streak
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    recordChat(); // Record the chat for streak
    sendMessage({ text: input });
    setInput("");
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Re-focus input after streaming completes and trigger speech
  const prevLoadingRef = useRef(isLoading);
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      setTimeout(() => setSpeakTrigger((prev) => prev + 1), 0);
      inputRef.current?.focus();
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

  // Track the latest AI emotion
  useEffect(() => {
    const lastAiMessage = [...messages].reverse().find((m) => m.role === "assistant");
    if (lastAiMessage) {
      // AI SDK v5: extract text from parts array
      const rawText = lastAiMessage.parts
        ?.map((p) => (p.type === "text" ? p.text : ""))
        .join("") ?? "";
      const { mood } = parseMessage(rawText);
      if (mood) {
        setCurrentEmotion(mood);
      }
    }
  }, [messages]);

  const reversedMessages = useMemo(() => messages, [messages]);

  return (
    <div className="relative h-screen overflow-hidden bg-[#050505] text-[#e0e0e0]">
      {/* z-index 0: Background */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-[#050505] via-[#0a0a12] to-[#050505]" />

      {/* z-index 1: Live2D Model - Fixed position */}
      <div className="fixed bottom-0 left-0 z-[1]">
        <Live2DModel emotion={currentEmotion} speakTrigger={speakTrigger} />
      </div>

      {/* z-index 2: Header - Fixed at top */}
      <header className="fixed left-0 right-0 top-0 z-[3] flex items-center justify-between border-b border-[#111]/50 bg-[#050505]/90 px-4 py-4 backdrop-blur-md md:px-10">
        <div className="flex items-center gap-4">
          <span className="text-xs uppercase tracking-[0.28em] text-[#00ff41]">
            Kyōhansha // {PERSONA_NAMES[selectedPersona]}
          </span>
          <button
            onClick={() => setShowPersonaSelector(true)}
            className="p-1.5 rounded-lg border border-gray-700 hover:border-[#00ff41] transition-colors"
            title="Change Personality"
          >
            <Settings size={14} className="text-gray-400 hover:text-[#00ff41]" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Streak Counter */}
          {streakLoaded && <StreakCounter streak={streak} flameTier={flameTier} />}

          <span className="text-xs uppercase tracking-[0.28em] text-[#ff003c]">
            {currentEmotion}
          </span>
        </div>
      </header>

      {/* Personality Selector Modal */}
      <AnimatePresence>
        {showPersonaSelector && (
          <PersonalitySelector
            isOpen={showPersonaSelector}
            onClose={() => setShowPersonaSelector(false)}
            selectedPersona={selectedPersona}
            onSelectPersona={handleSelectPersona}
          />
        )}
      </AnimatePresence>

      {/* z-index 2: Chat Interface - Scrollable area */}
      <main className="relative z-[2] flex h-screen flex-col pt-16 pb-24">
        <div
          ref={scrollRef}
          className="pointer-events-auto ml-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto px-4 py-5 md:px-10"
        >
          <div className="flex flex-1 flex-col justify-end gap-3">
            {reversedMessages.map((message) => {
              const isUser = message.role === "user";
              // AI SDK v5: extract text from parts array
              const rawText = message.parts
                ?.map((p) => (p.type === "text" ? p.text : ""))
                .join("") ?? "";
              const { mood, text } = parseMessage(rawText);

              const bubbleClasses = clsx(
                "max-w-[78%] rounded-lg border px-4 py-3 text-sm leading-relaxed shadow-[0_0_24px_rgba(0,0,0,0.45)]",
                "backdrop-blur-sm",
                isUser
                  ? "self-end border-[#00ff41] bg-black/70 text-[#e0e0e0]"
                  : "self-start border-[#ff003c] bg-black/70 text-[#e0e0e0]"
              );

              const moodAccent = !isUser && mood ? (
                <span className="mb-2 block text-[0.7rem] uppercase tracking-[0.18em] text-[#ff003c]">
                  {mood}
                </span>
              ) : null;

              return (
                <motion.div
                  key={message.id}
                  className={bubbleClasses}
                  animate={mood === "Angry" && !isUser ? ANGRY_SHAKE : { x: 0 }}
                >
                  {moodAccent}
                  <p className="whitespace-pre-wrap">{text}</p>
                </motion.div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>

        {error ? (
          <div className="mx-auto mt-3 max-w-md rounded-md border border-[#ff003c] bg-[#1a0008] px-3 py-2 text-sm text-[#ff5675]">
            {error.message}
          </div>
        ) : null}
      </main>

      {/* z-index 3: Input Form - Fixed at bottom */}
      <form
        onSubmit={handleSubmit}
        className="fixed bottom-0 left-0 right-0 z-[3] border-t border-[#111] bg-[#050505]/95 px-4 py-4 backdrop-blur-md md:px-10"
      >
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <span className="text-[#00ff41]">&gt;</span>
          <input
            ref={inputRef}
            className="w-full rounded-lg border border-[#00ff41] bg-black/80 px-4 py-3 text-sm text-[#e0e0e0] outline-none ring-0 transition focus:border-[#7dff9a] focus:shadow-[0_0_18px_rgba(0,255,65,0.35)]"
            placeholder="Enter command..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Send a message"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="rounded-md border border-[#00ff41] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[#00ff41] transition hover:border-[#7dff9a] hover:text-[#7dff9a] disabled:opacity-60"
            disabled={!input.trim() || isLoading}
          >
            Send
          </button>
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="rounded-md border border-[#ff003c] px-3 py-2 text-[0.75rem] uppercase tracking-[0.14em] text-[#ff5675] transition hover:border-[#ff6f86] hover:text-[#ff6f86]"
            >
              Stop
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
