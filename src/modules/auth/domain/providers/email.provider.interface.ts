export const EMAIL_PROVIDER = Symbol('IEmailProvider');

export type SendPasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

export type SendEmailVerificationInput = {
  to: string;
  verifyUrl: string;
};

export type SendStorePurchaseEmailInput = {
  to: string;
  productName: string;
  rpAmount: number;
  riotKey: string;
};

export type SendSponsorProposalEmailInput = {
  to: string;
  companyName: string;
  contactEmail: string;
  message: string;
};

export interface IEmailProvider {
  sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<void>;
  sendEmailVerification(input: SendEmailVerificationInput): Promise<void>;
  sendStorePurchaseEmail(input: SendStorePurchaseEmailInput): Promise<void>;
  sendSponsorProposalEmail(input: SendSponsorProposalEmailInput): Promise<void>;
}
