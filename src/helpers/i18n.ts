/**
 * Internationalization (i18n) Module
 * Supports Chinese and English languages
 */

export type Language = "zh-CN" | "en-US";

// Storage key for language preference
const STORAGE_KEY = "word-copilot-language";

// All translatable strings
export interface Translations {
  // App
  appTitle: string;
  tabChat: string;
  tabPlan: string;
  tabSettings: string;

  // Common
  save: string;
  cancel: string;
  confirm: string;
  delete: string;
  rename: string;
  retry: string;
  loading: string;
  error: string;
  success: string;

  // Config status
  configRequired: string;

  // Chat Panel
  chatPlaceholder: string;
  chatSend: string;
  chatStop: string;
  chatThinking: string;
  chatEmpty: string;
  chatEmptyHint: string;
  chatStructureCheck: string;
  sessionList: string;
  newSession: string;
  sessionMessages: string;
  deleteConfirm: string;
  yes: string;
  no: string;
  sessionCreated: string;
  sessionDeleted: string;
  sessionCleared: string;

  // Settings Panel
  settingsModelConfig: string;
  settingsBaseUrl: string;
  settingsApiKey: string;
  settingsModel: string;
  settingsCustomModel: string;
  settingsCustomModelPlaceholder: string;
  settingsWritingRules: string;
  settingsScenario: string;
  settingsStyle: string;
  settingsTone: string;
  settingsLength: string;
  settingsLanguage: string;
  settingsCustomRules: string;
  settingsCustomRulesPlaceholder: string;
  settingsSave: string;
  settingsTesting: string;
  settingsSaving: string;
  settingsConnectSuccess: string;
  settingsConnectFailed: string;
  settingsViewPreset: string;

  // Settings - Language option
  settingsUILanguage: string;
  settingsUILanguageHint: string;

  // Scenarios
  scenarioCustom: string;
  scenarioSciPaper: string;
  scenarioClinical: string;
  scenarioProposal: string;
  scenarioOfficial: string;

  // Styles
  styleAcademic: string;
  styleFormal: string;
  styleBusiness: string;
  styleCasual: string;
  styleCreative: string;

  // Tones
  toneRigorous: string;
  toneNeutral: string;
  toneFriendly: string;

  // Lengths
  lengthConcise: string;
  lengthNormal: string;
  lengthDetailed: string;

  // Output Languages
  langChinese: string;
  langEnglish: string;
  langFollowDoc: string;

  // Plan Panel
  planQuestionTitle: string;
  planQuestionHint: string;
  planDocTitle: string;
  planDocTitlePlaceholder: string;
  planObjective: string;
  planObjectivePlaceholder: string;
  planAudience: string;
  planAudiencePlaceholder: string;
  planLength: string;
  planLengthPlaceholder: string;
  planExtra: string;
  planExtraPlaceholder: string;
  planGenerateOutline: string;
  planGenerating: string;
  planOutlineTitle: string;
  planBackToQuestions: string;
  planOutlineHint: string;
  planGenerate: string;
  planPending: string;
  planDone: string;
  planFailed: string;
  planExtraPrompt: string;
  planRegenerate: string;
  planInsertDoc: string;
  planReset: string;
  planInsertAll: string;
  planNoContent: string;
  planInsertFailed: string;
  planOutlineFailed: string;
  planContentFailed: string;
  planCancelled: string;

  // Voice Input
  voiceStart: string;
  voiceStop: string;
  voiceListening: string;
  voiceNotSupported: string;
  voicePermissionDenied: string;
}

