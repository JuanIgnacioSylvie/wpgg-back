export const EMAIL_PROVIDER = Symbol('IEmailProvider');

export type SendPasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

export type SendEmailVerificationInput = {
  to: string;
  verifyUrl: string;
};

export interface IEmailProvider {
  sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<void>;
  sendEmailVerification(input: SendEmailVerificationInput): Promise<void>;
}
