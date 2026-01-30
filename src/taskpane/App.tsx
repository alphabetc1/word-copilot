import * as React from "react";
import { useState, useEffect } from "react";
import ChatPanel from "./components/ChatPanel";
import SettingsPanel from "./components/SettingsPanel";
import { isModelConfigured } from "../helpers/settings";

type TabType = "chat" | "settings";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Check if model is configured on mount
    setIsConfigured(isModelConfigured());
  }, []);

  const handleSettingsSaved = () => {
    setIsConfigured(isModelConfigured());
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1>Word Copilot</h1>
      </header>

      {/* Tab Navigation */}
      <nav className="tab-nav">
        <button
          className={activeTab === "chat" ? "active" : ""}
          onClick={() => setActiveTab("chat")}
        >
          对话
        </button>
        <button
          className={activeTab === "settings" ? "active" : ""}
          onClick={() => setActiveTab("settings")}
        >
          设置
        </button>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === "chat" ? (
          <>
            {!isConfigured && (
              <div className="config-status">
                <span>⚠️</span>
                <span>请先在设置中配置 API Key</span>
              </div>
            )}
            <ChatPanel isConfigured={isConfigured} />
          </>
        ) : (
          <SettingsPanel onSaved={handleSettingsSaved} />
        )}
      </main>
    </div>
  );
};

export default App;
