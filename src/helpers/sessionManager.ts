/**
 * Session Manager - Manages multiple conversation sessions
 */

import { ChatMessage, DisplayMessage } from "../types/llm";

/**
 * Session data structure
 */
export interface Session {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  displayMessages: DisplayMessage[];
}

/**
 * Storage key for sessions
 */
const STORAGE_KEY = "word_copilot_sessions";
const ACTIVE_SESSION_KEY = "word_copilot_active_session";
const MAX_SESSIONS = 20;
const MAX_MESSAGES_PER_SESSION = 50;

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate default session name based on date
 */
function generateSessionName(): string {
  const now = new Date();
  return `对话 ${now.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })} ${now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
}

/**
 * Session Manager class
 */
export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private activeSessionId: string | null = null;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load sessions from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const sessions: Session[] = JSON.parse(data);
        sessions.forEach((s) => this.sessions.set(s.id, s));
      }

      const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (activeId && this.sessions.has(activeId)) {
        this.activeSessionId = activeId;
      }

      // Create a default session if none exist
      if (this.sessions.size === 0) {
        this.createSession();
      }
    } catch (e) {
      console.warn("Failed to load sessions from storage:", e);
      this.createSession();
    }
  }

  /**
   * Save sessions to localStorage
   */
  private saveToStorage(): void {
    try {
      const sessions = Array.from(this.sessions.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      if (this.activeSessionId) {
        localStorage.setItem(ACTIVE_SESSION_KEY, this.activeSessionId);
      }
    } catch (e) {
      console.warn("Failed to save sessions to storage:", e);
    }
  }

  /**
   * Create a new session
   */
  createSession(name?: string): Session {
    const session: Session = {
      id: generateSessionId(),
      name: name || generateSessionName(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      displayMessages: [],
    };

    this.sessions.set(session.id, session);
    this.activeSessionId = session.id;

    // Limit total number of sessions
    if (this.sessions.size > MAX_SESSIONS) {
      const oldest = this.getSessionList()[this.sessions.size - 1];
      this.deleteSession(oldest.id);
    }

    this.saveToStorage();
    return session;
  }

  /**
   * Get the active session
   */
  getActiveSession(): Session | null {
    if (!this.activeSessionId) {
      const first = this.sessions.values().next().value;
      if (first) {
        this.activeSessionId = first.id;
      }
    }
    return this.activeSessionId ? this.sessions.get(this.activeSessionId) || null : null;
  }

  /**
   * Set active session by ID
   */
  setActiveSession(sessionId: string): Session | null {
    if (this.sessions.has(sessionId)) {
      this.activeSessionId = sessionId;
      this.saveToStorage();
      return this.sessions.get(sessionId) || null;
    }
    return null;
  }

  /**
   * Get all sessions sorted by updatedAt (newest first)
   */
  getSessionList(): Session[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
  }

  /**
   * Rename a session
   */
  renameSession(sessionId: string, newName: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.name = newName.trim() || session.name;
      session.updatedAt = Date.now();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): boolean {
    if (this.sessions.size <= 1) {
      // Don't delete the last session, just clear it
      const session = this.sessions.get(sessionId);
      if (session) {
        session.messages = [];
        session.displayMessages = [];
        session.updatedAt = Date.now();
        this.saveToStorage();
      }
      return false;
    }

    const deleted = this.sessions.delete(sessionId);
    if (deleted && this.activeSessionId === sessionId) {
      // Switch to another session
      const first = this.sessions.values().next().value;
      this.activeSessionId = first ? first.id : null;
    }
    this.saveToStorage();
    return deleted;
  }

  /**
   * Add a message to the active session
   */
  addMessage(message: ChatMessage): void {
    const session = this.getActiveSession();
    if (session) {
      session.messages.push(message);
      session.updatedAt = Date.now();

      // Limit messages per session
      if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
        session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION);
      }

      this.saveToStorage();
    }
  }

  /**
   * Add a display message to the active session
   */
  addDisplayMessage(
    role: DisplayMessage["role"],
    content: string,
    toolCalls?: ChatMessage["tool_calls"],
    isError?: boolean
  ): DisplayMessage | null {
    const session = this.getActiveSession();
    if (session) {
      const msg: DisplayMessage = {
        id: generateMessageId(),
        role,
        content,
        timestamp: Date.now(),
        toolCalls,
        isError,
      };
      session.displayMessages.push(msg);
      session.updatedAt = Date.now();

      // Limit display messages
      if (session.displayMessages.length > MAX_MESSAGES_PER_SESSION) {
        session.displayMessages = session.displayMessages.slice(-MAX_MESSAGES_PER_SESSION);
      }

      this.saveToStorage();
      return msg;
    }
    return null;
  }

  /**
   * Get messages from active session
   */
  getMessages(): ChatMessage[] {
    const session = this.getActiveSession();
    return session ? [...session.messages] : [];
  }

  /**
   * Get display messages from active session
   */
  getDisplayMessages(): DisplayMessage[] {
    const session = this.getActiveSession();
    return session ? [...session.displayMessages] : [];
  }

  /**
   * Clear messages in active session
   */
  clearActiveSession(): void {
    const session = this.getActiveSession();
    if (session) {
      session.messages = [];
      session.displayMessages = [];
      session.updatedAt = Date.now();
      this.saveToStorage();
    }
  }

  /**
   * Build user message with context (same as ContextManager)
   */
  buildUserMessage(
    userInput: string,
    selection?: string,
    documentText?: string,
    userRulesText?: string
  ): ChatMessage {
    const parts: string[] = [];

    if (userRulesText) {
      parts.push(`[USER_RULES]\n${userRulesText}\n[/USER_RULES]`);
    }

    if (documentText && documentText.trim()) {
      parts.push(`[DOCUMENT]\n${documentText.trim()}\n[/DOCUMENT]`);
    }

    if (selection && selection.trim()) {
      parts.push(`[SELECTION]\n${selection.trim()}\n[/SELECTION]`);
    }

    parts.push(userInput);

    return {
      role: "user",
      content: parts.join("\n\n"),
    };
  }
}

/**
 * Singleton instance
 */
let sessionManagerInstance: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager();
  }
  return sessionManagerInstance;
}

export function resetSessionManager(): void {
  sessionManagerInstance = new SessionManager();
}

export default SessionManager;
