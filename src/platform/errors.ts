export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public field_errors: { field: string; message: string }[] = [],
  ) {
    super(message);
  }
}
export const unavailable = () =>
  new AppError(404, "RecordUnavailable", "This record is unavailable.");
