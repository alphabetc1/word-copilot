import * as React from "react";
import { useState, useEffect } from "react";
import ChatPanel from "./components/ChatPanel";
import PlanPanel from "./components/PlanPanel";
import SettingsPanel from "./components/SettingsPanel";
import { isModelConfigured } from "../helpers/settings";
import { t, loadLanguage, Language } from "../helpers/i18n";

type TabType = "chat" | "plan" | "settings";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [isConfigured, setIsConfigured] = useState(false);
  const [, setLang] = useState<Language>(loadLanguage());

  useEffect(() => {
    // Check if model is configured on mount
    setIsConfigured(isModelConfigured());
  }, []);

  const handleSettingsSaved = () => {
    setIsConfigured(isModelConfigured());
  };

  // Force re-render when language changes
  const handleLanguageChange = () => {
    setLang(loadLanguage());
  };

  const i18n = t();

  return (
    <div className="app-container">
      {/* Floating Header - shows on hover or when triggered */}
      <div className="floating-header-zone">
        {/* Header */}
        <header className="app-header">
          <h1>{i18n.appTitle}</h1>
        </header>

        {/* Tab Navigation */}
        <nav className="tab-nav">
          <button
            className={activeTab === "chat" ? "active" : ""}
            onClick={() => setActiveTab("chat")}
          >
            {i18n.tabChat}
          </button>
          <button
            className={activeTab === "plan" ? "active" : ""}
            onClick={() => setActiveTab("plan")}
          >
            {i18n.tabPlan}
          </button>
          <button
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            {i18n.tabSettings}
          </button>
        </nav>
      </div>

      {/* Hover trigger zone at top */}
      <div className="header-trigger-zone" />

      {/* Main Content */}
      <main className="main-content">
        {activeTab === "chat" && (
          <>
            {!isConfigured && (
              <div className="config-status">
                <span>⚠️</span>
                <span>{i18n.configRequired}</span>
              </div>
            )}
            <ChatPanel isConfigured={isConfigured} />
          </>
        )}
        {activeTab === "plan" && <PlanPanel isConfigured={isConfigured} />}
        {activeTab === "settings" && (
          <SettingsPanel
            onSaved={handleSettingsSaved}
            onLanguageChange={handleLanguageChange}
          />
        )}
      </main>
    </div>
  );
};

export default App;
