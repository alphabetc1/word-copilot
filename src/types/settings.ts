/**
 * Model configuration for LLM API
 */
export interface ModelConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

/**
 * Writing scenario options
 */
export type ScenarioOption = 
  | "custom"           // Default: user-defined rules
  | "sci_paper"        // SCI academic paper
  | "clinical_report"  // Clinical research report
  | "project_proposal" // Project proposal/申报书
  | "official_notice"; // Administrative notice/公文

/**
 * Writing style options
 */
export type StyleOption = "academic" | "formal" | "business" | "casual" | "creative";

/**
 * Tone options
 */
export type ToneOption = "rigorous" | "neutral" | "friendly";

/**
 * Length preference options
 */
export type LengthOption = "concise" | "normal" | "detailed";

/**
 * Language preference options
 */
export type LanguageOption = "chinese" | "english" | "follow_document";

/**
 * User rules configuration
 */
export interface UserRules {
  scenario: ScenarioOption;
  style: StyleOption;
  tone: ToneOption;
  length: LengthOption;
  language: LanguageOption;
  custom: string;
}

/**
 * Complete settings object
 */
export interface Settings {
  modelConfig: ModelConfig;
  userRules: UserRules;
}

/**
 * Default user rules
 */
export const DEFAULT_USER_RULES: UserRules = {
  scenario: "custom",
  style: "formal",
  tone: "neutral",
  length: "normal",
  language: "chinese",
  custom: "",
};

/**
 * Default model config
 */
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  baseUrl: "https://api.openai.com",
  apiKey: "",
  model: "gpt-4o",
};

/**
 * Common model presets with display name and API name
 * Grouped by provider for better organization
 */
export interface ModelPreset {
  id: string;        // Internal identifier
  name: string;      // Display name
  apiName: string;   // Actual API model name
  provider: string;  // Provider name for grouping
}

