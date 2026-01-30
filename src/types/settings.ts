/**
 * Model configuration for LLM API
 */
export interface ModelConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

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
