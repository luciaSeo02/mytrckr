"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMounted } from "@/hooks/useMounted";
import PrivatePageGuard from "@/components/PrivatePageGuard";
import LoadingScreen from "@/components/LoadingScreen";
import { apiGet } from "@/utils/api";
import { ArrowLeft, Calendar, Building2 } from "lucide-react";
import { capitalize } from "@/utils/format";

type InterviewHistoryItem = {
  id: string;
  type: "HR" | "TECHNICAL" | "MIXED";
  target: "GENERAL" | "SPECIFIC";
  targetRole: string;
  overallScore: number | null;
  summary: string | null;
  completedAt: string | null;
  createdAt: string;
  jobApplication?: { company: string; role: string } | null;
};

function HistoryContent() {
  const mounted = useMounted();
  const [interviews, setInterviews] = useState<InterviewHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiGet<InterviewHistoryItem[]>(
          "/interviews/history",
        );
        setInterviews(data);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const getScoreColor = (score: number | null) => {
    if (score === null) return "var(--text-muted)";
    if (score >= 75) return "var(--success)";
    if (score >= 50) return "var(--warning)";
    return "var(--danger)";
  };

  if (!mounted) return <LoadingScreen />;
  if (loading) return <LoadingScreen message="Loading history..." />;

  return (
    <div className="page animate-in">
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/interview-prep"
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
          Back to interview prep
        </Link>
        <h1 style={{ marginBottom: 6 }}>Interview history</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Review your past practice sessions
        </p>
      </div>

      {interviews.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "48px 32px",
            borderStyle: "dashed",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            No completed interviews yet. Start your first one!
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {interviews.map((iv) => (
            <Link
              key={iv.id}
              href={`/interview-prep/history/${iv.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                className="card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  cursor: "pointer",
                  borderLeft: `2px solid ${getScoreColor(iv.overallScore)}`,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    border: `3px solid ${getScoreColor(iv.overallScore)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: getScoreColor(iv.overallScore),
                    }}
                  >
                    {iv.overallScore ?? "—"}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {capitalize(iv.type)} interview
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--accent)",
                        backgroundColor: "var(--accent-dim)",
                        border: "1px solid var(--accent)",
                        borderRadius: 999,
                        padding: "2px 8px",
                      }}
                    >
                      {iv.targetRole}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                      flexWrap: "wrap",
                    }}
                  >
                    {iv.jobApplication && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Building2 size={11} />
                        {iv.jobApplication.company}
                      </span>
                    )}
                    {iv.completedAt && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Calendar size={11} />
                        {new Date(iv.completedAt).toLocaleDateString("en-GB")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <PrivatePageGuard>
      <HistoryContent />
    </PrivatePageGuard>
  );
}
