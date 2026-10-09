export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = 'INTERNAL_ERROR',
  ) {
    super(message);
    this.name = 'ApiError';
  }
}