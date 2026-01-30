import * as React from "react";
import { DisplayMessage } from "../../types/llm";
import MarkdownRenderer from "./MarkdownRenderer";

interface MessageItemProps {
  message: DisplayMessage;
}

/**
 * Format timestamp to readable time
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { role, content, timestamp, isError } = message;

  // Build class names
  const classNames = ["message-item", role];
  if (isError) {
    classNames.push("error");
  }

  // Use Markdown renderer for assistant messages
  const shouldRenderMarkdown = role === "assistant" && !isError;

  return (
    <div className={classNames.join(" ")}>
      <div className="content">
        {shouldRenderMarkdown ? (
          <MarkdownRenderer content={content} />
        ) : (
          content
        )}
      </div>
      <div className="timestamp">{formatTime(timestamp)}</div>
    </div>
  );
};

export default MessageItem;
