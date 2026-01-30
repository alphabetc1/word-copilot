/**
 * Message role types
 */
export type MessageRole = "system" | "user" | "assistant" | "tool";

/**
 * Tool call from LLM response
 */
export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: MessageRole;
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

/**
 * LLM API response choice
 */
export interface LLMChoice {
  index: number;
  message: ChatMessage;
  finish_reason: "stop" | "tool_calls" | "length" | "content_filter" | null;
}

/**
 * LLM API response usage
 */
export interface LLMUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * LLM API response
 */
export interface LLMResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: LLMChoice[];
  usage?: LLMUsage;
}

/**
 * LLM API error response
 */
export interface LLMErrorResponse {
  error: {
    message: string;
    type: string;
    code: string | null;
  };
}

/**
 * Chat completion request body
 */
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  tools?: import("./tools").ToolDefinition[];
  tool_choice?: "auto" | "none" | "required";
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Display message for UI
 */
export interface DisplayMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool_result";
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  isError?: boolean;
}
