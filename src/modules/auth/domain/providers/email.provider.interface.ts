export const EMAIL_PROVIDER = Symbol('IEmailProvider');

export type SendPasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

export interface IEmailProvider {
  sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<void>;
}
