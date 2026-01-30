/**
 * Tool definition for OpenAI-compatible API
 */
export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, ToolParameter>;
      required?: string[];
    };
  };
}

/**
 * Tool parameter definition
 */
export interface ToolParameter {
  type: string;
  description?: string;
  enum?: string[];
}

/**
 * Insert position options
 */
export type InsertPosition =
  | "before_selection"
  | "after_selection"
  | "document_start"
  | "document_end";

/**
 * Arguments for replace_selection tool
 */
export interface ReplaceSelectionArgs {
  content: string;
  comment?: string;
}

/**
 * Arguments for insert_text tool
 */
export interface InsertTextArgs {
  position: InsertPosition;
  content: string;
  comment?: string;
}

/**
 * Arguments for delete_selection tool
 */
export interface DeleteSelectionArgs {
  comment?: string;
}

/**
 * Arguments for add_comment_to_selection tool
 */
export interface AddCommentToSelectionArgs {
  comment: string;
}

/**
 * Union type for all tool arguments
 */
export type ToolArgs =
  | ReplaceSelectionArgs
  | InsertTextArgs
  | DeleteSelectionArgs
  | AddCommentToSelectionArgs;

/**
 * Tool names
 */
export type ToolName =
  | "replace_selection"
  | "insert_text"
  | "delete_selection"
  | "add_comment_to_selection";

/**
 * Tool execution result
 */
export interface ToolResult {
  toolCallId: string;
  name: ToolName;
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Tool definitions for the Word Copilot
 */
export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "replace_selection",
      description:
        "Replace the currently selected text in the Word document with new content. Use this when the user asks to rewrite, polish, translate, or modify the selected text.",
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "The new text to replace the current selection with",
          },
          comment: {
            type: "string",
            description:
              "Optional brief explanation of what changes were made",
          },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insert_text",
      description:
        "Insert text at a specified position in the document. Use this for adding summaries, outlines, or new content without replacing existing text.",
      parameters: {
        type: "object",
        properties: {
          position: {
            type: "string",
            description: "Where to insert the text",
            enum: [
              "before_selection",
              "after_selection",
              "document_start",
              "document_end",
            ],
          },
          content: {
            type: "string",
            description: "The text content to insert",
          },
          comment: {
            type: "string",
            description: "Optional brief explanation of what was inserted",
          },
        },
        required: ["position", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_selection",
      description:
        "Delete the currently selected text from the document. Use this when the user explicitly asks to remove or delete content.",
      parameters: {
        type: "object",
        properties: {
          comment: {
            type: "string",
            description: "Optional brief explanation of why the text was deleted",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_comment_to_selection",
      description:
        "Add a comment/annotation to the selected text without modifying the text itself. Use this for providing feedback, suggestions, or explanations about the selected content.",
      parameters: {
        type: "object",
        properties: {
          comment: {
            type: "string",
            description: "The comment text to add as an annotation",
          },
        },
        required: ["comment"],
      },
    },
  },
];
