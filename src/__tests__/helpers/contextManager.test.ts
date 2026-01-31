/**
 * Tests for ContextManager
 */

import {
  ContextManager,
  formatUserRules,
  getContextManager,
  resetContextManager,
} from "../../helpers/contextManager";
import { DEFAULT_USER_RULES, UserRules } from "../../types/settings";

describe("ContextManager", () => {
  let contextManager: ContextManager;

  beforeEach(() => {
    contextManager = new ContextManager();
  });

  describe("Message Management", () => {
    it("should add messages to context", () => {
      contextManager.addMessage({ role: "user", content: "Hello" });
      contextManager.addMessage({ role: "assistant", content: "Hi there" });

      const messages = contextManager.getMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe("user");
      expect(messages[1].role).toBe("assistant");
    });

    it("should limit messages to max rounds", () => {
      const cm = new ContextManager(2); // 2 rounds = 4 messages

      for (let i = 0; i < 10; i++) {
        cm.addMessage({ role: "user", content: `User ${i}` });
        cm.addMessage({ role: "assistant", content: `Assistant ${i}` });
      }

      const messages = cm.getMessages();
      expect(messages.length).toBeLessThanOrEqual(4);
    });

    it("should clear all messages", () => {
      contextManager.addMessage({ role: "user", content: "Hello" });
      contextManager.addDisplayMessage("user", "Hello");

      contextManager.clearMessages();

      expect(contextManager.getMessages()).toHaveLength(0);
      expect(contextManager.getDisplayMessages()).toHaveLength(0);
    });
  });

  describe("Display Messages", () => {
    it("should add display messages with metadata", () => {
      const msg = contextManager.addDisplayMessage("user", "Test message");

      expect(msg.id).toBeDefined();
      expect(msg.role).toBe("user");
      expect(msg.content).toBe("Test message");
      expect(msg.timestamp).toBeDefined();
    });

    it("should mark error messages", () => {
      const msg = contextManager.addDisplayMessage(
        "assistant",
        "Error occurred",
        undefined,
        true
      );

      expect(msg.isError).toBe(true);
    });
  });

  describe("buildUserMessage", () => {
    it("should build message with all context", () => {
      const message = contextManager.buildUserMessage(
        "Test input",
        "Selected text",
        "Document content",
        { ...DEFAULT_USER_RULES, custom: "Custom rule" }
      );

      expect(message.role).toBe("user");
      expect(message.content).toContain("[USER_RULES]");
      expect(message.content).toContain("[DOCUMENT]");
      expect(message.content).toContain("[SELECTION]");
      expect(message.content).toContain("Test input");
    });

    it("should handle missing optional context", () => {
      const message = contextManager.buildUserMessage("Test input");

      expect(message.role).toBe("user");
      expect(message.content).toBe("Test input");
      expect(message.content).not.toContain("[DOCUMENT]");
      expect(message.content).not.toContain("[SELECTION]");
    });
  });

  describe("Singleton", () => {
    it("should return the same instance", () => {
      const instance1 = getContextManager();
      const instance2 = getContextManager();

      expect(instance1).toBe(instance2);
    });

    it("should create new instance after reset", () => {
      const instance1 = getContextManager();
      instance1.addMessage({ role: "user", content: "Test" });

      resetContextManager();
      const instance2 = getContextManager();

      expect(instance2.getMessages()).toHaveLength(0);
    });
  });
});

describe("formatUserRules", () => {
  it("should format default rules", () => {
    const formatted = formatUserRules(DEFAULT_USER_RULES);

    expect(formatted).toContain("风格");
    expect(formatted).toContain("语气");
    expect(formatted).toContain("长度");
    expect(formatted).toContain("语言");
  });

  it("should include scenario preset rules when not custom", () => {
    const rules: UserRules = {
      ...DEFAULT_USER_RULES,
      scenario: "sci_paper",
    };

    const formatted = formatUserRules(rules);
    expect(formatted).toContain("学术论文规范");
  });

  it("should include custom rules", () => {
    const rules: UserRules = {
      ...DEFAULT_USER_RULES,
      custom: "My custom rule",
    };

    const formatted = formatUserRules(rules);
    expect(formatted).toContain("My custom rule");
  });
});
