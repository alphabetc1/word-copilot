/**
 * Tool Executor - Executes tool calls from LLM responses
 */

import { ToolCall } from "../types/llm";
import {
  ToolName,
  ToolResult,
  ReplaceSelectionArgs,
  InsertTextArgs,
  DeleteSelectionArgs,
  AddCommentToSelectionArgs,
  InsertPosition,
} from "../types/tools";
import {
  replaceSelection,
  insertText,
  deleteSelection,
  addCommentToSelection,
} from "./wordBridge";

/**
 * Parse tool arguments from JSON string
 */
function parseToolArgs<T>(argsString: string): T {
  try {
    return JSON.parse(argsString) as T;
  } catch (error) {
    throw new Error(`Failed to parse tool arguments: ${argsString}`);
  }
}

/**
 * Execute a single tool call
 */
async function executeSingleToolCall(toolCall: ToolCall): Promise<ToolResult> {
  const { id, function: fn } = toolCall;
  const toolName = fn.name as ToolName;

  try {
    switch (toolName) {
      case "replace_selection": {
        const args = parseToolArgs<ReplaceSelectionArgs>(fn.arguments);
        if (!args.content) {
          throw new Error("replace_selection requires content parameter");
        }
        await replaceSelection(args.content);
        return {
          toolCallId: id,
          name: toolName,
          success: true,
          message: args.comment || "已替换选中内容",
        };
      }

      case "insert_text": {
        const args = parseToolArgs<InsertTextArgs>(fn.arguments);
        if (!args.position || !args.content) {
          throw new Error("insert_text requires position and content parameters");
        }
        const validPositions: InsertPosition[] = [
          "before_selection",
          "after_selection",
          "document_start",
          "document_end",
        ];
        if (!validPositions.includes(args.position)) {
          throw new Error(`Invalid insert position: ${args.position}`);
        }
        await insertText(args.position, args.content);
        const positionLabel = getPositionLabel(args.position);
        return {
          toolCallId: id,
          name: toolName,
          success: true,
          message: args.comment || `已在${positionLabel}插入内容`,
        };
      }

      case "delete_selection": {
        const args = parseToolArgs<DeleteSelectionArgs>(fn.arguments);
        await deleteSelection();
        return {
          toolCallId: id,
          name: toolName,
          success: true,
          message: args.comment || "已删除选中内容",
        };
      }

      case "add_comment_to_selection": {
        const args = parseToolArgs<AddCommentToSelectionArgs>(fn.arguments);
        if (!args.comment) {
          throw new Error("add_comment_to_selection requires comment parameter");
        }
        await addCommentToSelection(args.comment);
        return {
          toolCallId: id,
          name: toolName,
          success: true,
          message: "已添加批注",
        };
      }

      default:
        return {
          toolCallId: id,
          name: toolName,
          success: false,
          message: `未知工具: ${toolName}`,
          error: `Unknown tool: ${toolName}`,
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      toolCallId: id,
      name: toolName,
      success: false,
      message: `执行失败: ${errorMessage}`,
      error: errorMessage,
    };
  }
}

/**
 * Get human-readable position label
 */
function getPositionLabel(position: InsertPosition): string {
  switch (position) {
    case "before_selection":
      return "选区前";
    case "after_selection":
      return "选区后";
    case "document_start":
      return "文档开头";
    case "document_end":
      return "文档末尾";
    default:
      return "指定位置";
  }
}

/**
 * Execute multiple tool calls sequentially
 */
export async function executeToolCalls(
  toolCalls: ToolCall[]
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];

  for (const toolCall of toolCalls) {
    const result = await executeSingleToolCall(toolCall);
    results.push(result);

    // If a tool call fails, we might want to stop execution
    // For now, we continue with remaining calls
    if (!result.success) {
      console.warn(`Tool call failed: ${result.error}`);
    }
  }

  return results;
}

/**
 * Check if a message contains tool calls
 */
export function hasToolCalls(
  message: { tool_calls?: ToolCall[] } | null | undefined
): boolean {
  return Boolean(message?.tool_calls && message.tool_calls.length > 0);
}

/**
 * Format tool results for display
 */
export function formatToolResults(results: ToolResult[]): string {
  if (results.length === 0) return "";

  const lines = results.map((r) => {
    const status = r.success ? "✓" : "✗";
    return `${status} ${r.message}`;
  });

  return lines.join("\n");
}

/**
 * Convert tool results to LLM message format
 */
export function toolResultsToMessages(
  results: ToolResult[]
): Array<{ toolCallId: string; result: string }> {
  return results.map((r) => ({
    toolCallId: r.toolCallId,
    result: r.success
      ? `成功: ${r.message}`
      : `失败: ${r.error || r.message}`,
  }));
}

/**
 * Tool executor object for easy import
 */
export const toolExecutor = {
  executeToolCalls,
  hasToolCalls,
  formatToolResults,
  toolResultsToMessages,
};

export default toolExecutor;
