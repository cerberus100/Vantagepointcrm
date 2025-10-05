import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { HiringService } from './hiring.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { BulkInvitationDto, BulkUploadResult } from './dto/bulk-invitation.dto';
import { SignatureDto, PaymentUploadDto, TrainingDto, CreateCredentialsDto } from './dto/onboarding.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { HiringInvite } from './entities/hiring-invite.entity';
import { Signature } from './entities/signature.entity';
import { PaymentDocument } from './entities/payment-document.entity';
import { Training } from './entities/training.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('Hiring')
@Controller('hiring')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class HiringController {
  constructor(private readonly hiringService: HiringService) {}

  @Post('invitations')
  @Roles(UserRole.HIRING_TEAM, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Create a new hiring invitation',
    description: 'Send an invitation to a new hire to complete onboarding'
  })
  @ApiResponse({
    status: 201,
    description: 'Invitation created successfully',
    type: HiringInvite,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - user already exists or invitation already sent',
  })
  async createInvitation(
    @Body() createInvitationDto: CreateInvitationDto,
    @Request() req: any,
  ): Promise<HiringInvite> {
    return this.hiringService.createInvitation(createInvitationDto, req.user.id);
  }

  @Get('invitations')
  @Roles(UserRole.HIRING_TEAM, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get all hiring invitations',
    description: 'Retrieve all invitations sent by the current user'
  })
  @ApiResponse({
    status: 200,
    description: 'Invitations retrieved successfully',
    type: [HiringInvite],
  })
  async getInvitations(@Request() req: any): Promise<HiringInvite[]> {
    return this.hiringService.getInvitations(req.user.id);
  }

  @Post('invitations/:id/resend')
  @Roles(UserRole.HIRING_TEAM, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Resend an invitation',
    description: 'Resend an invitation email to the invitee'
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation resent successfully',
    type: HiringInvite,
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invitation expired or consumed',
  })
  async resendInvitation(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<HiringInvite> {
    return this.hiringService.resendInvitation(id, req.user.id);
  }

  @Post('invitations/:id/revoke')
  @Roles(UserRole.HIRING_TEAM, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Revoke an invitation',
    description: 'Revoke an active invitation'
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation revoked successfully',
    type: HiringInvite,
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invitation already consumed',
  })
  async revokeInvitation(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<HiringInvite> {
    return this.hiringService.revokeInvitation(id, req.user.id);
  }

  @Post('invitations/bulk')
  @Roles(UserRole.HIRING_TEAM, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Create bulk invitations',
    description: 'Send invitations to multiple new hires from CSV/Excel upload'
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk invitations processed',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        successful: { type: 'number' },
        failed: { type: 'number' },
        errors: { type: 'array' },
        invitations: { type: 'array' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  async createBulkInvitations(
    @Body() bulkDto: BulkInvitationDto,
    @Request() req: any,
  ): Promise<BulkUploadResult> {
    return this.hiringService.createBulkInvitations(bulkDto, req.user.id);
  }
}

@ApiTags('Onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly hiringService: HiringService) {}

  @Get('invite/:token')
  @ApiOperation({ 
    summary: 'Validate invitation token',
    description: 'Validate an invitation token and return onboarding status'
  })
  @ApiResponse({
    status: 200,
    description: 'Token validated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid, expired, or consumed token',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found',
  })
  async validateInviteToken(@Param('token') token: string): Promise<any> {
    const invitation = await this.hiringService.validateInviteToken(token);
    const status = await this.hiringService.getOnboardingStatus(invitation.id);
    
    return {
      invitation: {
        id: invitation.id,
        firstName: invitation.first_name,
        lastName: invitation.last_name,
        email: invitation.email,
        roleForHire: invitation.role_for_hire,
        expiresAt: invitation.expires_at,
      },
      status,
    };
  }

  @Post('signature')
  @ApiOperation({ 
    summary: 'Submit document signature',
    description: 'Submit a signed document (W-9 or BAA)'
  })
  @ApiResponse({
    status: 201,
    description: 'Signature submitted successfully',
    type: Signature,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found',
  })
  async submitSignature(
    @Body() signatureDto: SignatureDto & { inviteId: string },
  ): Promise<Signature> {
    return this.hiringService.submitSignature(signatureDto.inviteId, signatureDto);
  }

  @Post('payment')
  @ApiOperation({ 
    summary: 'Submit payment document',
    description: 'Submit a payment document (voided check)'
  })
  @ApiResponse({
    status: 201,
    description: 'Payment document submitted successfully',
    type: PaymentDocument,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found',
  })
  async submitPaymentDocument(
    @Body() paymentDto: PaymentUploadDto & { inviteId: string },
  ): Promise<PaymentDocument> {
    return this.hiringService.submitPaymentDocument(paymentDto.inviteId, paymentDto);
  }

  @Post('training')
  @ApiOperation({ 
    summary: 'Submit training completion',
    description: 'Submit training quiz results and attestation'
  })
  @ApiResponse({
    status: 201,
    description: 'Training submitted successfully',
    type: Training,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found',
  })
  async submitTraining(
    @Body() trainingDto: TrainingDto & { inviteId: string },
  ): Promise<Training> {
    return this.hiringService.submitTraining(trainingDto.inviteId, trainingDto);
  }

  @Post('register')
  @ApiOperation({ 
    summary: 'Create user credentials',
    description: 'Create user account credentials to complete onboarding'
  })
  @ApiResponse({
    status: 201,
    description: 'User credentials created successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or passwords do not match',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - username already taken',
  })
  async createUserCredentials(
    @Body() credentialsDto: CreateCredentialsDto & { inviteId: string },
  ): Promise<User> {
    return this.hiringService.createUserCredentials(credentialsDto.inviteId, credentialsDto);
  }
}
