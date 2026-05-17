import { Injectable, Logger } from '@nestjs/common';

export interface ParsedJobListing {
  company: string;
  role: string;
  location: string | null;
  workMode: 'REMOTE' | 'HYBRID' | 'ONSITE' | null;
  companyType:
    | 'STARTUP'
    | 'SCALEUP'
    | 'CORPORATE'
    | 'CONSULTORA'
    | 'AGENCY'
    | null;
  salaryMin: number | null;
  salaryMax: number | null;
  skills: string[];
  source:
    | 'LINKEDIN'
    | 'INDEED'
    | 'INFOJOBS'
    | 'GLASSDOOR'
    | 'COMPANY_WEBSITE'
    | 'JOB_BOARD'
    | 'RECRUITER'
    | 'OTHER';
}

export interface CvAnalysis {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  skillsDetected: string[];
  skillGaps: string[];
  summary: string;
}

export interface InterviewQuestion {
  id: number;
  text: string;
  topic: string;
}

export interface GeneratedInterview {
  intro: string;
  questions: InterviewQuestion[];
}

export interface QuestionFeedback {
  questionId: number;
  score: number;
  feedback: string;
  modelAnswer?: string;
}

export interface InterviewFeedback {
  overallScore: number;
  summary: string;
  questionFeedback: QuestionFeedback[];
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY ?? '';
  private readonly apiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  private async generate(prompt: string): Promise<string> {
    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const error: unknown = await response.json();
      this.logger.error(`Gemini API error: ${JSON.stringify(error)}`);
      throw new Error('AI service unavailable');
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  async parseJobListing(url: string): Promise<ParsedJobListing> {
    let pageContent: string;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      pageContent = await response.text();
    } catch {
      throw new Error('Could not fetch the job listing URL');
    }

    const textContent = pageContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);

    const prompt = `Analyze this job listing and extract the following information. Respond ONLY with a valid JSON object, no markdown, no backticks, no explanation.

{
  "company": "company name",
  "role": "job title",
  "location": "city, country or null",
  "workMode": "REMOTE" or "HYBRID" or "ONSITE" or null,
  "companyType": "STARTUP" or "SCALEUP" or "CORPORATE" or "CONSULTORA" or "AGENCY" or null,
  "salaryMin": number or null (annual, in local currency),
  "salaryMax": number or null (annual, in local currency),
  "skills": ["skill1", "skill2", ...] (technical skills only, e.g. React, Python, AWS),
  "source": detect from URL - "LINKEDIN" if linkedin.com, "INDEED" if indeed.com, "INFOJOBS" if infojobs.net, "GLASSDOOR" if glassdoor.com, "COMPANY_WEBSITE" if company career page, "JOB_BOARD" for other job boards, "OTHER" if unknown
}

URL: ${url}

Job listing content:
${textContent}`;

    const result = await this.generate(prompt);

    try {
      const cleaned = result.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned) as ParsedJobListing;

