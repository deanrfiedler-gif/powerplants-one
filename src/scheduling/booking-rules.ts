// Read-only rules shared by ordinary booking and controlled policy evaluation.
import type { QueryClient } from "../platform/permissions";
export function matchesConfirmedContact(
  contact:
    | {
        outcome: string;
        start_at: Date;
        end_at: Date;
        recipient_id: string;
      }
    | undefined,
  start: Date,
  end: Date,
  recipient: string,
  commitment: string,
) {
  return (
    !!contact &&
    contact.outcome === "Confirmed" &&
    +contact.start_at === +start &&
    +contact.end_at === +end &&
    contact.recipient_id === recipient &&
    commitment === "Confirmed"
  );
}
export const visitFitsPolicy = (
  start: Date,
  end: Date,
  policy: {
    effective_from: Date;
    effective_to: Date;
    max_visit_minutes: number;
  },
) =>
  start >= policy.effective_from &&
  end <= policy.effective_to &&
  end.getTime() - start.getTime() <= policy.max_visit_minutes * 60000;

export async function fitsWorkingInterval(
  c: QueryClient,
  workspace: string,
  calendar: { id: string; timezone: string },
  before: Date,
  after: Date,
): Promise<boolean> {
  // Keep the established PostgreSQL timezone/DST and exclusive-end convention.
  return (
    await c.query(
      `SELECT EXISTS(SELECT 1 FROM ppo.calendar_intervals i WHERE i.workspace_id=$1 AND i.calendar_id=$2 AND i.weekday=extract(dow FROM $3::timestamptz AT TIME ZONE $5) AND ($3::timestamptz AT TIME ZONE $5)::date=(($4::timestamptz-interval '1 microsecond') AT TIME ZONE $5)::date AND $3::timestamptz >= (((($3::timestamptz AT TIME ZONE $5)::date)::timestamp + make_interval(mins=>i.start_minute)) AT TIME ZONE $5) AND $4::timestamptz <= (((($3::timestamptz AT TIME ZONE $5)::date)::timestamp + make_interval(mins=>i.end_minute)) AT TIME ZONE $5)) AS fits`,
      [workspace, calendar.id, before, after, calendar.timezone],
    )
  ).rows[0].fits;
}
