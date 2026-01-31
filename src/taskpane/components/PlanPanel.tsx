import * as React from "react";
import { useState, useRef } from "react";
import { sendChat } from "../../helpers/llmClient";
import { loadModelConfig, loadUserRules } from "../../helpers/settings";
import { insertText } from "../../helpers/wordBridge";

// Plan workflow steps
type PlanStep = "questions" | "outline" | "sections";

interface ClarifyingQuestion {
  id: string;
  question: string;
  answer: string;
  placeholder: string;
}

interface OutlineSection {
  id: string;
  title: string;
  description: string;
  content: string;
  status: "pending" | "generating" | "done" | "error";
  customPrompt: string;
}

interface PlanPanelProps {
  isConfigured: boolean;
}

// Default clarifying questions for long document writing
const DEFAULT_QUESTIONS: ClarifyingQuestion[] = [
  {
    id: "title",
    question: "文档标题/项目名称",
    answer: "",
    placeholder: "例如：基于深度学习的医学影像分析研究",
  },
  {
    id: "objective",
    question: "主要目标/核心内容",
    answer: "",
    placeholder: "简述你想要实现的目标",
  },
  {
    id: "audience",
    question: "目标读者/对象",
    answer: "",
    placeholder: "例如：基金评审专家、学术期刊编辑",
  },
  {
    id: "length",
    question: "预期字数/篇幅",
    answer: "",
    placeholder: "例如：3000字、10页",
  },
  {
    id: "extra",
    question: "其他要求或背景信息",
    answer: "",
    placeholder: "任何额外的说明或特殊要求",
  },
];

