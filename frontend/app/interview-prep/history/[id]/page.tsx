"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMounted } from "@/hooks/useMounted";
import PrivatePageGuard from "@/components/PrivatePageGuard";
import LoadingScreen from "@/components/LoadingScreen";
import { apiGet, InterviewQuestion, QuestionFeedback } from "@/utils/api";
import {
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react";

type InterviewDetail = {
  id: string;
  type: "HR" | "TECHNICAL" | "MIXED";
  target: "GENERAL" | "SPECIFIC";
  targetRole: string;
  experienceLevel: string;
  overallScore: number | null;
  summary: string | null;
  questions: InterviewQuestion[];
  answers: { questionId: number; answer: string; skipped: boolean }[] | null;
  questionFeedback: QuestionFeedback[] | null;
  strengths: string[] | null;
  improvements: string[] | null;
  nextSteps: string[] | null;
  completedAt: string | null;
  jobApplication?: { company: string; role: string } | null;
};

function DetailContent() {
  const params = useParams();
  const id = params.id as string;
  const mounted = useMounted();
  const [interview, setInterview] = useState<InterviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiGet<InterviewDetail>(`/interviews/${id}`);
        setInterview(data);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [id]);

  const getScoreColor = (score: number | null) => {
    if (score === null) return "var(--text-muted)";
    if (score >= 75) return "var(--success)";
    if (score >= 50) return "var(--warning)";
    return "var(--danger)";
  };

  if (!mounted) return <LoadingScreen />;
  if (loading) return <LoadingScreen message="Loading interview..." />;
  if (!interview) {
    return (
      <div className="page">
        <p style={{ color: "var(--text-muted)" }}>Interview not found</p>
      </div>
    );
  }

  return (
    <div className="page animate-in">
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/interview-prep/history"
          style={{
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 12,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={14} />
          Back to history
        </Link>
        <h1 style={{ marginBottom: 6 }}>{interview.type} interview</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          {interview.targetRole}
          {interview.jobApplication && ` · ${interview.jobApplication.company}`}
          {interview.completedAt &&
            ` · ${new Date(interview.completedAt).toLocaleDateString("en-GB")}`}
        </p>
      </div>

      {interview.overallScore !== null && (
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
              border: `4px solid ${getScoreColor(interview.overallScore)}`,
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
                color: getScoreColor(interview.overallScore),
              }}
            >
              {interview.overallScore}
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
              {interview.summary}
            </p>
          </div>
        </div>
      )}

      {interview.questionFeedback && interview.answers && (
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
            Questions and answers
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {interview.questionFeedback.map((qf) => {
              const question = interview.questions.find(
                (q) => q.id === qf.questionId,
              );
              const answer = interview.answers?.find(
                (a) => a.questionId === qf.questionId,
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
                      {answer && (
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
                            Your answer
                          </div>
                          <p
                            style={{
                              fontSize: "0.85rem",
                              color: answer.skipped
                                ? "var(--text-muted)"
                                : "var(--text-secondary)",
                              lineHeight: 1.6,
                              margin: 0,
                              fontStyle: answer.skipped ? "italic" : "normal",
                            }}
                          >
                            {answer.skipped
                              ? "Skipped — I didn't know how to answer this"
                              : answer.answer}
                          </p>
                        </div>
                      )}
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
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
        }}
        className="market-grid-2"
      >
        {interview.strengths && interview.strengths.length > 0 && (
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
              {interview.strengths.map((s, i) => (
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

        {interview.improvements && interview.improvements.length > 0 && (
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
              {interview.improvements.map((s, i) => (
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

        {interview.nextSteps && interview.nextSteps.length > 0 && (
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
              {interview.nextSteps.map((s, i) => (
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
    </div>
  );
}

export default function InterviewDetailPage() {
  return (
    <PrivatePageGuard>
      <DetailContent />
    </PrivatePageGuard>
  );
}
