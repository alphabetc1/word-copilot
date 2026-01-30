/**
 * Settings Manager - Handles persistence of model config and user rules
 */

import {
  ModelConfig,
  UserRules,
  DEFAULT_MODEL_CONFIG,
  DEFAULT_USER_RULES,
} from "../types/settings";

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  MODEL_CONFIG: "word_copilot_model_config",
  USER_RULES: "word_copilot_user_rules",
} as const;

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe JSON parse with fallback
 */
function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * Save model configuration
 */
export function saveModelConfig(config: ModelConfig): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn("localStorage is not available");
    return false;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.MODEL_CONFIG, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error("Failed to save model config:", error);
    return false;
  }
}

/**
 * Load model configuration
 */
export function loadModelConfig(): ModelConfig {
  if (!isLocalStorageAvailable()) {
    return { ...DEFAULT_MODEL_CONFIG };
  }

  const stored = localStorage.getItem(STORAGE_KEYS.MODEL_CONFIG);
  const config = safeJsonParse(stored, DEFAULT_MODEL_CONFIG);

  // Merge with defaults to ensure all fields exist
  return {
    ...DEFAULT_MODEL_CONFIG,
    ...config,
  };
}

/**
 * Save user rules
 */
export function saveUserRules(rules: UserRules): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn("localStorage is not available");
    return false;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.USER_RULES, JSON.stringify(rules));
    return true;
  } catch (error) {
    console.error("Failed to save user rules:", error);
    return false;
  }
}

/**
 * Load user rules
 */
export function loadUserRules(): UserRules {
  if (!isLocalStorageAvailable()) {
    return { ...DEFAULT_USER_RULES };
  }

  const stored = localStorage.getItem(STORAGE_KEYS.USER_RULES);
  const rules = safeJsonParse(stored, DEFAULT_USER_RULES);

  // Merge with defaults to ensure all fields exist
  return {
    ...DEFAULT_USER_RULES,
    ...rules,
  };
}

/**
 * Clear all settings
 */
export function clearAllSettings(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(STORAGE_KEYS.MODEL_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.USER_RULES);
    return true;
  } catch (error) {
    console.error("Failed to clear settings:", error);
    return false;
  }
}

/**
 * Check if model is configured (has API key)
 */
export function isModelConfigured(): boolean {
  const config = loadModelConfig();
  return Boolean(config.apiKey && config.baseUrl && config.model);
}

/**
 * Settings manager object for easy import
 */
export const settingsManager = {
  saveModelConfig,
  loadModelConfig,
  saveUserRules,
  loadUserRules,
  clearAllSettings,
  isModelConfigured,
};

export default settingsManager;
