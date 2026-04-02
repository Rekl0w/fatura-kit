export class ApiError extends Error {
  constructor(
    message: string,
    public readonly payload?: unknown,
    public readonly response?: unknown,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
