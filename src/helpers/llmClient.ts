/**
 * LLM Client - Handles communication with OpenAI-compatible LLM APIs
 */

import {
  ChatMessage,
  LLMResponse,
  LLMErrorResponse,
  ChatCompletionRequest,
} from "../types/llm";
import { ToolDefinition } from "../types/tools";
import { ModelConfig } from "../types/settings";

/**
 * Parameters for sending a chat request
 */
export interface SendChatParams {
  config: ModelConfig;
  systemPrompt: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  toolChoice?: "auto" | "none" | "required";
  temperature?: number;
  maxTokens?: number;
  /** External AbortController for cancellation support */
  abortController?: AbortController;
}

/**
 * Result of a chat request
 */
export interface ChatResult {
  success: boolean;
  message?: ChatMessage;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Default request timeout in milliseconds
 */
const DEFAULT_TIMEOUT = 60000;

/**
 * Build the API endpoint URL
 */
function buildEndpoint(baseUrl: string): string {
  // Remove trailing slash if present
  let url = baseUrl.replace(/\/+$/, "");
  
  // If URL already contains the path, don't add it again
  if (url.includes("/chat/completions")) {
    return url;
  }
  
  // If URL ends with /v1, just add /chat/completions
  if (url.endsWith("/v1")) {
    return `${url}/chat/completions`;
  }
  
  // Otherwise add the full path
  return `${url}/v1/chat/completions`;
}

/**
 * Create an AbortController with timeout
 */
function createTimeoutController(timeout: number): {
  controller: AbortController;
  timeoutId: ReturnType<typeof setTimeout>;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return { controller, timeoutId };
}

/**
 * Send a chat completion request to the LLM API
 */
export async function sendChat(params: SendChatParams): Promise<ChatResult> {
  const {
    config,
    systemPrompt,
    messages,
    tools,
    toolChoice = "auto",
    temperature = 0.7,
    maxTokens = 4096,
    abortController: externalController,
  } = params;

  // Validate config
  if (!config.baseUrl) {
    return { success: false, error: "Base URL is not configured" };
  }
  if (!config.apiKey) {
    return { success: false, error: "API Key is not configured" };
  }
  if (!config.model) {
    return { success: false, error: "Model is not configured" };
  }

  // Build messages array with system prompt
  const fullMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  // Build request body - use type assertion for flexibility with different APIs
  const requestBody: Record<string, unknown> = {
    model: config.model,
    messages: fullMessages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  };

  // Add tools if provided (some models may not support this)
  if (tools && tools.length > 0) {
    requestBody.tools = tools;
    requestBody.tool_choice = toolChoice;
  }

  const endpoint = buildEndpoint(config.baseUrl);
  console.log("Sending request to:", endpoint);
  console.log("Request body (truncated):", JSON.stringify(requestBody, null, 2).substring(0, 500));

  // Use external controller if provided, otherwise create one with timeout
  const useExternalController = !!externalController;
  const { controller, timeoutId } = useExternalController
    ? { controller: externalController, timeoutId: null }
    : createTimeoutController(DEFAULT_TIMEOUT);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorText = await response.text();
        // Try to parse as JSON
        try {
          const errorData = JSON.parse(errorText) as LLMErrorResponse;
          if (errorData?.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          // If not JSON, use the raw text (truncated)
          if (errorText) {
            errorMessage = errorText.substring(0, 200);
          }
        }
      } catch {
        // Ignore parse errors
      }
      console.error("API Error:", errorMessage, "Endpoint:", endpoint);
      return { success: false, error: errorMessage };
    }

    // Parse successful response
    const data = (await response.json()) as LLMResponse;

    if (!data.choices || data.choices.length === 0) {
      return { success: false, error: "No response from model" };
    }

    const choice = data.choices[0];

    return {
      success: true,
      message: choice.message,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        // Check if it was user-initiated cancellation or timeout
        if (useExternalController) {
          return { success: false, error: "已取消请求" };
        }
        return { success: false, error: "Request timed out" };
      }
      return { success: false, error: `Network error: ${error.message}` };
    }

    return { success: false, error: "Unknown error occurred" };
  }
}

/**
 * Send a simple chat message without tools (for Q&A scenarios)
 */
export async function sendSimpleChat(
  config: ModelConfig,
  systemPrompt: string,
  userMessage: string
): Promise<ChatResult> {
  return sendChat({
    config,
    systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
}

/**
 * Continue a conversation with tool results
 */
export async function continueWithToolResults(
  params: SendChatParams,
  assistantMessage: ChatMessage,
  toolResults: Array<{ toolCallId: string; result: string }>
): Promise<ChatResult> {
  // Add the assistant message with tool calls
  const messagesWithAssistant = [...params.messages, assistantMessage];

  // Add tool result messages
  const toolResultMessages: ChatMessage[] = toolResults.map((tr) => ({
    role: "tool" as const,
    tool_call_id: tr.toolCallId,
    content: tr.result,
  }));

  return sendChat({
    ...params,
    messages: [...messagesWithAssistant, ...toolResultMessages],
    // After tool results, we typically don't want more tool calls
    toolChoice: "none",
  });
}

/**
 * LLM Client object for easy import
 */
export const llmClient = {
  sendChat,
  sendSimpleChat,
  continueWithToolResults,
};

export default llmClient;
