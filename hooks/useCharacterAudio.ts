"use client";

import { useEffect, useRef } from "react";

export type EmotionType = "Neutral" | "Happy" | "Angry" | "Smug" | "Sad";

// Map emotions to audio files
const emotionAudioMap: Record<EmotionType, string[]> = {
  Happy: ["happy.mp3", "happy_shy.mp3"], // Random selection
  Smug: ["smug.mp3"],
  Neutral: ["neutral.mp3"],
  Angry: ["neutral.mp3"], // Fallback to neutral if no angry audio
  Sad: ["neutral.mp3"], // Fallback to neutral if no sad audio
};

/**
 * Custom hook to play character audio based on emotion changes
 * - Plays greeting on mount
 * - Plays emotion-specific audio when emotion changes
 * - Random selection for emotions with multiple audio files
 * - Natural delay (100-300ms) before playback
 */
export function useCharacterAudio(emotion: EmotionType) {
  const hasPlayedGreeting = useRef(false);
  const previousEmotion = useRef(emotion);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play greeting on mount (only once)
  useEffect(() => {
    if (!hasPlayedGreeting.current) {
      hasPlayedGreeting.current = true;
      
      const delay = 100 + Math.random() * 200; // 100-300ms delay
      const timer = setTimeout(() => {
        try {
          const greetingAudio = new Audio("/assets/sounds/greeting_rude.mp3");
          greetingAudio.volume = 0.7;
          greetingAudio.play().catch((err) => {
            console.warn("Failed to play greeting audio:", err);
          });
        } catch (err) {
          console.warn("Error creating greeting audio:", err);
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, []);

  // Play emotion audio when emotion changes
  useEffect(() => {
    // Skip if emotion hasn't changed
    if (emotion === previousEmotion.current) {
      return;
    }
    
    previousEmotion.current = emotion;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audioFiles = emotionAudioMap[emotion];
    if (!audioFiles || audioFiles.length === 0) {
      return;
    }

    // Random selection if multiple files available
    const randomIndex = Math.floor(Math.random() * audioFiles.length);
    const selectedAudio = audioFiles[randomIndex];

    // Natural delay before playback
    const delay = 100 + Math.random() * 200; // 100-300ms
    const timer = setTimeout(() => {
      try {
        const audio = new Audio(`/assets/sounds/${selectedAudio}`);
        audio.volume = 0.7;
        audioRef.current = audio;
        
        audio.play().catch((err) => {
          console.warn(`Failed to play audio for ${emotion}:`, err);
        });

        // Clear reference when audio ends
        audio.addEventListener("ended", () => {
          if (audioRef.current === audio) {
            audioRef.current = null;
          }
        });
      } catch (err) {
        console.warn(`Error creating audio for ${emotion}:`, err);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      // Cleanup audio on unmount or emotion change
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [emotion]);
}