const PlanPanel: React.FC<PlanPanelProps> = ({ isConfigured }) => {
  const [step, setStep] = useState<PlanStep>("questions");
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>(DEFAULT_QUESTIONS);
  const [outline, setOutline] = useState<OutlineSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update question answer
  const updateAnswer = (id: string, answer: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, answer } : q))
    );
  };

  // Generate outline from questions
  const generateOutline = async () => {
    if (!isConfigured) {
      setError("请先在设置中配置 API");
      return;
    }

    setIsLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    const config = loadModelConfig();
    const userRules = loadUserRules();

    // Build context from questions
    const context = questions
      .filter((q) => q.answer.trim())
      .map((q) => `${q.question}: ${q.answer}`)
      .join("\n");

    const prompt = `根据以下信息，生成一份详细的文档大纲。请以 JSON 格式返回，包含标题和简要说明。

用户提供的信息：
${context}

用户写作规则：
- 场景: ${userRules.scenario}
- 风格: ${userRules.style}
- 语气: ${userRules.tone}

请返回如下 JSON 格式（不要添加其他内容）：
{
  "sections": [
    {"title": "章节标题", "description": "该章节应包含的内容概要"},
    ...
  ]
}`;

    try {
      const result = await sendChat({
        config,
        systemPrompt: "你是一个专业的文档写作助手。",
        messages: [{ role: "user", content: prompt }],
        abortController: abortControllerRef.current,
      });

      if (!result.success || !result.message) {
        throw new Error(result.error || "生成大纲失败");
      }

      // Parse JSON response
      const content = result.message.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("无法解析大纲格式");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const sections: OutlineSection[] = parsed.sections.map(
        (s: { title: string; description: string }, i: number) => ({
          id: `section-${i}`,
          title: s.title,
          description: s.description,
          content: "",
          status: "pending" as const,
          customPrompt: "",
        })
      );

      setOutline(sections);
      setStep("outline");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("已取消");
      } else {
        setError(err instanceof Error ? err.message : "生成失败");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Generate content for a section
  const generateSection = async (sectionId: string) => {
    const section = outline.find((s) => s.id === sectionId);
    if (!section || !isConfigured) return;

    setOutline((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, status: "generating" } : s
      )
    );

    abortControllerRef.current = new AbortController();
    const config = loadModelConfig();
    const userRules = loadUserRules();

    // Build context
    const questionContext = questions
      .filter((q) => q.answer.trim())
      .map((q) => `${q.question}: ${q.answer}`)
      .join("\n");

    const outlineContext = outline
      .map((s) => `- ${s.title}: ${s.description}`)
      .join("\n");

    const customInstructions = section.customPrompt
      ? `\n用户额外要求：${section.customPrompt}`
      : "";

    const prompt = `请为以下文档撰写「${section.title}」章节的内容。

文档背景：
${questionContext}

完整大纲：
${outlineContext}

当前要撰写的章节：
标题：${section.title}
内容要求：${section.description}${customInstructions}

写作规则：
- 场景: ${userRules.scenario}
- 风格: ${userRules.style}
- 语气: ${userRules.tone}
- 语言: ${userRules.language}

请直接输出该章节的正文内容（不要输出标题），确保：
1. 内容与大纲描述一致
2. 与其他章节逻辑连贯
3. 符合上述写作规则`;

    try {
      const result = await sendChat({
        config,
        systemPrompt: "你是一个专业的文档写作助手。",
        messages: [{ role: "user", content: prompt }],
        abortController: abortControllerRef.current,
      });

      if (!result.success || !result.message) {
        throw new Error(result.error || "生成内容失败");
      }

      const content = result.message.content || "";
      setOutline((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, content, status: "done" }
            : s
        )
      );
    } catch (err) {
      setOutline((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, status: "error" } : s
        )
      );
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      abortControllerRef.current = null;
    }
  };

  // Insert section content to document
  const insertSection = async (sectionId: string) => {
    const section = outline.find((s) => s.id === sectionId);
    if (!section || !section.content) return;

    try {
      // Insert title and content
      const fullContent = `\n${section.title}\n\n${section.content}\n`;
      await insertText("document_end", fullContent);
    } catch (err) {
      setError("插入文档失败");
    }
  };

  // Insert all sections to document
  const insertAllSections = async () => {
    const completedSections = outline.filter((s) => s.status === "done");
    if (completedSections.length === 0) {
      setError("没有可插入的内容");
      return;
    }

    try {
      for (const section of completedSections) {
        const fullContent = `\n${section.title}\n\n${section.content}\n`;
        await insertText("document_end", fullContent);
      }
    } catch (err) {
      setError("插入文档失败");
    }
  };

  // Update section custom prompt
  const updateSectionPrompt = (sectionId: string, prompt: string) => {
    setOutline((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, customPrompt: prompt } : s
      )
    );
  };

  // Cancel current generation
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Reset to start
  const handleReset = () => {
    setStep("questions");
    setQuestions(DEFAULT_QUESTIONS);
    setOutline([]);
    setError(null);
  };

  // Render based on current step
  const renderQuestions = () => (
    <div className="plan-questions">
      <h3>📝 请回答以下问题</h3>
      <p className="plan-hint">
        AI 将根据您的回答生成文档大纲。填写越详细，生成效果越好。
      </p>

      {questions.map((q) => (
        <div key={q.id} className="plan-question-item">
          <label>{q.question}</label>
          <input
            type="text"
            value={q.answer}
            onChange={(e) => updateAnswer(q.id, e.target.value)}
            placeholder={q.placeholder}
            disabled={isLoading}
          />
        </div>
      ))}

      {error && <div className="plan-error">{error}</div>}

      <div className="plan-actions">
        <button
          className="plan-btn primary"
          onClick={generateOutline}
          disabled={isLoading || !isConfigured}
        >
          {isLoading ? (
            <>
              <span className="button-spinner" />
              生成大纲中...
            </>
          ) : (
            "生成大纲"
          )}
        </button>
        {isLoading && (
          <button className="plan-btn secondary" onClick={handleCancel}>
            取消
          </button>
        )}
      </div>
    </div>
  );

  const renderOutline = () => (
    <div className="plan-outline">
      <div className="plan-outline-header">
        <h3>📋 文档大纲</h3>
        <button className="plan-btn text" onClick={() => setStep("questions")}>
          ← 返回修改
        </button>
      </div>

      <p className="plan-hint">
        点击「生成」按钮生成各章节内容，可在生成前修改提示词。
      </p>

      <div className="plan-sections">
        {outline.map((section, index) => (
          <div key={section.id} className={`plan-section ${section.status}`}>
            <div className="plan-section-header">
              <span className="plan-section-num">{index + 1}</span>
              <div className="plan-section-info">
                <h4>{section.title}</h4>
                <p>{section.description}</p>
              </div>
              <div className="plan-section-status">
                {section.status === "pending" && "待生成"}
                {section.status === "generating" && "生成中..."}
                {section.status === "done" && "✓ 完成"}
                {section.status === "error" && "✗ 失败"}
              </div>
            </div>

            {section.status === "pending" && (
              <div className="plan-section-prompt">
                <input
                  type="text"
                  value={section.customPrompt}
                  onChange={(e) => updateSectionPrompt(section.id, e.target.value)}
                  placeholder="额外提示词（可选）"
                />
                <button
                  className="plan-btn primary small"
                  onClick={() => generateSection(section.id)}
                  disabled={!isConfigured}
                >
                  生成
                </button>
              </div>
            )}

            {section.status === "generating" && (
              <div className="plan-section-loading">
                <span className="button-spinner" />
                正在生成内容...
                <button className="plan-btn text small" onClick={handleCancel}>
                  取消
                </button>
              </div>
            )}

            {section.status === "done" && section.content && (
              <div className="plan-section-content">
                <div className="plan-section-preview">
                  {section.content.slice(0, 200)}
                  {section.content.length > 200 && "..."}
                </div>
                <div className="plan-section-actions">
                  <button
                    className="plan-btn secondary small"
                    onClick={() => {
                      setOutline((prev) =>
                        prev.map((s) =>
                          s.id === section.id
                            ? { ...s, status: "pending", content: "" }
                            : s
                        )
                      );
                    }}
                  >
                    重新生成
                  </button>
                  <button
                    className="plan-btn primary small"
                    onClick={() => insertSection(section.id)}
                  >
                    插入文档
                  </button>
                </div>
              </div>
            )}

            {section.status === "error" && (
              <div className="plan-section-error">
                <span>生成失败</span>
                <button
                  className="plan-btn secondary small"
                  onClick={() => generateSection(section.id)}
                >
                  重试
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <div className="plan-error">{error}</div>}

      <div className="plan-actions">
        <button className="plan-btn secondary" onClick={handleReset}>
          重新开始
        </button>
        {outline.some((s) => s.status === "done") && (
          <button className="plan-btn primary" onClick={insertAllSections}>
            插入全部已完成章节
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="plan-panel">
      {!isConfigured && (
        <div className="config-status">
          <span>⚠️</span>
          <span>请先在设置中配置 API Key</span>
        </div>
      )}

      {step === "questions" && renderQuestions()}
      {(step === "outline" || step === "sections") && renderOutline()}
    </div>
  );
};

export default PlanPanel;
