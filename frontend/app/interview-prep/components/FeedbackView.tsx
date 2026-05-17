import { useState } from "react";
import Link from "next/link";
import { InterviewFeedback } from "@/utils/api";
import {
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";

type Props = {
  feedback: InterviewFeedback;
  onRestart: () => void;
};

export default function FeedbackView({ feedback, onRestart }: Props) {
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 75) return "var(--success)";
    if (score >= 50) return "var(--warning)";
    return "var(--danger)";
  };

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 6 }}>Interview feedback</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          AI-generated assessment of your responses
        </p>
      </div>

      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            border: `4px solid ${getScoreColor(feedback.overallScore)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.75rem",
              fontWeight: 600,
              color: getScoreColor(feedback.overallScore),
            }}
          >
            {feedback.overallScore}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 8,
            }}
          >
            Overall score
          </div>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {feedback.summary}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 12,
            fontWeight: 600,
          }}
        >
          Question-by-question feedback
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {feedback.questionFeedback.map((qf) => {
            const question = feedback.questions.find(
              (q) => q.id === qf.questionId,
            );
            const isExpanded = expandedQ === qf.questionId;
            return (
              <div
                key={qf.questionId}
                className="card"
                style={{
                  borderLeft: `2px solid ${getScoreColor(qf.score)}`,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    gap: 12,
                  }}
                  onClick={() =>
                    setExpandedQ(isExpanded ? null : qf.questionId)
                  }
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-mono)",
                        marginBottom: 4,
                      }}
                    >
                      Q{qf.questionId}
                    </div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--text-primary)",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: isExpanded ? "normal" : "nowrap",
                      }}
                    >
                      {question?.text}
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: getScoreColor(qf.score),
                      }}
                    >
                      {qf.score}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: "1px solid var(--bg-border)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: 6,
                        }}
                      >
                        Feedback
                      </div>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-secondary)",
                          lineHeight: 1.6,
                          margin: 0,
                        }}
                      >
                        {qf.feedback}
                      </p>
                    </div>
                    {qf.modelAnswer && (
                      <div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--accent)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: 6,
                          }}
                        >
                          Suggested answer
                        </div>
                        <p
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--text-secondary)",
                            lineHeight: 1.6,
                            margin: 0,
                            backgroundColor: "var(--bg-elevated)",
                            padding: 12,
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--bg-border)",
                          }}
                        >
                          {qf.modelAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          marginBottom: 24,
        }}
        className="market-grid-2"
      >
        {feedback.strengths.length > 0 && (
          <div
            className="card"
            style={{ borderLeft: "2px solid var(--success)" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.75rem",
                color: "var(--success)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              <CheckCircle2 size={13} />
              Strengths
            </div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {feedback.strengths.map((s, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    marginBottom: 6,
                    lineHeight: 1.5,
                  }}
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {feedback.improvements.length > 0 && (
          <div
            className="card"
            style={{ borderLeft: "2px solid var(--warning)" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.75rem",
                color: "var(--warning)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              <AlertCircle size={13} />
              Improvements
            </div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {feedback.improvements.map((s, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    marginBottom: 6,
                    lineHeight: 1.5,
                  }}
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {feedback.nextSteps.length > 0 && (
          <div
            className="card"
            style={{ borderLeft: "2px solid var(--accent)" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.75rem",
                color: "var(--accent)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              <Lightbulb size={13} />
              Next steps
            </div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {feedback.nextSteps.map((s, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    marginBottom: 6,
                    lineHeight: 1.5,
                  }}
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onRestart}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <RefreshCw size={14} />
          Try another interview
        </button>
        <Link href="/recommendations">
          <button type="submit">View learning recommendations →</button>
        </Link>
      </div>
    </>
  );
}
