import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { SubmitSponsorProposalUseCase } from '../application/use-cases/submit-sponsor-proposal.use-case';
import { SubmitSupportRequestUseCase } from '../application/use-cases/submit-support-request.use-case';
import { SponsorProposalRequestDto } from './dto/sponsor-proposal-request.dto';
import { SupportRequestRequestDto } from './dto/support-request-request.dto';

function clientPlatformFromHeaders(
  platformHeader?: string,
): string | undefined {
  const p = platformHeader?.trim().toLowerCase();
  return p === 'web' || p === 'mobile' ? p : undefined;
}

function remoteIpFromRequest(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim();
  }
  return req.socket.remoteAddress ?? undefined;
}

@Controller('contact')
export class ContactController {
  constructor(
    private readonly submitSponsorProposal: SubmitSponsorProposalUseCase,
    private readonly submitSupportRequest: SubmitSupportRequestUseCase,
  ) {}

  @Post('sponsor')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async sponsor(
    @Body() body: SponsorProposalRequestDto,
    @Headers('x-wpgg-platform') platformHeader: string | undefined,
    @Req() req: Request,
  ): Promise<void> {
    await this.submitSponsorProposal.execute({
      companyName: body.companyName,
      contactEmail: body.contactEmail,
      message: body.message,
      turnstileToken: body.turnstileToken,
      clientPlatform: clientPlatformFromHeaders(platformHeader),
      remoteIp: remoteIpFromRequest(req),
    });
  }

  @Post('support')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async support(
    @Body() body: SupportRequestRequestDto,
    @Headers('x-wpgg-platform') platformHeader: string | undefined,
    @Req() req: Request,
  ): Promise<void> {
    await this.submitSupportRequest.execute({
      contactEmail: body.contactEmail,
      subject: body.subject,
      message: body.message,
      turnstileToken: body.turnstileToken,
      clientPlatform: clientPlatformFromHeaders(platformHeader),
      remoteIp: remoteIpFromRequest(req),
    });
  }
}
