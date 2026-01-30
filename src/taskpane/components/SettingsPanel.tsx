import * as React from "react";
import { useState, useEffect } from "react";
import {
  ModelConfig,
  UserRules,
  StyleOption,
  ToneOption,
  LengthOption,
  LanguageOption,
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

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onSaved }) => {
  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_MODEL_CONFIG);
  const [userRules, setUserRules] = useState<UserRules>(DEFAULT_USER_RULES);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Load settings on mount
  useEffect(() => {
    setModelConfig(loadModelConfig());
    setUserRules(loadUserRules());
  }, []);

  const handleSave = () => {
    const configSaved = saveModelConfig(modelConfig);
    const rulesSaved = saveUserRules(userRules);

    if (configSaved && rulesSaved) {
      setStatus({ type: "success", message: "设置已保存" });
      onSaved?.();
    } else {
      setStatus({ type: "error", message: "保存失败，请重试" });
    }

    // Clear status after 3 seconds
    setTimeout(() => setStatus(null), 3000);
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
            placeholder="gpt-4o"
          />
        </div>
      </section>

      {/* User Rules */}
      <section className="settings-section">
        <h3>📝 写作规则</h3>

        <div className="form-group">
          <label>风格</label>
          {renderRadioGroup<StyleOption>(
            "style",
            userRules.style,
            STYLE_LABELS,
            (value) => setUserRules({ ...userRules, style: value })
          )}
        </div>

        <div className="form-group">
          <label>语气</label>
          {renderRadioGroup<ToneOption>(
            "tone",
            userRules.tone,
            TONE_LABELS,
            (value) => setUserRules({ ...userRules, tone: value })
          )}
        </div>

        <div className="form-group">
          <label>长度</label>
          {renderRadioGroup<LengthOption>(
            "length",
            userRules.length,
            LENGTH_LABELS,
            (value) => setUserRules({ ...userRules, length: value })
          )}
        </div>

        <div className="form-group">
          <label>语言偏好</label>
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
          />
        </div>
      </section>

      {/* Save Button */}
      <button className="save-button" onClick={handleSave}>
        保存设置
      </button>

      {/* Status Message */}
      {status && (
        <div className={`status-message ${status.type}`}>{status.message}</div>
      )}
    </div>
  );
};

export default SettingsPanel;
