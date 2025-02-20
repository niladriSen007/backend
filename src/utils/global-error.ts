export class GlobalErrorResponse extends Error {
  constructor(public message: string, public statusCode: number, public error?: any) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.error = error;
  }
}