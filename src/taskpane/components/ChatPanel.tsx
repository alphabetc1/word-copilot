import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { DisplayMessage } from "../../types/llm";
import { TOOL_DEFINITIONS } from "../../types/tools";
import { loadModelConfig, loadUserRules } from "../../helpers/settings";
import { formatUserRules } from "../../helpers/contextManager";
import { getSessionManager, SessionManager, Session } from "../../helpers/sessionManager";
import { sendChat } from "../../helpers/llmClient";
import { SYSTEM_PROMPT } from "../../helpers/systemPrompt";
import {
  executeToolCalls,
  hasToolCalls,
  formatToolResults,
} from "../../helpers/toolExecutor";
import { getSelectionText, getDocumentText } from "../../helpers/wordBridge";
import { analyzeDocumentStructure } from "../../helpers/structureAnalyzer";
import MessageItem from "./MessageItem";
import SessionList from "./SessionList";

interface ChatPanelProps {
  isConfigured: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isConfigured }) => {
  const sessionManagerRef = useRef<SessionManager>(getSessionManager());
  const [sessions, setSessions] = useState<Session[]>(() =>
    sessionManagerRef.current.getSessionList()
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() =>
    sessionManagerRef.current.getActiveSession()?.id || null
  );
  const [messages, setMessages] = useState<DisplayMessage[]>(() =>
    sessionManagerRef.current.getDisplayMessages()
  );
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSessionList, setShowSessionList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AbortController for cancelling requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Refresh sessions list
  const refreshSessions = useCallback(() => {
    const sm = sessionManagerRef.current;
    setSessions(sm.getSessionList());
    setActiveSessionId(sm.getActiveSession()?.id || null);
    setMessages(sm.getDisplayMessages());
  }, []);

  // Restore messages when component mounts (e.g., after tab switch)
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cancel current request
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Session management handlers
  const handleSelectSession = (sessionId: string) => {
    const sm = sessionManagerRef.current;
    sm.setActiveSession(sessionId);
    refreshSessions();
    setShowSessionList(false);
  };

  const handleNewSession = () => {
    const sm = sessionManagerRef.current;
    sm.createSession();
    refreshSessions();
    setShowSessionList(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    const sm = sessionManagerRef.current;
    sm.deleteSession(sessionId);
    refreshSessions();
  };

  const handleRenameSession = (sessionId: string, newName: string) => {
    const sm = sessionManagerRef.current;
    sm.renameSession(sessionId, newName);
    refreshSessions();
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !isConfigured) return;

    const userInput = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const sm = sessionManagerRef.current;

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
      const userRulesText = formatUserRules(userRules);

      // Build user message
      const userMessage = sm.buildUserMessage(
        userInput,
        selection,
        documentText,
        userRulesText
      );

      // Add to session
      sm.addMessage(userMessage);
      sm.addDisplayMessage("user", userInput);
      setMessages(sm.getDisplayMessages());

      // Send to LLM
      let result = await sendChat({
        config,
        systemPrompt: SYSTEM_PROMPT,
        messages: sm.getMessages(),
        tools: TOOL_DEFINITIONS,
        toolChoice: "auto",
        abortController: abortControllerRef.current!,
      });

      // If 400 error, might be tools not supported, retry without tools
      if (!result.success && result.error?.includes("400")) {
        console.warn("Retrying without tools due to 400 error");
        result = await sendChat({
          config,
          systemPrompt: SYSTEM_PROMPT,
          messages: sm.getMessages(),
          abortController: abortControllerRef.current!,
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
        sm.addDisplayMessage(
          "tool_result",
          toolResultText,
          undefined,
          toolResults.some((r) => !r.success)
        );

        // Add natural language response if present
        if (result.message.content) {
          sm.addMessage({
            role: "assistant",
            content: result.message.content,
          });
          sm.addDisplayMessage("assistant", result.message.content);
        } else {
          sm.addMessage({
            role: "assistant",
            content: `[已执行操作: ${toolResultText}]`,
          });
        }
      } else if (result.message.content) {
        sm.addMessage({
          role: "assistant",
          content: result.message.content,
        });
        sm.addDisplayMessage("assistant", result.message.content);
      }

      setMessages(sm.getDisplayMessages());
      refreshSessions(); // Update session list with new message count
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      sm.addDisplayMessage("assistant", errorMessage, undefined, true);
      setMessages(sm.getDisplayMessages());
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    sessionManagerRef.current.clearActiveSession();
    refreshSessions();
  };

  // Structure analysis handler
  const handleStructureAnalysis = async () => {
    if (!isConfigured || isLoading) return;

    setIsLoading(true);
    const sm = sessionManagerRef.current;

    try {
      sm.addDisplayMessage("user", "📊 执行文档结构检查...");
      setMessages(sm.getDisplayMessages());

      const result = await analyzeDocumentStructure();

      if (result.success && result.report) {
        sm.addMessage({ role: "assistant", content: result.report });
        sm.addDisplayMessage("assistant", result.report);
      } else {
        sm.addDisplayMessage("assistant", result.error || "结构分析失败", undefined, true);
      }

      setMessages(sm.getDisplayMessages());
      refreshSessions();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "分析失败";
      sm.addDisplayMessage("assistant", errorMessage, undefined, true);
      setMessages(sm.getDisplayMessages());
    } finally {
      setIsLoading(false);
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="chat-panel">
      {/* Session Header */}
      <div className="session-header">
        <button
          className="session-toggle-btn"
          onClick={() => setShowSessionList(!showSessionList)}
          title="会话列表"
        >
          📋 {activeSession?.name || "新对话"}
        </button>
        <button
          className="new-session-btn"
          onClick={handleNewSession}
          title="新建对话"
        >
          +
        </button>
      </div>

      {/* Session List Dropdown */}
      {showSessionList && (
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
        />
      )}

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
            <div className="quick-actions">
              <button
                className="quick-action-btn"
                onClick={handleStructureAnalysis}
                disabled={!isConfigured || isLoading}
              >
                📊 结构检查
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageItem key={msg.id} message={msg} />)
        )}

        {isLoading && (
          <div className="loading">
            <div className="loading-spinner" />
            <span>AI 正在思考...</span>
            <button className="cancel-button" onClick={handleCancel}>
              停止
            </button>
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
