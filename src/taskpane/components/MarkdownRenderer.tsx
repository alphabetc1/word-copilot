import * as React from "react";

interface MarkdownRendererProps {
  content: string;
}

/**
 * Simple Markdown renderer without external dependencies
 * Supports: bold, italic, code, links, lists, headers, blockquotes, horizontal rules
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const renderMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    let inList = false;
    let listType: "ul" | "ol" = "ul";

    const processInline = (line: string): React.ReactNode => {
      // Process inline elements
      const parts: React.ReactNode[] = [];
      let remaining = line;
      let key = 0;

      while (remaining.length > 0) {
        // Code (inline)
        const codeMatch = remaining.match(/^`([^`]+)`/);
        if (codeMatch) {
          parts.push(<code key={key++} className="md-code">{codeMatch[1]}</code>);
          remaining = remaining.slice(codeMatch[0].length);
          continue;
        }

        // Bold
        const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
        if (boldMatch) {
          parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
          remaining = remaining.slice(boldMatch[0].length);
          continue;
        }

        // Italic
        const italicMatch = remaining.match(/^\*([^*]+)\*/);
        if (italicMatch) {
          parts.push(<em key={key++}>{italicMatch[1]}</em>);
          remaining = remaining.slice(italicMatch[0].length);
          continue;
        }

        // Links
        const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          parts.push(
            <a key={key++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer">
              {linkMatch[1]}
            </a>
          );
          remaining = remaining.slice(linkMatch[0].length);
          continue;
        }

        // Regular text (take one character)
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      }

      return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
    };

    const flushList = () => {
      if (listItems.length > 0) {
        if (listType === "ul") {
          elements.push(<ul key={`list-${elements.length}`} className="md-list">{listItems}</ul>);
        } else {
          elements.push(<ol key={`list-${elements.length}`} className="md-list">{listItems}</ol>);
        }
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Empty line
      if (trimmedLine === "") {
        flushList();
        elements.push(<div key={index} className="md-spacer" />);
        return;
      }

      // Horizontal rule
      if (/^(-{3,}|_{3,}|\*{3,})$/.test(trimmedLine)) {
        flushList();
        elements.push(<hr key={index} className="md-hr" />);
        return;
      }

      // Headers
      const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        flushList();
        const level = headerMatch[1].length;
        const HeaderTag = `h${level}` as keyof JSX.IntrinsicElements;
        elements.push(
          <HeaderTag key={index} className={`md-h${level}`}>
            {processInline(headerMatch[2])}
          </HeaderTag>
        );
        return;
      }

      // Blockquote
      if (trimmedLine.startsWith(">")) {
        flushList();
        const quoteContent = trimmedLine.slice(1).trim();
        elements.push(
          <blockquote key={index} className="md-blockquote">
            {processInline(quoteContent)}
          </blockquote>
        );
        return;
      }

      // Unordered list
      const ulMatch = trimmedLine.match(/^[-*+]\s+(.+)$/);
      if (ulMatch) {
        if (!inList || listType !== "ul") {
          flushList();
          inList = true;
          listType = "ul";
        }
        listItems.push(<li key={index}>{processInline(ulMatch[1])}</li>);
        return;
      }

      // Ordered list
      const olMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
      if (olMatch) {
        if (!inList || listType !== "ol") {
          flushList();
          inList = true;
          listType = "ol";
        }
        listItems.push(<li key={index}>{processInline(olMatch[1])}</li>);
        return;
      }

      // Checkbox (✅ or ❌)
      if (trimmedLine.startsWith("✅") || trimmedLine.startsWith("❌")) {
        flushList();
        elements.push(
          <div key={index} className="md-checkbox">
            {processInline(trimmedLine)}
          </div>
        );
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={index} className="md-paragraph">
          {processInline(trimmedLine)}
        </p>
      );
    });

    flushList();
    return elements;
  };

  return <div className="markdown-content">{renderMarkdown(content)}</div>;
};

export default MarkdownRenderer;
