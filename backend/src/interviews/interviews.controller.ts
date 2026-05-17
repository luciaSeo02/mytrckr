import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user: { sub: string; email: string };
}

interface StartInterviewDto {
  type: 'HR' | 'TECHNICAL' | 'MIXED';
  target: 'GENERAL' | 'SPECIFIC';
  jobApplicationId?: string;
}

interface SubmitAnswersDto {
  answers: { questionId: number; answer: string; skipped: boolean }[];
}

@Controller('interviews')
@UseGuards(JwtAuthGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post('start')
  async start(@Body() dto: StartInterviewDto, @Req() req: RequestWithUser) {
    if (!dto.type || !dto.target) {
      throw new BadRequestException('Type and target are required');
    }
    return this.interviewsService.startInterview(
      req.user.sub,
      dto.type,
      dto.target,
      dto.jobApplicationId,
    );
  }

  @Post(':id/submit')
  async submit(
    @Param('id') id: string,
    @Body() dto: SubmitAnswersDto,
    @Req() req: RequestWithUser,
  ) {
    return this.interviewsService.submitInterview(
      req.user.sub,
      id,
      dto.answers,
    );
  }

  @Get('remaining')
  async getRemaining(@Req() req: RequestWithUser) {
    return this.interviewsService.getRemainingToday(req.user.sub);
  }

  @Get('history')
  async getHistory(@Req() req: RequestWithUser) {
    return this.interviewsService.getHistory(req.user.sub);
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.interviewsService.getOne(req.user.sub, id);
  }
}
