import { formatDateTime, formatTimestamp } from "../shell/date-format";

export function FindingTime({
  value,
  timezone,
  scheduled = false,
}: {
  value?: string | null;
  timezone?: string;
  scheduled?: boolean;
}) {
  return value ? (
    <time dateTime={value}>
      {scheduled
        ? formatDateTime(value, timezone)
        : formatTimestamp(value, timezone)}
    </time>
  ) : (
    <>Unknown</>
  );
}
