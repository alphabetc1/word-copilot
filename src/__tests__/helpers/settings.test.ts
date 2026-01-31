/**
 * Tests for settings helper
 */

import {
  saveModelConfig,
  loadModelConfig,
  saveUserRules,
  loadUserRules,
  isModelConfigured,
} from "../../helpers/settings";
import {
  DEFAULT_MODEL_CONFIG,
  DEFAULT_USER_RULES,
  ModelConfig,
  UserRules,
} from "../../types/settings";

describe("Settings Helper", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    (localStorage.getItem as jest.Mock).mockReturnValue(null);
  });

  describe("Model Config", () => {
    it("should return default config when nothing is saved", () => {
      const config = loadModelConfig();
      expect(config).toEqual(DEFAULT_MODEL_CONFIG);
    });

    it("should save and load model config", () => {
      const testConfig: ModelConfig = {
        baseUrl: "https://api.test.com",
        apiKey: "test-key",
        model: "test-model",
      };

      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify(testConfig)
      );

      saveModelConfig(testConfig);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "word_copilot_model_config",
        JSON.stringify(testConfig)
      );
    });

    it("should handle invalid JSON gracefully", () => {
      (localStorage.getItem as jest.Mock).mockReturnValue("invalid json");

      const config = loadModelConfig();
      expect(config).toEqual(DEFAULT_MODEL_CONFIG);
    });
  });

  describe("User Rules", () => {
    it("should return default rules when nothing is saved", () => {
      const rules = loadUserRules();
      expect(rules).toEqual(DEFAULT_USER_RULES);
    });

    it("should save user rules", () => {
      const testRules: UserRules = {
        scenario: "sci_paper",
        style: "academic",
        tone: "rigorous",
        length: "detailed",
        language: "english",
        custom: "Test custom rule",
      };

      saveUserRules(testRules);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "word_copilot_user_rules",
        JSON.stringify(testRules)
      );
    });
  });

  describe("isModelConfigured", () => {
    it("should return false when API key is empty", () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({ ...DEFAULT_MODEL_CONFIG, apiKey: "" })
      );

      expect(isModelConfigured()).toBe(false);
    });

    it("should return true when all required fields are present", () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({
          baseUrl: "https://api.test.com",
          apiKey: "valid-key",
          model: "test-model",
        })
      );

      expect(isModelConfigured()).toBe(true);
    });
  });
});
