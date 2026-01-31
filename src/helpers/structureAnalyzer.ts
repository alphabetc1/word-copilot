/**
 * Structure Analyzer - Analyzes document structure and identifies issues
 */

import { sendChat } from "./llmClient";
import { loadModelConfig } from "./settings";
import { getDocumentText } from "./wordBridge";

/**
 * Structure analysis result
 */
export interface StructureAnalysisResult {
  success: boolean;
  report?: string;
  issues?: StructureIssue[];
  error?: string;
}

/**
 * A specific structural issue found
 */
export interface StructureIssue {
  type: "heading" | "section" | "paragraph" | "citation" | "other";
  severity: "error" | "warning" | "suggestion";
  description: string;
  location?: string;
  suggestion?: string;
}

/**
 * System prompt for structure analysis
 */
const STRUCTURE_ANALYSIS_PROMPT = `你是一个专业的学术文档结构审查专家。请分析用户提供的文档，从以下几个维度进行诊断：

## 检查维度

1. **标题层级一致性**
   - 检查 H1/H2/H3 等标题层级是否连贯
   - 是否存在跳级（如 H1 直接到 H3）
   - 标题编号是否规范

2. **必要模块完整性**
   - 是否包含：摘要/引言/方法/结果/讨论/结论等基本模块
   - 各模块位置是否合理

3. **段落结构问题**
   - 是否存在过长段落（建议单段不超过 200 字）
   - 是否存在逻辑跳跃点
   - 段落间过渡是否自然

4. **引用规范性**
   - 正文中的引用标记（如 [1]、(Smith, 2020)）是否都有对应的参考文献
   - 是否存在需要添加引用但缺失的陈述
   - 引用格式是否统一

## 输出格式

请以结构化的方式输出分析报告：

### 📊 文档结构概览
（简要描述文档的整体结构）

### ✅ 合格项
- 列出做得好的方面

### ⚠️ 问题与建议
按严重程度排列，格式如下：
- **[严重程度]** 问题描述
  - 位置：（如果可以定位）
  - 建议：具体改进建议

### 📝 总结
简要总结主要问题和改进优先级

注意：
- 如果文档很短或不是学术文档，请适当调整检查标准
- 给出的建议要具体可执行
- 用中文回复`;

/**
 * Analyze document structure
 */
export async function analyzeDocumentStructure(): Promise<StructureAnalysisResult> {
  try {
    // Get document content
    const documentText = await getDocumentText(15000); // Get more text for structure analysis

    if (!documentText || documentText.trim().length < 100) {
      return {
        success: false,
        error: "文档内容太少，无法进行结构分析",
      };
    }

    // Load model config
    const config = loadModelConfig();

    if (!config.apiKey || !config.baseUrl) {
      return {
        success: false,
        error: "请先在设置中配置 API Key",
      };
    }

    // Send to LLM for analysis
    const result = await sendChat({
      config,
      systemPrompt: STRUCTURE_ANALYSIS_PROMPT,
      messages: [
        {
          role: "user",
          content: `请分析以下文档的结构：\n\n${documentText}`,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      maxTokens: 4096,
    });

    if (!result.success || !result.message?.content) {
      return {
        success: false,
        error: result.error || "分析失败，请重试",
      };
    }

    // Parse the response
    const report = result.message.content;

    return {
      success: true,
      report,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "分析过程中出错",
    };
  }
}

/**
 * Quick structure check for specific issues
 */
export async function quickStructureCheck(): Promise<string> {
  const result = await analyzeDocumentStructure();

  if (!result.success) {
    return `❌ ${result.error}`;
  }

  return result.report || "分析完成，未发现明显问题";
}

export default {
  analyzeDocumentStructure,
  quickStructureCheck,
};
