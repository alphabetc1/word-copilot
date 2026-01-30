/**
 * Commands - Right-click menu command handlers
 *
 * These functions are called when users click on context menu items.
 * They execute LLM requests and apply tool calls to the document.
 */

import { TOOL_DEFINITIONS } from "../types/tools";
import { loadModelConfig, loadUserRules, isModelConfigured } from "../helpers/settings";
import { sendChat } from "../helpers/llmClient";
import { getSystemPromptForCommand } from "../helpers/systemPrompt";
import { executeToolCalls, hasToolCalls } from "../helpers/toolExecutor";
import { getSelectionText, getDocumentText, showNotification } from "../helpers/wordBridge";
import { formatUserRules } from "../helpers/contextManager";

/**
 * Execute a command with the given prompt
 */
async function executeCommand(
  commandType: "polish" | "translate" | "comment",
  userPrompt: string
): Promise<void> {
  // Check if configured
  if (!isModelConfigured()) {
    showNotification("请先在插件设置中配置 API Key", "error");
    return;
  }

  try {
    // Get selection
    const selection = await getSelectionText();
    if (!selection || !selection.trim()) {
      showNotification("请先选中要处理的文本", "warning");
      return;
    }

    // Get document context (smaller for commands)
    let documentText = "";
    try {
      documentText = await getDocumentText(2000);
    } catch {
      // Document context is optional
    }

    // Load settings
    const config = loadModelConfig();
    const userRules = loadUserRules();

    // Build message content
    const rulesText = formatUserRules(userRules);
    const messageContent = [
      `[USER_RULES]\n${rulesText}\n[/USER_RULES]`,
      documentText ? `[DOCUMENT]\n${documentText}\n[/DOCUMENT]` : "",
      `[SELECTION]\n${selection}\n[/SELECTION]`,
      userPrompt,
    ]
      .filter(Boolean)
      .join("\n\n");

    // Get command-specific system prompt
    const systemPrompt = getSystemPromptForCommand(commandType);

    // Send to LLM
    const result = await sendChat({
      config,
      systemPrompt,
      messages: [{ role: "user", content: messageContent }],
      tools: TOOL_DEFINITIONS,
      toolChoice: "auto",
    });

    if (!result.success || !result.message) {
      throw new Error(result.error || "AI 响应失败");
    }

    // Execute tool calls if present
    if (hasToolCalls(result.message)) {
      const toolResults = await executeToolCalls(result.message.tool_calls!);
      const allSuccess = toolResults.every((r) => r.success);

      if (allSuccess) {
        showNotification("操作完成", "info");
      } else {
        const failedResults = toolResults.filter((r) => !r.success);
        showNotification(`部分操作失败: ${failedResults[0]?.error}`, "error");
      }
    } else if (result.message.content) {
      // No tool calls, show the response
      showNotification(result.message.content.substring(0, 100), "info");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "操作失败";
    showNotification(errorMessage, "error");
    console.error("Command execution error:", error);
  }
}

/**
 * Polish (润色) the selected text
 */
async function polishSelection(event: Office.AddinCommands.Event): Promise<void> {
  await executeCommand(
    "polish",
    "请润色选中的文本，使其更加清晰、流畅、专业。保持原意不变。"
  );
  event.completed();
}

/**
 * Translate the selected text
 */
async function translateSelection(event: Office.AddinCommands.Event): Promise<void> {
  await executeCommand(
    "translate",
    "请翻译选中的文本。如果是中文则翻译成英文，如果是英文则翻译成中文。保持专业术语的准确性。"
  );
  event.completed();
}

/**
 * Add comment suggestion to the selected text
 */
async function addCommentSuggestion(event: Office.AddinCommands.Event): Promise<void> {
  await executeCommand(
    "comment",
    "请分析选中的文本，并添加改进建议或反馈意见作为批注。不要修改原文。"
  );
  event.completed();
}

/**
 * Register commands with Office.js
 */
function registerCommands(): void {
  // Register command functions
  Office.actions.associate("polishSelection", polishSelection);
  Office.actions.associate("translateSelection", translateSelection);
  Office.actions.associate("addCommentSuggestion", addCommentSuggestion);
}

// Initialize on Office ready
Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    registerCommands();
  }
});

// Export for testing
export { polishSelection, translateSelection, addCommentSuggestion, executeCommand };
