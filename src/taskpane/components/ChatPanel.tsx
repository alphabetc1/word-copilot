import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { DisplayMessage } from "../../types/llm";
import { TOOL_DEFINITIONS } from "../../types/tools";
import { loadModelConfig, loadUserRules } from "../../helpers/settings";
import { getContextManager, ContextManager } from "../../helpers/contextManager";
import { sendChat } from "../../helpers/llmClient";
import { SYSTEM_PROMPT } from "../../helpers/systemPrompt";
import {
  executeToolCalls,
  hasToolCalls,
  formatToolResults,
} from "../../helpers/toolExecutor";
import { getSelectionText, getDocumentText } from "../../helpers/wordBridge";
import MessageItem from "./MessageItem";

interface ChatPanelProps {
  isConfigured: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isConfigured }) => {
  const contextManagerRef = useRef<ContextManager>(getContextManager());
  // Initialize messages from context manager to persist across tab switches
  const [messages, setMessages] = useState<DisplayMessage[]>(
    () => contextManagerRef.current.getDisplayMessages()
  );
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Restore messages when component mounts (e.g., after tab switch)
  useEffect(() => {
    const savedMessages = contextManagerRef.current.getDisplayMessages();
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !isConfigured) return;

    const userInput = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    const contextManager = contextManagerRef.current;

    try {
      // Get current selection and document context
      let selection = "";
      let documentText = "";

      try {
        selection = await getSelectionText();
        documentText = await getDocumentText(5000);
      } catch (error) {
        console.warn("Could not get Word context:", error);
      }

      // Load settings
      const config = loadModelConfig();
      const userRules = loadUserRules();

      // Build user message
      const userMessage = contextManager.buildUserMessage(
        userInput,
        selection,
        documentText,
        userRules
      );

      // Add to context
      contextManager.addMessage(userMessage);

      // Add to display
      contextManager.addDisplayMessage("user", userInput);
      setMessages([...contextManager.getDisplayMessages()]);

      // Send to LLM
      // First try with tools, if it fails with 400, retry without tools
      let result = await sendChat({
        config,
        systemPrompt: SYSTEM_PROMPT,
        messages: contextManager.getMessages(),
        tools: TOOL_DEFINITIONS,
        toolChoice: "auto",
      });

      // If 400 error, might be tools not supported, retry without tools
      if (!result.success && result.error?.includes("400")) {
        console.warn("Retrying without tools due to 400 error");
        result = await sendChat({
          config,
          systemPrompt: SYSTEM_PROMPT,
          messages: contextManager.getMessages(),
          // No tools - for models that don't support function calling
        });
      }

      if (!result.success || !result.message) {
        throw new Error(result.error || "Failed to get response from AI");
      }

      // Handle tool calls if present
      if (hasToolCalls(result.message)) {
        const toolCalls = result.message.tool_calls!;

        // Execute tool calls
        const toolResults = await executeToolCalls(toolCalls);
        const toolResultText = formatToolResults(toolResults);

        // Add tool result to display
        contextManager.addDisplayMessage(
          "tool_result",
          toolResultText,
          undefined,
          toolResults.some((r) => !r.success)
        );

        // Add natural language response if present
        if (result.message.content) {
          // Only add text content to context (without tool_calls to avoid API errors)
          contextManager.addMessage({
            role: "assistant",
            content: result.message.content,
          });
          contextManager.addDisplayMessage("assistant", result.message.content);
        } else {
          // Add a summary of what was done to context
          contextManager.addMessage({
            role: "assistant",
            content: `[已执行操作: ${toolResultText}]`,
          });
        }
      } else if (result.message.content) {
        // No tool calls, add the response to context and display
        contextManager.addMessage({
          role: "assistant",
          content: result.message.content,
        });
        contextManager.addDisplayMessage("assistant", result.message.content);
      }

      setMessages([...contextManager.getDisplayMessages()]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      contextManager.addDisplayMessage("assistant", errorMessage, undefined, true);
      setMessages([...contextManager.getDisplayMessages()]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    contextManagerRef.current.clearMessages();
    setMessages([]);
  };

  return (
    <div className="chat-panel">
      {/* Messages Area */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h3>开始对话</h3>
            <p>
              选中文档中的文本，然后告诉我你想要做什么。
              <br />
              例如：润色这段话、翻译成英文、添加批注建议...
            </p>
          </div>
        ) : (
          messages.map((msg) => <MessageItem key={msg.id} message={msg} />)
        )}

        {isLoading && (
          <div className="loading">
            <div className="loading-spinner" />
            <span>AI 正在思考...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-area">
        {messages.length > 0 && (
          <div style={{ marginBottom: 8, textAlign: "right" }}>
            <button className="clear-button" onClick={handleClear}>
              清除对话
            </button>
          </div>
        )}
        <div className="input-row">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isConfigured
                ? "输入你的请求，Shift+Enter 换行..."
                : "请先配置 API Key"
            }
            disabled={isLoading || !isConfigured}
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading || !isConfigured}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
