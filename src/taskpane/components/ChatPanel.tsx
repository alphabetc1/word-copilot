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
import { t } from "../../helpers/i18n";
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
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // AbortController for cancelling requests
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const activeRequestIdRef = useRef<number | null>(null);
  const sendInProgressRef = useRef(false);

  const i18n = t();

  // Scroll to top/bottom functions
  const scrollToTop = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Show toast notification
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const actionIntentRegex =
    /(润色|改写|改为|改成|翻译|翻譯|删除|删掉|替换|插入|补充|添加|批注|comment|translate|polish|rewrite|rephrase|improve|edit|fix|remove|delete|insert|add)/i;
  const selectionRequiredRegex =
    /(选中|选区|selected|selection|润色|改写|翻译|翻譯|替换|删除|批注|comment|polish|rewrite|rephrase|translate|remove|delete)/i;

  const shouldForceToolCall = (input: string): boolean => {
    return actionIntentRegex.test(input);
  };

  const requiresSelection = (input: string): boolean => {
    return selectionRequiredRegex.test(input);
  };

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
    const newSession = sm.createSession();
    refreshSessions();
    setShowSessionList(false);
    showToast(`✓ 已创建新对话: ${newSession.name}`);
  };

  const handleDeleteSession = (sessionId: string) => {
    const sm = sessionManagerRef.current;
    const deleted = sm.deleteSession(sessionId);
    refreshSessions();
    if (deleted) {
      showToast("已删除对话");
    } else {
      showToast("已清空对话内容");
    }
  };

  const handleRenameSession = (sessionId: string, newName: string) => {
    const sm = sessionManagerRef.current;
    sm.renameSession(sessionId, newName);
    refreshSessions();
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !isConfigured || sendInProgressRef.current) return;

    const userInput = inputValue.trim();
    setInputValue("");
    setIsLoading(true);
    sendInProgressRef.current = true;
    const requestId = ++requestIdRef.current;
    activeRequestIdRef.current = requestId;

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

      if (activeRequestIdRef.current !== requestId) {
        return;
      }

      const selectionText = selection.trim();
      const shouldRequireSelection = requiresSelection(userInput);
      if (shouldRequireSelection && !selectionText) {
        sm.addDisplayMessage(
          "assistant",
          "未检测到选中内容，请先选中文本再执行该操作。",
          undefined,
          true
        );
        setMessages(sm.getDisplayMessages());
        refreshSessions();
        return;
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

      const requestChatWithTools = async (toolChoice: "auto" | "required") => {
        let result = await sendChat({
          config,
          systemPrompt: SYSTEM_PROMPT,
          messages: sm.getMessages(),
          tools: TOOL_DEFINITIONS,
          toolChoice,
          abortController: abortControllerRef.current!,
        });

        if (!result.success && result.error?.includes("400") && toolChoice === "auto") {
          console.warn("Retrying without tools due to 400 error");
          result = await sendChat({
            config,
            systemPrompt: SYSTEM_PROMPT,
            messages: sm.getMessages(),
            abortController: abortControllerRef.current!,
          });
        }

        return result;
      };

      // Send to LLM
      let result = await requestChatWithTools("auto");

      if (activeRequestIdRef.current !== requestId) {
        return;
      }

      if (!result.success || !result.message) {
        throw new Error(result.error || "Failed to get response from AI");
      }

      let message = result.message;
      const needsToolCall = shouldForceToolCall(userInput);
      if (needsToolCall && !hasToolCalls(message)) {
        const retryResult = await requestChatWithTools("required");
        if (
          retryResult.success &&
          retryResult.message &&
          hasToolCalls(retryResult.message)
        ) {
          result = retryResult;
          message = retryResult.message;
        } else {
          const errorText =
            retryResult.error ||
            "未能触发文档操作工具，请重试或简化指令。";
          sm.addDisplayMessage("assistant", errorText, undefined, true);
          setMessages(sm.getDisplayMessages());
          refreshSessions();
          return;
        }
      }

      // Handle tool calls if present
      if (hasToolCalls(message)) {
        const toolCalls = message.tool_calls!;

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
        if (message.content) {
          sm.addMessage({
            role: "assistant",
            content: message.content,
          });
          sm.addDisplayMessage("assistant", message.content);
        } else {
          sm.addMessage({
            role: "assistant",
            content: `[已执行操作: ${toolResultText}]`,
          });
        }
      } else if (message.content) {
        sm.addMessage({
          role: "assistant",
          content: message.content,
        });
        sm.addDisplayMessage("assistant", message.content);
      }

      setMessages(sm.getDisplayMessages());
      refreshSessions(); // Update session list with new message count
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      sm.addDisplayMessage("assistant", errorMessage, undefined, true);
      setMessages(sm.getDisplayMessages());
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setIsLoading(false);
        abortControllerRef.current = null;
        sendInProgressRef.current = false;
        activeRequestIdRef.current = null;
      }
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
      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

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
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <h3>{i18n.chatEmpty}</h3>
            <p>{i18n.chatEmptyHint}</p>
            <div className="quick-actions">
              <button
                className="quick-action-btn"
                onClick={handleStructureAnalysis}
                disabled={!isConfigured || isLoading}
              >
                {i18n.chatStructureCheck}
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageItem key={msg.id} message={msg} />)
        )}

        {isLoading && (
          <div className="loading">
            <div className="loading-spinner" />
            <span>{i18n.chatThinking}</span>
            <button className="cancel-button" onClick={handleCancel}>
              {i18n.chatStop}
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />

        {/* Scroll Navigation Buttons */}
        {messages.length > 0 && (
          <div className="scroll-nav">
            <button
              className="scroll-nav-btn scroll-to-top"
              onClick={scrollToTop}
              title="回到顶部"
            >
              ⬆
            </button>
            <button
              className="scroll-nav-btn scroll-to-bottom"
              onClick={scrollToBottom}
              title="跳到底部"
            >
              ⬇
            </button>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="input-area">
        <div className="input-row">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isConfigured
                ? i18n.chatPlaceholder
                : i18n.configRequired
            }
            disabled={isLoading || !isConfigured}
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading || !isConfigured}
          >
            {i18n.chatSend}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
