"use client";

import { useState, useEffect } from "react";
import { useMounted } from "@/hooks/useMounted";
import PrivatePageGuard from "@/components/PrivatePageGuard";
import LoadingScreen from "@/components/LoadingScreen";
import {
  apiGetRemainingInterviews,
  apiGetJobApplications,
  apiStartInterview,
  apiSubmitInterview,
  RemainingInterviews,
  StartInterviewResponse,
  InterviewFeedback,
  InterviewAnswer,
} from "@/utils/api";
import { JobApplication } from "@/types/user";
import SetupStep from "./components/SetupStep";
import InterviewChat from "./components/InterviewChat";
import FeedbackView from "./components/FeedbackView";

type Stage = "setup" | "interview" | "feedback";

function InterviewPrepContent() {
  const mounted = useMounted();
  const [stage, setStage] = useState<Stage>("setup");
  const [remaining, setRemaining] = useState<RemainingInterviews | null>(null);
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [interview, setInterview] = useState<StartInterviewResponse | null>(
    null,
  );
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [remainingData, jobsData] = await Promise.all([
          apiGetRemainingInterviews(),
          apiGetJobApplications(),
        ]);
        setRemaining(remainingData);
        setJobs(jobsData);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const handleStart = async (
    type: "HR" | "TECHNICAL" | "MIXED",
    target: "GENERAL" | "SPECIFIC",
    jobApplicationId?: string,
  ) => {
    setSubmitting(true);
    setError("");
    try {
      const result = await apiStartInterview({
        type,
        target,
        jobApplicationId,
      });
      setInterview(result);
      setStage("interview");
      const newRemaining = await apiGetRemainingInterviews();
      setRemaining(newRemaining);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (answers: InterviewAnswer[]) => {
    if (!interview) return;
    setSubmitting(true);
    try {
      const result = await apiSubmitInterview(interview.id, answers);
      setFeedback(result);
      setStage("feedback");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setInterview(null);
    setFeedback(null);
    setError("");
    setStage("setup");
  };

  if (!mounted) return <LoadingScreen />;
  if (loading) return <LoadingScreen message="Loading interview prep..." />;
  if (submitting && stage === "interview")
    return <LoadingScreen message="Generating your feedback..." />;
  if (submitting && stage === "setup")
    return <LoadingScreen message="Preparing your interview..." />;

  return (
    <div className="page animate-in">
      {stage === "setup" && (
        <SetupStep
          remaining={remaining}
          jobs={jobs}
          error={error}
          onStart={handleStart}
        />
      )}
      {stage === "interview" && interview && (
        <InterviewChat interview={interview} onSubmit={handleSubmit} />
      )}
      {stage === "feedback" && feedback && (
        <FeedbackView feedback={feedback} onRestart={handleRestart} />
      )}
    </div>
  );
}

export default function InterviewPrepPage() {
  return (
    <PrivatePageGuard>
      <InterviewPrepContent />
    </PrivatePageGuard>
  );
}
