/**
 * Word Bridge - Encapsulates Office.js Word API operations
 */

import { InsertPosition } from "../types/tools";

/**
 * Get the currently selected text in Word
 * @returns The selected text or empty string if nothing selected
 */
export async function getSelectionText(): Promise<string> {
  return Word.run(async (context) => {
    const selection = context.document.getSelection();
    selection.load("text");
    await context.sync();
    return selection.text || "";
  });
}

/**
 * Get the document body text (optionally truncated)
 * @param maxLength Maximum length of text to return (default: 10000)
 * @returns The document text
 */
export async function getDocumentText(maxLength: number = 10000): Promise<string> {
  return Word.run(async (context) => {
    const body = context.document.body;
    body.load("text");
    await context.sync();

    const text = body.text || "";
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + "\n...[文档内容已截断]...";
    }
    return text;
  });
}

/**
 * Replace the current selection with new content using Track Changes
 * This enables revision mode so users can Accept/Reject changes
 * @param content The new text to replace selection with
 * @param useTrackChanges Whether to use track changes mode (default: true)
 */
export async function replaceSelection(
  content: string,
  useTrackChanges: boolean = true
): Promise<void> {
  return Word.run(async (context) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let originalMode: any = null;
    let shouldRestore = false;

    // Save and set track changes mode if requested
    if (useTrackChanges) {
      try {
        // Load current tracking mode to restore later
        context.document.load("changeTrackingMode");
        await context.sync();
        originalMode = context.document.changeTrackingMode;
        shouldRestore = true;

        // Enable track all mode for this operation
        context.document.changeTrackingMode = Word.ChangeTrackingMode.trackAll;
        await context.sync();
      } catch (e) {
        // Track changes might not be supported in all versions
        console.warn("Track changes not supported, falling back to direct replace:", e);
        shouldRestore = false;
      }
    }

    try {
      // Perform the replacement
      const selection = context.document.getSelection();
      selection.load("text");
      await context.sync();

      selection.insertText(content, Word.InsertLocation.replace);
      await context.sync();
    } finally {
      // Restore original tracking mode (turn off if it was off)
      if (shouldRestore && originalMode !== null) {
        try {
          context.document.changeTrackingMode = originalMode;
          await context.sync();
        } catch (e) {
          // Ignore restore errors
          console.warn("Failed to restore tracking mode:", e);
        }
      }
    }
  });
}

/**
 * Replace the current selection directly without track changes
 * @param content The new text to replace selection with
 */
export async function replaceSelectionDirect(content: string): Promise<void> {
  return Word.run(async (context) => {
    const selection = context.document.getSelection();
    selection.insertText(content, Word.InsertLocation.replace);
    await context.sync();
  });
}

/**
 * Insert text at a specified position
 * @param position Where to insert the text
 * @param content The text to insert
 */
export async function insertText(
  position: InsertPosition,
  content: string
): Promise<void> {
  return Word.run(async (context) => {
    let range: Word.Range;

    switch (position) {
      case "before_selection":
        range = context.document.getSelection();
        range.insertText(content, Word.InsertLocation.before);
        break;

      case "after_selection":
        range = context.document.getSelection();
        range.insertText(content, Word.InsertLocation.after);
        break;

      case "document_start":
        range = context.document.body.getRange(Word.RangeLocation.start);
        range.insertText(content + "\n\n", Word.InsertLocation.before);
        break;

      case "document_end":
        range = context.document.body.getRange(Word.RangeLocation.end);
        range.insertText("\n\n" + content, Word.InsertLocation.after);
        break;

      default:
        throw new Error(`Unknown insert position: ${position}`);
    }

    await context.sync();
  });
}

/**
 * Delete the current selection
 */
export async function deleteSelection(): Promise<void> {
  return Word.run(async (context) => {
    const selection = context.document.getSelection();
    selection.delete();
    await context.sync();
  });
}

/**
 * Add a comment to the current selection
 * @param comment The comment text to add
 */
export async function addCommentToSelection(comment: string): Promise<void> {
  return Word.run(async (context) => {
    const selection = context.document.getSelection();

    // Word.js API for comments
    // Note: Comments API requires Word API 1.4+
    const commentRange = selection.getRange();
    commentRange.insertComment(comment);

    await context.sync();
  });
}

/**
 * Check if there is any text selected
 * @returns true if text is selected
 */
export async function hasSelection(): Promise<boolean> {
  return Word.run(async (context) => {
    const selection = context.document.getSelection();
    selection.load("text");
    await context.sync();
    return selection.text.length > 0;
  });
}

/**
 * Get paragraph containing the selection for context
 * @returns The paragraph text containing the selection
 */
export async function getSelectionContext(): Promise<{
  selection: string;
  paragraph: string;
}> {
  return Word.run(async (context) => {
    const selection = context.document.getSelection();
    selection.load("text");

    // Get the paragraph containing the selection
    const paragraphs = selection.paragraphs;
    paragraphs.load("text");

    await context.sync();

    const paragraphTexts = paragraphs.items.map((p) => p.text).join("\n");

    return {
      selection: selection.text || "",
      paragraph: paragraphTexts || "",
    };
  });
}

/**
 * Show a notification message in Word
 * @param message The message to show
 * @param type The message type
 */
export function showNotification(
  message: string,
  type: "info" | "warning" | "error" = "info"
): void {
  // Use Office notification API if available
  if (Office.context.ui && typeof Office.context.ui.displayDialogAsync === "function") {
    // Fallback: use console for now, could implement dialog-based notification
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  // Alternative: use browser notification if permitted
  if (typeof window !== "undefined" && window.alert) {
    // Only use alert for errors in production
    if (type === "error") {
      window.alert(message);
    }
  }
}

/**
 * Accept all tracked changes in the document
 */
export async function acceptAllChanges(): Promise<void> {
  return Word.run(async (context) => {
    try {
      // Get all tracked changes and accept them
      const body = context.document.body;
      body.load("text");
      await context.sync();
      
      // Note: There's no direct API to accept all changes in current Word.js
      // Users need to use Word UI (Review tab) to accept/reject changes
      console.log("Please use Word's Review tab to accept/reject changes");
    } catch (e) {
      console.warn("Could not process tracked changes:", e);
    }
  });
}

/**
 * Word Bridge API object for easy import
 */
export const wordBridge = {
  getSelectionText,
  getDocumentText,
  replaceSelection,
  replaceSelectionDirect,
  insertText,
  deleteSelection,
  addCommentToSelection,
  hasSelection,
  getSelectionContext,
  showNotification,
  acceptAllChanges,
};

export default wordBridge;