// Chinese translations
const zhCN: Translations = {
  // App
  appTitle: "Word Copilot",
  tabChat: "对话",
  tabPlan: "计划",
  tabSettings: "设置",

  // Common
  save: "保存",
  cancel: "取消",
  confirm: "确认",
  delete: "删除",
  rename: "重命名",
  retry: "重试",
  loading: "加载中...",
  error: "错误",
  success: "成功",

  // Config status
  configRequired: "请先在设置中配置 API Key",

  // Chat Panel
  chatPlaceholder: "输入你的问题或指令...",
  chatSend: "发送",
  chatStop: "停止",
  chatThinking: "AI 正在思考...",
  chatEmpty: "开始新对话",
  chatEmptyHint: "选中文档中的文本，然后输入指令",
  chatStructureCheck: "📊 结构检查",
  sessionList: "会话列表",
  newSession: "新建对话",
  sessionMessages: "条消息",
  deleteConfirm: "确定删除？",
  yes: "是",
  no: "否",
  sessionCreated: "✓ 已创建新对话",
  sessionDeleted: "已删除对话",
  sessionCleared: "已清空对话内容",

  // Settings Panel
  settingsModelConfig: "🤖 模型配置",
  settingsBaseUrl: "Base URL",
  settingsApiKey: "API Key",
  settingsModel: "模型",
  settingsCustomModel: "自定义模型...",
  settingsCustomModelPlaceholder: "输入模型名称，如 llama-3.1-70b",
  settingsWritingRules: "📝 写作规则",
  settingsScenario: "写作场景",
  settingsStyle: "风格",
  settingsTone: "语气",
  settingsLength: "长度",
  settingsLanguage: "语言偏好",
  settingsCustomRules: "其他规则（自由文本）",
  settingsCustomRulesPlaceholder: "例如：避免使用第一人称；不使用网络流行语...",
  settingsSave: "保存设置",
  settingsTesting: "测试连接中...",
  settingsSaving: "保存中...",
  settingsConnectSuccess: "✓ 连接成功，设置已保存！",
  settingsConnectFailed: "连接失败",
  settingsViewPreset: "查看当前场景预设规范",

  // Settings - Language option
  settingsUILanguage: "界面语言",
  settingsUILanguageHint: "更改后需要刷新页面",

  // Scenarios
  scenarioCustom: "自定义",
  scenarioSciPaper: "学术论文 (SCI)",
  scenarioClinical: "临床研究报告",
  scenarioProposal: "项目申报书",
  scenarioOfficial: "行政通知 / 公文",

  // Styles
  styleAcademic: "学术",
  styleFormal: "正式",
  styleBusiness: "商务",
  styleCasual: "口语",
  styleCreative: "创意",

  // Tones
  toneRigorous: "严谨",
  toneNeutral: "中性",
  toneFriendly: "亲切",

  // Lengths
  lengthConcise: "尽量简短",
  lengthNormal: "正常",
  lengthDetailed: "详细",

  // Output Languages
  langChinese: "优先中文",
  langEnglish: "优先英文",
  langFollowDoc: "跟随文档语言",

  // Plan Panel
  planQuestionTitle: "📝 请回答以下问题",
  planQuestionHint: "AI 将根据您的回答生成文档大纲。填写越详细，生成效果越好。",
  planDocTitle: "文档标题/项目名称",
  planDocTitlePlaceholder: "例如：基于深度学习的医学影像分析研究",
  planObjective: "主要目标/核心内容",
  planObjectivePlaceholder: "简述你想要实现的目标",
  planAudience: "目标读者/对象",
  planAudiencePlaceholder: "例如：基金评审专家、学术期刊编辑",
  planLength: "预期字数/篇幅",
  planLengthPlaceholder: "例如：3000字、10页",
  planExtra: "其他要求或背景信息",
  planExtraPlaceholder: "任何额外的说明或特殊要求",
  planGenerateOutline: "生成大纲",
  planGenerating: "生成大纲中...",
  planOutlineTitle: "📋 文档大纲",
  planBackToQuestions: "← 返回修改",
  planOutlineHint: "点击「生成」按钮生成各章节内容，可在生成前修改提示词。",
  planGenerate: "生成",
  planPending: "待生成",
  planDone: "✓ 完成",
  planFailed: "✗ 失败",
  planExtraPrompt: "额外提示词（可选）",
  planRegenerate: "重新生成",
  planInsertDoc: "插入文档",
  planReset: "重新开始",
  planInsertAll: "插入全部已完成章节",
  planNoContent: "没有可插入的内容",
  planInsertFailed: "插入文档失败",
  planOutlineFailed: "生成大纲失败",
  planContentFailed: "生成内容失败",
  planCancelled: "已取消",

  // Voice Input
  voiceStart: "🎤 语音输入",
  voiceStop: "⏹️ 停止录音",
  voiceListening: "正在听...",
  voiceNotSupported: "浏览器不支持语音输入",
  voicePermissionDenied: "麦克风权限被拒绝",
};

