import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

import { HiringInvite, InviteStatus } from './entities/hiring-invite.entity';
import { Signature, DocType, SignatureStatus } from './entities/signature.entity';
import { PaymentDocument, PaymentDocType } from './entities/payment-document.entity';
import { Training } from './entities/training.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { BulkInvitationDto, BulkUploadResult } from './dto/bulk-invitation.dto';
import { SignatureDto, PaymentUploadDto, TrainingDto, CreateCredentialsDto } from './dto/onboarding.dto';
import { AuditLogService } from '../common/services/audit-log.service';
import { AuditEventType } from '../common/entities/audit-log.entity';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class HiringService {
  private readonly logger = new Logger(HiringService.name);

  constructor(
    @InjectRepository(HiringInvite)
    private readonly hiringInviteRepository: Repository<HiringInvite>,
    @InjectRepository(Signature)
    private readonly signatureRepository: Repository<Signature>,
    @InjectRepository(PaymentDocument)
    private readonly paymentDocumentRepository: Repository<PaymentDocument>,
    @InjectRepository(Training)
    private readonly trainingRepository: Repository<Training>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
    private readonly emailService: EmailService,
  ) {}

  async createInvitation(createInvitationDto: CreateInvitationDto, managerId: number): Promise<HiringInvite> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: createInvitationDto.email }
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Check if there's already a pending invitation
      const existingInvite = await this.hiringInviteRepository.findOne({
        where: { 
          email: createInvitationDto.email,
          status: InviteStatus.SENT
        }
      });

      if (existingInvite && !existingInvite.is_expired) {
        throw new ConflictException('An active invitation already exists for this email');
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation
      const invitation = this.hiringInviteRepository.create({
        first_name: createInvitationDto.firstName,
        last_name: createInvitationDto.lastName,
        email: createInvitationDto.email,
        role_for_hire: createInvitationDto.roleForHire || 'AGENT',
        token_hash: tokenHash,
        expires_at: expiresAt,
        manager_id: managerId,
        status: InviteStatus.SENT,
      });

      const savedInvitation = await this.hiringInviteRepository.save(invitation);

      // Send email
      await this.sendInvitationEmail(savedInvitation, token);

      // Log audit event
      await this.auditLogService.logEvent(
        AuditEventType.INVITE_CREATED,
        managerId,
        null,
        {
          invite_id: savedInvitation.id,
          email: savedInvitation.email,
          role_for_hire: savedInvitation.role_for_hire,
        },
        null,
        null,
        'HiringInvite',
        null,
      );

      this.logger.log(`Invitation created for ${savedInvitation.email} by manager ${managerId}`);

      return savedInvitation;
    } catch (error) {
      this.logger.error(`Error creating invitation for ${createInvitationDto.email}`, error);
      throw error;
    }
  }

  async resendInvitation(inviteId: string, managerId: number): Promise<HiringInvite> {
    try {
      const invitation = await this.hiringInviteRepository.findOne({
        where: { id: inviteId }
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      if (invitation.is_expired) {
        throw new BadRequestException('Cannot resend expired invitation');
      }

      if (invitation.is_consumed) {
        throw new BadRequestException('Cannot resend consumed invitation');
      }

      // Generate new token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // Update invitation
      invitation.token_hash = tokenHash;
      invitation.status = InviteStatus.SENT;
      invitation.updated_at = new Date();

      const updatedInvitation = await this.hiringInviteRepository.save(invitation);

      // Send email
      await this.sendInvitationEmail(updatedInvitation, token);

      // Log audit event
      await this.auditLogService.logEvent(
        AuditEventType.INVITE_RESENT,
        managerId,
        null,
        {
          invite_id: updatedInvitation.id,
          email: updatedInvitation.email,
        },
        null,
        null,
        'HiringInvite',
        null,
      );

      this.logger.log(`Invitation resent for ${updatedInvitation.email} by manager ${managerId}`);

      return updatedInvitation;
    } catch (error) {
      this.logger.error(`Error resending invitation ${inviteId}`, error);
      throw error;
    }
  }

  async revokeInvitation(inviteId: string, managerId: number): Promise<HiringInvite> {
    try {
      const invitation = await this.hiringInviteRepository.findOne({
        where: { id: inviteId }
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      if (invitation.is_consumed) {
        throw new BadRequestException('Cannot revoke consumed invitation');
      }

      // Update invitation
      invitation.status = InviteStatus.REVOKED;
      invitation.updated_at = new Date();

      const updatedInvitation = await this.hiringInviteRepository.save(invitation);

      // Log audit event
      await this.auditLogService.logEvent(
        AuditEventType.INVITE_REVOKED,
        managerId,
        null,
        {
          invite_id: updatedInvitation.id,
          email: updatedInvitation.email,
        },
        null,
        null,
        'HiringInvite',
        null,
      );

      this.logger.log(`Invitation revoked for ${updatedInvitation.email} by manager ${managerId}`);

      return updatedInvitation;
    } catch (error) {
      this.logger.error(`Error revoking invitation ${inviteId}`, error);
      throw error;
    }
  }

  async getInvitations(managerId: number): Promise<HiringInvite[]> {
    try {
      const invitations = await this.hiringInviteRepository.find({
        where: { manager_id: managerId },
        order: { created_at: 'DESC' },
        relations: ['manager'],
      });

      return invitations;
    } catch (error) {
      this.logger.error(`Error fetching invitations for manager ${managerId}`, error);
      throw error;
    }
  }

  async validateInviteToken(token: string): Promise<HiringInvite> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      const invitation = await this.hiringInviteRepository.findOne({
        where: { token_hash: tokenHash }
      });

      if (!invitation) {
        throw new NotFoundException('Invalid invitation token');
      }

      if (invitation.is_expired) {
        throw new BadRequestException('Invitation has expired');
      }

      if (invitation.is_consumed) {
        throw new BadRequestException('Invitation has already been used');
      }

      if (invitation.status === InviteStatus.REVOKED) {
        throw new BadRequestException('Invitation has been revoked');
      }

      // Mark as opened if not already
      if (!invitation.opened_at) {
        invitation.opened_at = new Date();
        invitation.status = InviteStatus.OPENED;
        await this.hiringInviteRepository.save(invitation);
      }

      return invitation;
    } catch (error) {
      this.logger.error(`Error validating invite token`, error);
      throw error;
    }
  }

  async submitSignature(inviteId: string, signatureDto: SignatureDto): Promise<Signature> {
    try {
      const invitation = await this.hiringInviteRepository.findOne({
        where: { id: inviteId }
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      // Check if user already exists (shouldn't happen at this stage)
      let user = await this.userRepository.findOne({
        where: { email: invitation.email }
      });

      if (!user) {
        // Create temporary user for onboarding
        user = this.userRepository.create({
          username: `temp_${invitation.id}`,
          email: invitation.email,
          full_name: invitation.full_name,
          role: UserRole.AGENT,
          is_active: false, // Will be activated after onboarding
          password_hash: 'temp_password', // Will be set during credential creation
        });
        user = await this.userRepository.save(user);
      }

      // Create or update signature
      let signature = await this.signatureRepository.findOne({
        where: { 
          user_id: user.id,
          doc_type: signatureDto.docType
        }
      });

      if (signature) {
        signature.envelope_id = signatureDto.envelopeId;
        signature.file_url = signatureDto.fileUrl;
        signature.status = SignatureStatus.SIGNED;
        signature.signed_at = new Date();
      } else {
        signature = this.signatureRepository.create({
          user_id: user.id,
          doc_type: signatureDto.docType,
          envelope_id: signatureDto.envelopeId,
          file_url: signatureDto.fileUrl,
          status: SignatureStatus.SIGNED,
          signed_at: new Date(),
        });
      }

      const savedSignature = await this.signatureRepository.save(signature);

      // Update invitation status
      invitation.status = InviteStatus.DOCS;
      await this.hiringInviteRepository.save(invitation);

      this.logger.log(`Signature submitted for ${signatureDto.docType} by user ${user.id}`);

      return savedSignature;
    } catch (error) {
      this.logger.error(`Error submitting signature for invite ${inviteId}`, error);
      throw error;
    }
  }

  async submitPaymentDocument(inviteId: string, paymentDto: PaymentUploadDto): Promise<PaymentDocument> {
    try {
      const invitation = await this.hiringInviteRepository.findOne({
        where: { id: inviteId }
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      const user = await this.userRepository.findOne({
        where: { email: invitation.email }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Create payment document
      const paymentDoc = this.paymentDocumentRepository.create({
        user_id: user.id,
        type: paymentDto.type,
        file_url: paymentDto.fileUrl,
        acct_last4: paymentDto.acctLast4,
      });

      const savedPaymentDoc = await this.paymentDocumentRepository.save(paymentDoc);

      // Update invitation status
      invitation.status = InviteStatus.PAYMENT;
      await this.hiringInviteRepository.save(invitation);

      this.logger.log(`Payment document submitted by user ${user.id}`);

      return savedPaymentDoc;
    } catch (error) {
      this.logger.error(`Error submitting payment document for invite ${inviteId}`, error);
      throw error;
    }
  }

  async submitTraining(inviteId: string, trainingDto: TrainingDto): Promise<Training> {
    try {
      const invitation = await this.hiringInviteRepository.findOne({
        where: { id: inviteId }
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      const user = await this.userRepository.findOne({
        where: { email: invitation.email }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if training already exists
      let training = await this.trainingRepository.findOne({
        where: { user_id: user.id }
      });

      if (training) {
        training.score = trainingDto.score;
        training.attestation = trainingDto.attestation;
        training.attested_at = new Date();
        training.ip_addr = trainingDto.ipAddr;
        training.passed_at = trainingDto.score >= 80 ? new Date() : null;
      } else {
        training = this.trainingRepository.create({
          user_id: user.id,
          score: trainingDto.score,
          attestation: trainingDto.attestation,
          attested_at: new Date(),
          ip_addr: trainingDto.ipAddr,
          passed_at: trainingDto.score >= 80 ? new Date() : null,
        });
      }

      const savedTraining = await this.trainingRepository.save(training);

      // Update invitation status
      invitation.status = InviteStatus.TRAINED;
      await this.hiringInviteRepository.save(invitation);

      this.logger.log(`Training submitted by user ${user.id} with score ${trainingDto.score}`);

      return savedTraining;
    } catch (error) {
      this.logger.error(`Error submitting training for invite ${inviteId}`, error);
      throw error;
    }
  }

  async createUserCredentials(inviteId: string, credentialsDto: CreateCredentialsDto): Promise<User> {
    try {
      const invitation = await this.hiringInviteRepository.findOne({
        where: { id: inviteId }
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      if (credentialsDto.password !== credentialsDto.confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      // Validate password strength
      if (!this.isStrongPassword(credentialsDto.password)) {
        throw new BadRequestException('Password does not meet security requirements');
      }

      // Check if username is already taken
      const existingUser = await this.userRepository.findOne({
        where: { username: credentialsDto.username }
      });

      if (existingUser) {
        throw new ConflictException('Username is already taken');
      }

      const user = await this.userRepository.findOne({
        where: { email: invitation.email }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(credentialsDto.password, 12);

      // Update user with credentials
      user.username = credentialsDto.username;
      user.password_hash = passwordHash;
      user.is_active = true;
      user.password_changed_at = new Date();

      const savedUser = await this.userRepository.save(user);

      // Mark invitation as consumed
      invitation.consumed_at = new Date();
      invitation.status = InviteStatus.ACTIVATED;
      await this.hiringInviteRepository.save(invitation);

      // Log audit event
      await this.auditLogService.logEvent(
        AuditEventType.USER_CREATED,
        null,
        null,
        {
          user_id: savedUser.id,
          username: savedUser.username,
          email: savedUser.email,
          role: savedUser.role,
          via_invitation: true,
        },
        null,
        null,
        'User',
        savedUser.id,
      );

      this.logger.log(`User credentials created for ${savedUser.email}`);

      return savedUser;
    } catch (error) {
      this.logger.error(`Error creating user credentials for invite ${inviteId}`, error);
      throw error;
    }
  }

  async getOnboardingStatus(inviteId: string): Promise<any> {
    try {
      const invitation = await this.hiringInviteRepository.findOne({
        where: { id: inviteId }
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      const user = await this.userRepository.findOne({
        where: { email: invitation.email }
      });

      if (!user) {
        return {
          step: 1,
          status: 'pending',
          completed: [],
        };
      }

      const signatures = await this.signatureRepository.find({
        where: { user_id: user.id }
      });

      const paymentDocs = await this.paymentDocumentRepository.find({
        where: { user_id: user.id }
      });

      const training = await this.trainingRepository.findOne({
        where: { user_id: user.id }
      });

      const completed = [];
      let currentStep = 1;

      // Check completed steps
      if (signatures.length > 0) {
        completed.push('signatures');
        currentStep = 2;
      }

      if (paymentDocs.length > 0) {
        completed.push('payment');
        currentStep = 3;
      }

      if (training && training.is_completed) {
        completed.push('training');
        currentStep = 4;
      }

      if (user.is_active && user.username !== `temp_${inviteId}`) {
        completed.push('credentials');
        currentStep = 5;
      }

      return {
        step: currentStep,
        status: invitation.status,
        completed,
        signatures: signatures.map(s => ({
          docType: s.doc_type,
          status: s.status,
          signedAt: s.signed_at,
        })),
        paymentDocs: paymentDocs.map(p => ({
          type: p.type,
          uploadedAt: p.uploaded_at,
        })),
        training: training ? {
          score: training.score,
          passed: training.is_passing_score,
          attested: training.attested_at !== null,
        } : null,
      };
    } catch (error) {
      this.logger.error(`Error getting onboarding status for invite ${inviteId}`, error);
      throw error;
    }
  }

  private async sendInvitationEmail(invitation: HiringInvite, token: string): Promise<void> {
    try {
      const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/onboarding/invite/${token}`;
      
      const emailData = {
        to: invitation.email,
        subject: 'New Hire Onboarding — VantagePoint',
        template: 'hiring-invitation',
        data: {
          firstName: invitation.first_name,
          inviteUrl,
        },
      };

      await this.emailService.sendEmail(emailData);
      
      this.logger.log(`Invitation email sent to ${invitation.email}`);
    } catch (error) {
      this.logger.error(`Error sending invitation email to ${invitation.email}`, error);
      throw error;
    }
  }

  async createBulkInvitations(bulkDto: BulkInvitationDto, managerId: number): Promise<BulkUploadResult> {
    const result: BulkUploadResult = {
      total: bulkDto.invitations.length,
      successful: 0,
      failed: 0,
      errors: [],
      invitations: [],
    };

    this.logger.log(`Processing bulk upload of ${bulkDto.invitations.length} invitations by manager ${managerId}`);

    // Process invitations sequentially to avoid overwhelming the email service
    for (let i = 0; i < bulkDto.invitations.length; i++) {
      const inviteDto = bulkDto.invitations[i];
      
      try {
        // Check if user already exists
        const existingUser = await this.userRepository.findOne({
          where: { email: inviteDto.email }
        });

        if (existingUser) {
          result.failed++;
          result.errors.push({
            row: i + 1,
            email: inviteDto.email,
            error: 'User with this email already exists',
          });
          result.invitations.push({
            email: inviteDto.email,
            status: 'failed',
            error: 'User already exists',
          });
          continue;
        }

        // Check if there's already a pending invitation
        const existingInvite = await this.hiringInviteRepository.findOne({
          where: { 
            email: inviteDto.email,
            status: InviteStatus.SENT
          }
        });

        if (existingInvite && !existingInvite.is_expired) {
          result.failed++;
          result.errors.push({
            row: i + 1,
            email: inviteDto.email,
            error: 'Active invitation already exists',
          });
          result.invitations.push({
            email: inviteDto.email,
            status: 'failed',
            error: 'Active invitation exists',
          });
          continue;
        }

        // Create invitation
        const invitation = await this.createInvitation(inviteDto, managerId);
        
        result.successful++;
        result.invitations.push({
          email: invitation.email,
          status: 'success',
          id: invitation.id,
        });

        // Add small delay to avoid overwhelming email service
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push({
          row: i + 1,
          email: inviteDto.email,
          error: errorMessage,
        });
        result.invitations.push({
          email: inviteDto.email,
          status: 'failed',
          error: errorMessage,
        });
        this.logger.error(`Error creating invitation for ${inviteDto.email}`, error);
      }
    }

    // Log bulk upload audit event
    await this.auditLogService.logEvent(
      AuditEventType.INVITE_CREATED,
      managerId,
      null,
      {
        bulk_upload: true,
        total: result.total,
        successful: result.successful,
        failed: result.failed,
      },
      null,
      null,
      'HiringInvite',
      null,
    );

    this.logger.log(`Bulk upload complete: ${result.successful}/${result.total} successful`);

    return result;
  }

  private isStrongPassword(password: string): boolean {
    // At least 12 characters, uppercase, lowercase, number, and symbol
    const minLength = password.length >= 12;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return minLength && hasUpper && hasLower && hasNumber && hasSymbol;
  }
}
