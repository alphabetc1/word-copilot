import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  ModelConfig,
  UserRules,
  ScenarioOption,
  StyleOption,
  ToneOption,
  LengthOption,
  LanguageOption,
  SCENARIO_PRESETS,
  DEFAULT_MODEL_CONFIG,
  DEFAULT_USER_RULES,
  COMMON_MODELS,
  CUSTOM_MODEL_ID,
} from "../../types/settings";
import {
  loadModelConfig,
  saveModelConfig,
  loadUserRules,
  saveUserRules,
} from "../../helpers/settings";
import { t, Language, getLanguage, saveLanguage, Translations } from "../../helpers/i18n";

// Helper to get scenario labels from i18n
const getScenarioLabels = (i18n: Translations): Record<ScenarioOption, string> => ({
  custom: i18n.scenarioCustom,
  sci_paper: i18n.scenarioSciPaper,
  clinical_report: i18n.scenarioClinical,
  project_proposal: i18n.scenarioProposal,
  official_notice: i18n.scenarioOfficial,
});

// Helper to get style labels from i18n
const getStyleLabels = (i18n: Translations): Record<StyleOption, string> => ({
  academic: i18n.styleAcademic,
  formal: i18n.styleFormal,
  business: i18n.styleBusiness,
  casual: i18n.styleCasual,
  creative: i18n.styleCreative,
});

// Helper to get tone labels from i18n
const getToneLabels = (i18n: Translations): Record<ToneOption, string> => ({
  rigorous: i18n.toneRigorous,
  neutral: i18n.toneNeutral,
  friendly: i18n.toneFriendly,
});

// Helper to get length labels from i18n
const getLengthLabels = (i18n: Translations): Record<LengthOption, string> => ({
  concise: i18n.lengthConcise,
  normal: i18n.lengthNormal,
  detailed: i18n.lengthDetailed,
});

// Helper to get language labels from i18n
const getLanguageLabels = (i18n: Translations): Record<LanguageOption, string> => ({
  chinese: i18n.langChinese,
  english: i18n.langEnglish,
  follow_document: i18n.langFollowDoc,
});

interface SettingsPanelProps {
  onSaved?: () => void;
  onLanguageChange?: () => void;
}

type StatusType = "success" | "error" | "testing" | "saving";

interface Status {
  type: StatusType;
  message: string;
}

/**
 * Test API connection by sending a simple request
 */