      return {
        company: parsed.company || 'Unknown',
        role: parsed.role || 'Unknown',
        location: parsed.location || null,
        workMode: ['REMOTE', 'HYBRID', 'ONSITE'].includes(
          parsed.workMode as string,
        )
          ? parsed.workMode
          : null,
        companyType: [
          'STARTUP',
          'SCALEUP',
          'CORPORATE',
          'CONSULTORA',
          'AGENCY',
        ].includes(parsed.companyType as string)
          ? parsed.companyType
          : null,
        salaryMin:
          typeof parsed.salaryMin === 'number' ? parsed.salaryMin : null,
        salaryMax:
          typeof parsed.salaryMax === 'number' ? parsed.salaryMax : null,
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        source: [
          'LINKEDIN',
          'INDEED',
          'INFOJOBS',
          'GLASSDOOR',
          'COMPANY_WEBSITE',
          'JOB_BOARD',
          'RECRUITER',
          'OTHER',
        ].includes(parsed.source)
          ? parsed.source
          : 'OTHER',
      };
    } catch {
      this.logger.error(`Failed to parse AI response: ${result}`);
      throw new Error('Could not parse the job listing');
    }
  }

  async analyzeCv(
    cvText: string,
    targetRole: string,
    userSkills: string[],
    experienceLevel: string,
    yearsExperience: number,
  ): Promise<CvAnalysis> {
    const levelContext = this.getLevelContext(experienceLevel, yearsExperience);

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });

    const prompt = `You are a senior tech recruiter analyzing a CV for a ${experienceLevel} candidate targeting: "${targetRole}".

    Today's date is ${currentDate}. Any dates in the CV up to this date are valid and not "future dates".


${levelContext}

Their current skills are: ${userSkills.join(', ') || 'none specified'}.

IMPORTANT: 
- Do NOT use markdown formatting (no asterisks, no underscores, no bold, no italic). Use plain text only.
- Calibrate your feedback to their experience level.
- Don't penalize junior candidates for lack of professional experience — that's expected.
- Focus on what's actionable for someone at their level.

Analyze the CV below and respond ONLY with a valid JSON object, no markdown, no backticks, no explanation:

{
  "overallScore": number from 0 to 100 (judge against expectations for ${experienceLevel} level, not senior),
  "strengths": ["strength1", "strength2", ...] (3-5 specific strengths relevant for ${experienceLevel}),
  "weaknesses": ["weakness1", "weakness2", ...] (2-4 areas to improve, NOT including 'lack of experience' if junior),
  "suggestions": ["suggestion1", "suggestion2", ...] (3-5 actionable improvements appropriate for ${experienceLevel}),
  "skillsDetected": ["skill1", "skill2", ...] (technical skills found in the CV),
  "skillGaps": ["skill1", "skill2", ...] (important skills for ${targetRole} at ${experienceLevel} level that are missing),
  "summary": "2-3 sentence professional summary of the candidate's fit for ${targetRole} at ${experienceLevel} level"
}

CV content:
${cvText}`;

    const result = await this.generate(prompt);

    try {
      const cleaned = result.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned) as CvAnalysis;

      return {
        overallScore:
          typeof parsed.overallScore === 'number' ? parsed.overallScore : 0,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions
          : [],
        skillsDetected: Array.isArray(parsed.skillsDetected)
          ? parsed.skillsDetected
          : [],
        skillGaps: Array.isArray(parsed.skillGaps) ? parsed.skillGaps : [],
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      };
    } catch {
      this.logger.error(`Failed to parse CV analysis: ${result}`);
      throw new Error('Could not analyze the CV');
    }
  }
  private getLevelContext(level: string, years: number): string {
    const contexts: Record<string, string> = {
      JUNIOR: `This is an entry-level/junior candidate with ${years} years of professional experience. Focus feedback on portfolio quality, project diversity, fundamentals, and learning trajectory. Personal projects, bootcamp work, and contributions count as valid experience.`,
      MID: `This is a mid-level candidate with ${years} years of experience. Expect solid project ownership, some leadership exposure, and technical depth.`,
      SENIOR: `This is a senior candidate with ${years} years of experience. Expect technical leadership, architecture decisions, mentoring, and significant project impact.`,
      LEAD: `This is a lead-level candidate with ${years} years of experience. Expect strategic thinking, team management, technical vision, and business impact.`,
    };
    return contexts[level] || contexts.MID;
  }
  async generateInterview(params: {
    type: 'HR' | 'TECHNICAL' | 'MIXED';
    experienceLevel: string;
    yearsExperience: number;
    targetRole: string;
    skills: string[];
    locationContext?: string;
    company?: string;
    companyType?: string;
    positionTitle?: string;
    requiredSkills?: string[];
    workMode?: string;
  }): Promise<GeneratedInterview> {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });

    const specificContext = params.company
      ? `\nThis is a SPECIFIC interview for:
- Company: ${params.company}
- Position: ${params.positionTitle ?? params.targetRole}
- Company type: ${params.companyType ?? 'unknown'}
- Required skills: ${params.requiredSkills?.join(', ') ?? 'not specified'}
- Work mode: ${params.workMode ?? 'unknown'}`
      : `\nThis is a GENERAL interview based on the candidate's profile (no specific company).`;

    const typeInstructions: Record<string, string> = {
      HR: 'Focus on HR/Behavioral questions: motivational, situational (STAR format), cultural fit, soft skills, salary expectations, career goals.',
      TECHNICAL:
        'Focus on Technical questions: conceptual knowledge, decision-making, experience with technologies, architectural thinking. NO live coding.',
      MIXED:
        'Mix 2-3 HR/Behavioral questions with 2-3 Technical questions. This is typical of smaller companies.',
    };

    const levelInstructions: Record<string, string> = {
      JUNIOR:
        'Junior level: focus on fundamentals, learning trajectory, motivation, basic technical understanding. Be encouraging and approachable.',
      MID: 'Mid level: focus on project ownership, real-world tradeoffs, technical depth, problem-solving experience.',
      SENIOR:
        'Senior level: focus on architecture decisions, technical leadership, complex situations, mentoring experience.',
      LEAD: 'Lead level: focus on strategy, team management, business impact, technical vision.',
    };

    const prompt = `You are an experienced interviewer conducting a tech interview.

Today's date is ${currentDate}.

Context:
- Candidate level: ${params.experienceLevel} (${params.yearsExperience} years of experience)
- Target role: ${params.targetRole}
- Candidate skills: ${params.skills.join(', ') || 'not specified'}
- Interview type: ${params.type}
- Location context: ${params.locationContext ?? 'International'}
${specificContext}

${typeInstructions[params.type]}

${levelInstructions[params.experienceLevel] ?? levelInstructions.MID}

IMPORTANT:
- Do NOT use markdown formatting (no asterisks, no underscores, no bold, no italic). Use plain text only.
- Generate exactly 5 questions calibrated for the candidate's level
- Detect the language from the candidate's profile context and ask questions in that language (Spanish if Spanish context, English otherwise)
- Make the intro feel natural and welcoming
- Each question should have a clear "topic" tag (e.g. "motivation", "react", "teamwork", "architecture")

Respond ONLY with a valid JSON object, no markdown:
{
  "intro": "Brief welcoming intro from the interviewer in 2-3 sentences, addressing the candidate by their target role",
  "questions": [
    {"id": 1, "text": "Question text", "topic": "topic tag"},
    {"id": 2, "text": "...", "topic": "..."},
    {"id": 3, "text": "...", "topic": "..."},
    {"id": 4, "text": "...", "topic": "..."},
    {"id": 5, "text": "...", "topic": "..."}
  ]
}`;

    const result = await this.generate(prompt);

    try {
      const cleaned = result.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned) as GeneratedInterview;

      return {
        intro: typeof parsed.intro === 'string' ? parsed.intro : '',
        questions: Array.isArray(parsed.questions)
          ? parsed.questions.slice(0, 5).map((q, i) => ({
              id: typeof q.id === 'number' ? q.id : i + 1,
              text: typeof q.text === 'string' ? q.text : '',
              topic: typeof q.topic === 'string' ? q.topic : 'general',
            }))
          : [],
      };
    } catch {
      this.logger.error(`Failed to parse interview: ${result}`);
      throw new Error('Could not generate interview questions');
    }
  }

  async generateInterviewFeedback(params: {
    type: 'HR' | 'TECHNICAL' | 'MIXED';
    experienceLevel: string;
    targetRole: string;
    questions: InterviewQuestion[];
    answers: { questionId: number; answer: string; skipped: boolean }[];
  }): Promise<InterviewFeedback> {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });

    const qaPairs = params.questions
      .map((q) => {
        const answer = params.answers.find((a) => a.questionId === q.id);
        const answerText = answer?.skipped
          ? '[SKIPPED — Candidate did not know how to answer]'
          : (answer?.answer ?? '[NO ANSWER]');
        return `Q${q.id}: ${q.text}\nA${q.id}: ${answerText}`;
      })
      .join('\n\n');

    const prompt = `You are an experienced interviewer giving feedback after a ${params.type} interview.

Today's date is ${currentDate}.

Context:
- Candidate level: ${params.experienceLevel}
- Target role: ${params.targetRole}
- Interview type: ${params.type}

IMPORTANT:
- Do NOT use markdown formatting (no asterisks, no underscores, no bold, no italic). Use plain text only.
- Calibrate feedback to ${params.experienceLevel} level — don't expect senior depth from junior
- Be constructive and encouraging, not devastating
- For SKIPPED questions, provide a model answer showing how it could have been answered
- Detect the language from the answers and respond in the same language
- Be specific in feedback, not generic

Questions and answers:
${qaPairs}

Respond ONLY with a valid JSON object, no markdown:
{
  "overallScore": number 0-100 (calibrated to ${params.experienceLevel} expectations),
  "summary": "2-3 sentence overall assessment",
  "questionFeedback": [
    {
      "questionId": 1,
      "score": 0-100,
      "feedback": "Specific feedback: what was good, what to improve",
      "modelAnswer": "ONLY include this field if the question was SKIPPED — a good answer they could have given"
    }
  ],
  "strengths": ["3-4 specific strengths from the answers"],
  "improvements": ["3-4 specific areas to improve"],
  "nextSteps": ["3-4 actionable next steps to prepare better"]
}`;

    const result = await this.generate(prompt);

    try {
      const cleaned = result.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned) as InterviewFeedback;

      return {
        overallScore:
          typeof parsed.overallScore === 'number' ? parsed.overallScore : 0,
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        questionFeedback: Array.isArray(parsed.questionFeedback)
          ? parsed.questionFeedback
          : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        improvements: Array.isArray(parsed.improvements)
          ? parsed.improvements
          : [],
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      };
    } catch {
      this.logger.error(`Failed to parse interview feedback: ${result}`);
      throw new Error('Could not generate interview feedback');
    }
  }
}