export const COMMON_MODELS: ModelPreset[] = [
  // OpenAI
  { id: "gpt-4o", name: "GPT-4o", apiName: "gpt-4o", provider: "OpenAI" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", apiName: "gpt-4o-mini", provider: "OpenAI" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", apiName: "gpt-4-turbo", provider: "OpenAI" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", apiName: "gpt-3.5-turbo", provider: "OpenAI" },
  // Anthropic
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", apiName: "claude-3-5-sonnet-20241022", provider: "Anthropic" },
  { id: "claude-3-opus", name: "Claude 3 Opus", apiName: "claude-3-opus-20240229", provider: "Anthropic" },
  { id: "claude-3-haiku", name: "Claude 3 Haiku", apiName: "claude-3-haiku-20240307", provider: "Anthropic" },
  // Alibaba Cloud (DashScope)
  { id: "qwen-plus", name: "通义千问 Plus", apiName: "qwen-plus", provider: "阿里云" },
  { id: "qwen-turbo", name: "通义千问 Turbo", apiName: "qwen-turbo", provider: "阿里云" },
  { id: "qwen-max", name: "通义千问 Max", apiName: "qwen-max", provider: "阿里云" },
  // DeepSeek
  { id: "deepseek-chat", name: "DeepSeek Chat", apiName: "deepseek-chat", provider: "DeepSeek" },
  { id: "deepseek-coder", name: "DeepSeek Coder", apiName: "deepseek-coder", provider: "DeepSeek" },
];

/**
 * Special option for custom model input
 */
export const CUSTOM_MODEL_ID = "_custom_";

/**
 * Style option labels (Chinese)
 */
export const STYLE_LABELS: Record<StyleOption, string> = {
  academic: "学术",
  formal: "正式",
  business: "商务",
  casual: "口语",
  creative: "创意",
};

/**
 * Tone option labels (Chinese)
 */
export const TONE_LABELS: Record<ToneOption, string> = {
  rigorous: "严谨",
  neutral: "中性",
  friendly: "亲切",
};

/**
 * Length option labels (Chinese)
 */
export const LENGTH_LABELS: Record<LengthOption, string> = {
  concise: "尽量简短",
  normal: "正常",
  detailed: "详细",
};

/**
 * Language option labels (Chinese)
 */
export const LANGUAGE_LABELS: Record<LanguageOption, string> = {
  chinese: "优先中文",
  english: "优先英文",
  follow_document: "跟随文档语言",
};

/**
 * Scenario option labels (Chinese)
 */
export const SCENARIO_LABELS: Record<ScenarioOption, string> = {
  custom: "自定义",
  sci_paper: "学术论文 (SCI)",
  clinical_report: "临床研究报告",
  project_proposal: "项目申报书",
  official_notice: "行政通知 / 公文",
};

/**
 * Scenario descriptions (for tooltip/help)
 */
export const SCENARIO_DESCRIPTIONS: Record<ScenarioOption, string> = {
  custom: "自行设置风格、语气、长度、语言偏好",
  sci_paper: "遵循IMRAD结构，使用规范学术术语，注重严谨性与可复现性",
  clinical_report: "符合CONSORT/STROBE等报告规范，术语准确，数据呈现清晰",
  project_proposal: "强调创新性与可行性，逻辑清晰，目标明确",
  official_notice: "符合公文格式规范，用语规范，层次分明",
};

/**
 * Preset rules for each scenario
 * These will be appended to the system prompt when a non-custom scenario is selected
 */
export const SCENARIO_PRESETS: Record<ScenarioOption, {
  style: StyleOption;
  tone: ToneOption;
  length: LengthOption;
  language: LanguageOption;
  rulesText: string;
}> = {
  custom: {
    style: "formal",
    tone: "neutral",
    length: "normal",
    language: "chinese",
    rulesText: "",
  },
  sci_paper: {
    style: "academic",
    tone: "rigorous",
    length: "detailed",
    language: "english",
    rulesText: `【学术论文规范】
- 结构遵循 IMRAD（Introduction, Methods, Results, And Discussion）
- 术语使用：采用领域内公认的专业术语，首次出现时给出英文全称及缩写
- 引用格式：遵循目标期刊要求（默认 APA/Vancouver）
- 语态：方法部分用被动语态，讨论部分可适当用主动语态
- 数据呈现：统计结果需包含 P 值、置信区间、效应量
- 避免：口语化表达、主观判断词（如"很好"、"非常"）
- 参考规范：《ICMJE Recommendations》《CONSORT声明》`,
  },
  clinical_report: {
    style: "academic",
    tone: "rigorous",
    length: "detailed",
    language: "chinese",
    rulesText: `【临床研究报告规范】
- 结构遵循 CONSORT（RCT）、STROBE（观察性研究）或 PRISMA（系统综述）
- 术语使用：符合《ICD-11》《中国精神障碍诊疗规范》等标准
- ITT/PP分析：意向性治疗（Intention-to-Treat, ITT）需明确说明
- 伦理声明：需包含伦理委员会批准及知情同意说明
- 数据呈现：样本量、失访率、主要结局指标需完整
- 统计方法：需说明具体检验方法、显著性水平
- 参考规范：《药物临床试验质量管理规范》（GCP）`,
  },
  project_proposal: {
    style: "formal",
    tone: "neutral",
    length: "detailed",
    language: "chinese",
    rulesText: `【项目申报书规范】
- 结构：研究背景 → 研究目标 → 研究内容 → 技术路线 → 预期成果 → 进度安排 → 经费预算
- 创新点：每个创新点需有理论/技术/方法依据
- 可行性：需包含前期工作基础、团队能力、条件保障
- 语言风格：简洁有力，避免冗余修饰
- 图表：技术路线图、甘特图等需清晰易读
- 参考规范：《国家自然科学基金申请书撰写指南》`,
  },
  official_notice: {
    style: "formal",
    tone: "rigorous",
    length: "concise",
    language: "chinese",
    rulesText: `【公文写作规范】
- 格式：符合《党政机关公文格式》（GB/T 9704-2012）
- 结构：标题 → 主送机关 → 正文 → 附件 → 发文机关 → 成文日期
- 用语：使用规范公文用语，如"拟""兹""特此通知"等
- 层次：使用"一、""（一）""1.""（1）"等层级序号
- 语气：庄重、准确、简明
- 避免：口语化、感情色彩词、模糊表述
- 数字：统计数字用阿拉伯数字，序数词用汉字`,
  },
};