// English translations
const enUS: Translations = {
  // App
  appTitle: "Word Copilot",
  tabChat: "Chat",
  tabPlan: "Plan",
  tabSettings: "Settings",

  // Common
  save: "Save",
  cancel: "Cancel",
  confirm: "Confirm",
  delete: "Delete",
  rename: "Rename",
  retry: "Retry",
  loading: "Loading...",
  error: "Error",
  success: "Success",

  // Config status
  configRequired: "Please configure API Key in Settings first",

  // Chat Panel
  chatPlaceholder: "Enter your question or instruction...",
  chatSend: "Send",
  chatStop: "Stop",
  chatThinking: "AI is thinking...",
  chatEmpty: "Start a new conversation",
  chatEmptyHint: "Select text in your document, then enter instructions",
  chatStructureCheck: "📊 Structure Check",
  sessionList: "Sessions",
  newSession: "New Chat",
  sessionMessages: "messages",
  deleteConfirm: "Delete this?",
  yes: "Yes",
  no: "No",
  sessionCreated: "✓ New session created",
  sessionDeleted: "Session deleted",
  sessionCleared: "Session cleared",

  // Settings Panel
  settingsModelConfig: "🤖 Model Configuration",
  settingsBaseUrl: "Base URL",
  settingsApiKey: "API Key",
  settingsModel: "Model",
  settingsCustomModel: "Custom model...",
  settingsCustomModelPlaceholder: "Enter model name, e.g. llama-3.1-70b",
  settingsWritingRules: "📝 Writing Rules",
  settingsScenario: "Writing Scenario",
  settingsStyle: "Style",
  settingsTone: "Tone",
  settingsLength: "Length",
  settingsLanguage: "Output Language",
  settingsCustomRules: "Additional Rules",
  settingsCustomRulesPlaceholder: "e.g. Avoid first person; Use formal language...",
  settingsSave: "Save Settings",
  settingsTesting: "Testing connection...",
  settingsSaving: "Saving...",
  settingsConnectSuccess: "✓ Connection successful, settings saved!",
  settingsConnectFailed: "Connection failed",
  settingsViewPreset: "View preset rules for this scenario",

  // Settings - Language option
  settingsUILanguage: "Interface Language",
  settingsUILanguageHint: "Refresh required after changing",

  // Scenarios
  scenarioCustom: "Custom",
  scenarioSciPaper: "Academic Paper (SCI)",
  scenarioClinical: "Clinical Research Report",
  scenarioProposal: "Project Proposal",
  scenarioOfficial: "Official Notice",

  // Styles
  styleAcademic: "Academic",
  styleFormal: "Formal",
  styleBusiness: "Business",
  styleCasual: "Casual",
  styleCreative: "Creative",

  // Tones
  toneRigorous: "Rigorous",
  toneNeutral: "Neutral",
  toneFriendly: "Friendly",

  // Lengths
  lengthConcise: "Concise",
  lengthNormal: "Normal",
  lengthDetailed: "Detailed",

  // Output Languages
  langChinese: "Prefer Chinese",
  langEnglish: "Prefer English",
  langFollowDoc: "Follow document language",

  // Plan Panel
  planQuestionTitle: "📝 Answer the following questions",
  planQuestionHint: "AI will generate a document outline based on your answers. More detail = better results.",
  planDocTitle: "Document Title / Project Name",
  planDocTitlePlaceholder: "e.g. Deep Learning-based Medical Image Analysis",
  planObjective: "Main Objective / Core Content",
  planObjectivePlaceholder: "Briefly describe your goals",
  planAudience: "Target Audience",
  planAudiencePlaceholder: "e.g. Grant reviewers, journal editors",
  planLength: "Expected Length",
  planLengthPlaceholder: "e.g. 3000 words, 10 pages",
  planExtra: "Additional Requirements",
  planExtraPlaceholder: "Any extra notes or special requirements",
  planGenerateOutline: "Generate Outline",
  planGenerating: "Generating outline...",
  planOutlineTitle: "📋 Document Outline",
  planBackToQuestions: "← Back to edit",
  planOutlineHint: "Click 'Generate' to create section content. You can modify prompts before generating.",
  planGenerate: "Generate",
  planPending: "Pending",
  planDone: "✓ Done",
  planFailed: "✗ Failed",
  planExtraPrompt: "Extra prompt (optional)",
  planRegenerate: "Regenerate",
  planInsertDoc: "Insert to Doc",
  planReset: "Start Over",
  planInsertAll: "Insert All Completed Sections",
  planNoContent: "No content to insert",
  planInsertFailed: "Failed to insert into document",
  planOutlineFailed: "Failed to generate outline",
  planContentFailed: "Failed to generate content",
  planCancelled: "Cancelled",

  // Voice Input
  voiceStart: "🎤 Voice Input",
  voiceStop: "⏹️ Stop Recording",
  voiceListening: "Listening...",
  voiceNotSupported: "Voice input not supported in this browser",
  voicePermissionDenied: "Microphone permission denied",
};

// All translations
const translations: Record<Language, Translations> = {
  "zh-CN": zhCN,
  "en-US": enUS,
};

// Current language (singleton)
let currentLanguage: Language = "zh-CN";

/**
 * Load language preference from localStorage
 */
export function loadLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "zh-CN" || stored === "en-US") {
      currentLanguage = stored;
    }
  } catch {
    // Ignore localStorage errors
  }
  return currentLanguage;
}

/**
 * Save language preference to localStorage
 */
export function saveLanguage(lang: Language): void {
  currentLanguage = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Get current language
 */
export function getLanguage(): Language {
  return currentLanguage;
}

/**
 * Get translations for current language
 */
export function t(): Translations {
  return translations[currentLanguage];
}

/**
 * Get a specific translation
 */
export function tr(key: keyof Translations): string {
  return translations[currentLanguage][key];
}

// Initialize language on module load
loadLanguage();
