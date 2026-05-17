import {
  User,
  CompleteProfile,
  UserProfile,
  PartialUser,
  PartialUserProfile,
  Skill,
  UserProfileSkill,
  AddSkillPayload,
  UpdateSkillPayload,
  JobApplicationStats,
  JobApplication,
  UpdateJobApplicationPayload,
  CreateJobApplicationPayload,
  SkillGap,
  SkillDemand,
  MarketOverview,
  RecommendationsResult,
  WorkMode,
  CompanyType,
  ApplicationSource,
} from "@/types/user";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type ApiErrorResponse = { message: string };

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err: ApiErrorResponse = await res
      .json()
      .catch(() => ({ message: "API Error" }));
    throw new Error(err.message || "API Error");
  }
  const text = await res.text();
  if (!text) return null as T;

  return JSON.parse(text) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { credentials: "include" });
  return handleResponse<T>(res);
}

export async function apiPost<T, B>(path: string, body: B): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiPatch<T, B>(path: string, body: B): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse<T>(res);
}

export async function apiGetUser(): Promise<User> {
  return apiGet<User>("/users/me");
}

export async function apiUpdateUser(body: PartialUser): Promise<User> {
  return apiPatch<User, PartialUser>("/users/me", body);
}

export async function apiDeleteAccount(): Promise<{ message: string }> {
  return apiDelete<{ message: string }>("/users/me");
}

type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export async function apiChangePassword(
  body: ChangePasswordPayload,
): Promise<{ message: string }> {
  return apiPatch<{ message: string }, ChangePasswordPayload>(
    "/users/change-password",
    body,
  );
}

export async function apiGetProfile(): Promise<UserProfile | undefined> {
  const profile = await apiGet<UserProfile | null>("/profile");
  return profile ?? undefined;
}

export async function apiCreateProfile(
  body: Omit<UserProfile, "id" | "userId" | "createdAt" | "updatedAt">,
): Promise<UserProfile> {
  return apiPost<UserProfile, typeof body>("/profile", body);
}

export async function apiUpdateProfile(
  body: PartialUserProfile,
): Promise<UserProfile> {
  return apiPatch<UserProfile, PartialUserProfile>("/profile", body);
}

export async function apiGetCompleteProfile(): Promise<CompleteProfile> {
  const user = await apiGetUser();
  const profile = await apiGetProfile().catch(() => undefined);
  return { ...user, profile };
}

export async function apiGetSkills(): Promise<Skill[]> {
  return apiGet<Skill[]>("/skills");
}

export async function apiAddProfileSkill(
  body: AddSkillPayload,
): Promise<UserProfileSkill> {
  return apiPost<UserProfileSkill, AddSkillPayload>("/profile/skills", body);
}

export async function apiUpdateProfileSkill(
  skillId: string,
  body: UpdateSkillPayload,
): Promise<UserProfileSkill> {
  return apiPatch<UserProfileSkill, UpdateSkillPayload>(
    `/profile/skills/${skillId}`,
    body,
  );
}

export async function apiRemoveProfileSkill(
  skillId: string,
): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/profile/skills/${skillId}`);
}

export async function apiGetJobApplications(): Promise<JobApplication[]> {
  return apiGet<JobApplication[]>("/job-applications");
}

export async function apiGetJobApplication(
  id: string,
): Promise<JobApplication> {
  return apiGet<JobApplication>(`/job-applications/${id}`);
}

export async function apiCreateJobApplication(
  body: CreateJobApplicationPayload,
): Promise<JobApplication> {
  return apiPost<JobApplication, CreateJobApplicationPayload>(
    "/job-applications",
    body,
  );
}

export async function apiUpdateJobApplication(
  id: string,
  body: UpdateJobApplicationPayload,
): Promise<JobApplication> {
  return apiPatch<JobApplication, UpdateJobApplicationPayload>(
    `/job-applications/${id}`,
    body,
  );
}

export async function apiDeleteJobApplication(
  id: string,
): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/job-applications/${id}`);
}

export async function apiGetJobApplicationStats(): Promise<JobApplicationStats> {
  return apiGet<JobApplicationStats>("/job-applications/stats");
}

export async function apiGetMarketOverview(
  region?: string,
): Promise<MarketOverview> {
  const params = region ? `?region=${encodeURIComponent(region)}` : "";
  return apiGet<MarketOverview>(`/market-insights${params}`);
}

export async function apiGetTopSkills(
  region?: string,
  limit?: number,
): Promise<SkillDemand[]> {
  const params = new URLSearchParams();
  if (region) params.set("region", region);
  if (limit) params.set("limit", limit.toString());
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiGet<SkillDemand[]>(`/market-insights/top-skills${query}`);
}

export async function apiGetMarketRegions(): Promise<string[]> {
  return apiGet<string[]>("/market-insights/regions");
}

export async function apiGetSkillGap(): Promise<SkillGap | null> {
  return apiGet<SkillGap | null>("/market-insights/skill-gap");
}

export async function apiGetRecommendations(): Promise<RecommendationsResult | null> {
  return apiGet<RecommendationsResult | null>("/recommendations");
}

export type ParsedJob = {
  company: string;
  role: string;
  location: string | null;
  workMode: WorkMode | null;
  companyType: CompanyType | null;
  salaryMin: number | null;
  salaryMax: number | null;
  skills: string[];
  source: ApplicationSource;
};

export async function apiParseJobListing(url: string): Promise<ParsedJob> {
  return apiPost<ParsedJob, { url: string }>("/ai/parse-job", { url });
}

export type CvAnalysis = {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  skillsDetected: string[];
  skillGaps: string[];
  summary: string;
};

export async function apiAnalyzeCv(file: File): Promise<CvAnalysis> {
  const formData = new FormData();
  formData.append("cv", file);

  const res = await fetch(`${BASE_URL}/ai/analyze-cv`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleResponse<CvAnalysis>(res);
}

export type InterviewQuestion = {
  id: number;
  text: string;
  topic: string;
};

export type StartInterviewResponse = {
  id: string;
  intro: string;
  questions: InterviewQuestion[];
  remainingToday: number;
};

export type QuestionFeedback = {
  questionId: number;
  score: number;
  feedback: string;
  modelAnswer?: string;
};

export type InterviewFeedback = {
  id: string;
  overallScore: number;
  summary: string;
  questionFeedback: QuestionFeedback[];
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
  questions: InterviewQuestion[];
};

export type RemainingInterviews = {
  used: number;
  remaining: number;
  limit: number;
};

export type InterviewAnswer = {
  questionId: number;
  answer: string;
  skipped: boolean;
};

export async function apiStartInterview(payload: {
  type: "HR" | "TECHNICAL" | "MIXED";
  target: "GENERAL" | "SPECIFIC";
  jobApplicationId?: string;
}): Promise<StartInterviewResponse> {
  return apiPost<StartInterviewResponse, typeof payload>(
    "/interviews/start",
    payload,
  );
}

export async function apiSubmitInterview(
  id: string,
  answers: InterviewAnswer[],
): Promise<InterviewFeedback> {
  return apiPost<InterviewFeedback, { answers: InterviewAnswer[] }>(
    `/interviews/${id}/submit`,
    { answers },
  );
}

export async function apiGetRemainingInterviews(): Promise<RemainingInterviews> {
  return apiGet<RemainingInterviews>("/interviews/remaining");
}
