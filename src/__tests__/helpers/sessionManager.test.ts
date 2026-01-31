/**
 * Tests for SessionManager
 */

import {
  SessionManager,
  getSessionManager,
  resetSessionManager,
} from "../../helpers/sessionManager";

describe("SessionManager", () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    // Clear localStorage mock
    (localStorage.getItem as jest.Mock).mockReturnValue(null);
    (localStorage.setItem as jest.Mock).mockClear();
    sessionManager = new SessionManager();
  });

  describe("Session Creation", () => {
    it("should create a default session on initialization", () => {
      const sessions = sessionManager.getSessionList();
      expect(sessions.length).toBeGreaterThanOrEqual(1);
    });

    it("should create new sessions with unique IDs", () => {
      const session1 = sessionManager.createSession("Session 1");
      const session2 = sessionManager.createSession("Session 2");

      expect(session1.id).not.toBe(session2.id);
    });

    it("should set new session as active", () => {
      const session = sessionManager.createSession("New Session");
      const active = sessionManager.getActiveSession();

      expect(active?.id).toBe(session.id);
    });

    it("should generate default name if not provided", () => {
      const session = sessionManager.createSession();

      expect(session.name).toBeDefined();
      expect(session.name.length).toBeGreaterThan(0);
    });
  });

  describe("Session Switching", () => {
    it("should switch active session", () => {
      const session1 = sessionManager.createSession("Session 1");
      sessionManager.createSession("Session 2"); // Create second session

      sessionManager.setActiveSession(session1.id);
      const active = sessionManager.getActiveSession();

      expect(active?.id).toBe(session1.id);
    });

    it("should return null for invalid session ID", () => {
      const result = sessionManager.setActiveSession("invalid-id");
      expect(result).toBeNull();
    });
  });

  describe("Session Operations", () => {
    it("should rename session", () => {
      const session = sessionManager.createSession("Original Name");
      sessionManager.renameSession(session.id, "New Name");

      const sessions = sessionManager.getSessionList();
      const updated = sessions.find((s) => s.id === session.id);

      expect(updated?.name).toBe("New Name");
    });

    it("should delete session", () => {
      sessionManager.createSession("Session 1");
      const session2 = sessionManager.createSession("Session 2");

      sessionManager.deleteSession(session2.id);
      const sessions = sessionManager.getSessionList();

      expect(sessions.find((s) => s.id === session2.id)).toBeUndefined();
    });

    it("should not delete the last session", () => {
      // Get the only session
      const sessions = sessionManager.getSessionList();
      const lastSession = sessions[0];

      // Try to delete it
      const deleted = sessionManager.deleteSession(lastSession.id);

      // Should not actually delete
      expect(deleted).toBe(false);
      expect(sessionManager.getSessionList().length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Message Management", () => {
    it("should add messages to active session", () => {
      sessionManager.createSession("Test Session");

      sessionManager.addMessage({ role: "user", content: "Hello" });
      sessionManager.addDisplayMessage("user", "Hello");

      const messages = sessionManager.getMessages();
      const displayMessages = sessionManager.getDisplayMessages();

      expect(messages).toHaveLength(1);
      expect(displayMessages).toHaveLength(1);
    });

    it("should clear active session messages", () => {
      sessionManager.addMessage({ role: "user", content: "Hello" });
      sessionManager.addDisplayMessage("user", "Hello");

      sessionManager.clearActiveSession();

      expect(sessionManager.getMessages()).toHaveLength(0);
      expect(sessionManager.getDisplayMessages()).toHaveLength(0);
    });
  });

  describe("buildUserMessage", () => {
    it("should build user message with context", () => {
      const message = sessionManager.buildUserMessage(
        "User input",
        "Selection",
        "Document",
        "Rules"
      );

      expect(message.role).toBe("user");
      expect(message.content).toContain("[USER_RULES]");
      expect(message.content).toContain("[DOCUMENT]");
      expect(message.content).toContain("[SELECTION]");
      expect(message.content).toContain("User input");
    });
  });

  describe("Persistence", () => {
    it("should save to localStorage", () => {
      sessionManager.createSession("Test");
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it("should load from localStorage", () => {
      const savedSessions = [
        {
          id: "saved-session",
          name: "Saved Session",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          displayMessages: [],
        },
      ];

      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify(savedSessions)
      );

      const sm = new SessionManager();
      const sessions = sm.getSessionList();

      expect(sessions.some((s) => s.id === "saved-session")).toBe(true);
    });
  });

  describe("Singleton", () => {
    it("should return the same instance", () => {
      resetSessionManager();
      const instance1 = getSessionManager();
      const instance2 = getSessionManager();

      expect(instance1).toBe(instance2);
    });
  });
});
