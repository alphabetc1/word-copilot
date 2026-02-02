/**
 * LLM Client - Handles communication with OpenAI-compatible LLM APIs
 */

import {
  ChatMessage,
  LLMResponse,
  LLMErrorResponse,
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
const DEFAULT_TIMEOUT = 180000;

/**
 * Maximum request body size (in characters) to avoid WebView/network failures.
 * This is a pragmatic safety limit; large payloads are more likely to fail in Office WebViews.
 */
const MAX_REQUEST_BODY_CHARS = 220_000;

function estimateChars(obj: unknown): number {
  try {
    return JSON.stringify(obj).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function formatKb(chars: number): string {
  // Rough estimate: 1 char ~= 1 byte for ASCII; for CJK it's more, but this is good enough for UI hints.
  const kb = Math.round(chars / 1024);
  return `${kb} KB`;
}

/**
 * Build the API endpoint URL
 */
function buildEndpoint(baseUrl: string): string {
  // Remove trailing slash if present
  const url = baseUrl.replace(/\/+$/, "");
  
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
 * Create an AbortController with timeout and optional external signal linkage.
 */
function createTimeoutController(timeout: number): {
  controller: AbortController;
  timeoutId: ReturnType<typeof setTimeout>;
  didTimeout: () => boolean;
  attachExternal: (external?: AbortController) => () => void;
} {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeout);

  const attachExternal = (external?: AbortController) => {
    if (!external) return () => {};

    const onAbort = () => controller.abort();
    if (external.signal.aborted) {
      controller.abort();
      return () => {};
    }
    external.signal.addEventListener("abort", onAbort, { once: true });
    return () => external.signal.removeEventListener("abort", onAbort);
  };

  return { controller, timeoutId, didTimeout: () => timedOut, attachExternal };
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

  // Always apply a timeout; Office WebViews can hang on long requests.
  // Also link to external AbortController (Cancel button, etc.).
  const useExternalController = !!externalController;
  const { controller, timeoutId, didTimeout, attachExternal } =
    createTimeoutController(DEFAULT_TIMEOUT);
  const detachExternal = attachExternal(externalController);

  // Guardrail: avoid huge payloads that frequently fail in Office WebViews (e.g. "Load failed").
  // Try pruning oldest messages (keep system + most recent messages) before giving up.
  let prunedMessages = fullMessages;
  let pruned = false;
  let requestChars = estimateChars({ ...requestBody, messages: prunedMessages });
  while (requestChars > MAX_REQUEST_BODY_CHARS && prunedMessages.length > 3) {
    // Remove the oldest non-system message (index 1).
    prunedMessages = [prunedMessages[0], ...prunedMessages.slice(2)];
    pruned = true;
    requestChars = estimateChars({ ...requestBody, messages: prunedMessages });
  }
  if (pruned) {
    requestBody.messages = prunedMessages;
  }
  if (requestChars > MAX_REQUEST_BODY_CHARS) {
    clearTimeout(timeoutId);
    detachExternal();
    return {
      success: false,
      error:
        `请求内容过长（约 ${formatKb(requestChars)}），` +
        "可能导致 Office 内置浏览器网络请求失败。建议：清空对话后重试，或把任务拆分成更小的步骤。",
    };
  }

  try {
    const doFetch = async () =>
      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

    // Retry once for transient WebView/network failures.
    let response: Response;
    try {
      response = await doFetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const transient =
        msg.includes("Load failed") ||
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError");
      if (!didTimeout() && !controller.signal.aborted && transient) {
        await new Promise((r) => setTimeout(r, 500));
        response = await doFetch();
      } else {
        throw e;
      }
    }

    clearTimeout(timeoutId);
    detachExternal();

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
    clearTimeout(timeoutId);
    detachExternal();

    if (error instanceof Error) {
      // Some Office WebViews throw TypeError("Load failed") on abort/timeout.
      if (didTimeout()) {
        return {
          success: false,
          error:
            "请求超时。复杂任务可能需要更久，建议拆分任务或减少上下文（清空对话/缩短输入）后重试。",
        };
      }
      if (error.name === "AbortError") {
        // Check if it was user-initiated cancellation or timeout
        if (useExternalController) {
          return { success: false, error: "已取消请求" };
        }
        return { success: false, error: "Request timed out" };
      }
      // Improve diagnosability for Office WebView network errors.
      const endpointHost = (() => {
        try {
          return new URL(endpoint).host;
        } catch {
          return endpoint;
        }
      })();
      console.error("Network error:", {
        name: error.name,
        message: error.message,
        endpointHost,
        requestSize: formatKb(requestChars),
        pruned,
      });
      if (error.message === "Load failed" || error.message === "Failed to fetch") {
        return {
          success: false,
          error:
            `网络请求失败（${error.message}）。` +
            `常见原因：网络/代理限制、TLS 证书问题、或请求过大/耗时过长导致连接被中断。` +
            `请检查 Base URL 是否可从 Word 访问（当前域名：${endpointHost}），` +
            "并尝试清空对话、缩短输入或拆分任务后重试。",
        };
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
