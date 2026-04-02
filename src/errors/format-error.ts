export class FormatError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = "FormatError";
  }
}
