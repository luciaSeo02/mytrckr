import { useState } from "react";
import { RemainingInterviews } from "@/utils/api";
import { JobApplication } from "@/types/user";
import Link from "next/link";
import {
  Users,
  Code,
  Layers,
  User,
  Briefcase,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

type Type = "HR" | "TECHNICAL" | "MIXED";
type Target = "GENERAL" | "SPECIFIC";

type Props = {
  remaining: RemainingInterviews | null;
  jobs: JobApplication[];
  error: string;
  onStart: (type: Type, target: Target, jobApplicationId?: string) => void;
};

export default function SetupStep({ remaining, jobs, error, onStart }: Props) {
  const [target, setTarget] = useState<Target>("GENERAL");
  const [type, setType] = useState<Type>("HR");
  const [jobId, setJobId] = useState<string>("");

  const canStart =
    remaining &&
    remaining.remaining > 0 &&
    (target === "GENERAL" || (target === "SPECIFIC" && jobId));

  const TARGET_OPTIONS = [
    {
      value: "GENERAL" as Target,
      title: "General",
      description: "Based on your target role and profile skills",
      icon: <User size={20} />,
    },
    {
      value: "SPECIFIC" as Target,
      title: "Specific job",
      description:
        "For a job in your tracker — questions tailored to that company",
      icon: <Briefcase size={20} />,
    },
  ];

  const TYPE_OPTIONS = [
    {
      value: "HR" as Type,
      title: "HR / Behavioral",
      description:
        "Soft skills, motivations, situational questions. Usually the first round.",
      icon: <Users size={20} />,
    },
    {
      value: "TECHNICAL" as Type,
      title: "Technical",
      description:
        "Technical knowledge, problem solving, decisions. With someone from the team.",
      icon: <Code size={20} />,
    },
    {
      value: "MIXED" as Type,
      title: "Mixed",
      description: "A bit of both. Common in smaller companies.",
      icon: <Layers size={20} />,
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 6 }}>Interview Prep</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Practice with AI-generated questions calibrated to your level
        </p>
      </div>

      <div
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--warning)",
          borderRadius: "var(--radius-md)",
          padding: "12px 16px",
          marginBottom: 24,
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <AlertTriangle
          size={16}
          style={{ color: "var(--warning)", flexShrink: 0, marginTop: 2 }}
        />
        <span>
          AI-generated questions and feedback are a practice tool, not a
          guarantee of real interviews. Always supplement with research about
          the company.
        </span>
      </div>

      {remaining && (
        <div
          className="card"
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
              }}
            >
              Daily interviews
            </div>
            <div style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--accent)",
                }}
              >
                {remaining.used}
              </span>
              {" / "}
              <span style={{ fontFamily: "var(--font-mono)" }}>
                {remaining.limit}
              </span>
              {" used today"}
            </div>
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color:
                remaining.remaining > 0 ? "var(--success)" : "var(--danger)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {remaining.remaining > 0
              ? `${remaining.remaining} remaining`
              : "Limit reached for today"}
          </div>
          <Link
            href="/interview-prep/history"
            style={{
              fontSize: "0.75rem",
              color: "var(--accent)",
              textDecoration: "none",
              fontFamily: "var(--font-mono)",
            }}
          >
            View history →
          </Link>
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: "0.875rem",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
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
          Step 1 · What interview do you want to practice?
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
          className="market-grid-2"
        >
          {TARGET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTarget(opt.value)}
              style={{
                padding: 16,
                textAlign: "left",
                backgroundColor: "var(--bg-surface)",
                border: `1px solid ${target === opt.value ? "var(--accent)" : "var(--bg-border)"}`,
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color:
                    target === opt.value
                      ? "var(--accent)"
                      : "var(--text-secondary)",
                }}
              >
                {opt.icon}
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                  {opt.title}
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {opt.description}
              </p>
            </button>
          ))}
        </div>

        {target === "SPECIFIC" && (
          <div style={{ marginTop: 12 }}>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              style={{ marginTop: 8 }}
            >
              <option value="">— Select a job application —</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.role} @ {job.company}
                </option>
              ))}
            </select>
            {jobs.length === 0 && (
              <small
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.75rem",
                  marginTop: 6,
                  display: "block",
                }}
              >
                You have no job applications yet. Add one in the Job Tracker
                first.
              </small>
            )}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 32 }}>
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
          Step 2 · Type of interview
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
          }}
        >
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              style={{
                padding: 16,
                textAlign: "left",
                backgroundColor: "var(--bg-surface)",
                border: `1px solid ${type === opt.value ? "var(--accent)" : "var(--bg-border)"}`,
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color:
                    type === opt.value
                      ? "var(--accent)"
                      : "var(--text-secondary)",
                }}
              >
                {opt.icon}
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                  {opt.title}
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {opt.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        onClick={() =>
          onStart(type, target, target === "SPECIFIC" ? jobId : undefined)
        }
        disabled={!canStart}
        style={{
          padding: "12px 28px",
          fontSize: "0.95rem",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Sparkles size={16} />
        Start interview →
      </button>
    </>
  );
}