async function testConnection(config: ModelConfig): Promise<{ success: boolean; error?: string }> {
  if (!config.baseUrl || !config.apiKey || !config.model) {
    return { success: false, error: "请填写完整的 URL、API Key 和模型名称" };
  }

  // Build endpoint
  let url = config.baseUrl.replace(/\/+$/, "");
  if (url.includes("/chat/completions")) {
    // URL already contains path
  } else if (url.endsWith("/v1")) {
    url = `${url}/chat/completions`;
  } else {
    url = `${url}/v1/chat/completions`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5,
      }),
    });

    if (response.ok) {
      return { success: true };
    }

    // Try to get error message
    let errorMsg = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error?.message) {
        errorMsg = data.error.message;
      }
    } catch {
      // Ignore parse errors
    }

    return { success: false, error: errorMsg };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "网络错误";
    return { success: false, error: msg };
  }
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onSaved, onLanguageChange }) => {
  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_MODEL_CONFIG);
  const [userRules, setUserRules] = useState<UserRules>(DEFAULT_USER_RULES);
  const [status, setStatus] = useState<Status | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customModelInput, setCustomModelInput] = useState("");
  const [uiLanguage, setUiLanguage] = useState<Language>(getLanguage());
  const i18n = t();

  // Get translated labels
  const scenarioLabels = useMemo(() => getScenarioLabels(i18n), [i18n]);
  const styleLabels = useMemo(() => getStyleLabels(i18n), [i18n]);
  const toneLabels = useMemo(() => getToneLabels(i18n), [i18n]);
  const lengthLabels = useMemo(() => getLengthLabels(i18n), [i18n]);
  const languageLabels = useMemo(() => getLanguageLabels(i18n), [i18n]);

  // Determine if current model is a preset or custom
  const selectedModelId = useMemo(() => {
    const found = COMMON_MODELS.find((m) => m.apiName === modelConfig.model);
    return found ? found.id : CUSTOM_MODEL_ID;
  }, [modelConfig.model]);

  // Group models by provider for the dropdown
  const modelsByProvider = useMemo(() => {
    const grouped: Record<string, typeof COMMON_MODELS> = {};
    COMMON_MODELS.forEach((model) => {
      if (!grouped[model.provider]) {
        grouped[model.provider] = [];
      }
      grouped[model.provider].push(model);
    });
    return grouped;
  }, []);

  // Load settings on mount
  useEffect(() => {
    const config = loadModelConfig();
    setModelConfig(config);
    setUserRules(loadUserRules());

    // If model is custom, set the input value
    const isPreset = COMMON_MODELS.some((m) => m.apiName === config.model);
    if (!isPreset && config.model) {
      setCustomModelInput(config.model);
    }
  }, []);

  const handleSave = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setStatus({ type: "testing", message: "正在测试 API 连接..." });

    // Test connection first
    const testResult = await testConnection(modelConfig);

    if (!testResult.success) {
      setStatus({
        type: "error",
        message: `连接失败: ${testResult.error} 请检查 API Key 和 Base URL`,
      });
      setIsProcessing(false);
      return;
    }

    // Connection successful, save settings
    setStatus({ type: "saving", message: "正在保存设置..." });

    const configSaved = saveModelConfig(modelConfig);
    const rulesSaved = saveUserRules(userRules);

    if (configSaved && rulesSaved) {
      setStatus({ type: "success", message: "✓ 连接成功，设置已保存！" });
      onSaved?.();

      // Clear success status after 3 seconds
      setTimeout(() => setStatus(null), 3000);
    } else {
      setStatus({ type: "error", message: "保存失败，请重试" });
    }

    setIsProcessing(false);
  };

  const renderRadioGroup = <T extends string>(
    name: string,
    value: T,
    options: Record<T, string>,
    onChange: (value: T) => void
  ) => {
    return (
      <div className="radio-group">
        {(Object.entries(options) as [T, string][]).map(([key, label]) => (
          <label
            key={key}
            className={`radio-option ${value === key ? "selected" : ""}`}
          >
            <input
              type="radio"
              name={name}
              value={key}
              checked={value === key}
              onChange={() => onChange(key)}
            />
            {label}
          </label>
        ))}
      </div>
    );
  };

  const getStatusClassName = () => {
    if (!status) return "";
    switch (status.type) {
      case "success":
        return "status-message success";
      case "error":
        return "status-message error";
      case "testing":
      case "saving":
        return "status-message testing";
      default:
        return "status-message";
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setUiLanguage(lang);
    saveLanguage(lang);
    onLanguageChange?.();
  };

  return (
    <div className="settings-panel">
      {/* UI Language Selection */}
      <section className="settings-section">
        <h3>🌐 {i18n.settingsUILanguage}</h3>
        <div className="form-group">
          <div className="radio-group">
            <label className={`radio-option ${uiLanguage === "zh-CN" ? "selected" : ""}`}>
              <input
                type="radio"
                name="uiLanguage"
                value="zh-CN"
                checked={uiLanguage === "zh-CN"}
                onChange={() => handleLanguageChange("zh-CN")}
              />
              简体中文
            </label>
            <label className={`radio-option ${uiLanguage === "en-US" ? "selected" : ""}`}>
              <input
                type="radio"
                name="uiLanguage"
                value="en-US"
                checked={uiLanguage === "en-US"}
                onChange={() => handleLanguageChange("en-US")}
              />
              English
            </label>
          </div>
        </div>
      </section>

      {/* Model Configuration */}
      <section className="settings-section">
        <h3>{i18n.settingsModelConfig}</h3>

        <div className="form-group">
          <label>{i18n.settingsBaseUrl}</label>
          <input
            type="text"
            value={modelConfig.baseUrl}
            onChange={(e) =>
              setModelConfig({ ...modelConfig, baseUrl: e.target.value })
            }
            placeholder="https://api.openai.com"
            disabled={isProcessing}
          />
        </div>

        <div className="form-group">
          <label>{i18n.settingsApiKey}</label>
          <input
            type="password"
            value={modelConfig.apiKey}
            onChange={(e) =>
              setModelConfig({ ...modelConfig, apiKey: e.target.value })
            }
            placeholder="sk-..."
            disabled={isProcessing}
          />
        </div>

        <div className="form-group">
          <label>{i18n.settingsModel}</label>
          <select
            className="model-select"
            value={selectedModelId}
            onChange={(e) => {
              const id = e.target.value;
              if (id === CUSTOM_MODEL_ID) {
                // Switch to custom, use the current custom input or empty
                setModelConfig({
                  ...modelConfig,
                  model: customModelInput || "",
                });
              } else {
                const preset = COMMON_MODELS.find((m) => m.id === id);
                if (preset) {
                  setModelConfig({ ...modelConfig, model: preset.apiName });
                }
              }
            }}
            disabled={isProcessing}
          >
            {Object.entries(modelsByProvider).map(([provider, models]) => (
              <optgroup key={provider} label={provider}>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </optgroup>
            ))}
            <optgroup label={uiLanguage === "zh-CN" ? "其他" : "Other"}>
              <option value={CUSTOM_MODEL_ID}>{i18n.settingsCustomModel}</option>
            </optgroup>
          </select>

          {/* Custom model input - shown when custom is selected */}
          {selectedModelId === CUSTOM_MODEL_ID && (
            <input
              type="text"
              className="custom-model-input"
              value={customModelInput}
              onChange={(e) => {
                setCustomModelInput(e.target.value);
                setModelConfig({ ...modelConfig, model: e.target.value });
              }}
              placeholder={i18n.settingsCustomModelPlaceholder}
              disabled={isProcessing}
            />
          )}
        </div>
      </section>

      {/* User Rules */}
      <section className="settings-section">
        <h3>{i18n.settingsWritingRules}</h3>

        {/* Scenario Selection */}
        <div className="form-group">
          <label>{i18n.settingsScenario}</label>
          <select
            className="scenario-select"
            value={userRules.scenario}
            onChange={(e) => {
              const newScenario = e.target.value as ScenarioOption;
              if (newScenario === "custom") {
                // Keep current settings when switching to custom
                setUserRules({ ...userRules, scenario: newScenario });
              } else {
                // Apply preset rules for the selected scenario
                const preset = SCENARIO_PRESETS[newScenario];
                setUserRules({
                  ...userRules,
                  scenario: newScenario,
                  style: preset.style,
                  tone: preset.tone,
                  length: preset.length,
                  language: preset.language,
                });
              }
            }}
            disabled={isProcessing}
          >
            {(Object.entries(scenarioLabels) as [ScenarioOption, string][]).map(
              ([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              )
            )}
          </select>
        </div>

        {/* Show preset rules info when not custom */}
        {userRules.scenario !== "custom" && (
          <div className="preset-rules-info">
            <details>
              <summary>{i18n.settingsViewPreset}</summary>
              <pre>{SCENARIO_PRESETS[userRules.scenario].rulesText}</pre>
            </details>
          </div>
        )}

        <div className="form-group">
          <label>{i18n.settingsStyle} {userRules.scenario !== "custom" && <span className="preset-badge">{uiLanguage === "zh-CN" ? "预设" : "Preset"}</span>}</label>
          {renderRadioGroup<StyleOption>(
            "style",
            userRules.style,
            styleLabels,
            (value) => setUserRules({ ...userRules, style: value })
          )}
        </div>

        <div className="form-group">
          <label>{i18n.settingsTone} {userRules.scenario !== "custom" && <span className="preset-badge">{uiLanguage === "zh-CN" ? "预设" : "Preset"}</span>}</label>
          {renderRadioGroup<ToneOption>(
            "tone",
            userRules.tone,
            toneLabels,
            (value) => setUserRules({ ...userRules, tone: value })
          )}
        </div>

        <div className="form-group">
          <label>{i18n.settingsLength} {userRules.scenario !== "custom" && <span className="preset-badge">{uiLanguage === "zh-CN" ? "预设" : "Preset"}</span>}</label>
          {renderRadioGroup<LengthOption>(
            "length",
            userRules.length,
            lengthLabels,
            (value) => setUserRules({ ...userRules, length: value })
          )}
        </div>

        <div className="form-group">
          <label>{i18n.settingsLanguage} {userRules.scenario !== "custom" && <span className="preset-badge">{uiLanguage === "zh-CN" ? "预设" : "Preset"}</span>}</label>
          {renderRadioGroup<LanguageOption>(
            "language",
            userRules.language,
            languageLabels,
            (value) => setUserRules({ ...userRules, language: value })
          )}
        </div>

        <div className="form-group">
          <label>{i18n.settingsCustomRules}</label>
          <textarea
            value={userRules.custom}
            onChange={(e) =>
              setUserRules({ ...userRules, custom: e.target.value })
            }
            placeholder={i18n.settingsCustomRulesPlaceholder}
            disabled={isProcessing}
          />
        </div>
      </section>

      {/* Status Message */}
      {status && (
        <div className={getStatusClassName()} role="status" aria-live="polite">
          {(status.type === "testing" || status.type === "saving") && (
            <span className="status-spinner" />
          )}
          {status.message}
        </div>
      )}

      {/* Save Button */}
      <button
        className={`save-button ${isProcessing ? "processing" : ""}`}
        onClick={handleSave}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <span className="button-spinner" />
            {status?.type === "testing" ? i18n.settingsTesting : i18n.settingsSaving}
          </>
        ) : (
          i18n.settingsSave
        )}
      </button>
    </div>
  );
};

export default SettingsPanel;
