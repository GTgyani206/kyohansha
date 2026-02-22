"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, ShoppingBag, LogOut, User, Mic, MicOff, PhoneCall } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { AuthModal } from "@/components/AuthModal";
import { BlackMarket } from "@/components/BlackMarket";
import { EmptyState } from "@/components/EmptyState";
import { PersonalitySelector, type PersonaType } from "@/components/PersonalitySelector";
import { StreakCounter } from "@/components/StreakCounter";
import { useAuth } from "@/contexts/AuthContext";
import { usePersistence } from "@/hooks/usePersistence";
import { KARMA_PER_CHAT } from "@/lib/gacha";

// Dynamic import for Live2D Model to avoid SSR issues
const Live2DModel = dynamic(
  () => import("@/components/Live2DModel").then((m) => m.Live2DModel),
  {
    ssr: false,
    loading: () => (
      <div className="absolute bottom-0 left-0 z-[1] flex h-[80vh] w-[50vw] items-center justify-center">
        <div className="animate-pulse text-sm uppercase tracking-[0.2em] text-cyber-accent">
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
        if (part && typeof part === "object" && "text" in part && typeof (part as { text?: unknown }).text === "string") {
          return (part as { text: string }).text;
        }
        return "";
      })
      .join("");
  }
  if (raw && typeof raw === "object" && "text" in raw && typeof (raw as { text?: unknown }).text === "string") {
    return (raw as { text: string }).text;
  }
  return "";
}

