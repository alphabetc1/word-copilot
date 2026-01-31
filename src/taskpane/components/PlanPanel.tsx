import * as React from "react";
import { useState, useRef, useMemo } from "react";
import { sendChat } from "../../helpers/llmClient";
import { loadModelConfig, loadUserRules } from "../../helpers/settings";
import { insertText } from "../../helpers/wordBridge";
import { t } from "../../helpers/i18n";

// Plan workflow steps
type PlanStep = "questions" | "outline" | "sections";

interface ClarifyingQuestion {
  id: string;
  questionKey: keyof ReturnType<typeof t>;
  placeholderKey: keyof ReturnType<typeof t>;
  answer: string;
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
const QUESTION_KEYS: Array<{
  id: string;
  questionKey: keyof ReturnType<typeof t>;
  placeholderKey: keyof ReturnType<typeof t>;
}> = [
  { id: "title", questionKey: "planDocTitle", placeholderKey: "planDocTitlePlaceholder" },
  { id: "objective", questionKey: "planObjective", placeholderKey: "planObjectivePlaceholder" },
  { id: "audience", questionKey: "planAudience", placeholderKey: "planAudiencePlaceholder" },
  { id: "length", questionKey: "planLength", placeholderKey: "planLengthPlaceholder" },
  { id: "extra", questionKey: "planExtra", placeholderKey: "planExtraPlaceholder" },
];

const PlanPanel: React.FC<PlanPanelProps> = ({ isConfigured }) => {
  const i18n = t();

  // Initialize questions with i18n keys
  const initialQuestions = useMemo(
    () =>
      QUESTION_KEYS.map((q) => ({
        id: q.id,
        questionKey: q.questionKey,
        placeholderKey: q.placeholderKey,
        answer: "",
      })),
    []
  );

  const [step, setStep] = useState<PlanStep>("questions");
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>(initialQuestions);
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
      setError(i18n.configRequired);
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
      .map((q) => `${i18n[q.questionKey]}: ${q.answer}`)
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
        throw new Error(result.error || i18n.planOutlineFailed);
      }

      // Parse JSON response
      const content = result.message.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(i18n.planOutlineFailed);
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
        setError(i18n.planCancelled);
      } else {
        setError(err instanceof Error ? err.message : i18n.planOutlineFailed);
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
      .map((q) => `${i18n[q.questionKey]}: ${q.answer}`)
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
        throw new Error(result.error || i18n.planContentFailed);
      }

      const content = result.message.content || "";
      setOutline((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, content, status: "done" } : s
        )
      );
    } catch (err) {
      setOutline((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, status: "error" } : s
        )
      );
      setError(err instanceof Error ? err.message : i18n.planContentFailed);
    } finally {
      abortControllerRef.current = null;
    }
  };

  // Insert section content to document
  const insertSection = async (sectionId: string) => {
    const section = outline.find((s) => s.id === sectionId);
    if (!section || !section.content) return;

    try {
      const fullContent = `\n${section.title}\n\n${section.content}\n`;
      await insertText("document_end", fullContent);
    } catch {
      setError(i18n.planInsertFailed);
    }
  };

  // Insert all sections to document
  const insertAllSections = async () => {
    const completedSections = outline.filter((s) => s.status === "done");
    if (completedSections.length === 0) {
      setError(i18n.planNoContent);
      return;
    }

    try {
      for (const section of completedSections) {
        const fullContent = `\n${section.title}\n\n${section.content}\n`;
        await insertText("document_end", fullContent);
      }
    } catch {
      setError(i18n.planInsertFailed);
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
    setQuestions(initialQuestions);
    setOutline([]);
    setError(null);
  };

  // Render based on current step
  const renderQuestions = () => (
    <div className="plan-questions">
      <h3>{i18n.planQuestionTitle}</h3>
      <p className="plan-hint">{i18n.planQuestionHint}</p>

      {questions.map((q) => (
        <div key={q.id} className="plan-question-item">
          <label>{i18n[q.questionKey]}</label>
          <input
            type="text"
            value={q.answer}
            onChange={(e) => updateAnswer(q.id, e.target.value)}
            placeholder={i18n[q.placeholderKey]}
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
              {i18n.planGenerating}
            </>
          ) : (
            i18n.planGenerateOutline
          )}
        </button>
        {isLoading && (
          <button className="plan-btn secondary" onClick={handleCancel}>
            {i18n.cancel}
          </button>
        )}
      </div>
    </div>
  );

  const renderOutline = () => (
    <div className="plan-outline">
      <div className="plan-outline-header">
        <h3>{i18n.planOutlineTitle}</h3>
        <button className="plan-btn text" onClick={() => setStep("questions")}>
          {i18n.planBackToQuestions}
        </button>
      </div>

      <p className="plan-hint">{i18n.planOutlineHint}</p>

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
                {section.status === "pending" && i18n.planPending}
                {section.status === "generating" && i18n.loading}
                {section.status === "done" && i18n.planDone}
                {section.status === "error" && i18n.planFailed}
              </div>
            </div>

            {section.status === "pending" && (
              <div className="plan-section-prompt">
                <input
                  type="text"
                  value={section.customPrompt}
                  onChange={(e) => updateSectionPrompt(section.id, e.target.value)}
                  placeholder={i18n.planExtraPrompt}
                />
                <button
                  className="plan-btn primary small"
                  onClick={() => generateSection(section.id)}
                  disabled={!isConfigured}
                >
                  {i18n.planGenerate}
                </button>
              </div>
            )}

            {section.status === "generating" && (
              <div className="plan-section-loading">
                <span className="button-spinner" />
                {i18n.loading}
                <button className="plan-btn text small" onClick={handleCancel}>
                  {i18n.cancel}
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
                    {i18n.planRegenerate}
                  </button>
                  <button
                    className="plan-btn primary small"
                    onClick={() => insertSection(section.id)}
                  >
                    {i18n.planInsertDoc}
                  </button>
                </div>
              </div>
            )}

            {section.status === "error" && (
              <div className="plan-section-error">
                <span>{i18n.planFailed}</span>
                <button
                  className="plan-btn secondary small"
                  onClick={() => generateSection(section.id)}
                >
                  {i18n.retry}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <div className="plan-error">{error}</div>}

      <div className="plan-actions">
        <button className="plan-btn secondary" onClick={handleReset}>
          {i18n.planReset}
        </button>
        {outline.some((s) => s.status === "done") && (
          <button className="plan-btn primary" onClick={insertAllSections}>
            {i18n.planInsertAll}
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
          <span>{i18n.configRequired}</span>
        </div>
      )}

      {step === "questions" && renderQuestions()}
      {(step === "outline" || step === "sections") && renderOutline()}
    </div>
  );
};

export default PlanPanel;
