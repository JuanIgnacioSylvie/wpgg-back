export class OutOfStockError extends Error {
  constructor() {
    super('Product out of stock');
    this.name = 'OutOfStockError';
  }
}