function parseMessage(content: unknown): ParsedMessage {
  const textContent = normalizeContent(content);
  // Match the tag, and optionally match a following colon and whitespace
  const match = textContent.match(/^\[(Neutral|Happy|Angry|Smug|Sad)\](?:[\s:]*)/);

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
  // Auth state
  const { user, isGuest, isLoading: authLoading, signOut } = useAuth();
  const showAuthModal = !authLoading && !user && !isGuest;

  // Persistence (handles Supabase vs localStorage)
  const {
    karma,
    streak,
    flameTier,
    persona,
    addKarma,
    spendKarma,
    recordChat,
    updatePersona,
    isLoaded: persistenceLoaded,
    isLoggedIn,
  } = usePersistence();

  // Persona selection state (synced with persistence)
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>("outlaw");
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [showBlackMarket, setShowBlackMarket] = useState(false);

  // Sync persona from persistence
  useEffect(() => {
    if (persistenceLoaded && persona) {
      setTimeout(() => setSelectedPersona(persona as PersonaType), 0);
    }
  }, [persistenceLoaded, persona]);

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

  // Web Speech API (STT) State
  const [isListening, setIsListening] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(false);

  // Refs for tracking changing state inside closures
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isContinuousModeRef = useRef(false);
  const inputValRef = useRef(input);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const submitCallbackRef = useRef<((text: string) => void) | null>(null);
  const wasLastInputFromSpeechRef = useRef(false);
  const [ttsEnabledForNextInteraction, setTtsEnabledForNextInteraction] = useState(false);

  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { isContinuousModeRef.current = isContinuousMode; }, [isContinuousMode]);
  useEffect(() => { inputValRef.current = input; }, [input]);
  useEffect(() => {
    submitCallbackRef.current = (text) => {
      recordChat();
      addKarma(KARMA_PER_CHAT);
      setTtsEnabledForNextInteraction(true);
      wasLastInputFromSpeechRef.current = false;
      sendMessage({ text });
      setInput("");
    };
  }, [recordChat, addKarma, sendMessage]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleContinuousMode = () => {
    const next = !isContinuousMode;
    setIsContinuousMode(next);
    // If turning on and not listening, auto-start mic
    if (next && !isListeningRef.current) {
      toggleListening();
    }
  };

  const handleSpeechStart = () => {
    // Mute mic when AI speaks so it doesn't hear itself
    if (isListening && recognitionRef.current) {
      try {
        isListeningRef.current = false;
        recognitionRef.current.stop();
        setIsListening(false);
      } catch { }
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };

  const handleSpeechEnd = () => {
    // Auto-resume mic when AI finishes if in continuous mode
    if (isContinuousModeRef.current && !isListening && recognitionRef.current) {
      try {
        setTimeout(() => {
          if (isContinuousModeRef.current) {
            recognitionRef.current.start();
            setIsListening(true);
          }
        }, 400); // Small buffer before listening
      } catch { }
    }
  };

  // Initialize and toggle STT
  const toggleListening = () => {
    if (isListeningRef.current) {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Set immediately to prevent strict-mode double firing
    isListeningRef.current = true;
    setIsListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowAny = window as any;
    const SpeechRecognition = windowAny.SpeechRecognition || windowAny.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support the Web Speech API. Please use Chrome or Edge.");
      isListeningRef.current = false;
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => console.debug("🎤 STT Started listening");
    recognition.onsoundstart = () => console.debug("🔈 STT Sound detected");
    recognition.onspeechstart = () => console.debug("🗣️ STT Speech detected");
    recognition.onspeechend = () => console.debug("🤐 STT Speech ended");
    recognition.onsoundend = () => console.debug("🔇 STT Sound ended");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        wasLastInputFromSpeechRef.current = true;
        setInput((prev) => {
          const newText = prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + finalTranscript;
          return newText;
        });

        // Auto-submit logic for continuous mode
        if (isContinuousModeRef.current) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            const currentInput = inputValRef.current;
            if (currentInput.trim()) {
              submitCallbackRef.current?.(currentInput);
            }
          }, 1500); // Auto-send after 1.5s of silence
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "network" || event.error === "no-speech" || event.error === "aborted") {
        // Harmless transient errors in Chrome Speech API
        console.debug(`Ignored STT error: ${event.error}`);
        return;
      }
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-recover continuous mode if it unexpectedly dropped
      if (isContinuousModeRef.current && isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          isListeningRef.current = false;
          setIsListening(false);
        }
      } else {
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      isListeningRef.current = false;
      setIsListening(false);
    }
  };

  // Save persona to persistence
  const handleSelectPersona = (newPersona: PersonaType) => {
    setSelectedPersona(newPersona);
    updatePersona(newPersona);
  };

  // Custom submit handler that also records streak and awards karma
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    recordChat(); // Record the chat for streak
    addKarma(KARMA_PER_CHAT); // Award karma for chatting
    setTtsEnabledForNextInteraction(wasLastInputFromSpeechRef.current || isContinuousMode || isListening);
    wasLastInputFromSpeechRef.current = false;
    sendMessage({ text: input });
    setInput("");
  };

  // Quick prompt handler for EmptyState
  const handleQuickPrompt = (prompt: string) => {
    recordChat();
    addKarma(KARMA_PER_CHAT);
    sendMessage({ text: prompt });
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
        setTimeout(() => setCurrentEmotion(mood), 0);
      }
    }
  }, [messages]);

  const reversedMessages = useMemo(() => messages, [messages]);

  // Show loading state while auth is checking
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-transparent">
        <div className="animate-pulse text-sm uppercase tracking-[0.2em] text-cyber-accent">
          Establishing Connection...
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden bg-[#050505] text-[#e0e0e0]">
      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} />

      {/* z-index 0: Background */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-black/20" />

      {/* z-index 1: Live2D Model - Fixed position */}
      <div className="fixed bottom-0 left-0 z-[1]">
        <Live2DModel
          emotion={currentEmotion}
          speakTrigger={speakTrigger}
          text={
            messages
              .filter(m => m.role === 'assistant')
              .slice(-1)[0]
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ?.parts?.map((p: any) => p.type === 'text' ? p.text : '')
              .join('') || ""
          }
          onSpeechStart={handleSpeechStart}
          onSpeechEnd={handleSpeechEnd}
          enableTTS={ttsEnabledForNextInteraction}
        />
      </div>

      {/* z-index 2: Header - Floating glass pill */}
      <header className="fixed left-2 right-2 sm:left-4 sm:right-4 top-2 sm:top-4 z-[3] flex items-center justify-between px-3 sm:px-6 py-1.5 sm:py-2 glass-pill transition-all duration-500 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-cyber-accent/80">Kyōhansha</span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-white/50">// {PERSONA_NAMES[selectedPersona]}</span>
          </div>
          <button
            onClick={() => setShowPersonaSelector(true)}
            className="p-2 rounded-full glass-input hover:text-cyber-accent transition-colors group"
            title="Change Personality"
          >
            <Settings size={14} className="text-white/60 group-hover:text-cyber-accent" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Karma Counter + Black Market */}
          {persistenceLoaded && (
            <button
              onClick={() => setShowBlackMarket(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-input transition-colors group"
              title="Black Market"
            >
              <ShoppingBag size={14} className="text-cyber-danger/80 group-hover:text-cyber-danger shrink-0" />
              <div className="flex items-baseline gap-1 whitespace-nowrap">
                <span className="text-xs font-bold font-mono text-cyber-accent/90">{karma}</span>
                <span className="text-[10px] text-cyber-accent/70">力</span>
              </div>
            </button>
          )}

          {/* Streak Counter */}
          {persistenceLoaded && <StreakCounter streak={streak} flameTier={flameTier} />}

          <span className="text-[10px] rounded-full px-2 py-0.5 bg-cyber-danger/10 border border-cyber-danger/20 text-cyber-danger uppercase tracking-[0.2em] whitespace-nowrap hidden sm:inline-block">
            {currentEmotion}
          </span>

          {/* User status / Logout */}
          {isLoggedIn ? (
            <button
              onClick={signOut}
              className="p-2 rounded-full glass-input hover:border-cyber-danger/50 hover:text-cyber-danger transition-colors group"
              title="Sign Out"
            >
              <LogOut size={14} className="text-white/60 group-hover:text-cyber-danger" />
            </button>
          ) : isGuest ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-input text-xs text-white/50">
              <User size={14} />
              Ghost
            </div>
          ) : null}
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

      {/* Black Market Modal */}
      <BlackMarket
        isOpen={showBlackMarket}
        onClose={() => setShowBlackMarket(false)}
        karma={karma}
        onSpendKarma={spendKarma}
      />

      {/* z-index 2: Chat Interface - Scrollable area */}
      <main className="relative z-[2] flex h-screen flex-col pt-16 pb-24">
        {messages.length === 0 ? (
          /* Empty State */
          <EmptyState
            streak={streak}
            flameTier={flameTier}
            onQuickPrompt={handleQuickPrompt}
          />
        ) : (
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
                  "max-w-[90%] sm:max-w-[85%] px-4 sm:px-5 py-3 sm:py-4 text-sm sm:text-[15px] leading-relaxed",
                  "glass-panel border-white/5",
                  isUser
                    ? "self-end !rounded-br-sm bg-cyber-accent/10 border-cyber-accent/20 text-white shadow-[0_4px_24px_rgba(8,145,178,0.15)]"
                    : "self-start !rounded-bl-sm bg-black/40 text-white/90"
                );

                return (
                  <motion.div
                    key={message.id}
                    className={bubbleClasses}
                    animate={mood === "Angry" && !isUser ? ANGRY_SHAKE : { x: 0 }}
                  >
                    <p className="whitespace-pre-wrap">{text}</p>
                  </motion.div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        {error ? (
          <div className="mx-auto mt-3 max-w-md rounded-md border border-[#ff003c] bg-[#1a0008] px-3 py-2 text-sm text-[#ff5675]">
            {error.message}
          </div>
        ) : null}
      </main>

      {/* z-index 3: Input Form - Floating pill layout */}
      <div className="fixed bottom-2 sm:bottom-6 w-full flex justify-center px-2 sm:px-4 z-[3] pointer-events-none">
        <form
          onSubmit={handleSubmit}
          className="pointer-events-auto w-full max-w-3xl glass-pill p-1.5 pl-3 pr-1.5 sm:p-2 sm:pl-4 sm:pr-2 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={toggleContinuousMode}
            className={clsx(
              "flex items-center justify-center rounded-full p-2.5 transition-all duration-300 hidden sm:flex shrink-0",
              isContinuousMode
                ? "bg-cyber-accent/20 text-cyber-accent shadow-[0_0_15px_rgba(8,145,178,0.4)]"
                : "text-white/40 hover:text-cyber-accent hover:bg-cyber-accent/10"
            )}
            title={isContinuousMode ? "End Live Call" : "Start Live Call (Continuous Voice)"}
          >
            <PhoneCall size={18} />
          </button>

          <button
            type="button"
            onClick={toggleListening}
            className={clsx(
              "flex items-center justify-center rounded-full p-2.5 transition-all duration-300 shrink-0",
              isListening
                ? "bg-cyber-danger/20 text-cyber-danger shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                : "text-white/40 hover:text-cyber-accent hover:bg-cyber-accent/10"
            )}
            title={isListening ? "Stop listening" : "Start Voice Input"}
          >
            {isListening ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          <input
            ref={inputRef}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
            placeholder={isListening ? "Neural link active..." : "Initiate sequence..."}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              wasLastInputFromSpeechRef.current = false;
              if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            }}
            aria-label="Send a message"
            disabled={isLoading}
          />

          <div className="flex items-center gap-2 pr-1 shrink-0">
            {isLoading ? (
              <button
                type="button"
                onClick={stop}
                className="rounded-full bg-cyber-danger/20 hover:bg-cyber-danger/30 text-cyber-danger px-4 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] transition-all"
              >
                Halt
              </button>
            ) : (
              <button
                type="submit"
                className="rounded-full bg-cyber-accent/20 hover:bg-cyber-accent/30 text-cyber-accent px-4 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] transition-all disabled:opacity-50 disabled:hover:bg-cyber-accent/20"
                disabled={!input.trim()}
              >
                Send
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
