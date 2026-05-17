-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('HR', 'TECHNICAL', 'MIXED');

-- CreateEnum
CREATE TYPE "InterviewTarget" AS ENUM ('GENERAL', 'SPECIFIC');

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "InterviewType" NOT NULL,
    "target" "InterviewTarget" NOT NULL,
    "jobApplicationId" TEXT,
    "targetRole" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "yearsExperience" INTEGER,
    "locationContext" TEXT,
    "intro" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "answers" JSONB,
    "overallScore" INTEGER,
    "summary" TEXT,
    "questionFeedback" JSONB,
    "strengths" JSONB,
    "improvements" JSONB,
    "nextSteps" JSONB,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Interview_userId_createdAt_idx" ON "Interview"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_jobApplicationId_fkey" FOREIGN KEY ("jobApplicationId") REFERENCES "JobApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
