import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendEmail(emailData: EmailData): Promise<void> {
    try {
      // For now, we'll use a mock email service
      // In production, integrate with Resend, SES, or SendGrid
      
      if (emailData.template === 'hiring-invitation') {
        await this.sendHiringInvitationEmail(emailData);
      } else {
        throw new Error(`Unknown email template: ${emailData.template}`);
      }

      this.logger.log(`Email sent to ${emailData.to}`);
    } catch (error) {
      this.logger.error(`Error sending email to ${emailData.to}`, error);
      throw error;
    }
  }

  private async sendHiringInvitationEmail(emailData: EmailData): Promise<void> {
    const { to, data } = emailData;
    
    // In production, this would integrate with a real email service
    // For now, we'll just log the email content
    const emailContent = this.generateHiringInvitationHTML({
      firstName: data.firstName,
      inviteUrl: data.inviteUrl,
    });
    
    this.logger.log(`Sending hiring invitation email to ${to}`);
    this.logger.debug(`Email content: ${emailContent}`);
    
    // TODO: Integrate with actual email service (Resend, SES, etc.)
    // await this.emailProvider.send({
    //   to,
    //   subject: emailData.subject,
    //   html: emailContent,
    // });
  }

  private generateHiringInvitationHTML(data: { firstName: string; inviteUrl: string }): string {
    return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B1220;padding:32px 0;font-family:Inter,Arial,sans-serif;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0E1627;border:1px solid #1E293B;border-radius:16px;color:#D1D5DB;">
        <tr>
          <td style="padding:24px 28px;border-bottom:1px solid #1E293B;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="display:inline-block;width:36px;height:36px;border-radius:12px;background:#22D3EE1F;border:1px solid #22D3EE40;"></span>
              <h1 style="margin:0;font-size:18px;letter-spacing:.2px;">New Hire Onboarding — VantagePoint</h1>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 12px 0;">Hi ${data.firstName},</p>
            <p style="margin:0 0 16px 0; color:#94A3B8;">
              Congratulations on your approval. To get you onboarded, please complete your new hire paperwork.
            </p>
            <p style="margin:0 0 16px 0; color:#94A3B8;">
              This includes a Business Associate Agreement (BAA), an IRS W-9 (standard form), a quick upload of a voided check for ACH setup, brief compliance training, and creating your account credentials.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${data.inviteUrl}" style="background:#06B6D4;color:#08131f;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;display:inline-block;">
                Start Onboarding
              </a>
            </div>
            <p style="margin:0; color:#64748B;font-size:12px;">
              This secure link expires in 7 days. If you didn't expect this email, please ignore it.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px;border-top:1px solid #1E293B;color:#64748B;font-size:12px;">
            © VantagePoint • Confidential
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
    `;
  }
}
