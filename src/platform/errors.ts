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

// Only fixed categories may enter review logs; never copy error text or arbitrary codes.
export function unexpectedFailureCategory(error: unknown): string {
  // Exact messages from the pinned pg-pool; return fixed labels, never the text.
  if (error instanceof Error && error.message === "timeout exceeded when trying to connect") return "DatabasePoolWaitTimeout";
  if (error instanceof Error && error.message === "Connection terminated due to connection timeout") return "DatabaseConnectTimeout";
  const code = error && typeof error === "object" && "code" in error
    ? error.code : undefined;
  switch (code) {
    case "53300": return "DatabaseConnectionCapacity";
    case "57014": return "DatabaseQueryCancelled";
    case "57P01": case "57P02": case "57P03": return "DatabaseRestartOrShutdown";
    case "40001": case "40P01": return "DatabaseTransactionConflict";
    case "ECONNREFUSED": case "ECONNRESET": case "ETIMEDOUT": return "ConnectionFailure";
    default: return "UnexpectedFailure";
  }
}
