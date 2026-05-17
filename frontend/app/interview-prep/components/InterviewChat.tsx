import { useState, useEffect, useRef } from "react";
import { StartInterviewResponse, InterviewAnswer } from "@/utils/api";
import { Send, HelpCircle, Bot, User as UserIcon } from "lucide-react";

type Props = {
  interview: StartInterviewResponse;
  onSubmit: (answers: InterviewAnswer[]) => void;
};

type Message =
  | { role: "interviewer"; text: string; questionId?: number }
  | { role: "user"; text: string; questionId: number; skipped?: boolean };

export default function InterviewChat({ interview, onSubmit }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
  const [typing, setTyping] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const sequence = async () => {
      setTyping(true);
      await new Promise((r) => setTimeout(r, 800));
      setMessages([{ role: "interviewer", text: interview.intro }]);
      setTyping(false);

      await new Promise((r) => setTimeout(r, 1000));
      setTyping(true);
      await new Promise((r) => setTimeout(r, 1200));
      setMessages((prev) => [
        ...prev,
        {
          role: "interviewer",
          text: interview.questions[0].text,
          questionId: interview.questions[0].id,
        },
      ]);
      setTyping(false);
    };
    void sequence();
  }, [interview]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const isLastQuestion = currentIndex === interview.questions.length - 1;
  const currentQuestion = interview.questions[currentIndex];

  const handleSend = (skipped = false) => {
    if (!currentQuestion) return;
    if (!skipped && !currentInput.trim()) return;

    const answer: InterviewAnswer = {
      questionId: currentQuestion.id,
      answer: skipped ? "" : currentInput.trim(),
      skipped,
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: skipped ? "I don't know how to answer this" : currentInput.trim(),
        questionId: currentQuestion.id,
        skipped,
      },
    ]);
    setCurrentInput("");

    if (isLastQuestion) {
      setTimeout(() => {
        setTyping(true);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: "interviewer",
              text: "Thanks for your answers. Let me analyze them and give you feedback...",
            },
          ]);
          setTyping(false);
          setTimeout(() => onSubmit(newAnswers), 1000);
        }, 1200);
      }, 500);
    } else {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      setTimeout(() => {
        setTyping(true);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: "interviewer",
              text: interview.questions[nextIndex].text,
              questionId: interview.questions[nextIndex].id,
            },
          ]);
          setTyping(false);
        }, 1500);
      }, 500);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Question {Math.min(currentIndex + 1, interview.questions.length)} of{" "}
            {interview.questions.length}
          </span>
        </div>
        <div
          style={{
            height: 3,
            backgroundColor: "var(--bg-border)",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${((currentIndex + 1) / interview.questions.length) * 100}%`,
              height: "100%",
              backgroundColor: "var(--accent)",
              borderRadius: 999,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      <div
        className="card"
        style={{
          padding: 20,
          minHeight: 400,
          maxHeight: "60vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginBottom: 16,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              animation: "fadeIn 0.3s ease",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                backgroundColor:
                  msg.role === "interviewer"
                    ? "var(--accent-dim)"
                    : "var(--bg-elevated)",
                border: `1px solid ${msg.role === "interviewer" ? "var(--accent)" : "var(--bg-border)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color:
                  msg.role === "interviewer"
                    ? "var(--accent)"
                    : "var(--text-secondary)",
              }}
            >
              {msg.role === "interviewer" ? (
                <Bot size={14} />
              ) : (
                <UserIcon size={14} />
              )}
            </div>
            <div
              style={{
                backgroundColor:
                  msg.role === "interviewer"
                    ? "var(--bg-elevated)"
                    : "var(--accent-dim)",
                border: `1px solid ${msg.role === "interviewer" ? "var(--bg-border)" : "var(--accent)"}`,
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                fontSize: "0.875rem",
                lineHeight: 1.5,
                color:
                  msg.role === "user" ? "var(--accent)" : "var(--text-primary)",
                maxWidth: "75%",
                fontStyle:
                  msg.role === "user" && msg.skipped ? "italic" : "normal",
                opacity: msg.role === "user" && msg.skipped ? 0.7 : 1,
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {typing && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                backgroundColor: "var(--accent-dim)",
                border: "1px solid var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "var(--accent)",
              }}
            >
              <Bot size={14} />
            </div>
            <div
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--bg-border)",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {!typing &&
        currentQuestion &&
        answers.length < interview.questions.length && (
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
            }}
          >
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Type your answer..."
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSend(false);
                }
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button
                type="submit"
                onClick={() => handleSend(false)}
                disabled={!currentInput.trim()}
                style={{
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                title="Send (Ctrl+Enter)"
              >
                <Send size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleSend(true)}
                style={{
                  padding: "8px 12px",
                  fontSize: "0.7rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
                title="Skip question"
              >
                <HelpCircle size={12} />
                Skip
              </button>
            </div>
          </div>
        )}

      <style jsx>{`
        @keyframes typingDot {
          0%,
          60%,
          100% {
            opacity: 0.3;
          }
          30% {
            opacity: 1;
          }
        }
        :global(.typing-dot) {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--text-muted);
          animation: typingDot 1.4s infinite;
        }
        :global(.typing-dot:nth-child(2)) {
          animation-delay: 0.2s;
        }
        :global(.typing-dot:nth-child(3)) {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
}
