/**
 * Context Manager - Manages conversation history and message building
 */

import { ChatMessage, DisplayMessage } from "../types/llm";
import {
  UserRules,
  STYLE_LABELS,
  TONE_LABELS,
  LENGTH_LABELS,
  LANGUAGE_LABELS,
} from "../types/settings";

/**
 * Maximum number of conversation rounds to keep
 */
const MAX_ROUNDS = 10;

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Context Manager class
 */
export class ContextManager {
  private messages: ChatMessage[] = [];
  private displayMessages: DisplayMessage[] = [];
  private maxRounds: number;

  constructor(maxRounds: number = MAX_ROUNDS) {
    this.maxRounds = maxRounds;
  }

  /**
   * Add a message to the conversation
   */
  addMessage(message: ChatMessage): void {
    this.messages.push(message);

    // Trim old messages if exceeding max rounds
    // Each round typically has 2 messages (user + assistant)
    const maxMessages = this.maxRounds * 2;
    if (this.messages.length > maxMessages) {
      this.messages = this.messages.slice(-maxMessages);
    }
  }

  /**
   * Add a display message for UI
   */
  addDisplayMessage(
    role: DisplayMessage["role"],
    content: string,
    toolCalls?: ChatMessage["tool_calls"],
    isError?: boolean
  ): DisplayMessage {
    const msg: DisplayMessage = {
      id: generateMessageId(),
      role,
      content,
      timestamp: Date.now(),
      toolCalls,
      isError,
    };
    this.displayMessages.push(msg);
    return msg;
  }

  /**
   * Get all messages for LLM context
   */
  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  /**
   * Get all display messages for UI
   */
  getDisplayMessages(): DisplayMessage[] {
    return [...this.displayMessages];
  }

  /**
   * Clear all conversation history
   */
  clearMessages(): void {
    this.messages = [];
    this.displayMessages = [];
  }

  /**
   * Build a user message with context
   */
  buildUserMessage(
    userInput: string,
    selection?: string,
    documentText?: string,
    userRules?: UserRules
  ): ChatMessage {
    const parts: string[] = [];

    // Add user rules if provided
    if (userRules) {
      const rulesText = formatUserRules(userRules);
      parts.push(`[USER_RULES]\n${rulesText}\n[/USER_RULES]`);
    }

    // Add document context if provided
    if (documentText && documentText.trim()) {
      parts.push(`[DOCUMENT]\n${documentText.trim()}\n[/DOCUMENT]`);
    }

    // Add selection if provided
    if (selection && selection.trim()) {
      parts.push(`[SELECTION]\n${selection.trim()}\n[/SELECTION]`);
    }

    // Add user input
    parts.push(userInput);

    return {
      role: "user",
      content: parts.join("\n\n"),
    };
  }

  /**
   * Get the last assistant message
   */
  getLastAssistantMessage(): ChatMessage | undefined {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].role === "assistant") {
        return this.messages[i];
      }
    }
    return undefined;
  }

  /**
   * Get conversation summary for context
   */
  getConversationSummary(): string {
    if (this.messages.length === 0) {
      return "（新对话）";
    }
    return `已进行 ${Math.ceil(this.messages.length / 2)} 轮对话`;
  }
}

/**
 * Format user rules into a readable string
 */
export function formatUserRules(rules: UserRules): string {
  const lines: string[] = [];

  lines.push(`风格：${STYLE_LABELS[rules.style]}`);
  lines.push(`语气：${TONE_LABELS[rules.tone]}`);
  lines.push(`长度：${LENGTH_LABELS[rules.length]}`);
  lines.push(`语言：${LANGUAGE_LABELS[rules.language]}`);

  if (rules.custom && rules.custom.trim()) {
    lines.push(`其他：${rules.custom.trim()}`);
  }

  return lines.join("\n");
}

/**
 * Create a singleton context manager instance
 */
let contextManagerInstance: ContextManager | null = null;

export function getContextManager(): ContextManager {
  if (!contextManagerInstance) {
    contextManagerInstance = new ContextManager();
  }
  return contextManagerInstance;
}

/**
 * Reset the context manager instance
 */
export function resetContextManager(): void {
  contextManagerInstance = new ContextManager();
}

export default ContextManager;
