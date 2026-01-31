/**
 * Voice Input Module - Experimental Feature
 * Uses Web Speech API for speech-to-text
 *
 * NOTE: This is an experimental feature.
 * Compatibility may vary across browsers and Office environments.
 */

// Type definitions for Web Speech API (not in standard TypeScript lib)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// Get the SpeechRecognition constructor (browser-specific)
function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;

  const w = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/**
 * Check if speech recognition is supported
 */
export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognition() !== null;
}

/**
 * Voice input result
 */
export interface VoiceInputResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

/**
 * Voice input error types
 */
export type VoiceInputError =
  | "not-supported"
  | "permission-denied"
  | "no-speech"
  | "network"
  | "aborted"
  | "unknown";

/**
 * Voice input callbacks
 */
export interface VoiceInputCallbacks {
  onResult: (result: VoiceInputResult) => void;
  onError: (error: VoiceInputError, message: string) => void;
  onStart: () => void;
  onEnd: () => void;
}

/**
 * Voice input controller
 */
export class VoiceInputController {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private callbacks: VoiceInputCallbacks | null = null;

  constructor() {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (SpeechRecognitionClass) {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "zh-CN"; // Default to Chinese
    }
  }

  /**
   * Set the recognition language
   */
  setLanguage(lang: "zh-CN" | "en-US"): void {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Start listening
   */
  start(callbacks: VoiceInputCallbacks): boolean {
    if (!this.recognition) {
      callbacks.onError("not-supported", "Speech recognition not supported");
      return false;
    }

    if (this.isListening) {
      return true;
    }

    this.callbacks = callbacks;

    // Set up event handlers
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex];
      if (result && result[0]) {
        this.callbacks?.onResult({
          transcript: result[0].transcript,
          isFinal: result.isFinal,
          confidence: result[0].confidence,
        });
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorType: VoiceInputError = "unknown";
      switch (event.error) {
        case "not-allowed":
        case "permission-denied":
          errorType = "permission-denied";
          break;
        case "no-speech":
          errorType = "no-speech";
          break;
        case "network":
          errorType = "network";
          break;
        case "aborted":
          errorType = "aborted";
          break;
      }
      this.callbacks?.onError(errorType, event.message || event.error);
      this.isListening = false;
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      this.callbacks?.onStart();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.callbacks?.onEnd();
    };

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error("Failed to start voice input:", error);
      this.callbacks?.onError("unknown", "Failed to start voice recognition");
      return false;
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore stop errors
      }
    }
    this.isListening = false;
  }

  /**
   * Abort listening (cancel without final result)
   */
  abort(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
      } catch {
        // Ignore abort errors
      }
    }
    this.isListening = false;
  }
}

// Singleton instance
let voiceController: VoiceInputController | null = null;

/**
 * Get the voice input controller instance
 */
export function getVoiceController(): VoiceInputController {
  if (!voiceController) {
    voiceController = new VoiceInputController();
  }
  return voiceController;
}
