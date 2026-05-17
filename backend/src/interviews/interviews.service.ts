import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService, InterviewQuestion } from '../ai/ai.service';

const DAILY_LIMIT = 2;

@Injectable()
export class InterviewsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async startInterview(
    userId: string,
    type: 'HR' | 'TECHNICAL' | 'MIXED',
    target: 'GENERAL' | 'SPECIFIC',
    jobApplicationId?: string,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await this.prisma.interview.count({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    if (todayCount >= DAILY_LIMIT) {
      throw new ForbiddenException(
        `Daily limit reached (${DAILY_LIMIT} interviews per day). Come back tomorrow!`,
      );
    }

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: { skills: { include: { skill: true } } },
    });

    if (!profile) {
      throw new BadRequestException('Complete your profile first');
    }

    let jobContext: {
      company?: string;
      positionTitle?: string;
      companyType?: string;
      workMode?: string;
      requiredSkills?: string[];
      locationContext?: string;
    } = {};

    if (target === 'SPECIFIC') {
      if (!jobApplicationId) {
        throw new BadRequestException(
          'Job application is required for specific interviews',
        );
      }

      const job = await this.prisma.jobApplication.findFirst({
        where: { id: jobApplicationId, userId },
        include: { skills: { include: { skill: true } } },
      });

      if (!job) {
        throw new NotFoundException('Job application not found');
      }

      jobContext = {
        company: job.company,
        positionTitle: job.role,
        companyType: job.companyType ?? undefined,
        workMode: job.workMode ?? undefined,
        requiredSkills: job.skills.map((s) => s.skill.name),
        locationContext: job.location ?? profile.location ?? undefined,
      };
    } else {
      jobContext.locationContext = profile.location ?? undefined;
    }

    const generated = await this.aiService.generateInterview({
      type,
      experienceLevel: profile.experienceLevel,
      yearsExperience: profile.yearsExperience ?? 0,
      targetRole: profile.targetRole,
      skills: profile.skills.map((s) => s.skill.name),
      ...jobContext,
    });

    const interview = await this.prisma.interview.create({
      data: {
        userId,
        type,
        target,
        jobApplicationId: target === 'SPECIFIC' ? jobApplicationId : null,
        targetRole: profile.targetRole,
        experienceLevel: profile.experienceLevel,
        yearsExperience: profile.yearsExperience,
        locationContext: jobContext.locationContext ?? null,
        intro: generated.intro,
        questions: generated.questions as unknown as object,
        status: 'IN_PROGRESS',
      },
    });

    return {
      id: interview.id,
      intro: generated.intro,
      questions: generated.questions,
      remainingToday: DAILY_LIMIT - (todayCount + 1),
    };
  }

  async submitInterview(
    userId: string,
    interviewId: string,
    answers: { questionId: number; answer: string; skipped: boolean }[],
  ) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, userId },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    if (interview.status === 'COMPLETED') {
      throw new BadRequestException('Interview already completed');
    }

    const questions = interview.questions as unknown as InterviewQuestion[];

    const feedback = await this.aiService.generateInterviewFeedback({
      type: interview.type as 'HR' | 'TECHNICAL' | 'MIXED',
      experienceLevel: interview.experienceLevel,
      targetRole: interview.targetRole,
      questions,
      answers,
    });

    const updated = await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        answers: answers as unknown as object,
        overallScore: feedback.overallScore,
        summary: feedback.summary,
        questionFeedback: feedback.questionFeedback as unknown as object,
        strengths: feedback.strengths as unknown as object,
        improvements: feedback.improvements as unknown as object,
        nextSteps: feedback.nextSteps as unknown as object,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      overallScore: feedback.overallScore,
      summary: feedback.summary,
      questionFeedback: feedback.questionFeedback,
      strengths: feedback.strengths,
      improvements: feedback.improvements,
      nextSteps: feedback.nextSteps,
      questions,
    };
  }

  async getRemainingToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await this.prisma.interview.count({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    return {
      used: todayCount,
      remaining: Math.max(0, DAILY_LIMIT - todayCount),
      limit: DAILY_LIMIT,
    };
  }

  async getHistory(userId: string) {
    return this.prisma.interview.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      include: {
        jobApplication: {
          select: { company: true, role: true },
        },
      },
      take: 20,
    });
  }

  async getOne(userId: string, interviewId: string) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, userId },
      include: {
        jobApplication: {
          select: { company: true, role: true },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    return interview;
  }
}
