import * as React from "react";
import { useState, useEffect } from "react";
import {
  ModelConfig,
  UserRules,
  ScenarioOption,
  StyleOption,
  ToneOption,
  LengthOption,
  LanguageOption,
  SCENARIO_LABELS,
  SCENARIO_DESCRIPTIONS,
  SCENARIO_PRESETS,
  STYLE_LABELS,
  TONE_LABELS,
  LENGTH_LABELS,
  LANGUAGE_LABELS,
  DEFAULT_MODEL_CONFIG,
  DEFAULT_USER_RULES,
} from "../../types/settings";
import {
  loadModelConfig,
  saveModelConfig,
  loadUserRules,
  saveUserRules,
} from "../../helpers/settings";

interface SettingsPanelProps {
  onSaved?: () => void;
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

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onSaved }) => {
  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_MODEL_CONFIG);
  const [userRules, setUserRules] = useState<UserRules>(DEFAULT_USER_RULES);
  const [status, setStatus] = useState<Status | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load settings on mount
  useEffect(() => {
    setModelConfig(loadModelConfig());
    setUserRules(loadUserRules());
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

  return (
    <div className="settings-panel">
      {/* Model Configuration */}
      <section className="settings-section">
        <h3>🤖 模型配置</h3>

        <div className="form-group">
          <label>Base URL</label>
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
          <label>API Key</label>
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
          <label>模型名称</label>
          <input
            type="text"
            value={modelConfig.model}
            onChange={(e) =>
              setModelConfig({ ...modelConfig, model: e.target.value })
            }
            placeholder="gpt-4o / qwen-plus"
            disabled={isProcessing}
          />
        </div>
      </section>

      {/* User Rules */}
      <section className="settings-section">
        <h3>📝 写作规则</h3>

        {/* Scenario Selection */}
        <div className="form-group">
          <label>写作场景</label>
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
            {(Object.entries(SCENARIO_LABELS) as [ScenarioOption, string][]).map(
              ([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              )
            )}
          </select>
          <p className="scenario-description">
            {SCENARIO_DESCRIPTIONS[userRules.scenario]}
          </p>
        </div>

        {/* Show preset rules info when not custom */}
        {userRules.scenario !== "custom" && (
          <div className="preset-rules-info">
            <details>
              <summary>查看当前场景预设规范</summary>
              <pre>{SCENARIO_PRESETS[userRules.scenario].rulesText}</pre>
            </details>
          </div>
        )}

        <div className="form-group">
          <label>风格 {userRules.scenario !== "custom" && <span className="preset-badge">预设</span>}</label>
          {renderRadioGroup<StyleOption>(
            "style",
            userRules.style,
            STYLE_LABELS,
            (value) => setUserRules({ ...userRules, style: value })
          )}
        </div>

        <div className="form-group">
          <label>语气 {userRules.scenario !== "custom" && <span className="preset-badge">预设</span>}</label>
          {renderRadioGroup<ToneOption>(
            "tone",
            userRules.tone,
            TONE_LABELS,
            (value) => setUserRules({ ...userRules, tone: value })
          )}
        </div>

        <div className="form-group">
          <label>长度 {userRules.scenario !== "custom" && <span className="preset-badge">预设</span>}</label>
          {renderRadioGroup<LengthOption>(
            "length",
            userRules.length,
            LENGTH_LABELS,
            (value) => setUserRules({ ...userRules, length: value })
          )}
        </div>

        <div className="form-group">
          <label>语言偏好 {userRules.scenario !== "custom" && <span className="preset-badge">预设</span>}</label>
          {renderRadioGroup<LanguageOption>(
            "language",
            userRules.language,
            LANGUAGE_LABELS,
            (value) => setUserRules({ ...userRules, language: value })
          )}
        </div>

        <div className="form-group">
          <label>其他规则（自由文本）</label>
          <textarea
            value={userRules.custom}
            onChange={(e) =>
              setUserRules({ ...userRules, custom: e.target.value })
            }
            placeholder="例如：避免使用第一人称；不使用网络流行语；专业术语需保留英文..."
            disabled={isProcessing}
          />
        </div>
      </section>

      {/* Save Button */}
      <button
        className={`save-button ${isProcessing ? "processing" : ""}`}
        onClick={handleSave}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <span className="button-spinner" />
            {status?.type === "testing" ? "测试连接中..." : "保存中..."}
          </>
        ) : (
          "保存设置"
        )}
      </button>

      {/* Status Message */}
      {status && (
        <div className={getStatusClassName()}>
          {(status.type === "testing" || status.type === "saving") && (
            <span className="status-spinner" />
          )}
          {status.message}
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
