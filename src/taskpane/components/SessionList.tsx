import * as React from "react";
import { useState } from "react";
import { Session, getSessionManager } from "../../helpers/sessionManager";

interface SessionListProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleStartEdit = (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditName(session.name);
  };

  const handleSaveEdit = (sessionId: string) => {
    if (editName.trim()) {
      onRenameSession(sessionId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === "Enter") {
      handleSaveEdit(sessionId);
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditName("");
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="session-list">
      <div className="session-list-header">
        <span>会话列表</span>
        <button className="new-session-button" onClick={onNewSession} title="新建对话">
          +
        </button>
      </div>

      <div className="session-items">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`session-item ${activeSessionId === session.id ? "active" : ""}`}
            onClick={() => onSelectSession(session.id)}
          >
            {editingId === session.id ? (
              <input
                type="text"
                className="session-name-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleSaveEdit(session.id)}
                onKeyDown={(e) => handleKeyDown(e, session.id)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <>
                <div className="session-info">
                  <span className="session-name">{session.name}</span>
                  <span className="session-meta">
                    {session.displayMessages.length} 条消息 · {formatTime(session.updatedAt)}
                  </span>
                </div>
                <div className="session-actions">
                  <button
                    className="session-action-btn"
                    onClick={(e) => handleStartEdit(session, e)}
                    title="重命名"
                  >
                    ✏️
                  </button>
                  <button
                    className="session-action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("确定要删除这个对话吗？")) {
                        onDeleteSession(session.id);
                      }
                    }}
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionList;
