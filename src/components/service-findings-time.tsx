import {
  formatDate,
  formatDateTime,
  formatTimestamp,
} from "../shell/date-format";

export function FindingTime({
  value,
  timezone,
  scheduled = false,
  dateOnly = false,
}: {
  value?: string | null;
  timezone?: string;
  scheduled?: boolean;
  dateOnly?: boolean;
}) {
  return value ? (
    <time
      dateTime={value}
      title={scheduled ? formatDateTime(value, timezone) : undefined}
    >
      {dateOnly
        ? formatDate(value, timezone)
        : scheduled
          ? formatDateTime(value, timezone)
          : formatTimestamp(value, timezone)}
    </time>
  ) : (
    <>Unknown</>
  );
}
