export class InsufficientBalanceError extends Error {
  constructor(message = 'Insufficient WPGG balance') {
    super(message);
    this.name = 'InsufficientBalanceError';
  }
}
