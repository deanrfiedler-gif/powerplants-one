import type { QueryClient } from "../platform/permissions";
import { AppError } from "../platform/errors";
import { preparationDeadline } from "./preparation-deadline";
import {
  SITE_READINESS,
  siteReadinessOutcome,
  type SiteChecks,
  type SitePreparation,
} from "./site-readiness-model";

export async function preparationInstalled(c: QueryClient) {
  return !!(
    await c.query(
      "SELECT to_regclass('ppo.scheduling_preparation_policies') AS installed",
    )
  ).rows[0].installed;
}

// Internal projections: callers first establish current appointment, pack or field
// visibility. Bounded list reads supply only their authorised IDs. No source facts
// or authority are cached across requests; calendar reads are batched per response.
export async function appointmentPreparations(
  c: QueryClient,
  workspace: string,
  ids: string[],
) {
  const result = new Map<string, ReturnType<typeof projectPreparation>>();
  if (!ids.length || !(await preparationInstalled(c))) return result;
  const appointments = (
    await c.query(
      `SELECT a.*,p.id AS preparation_policy_id,p.reference,p.version AS preparation_policy_version,
 p.confirmation_opens_hours,p.confirmation_due_hours,p.issue_due_minute,
 x.id AS contact_id,x.outcome AS contact_outcome,x.occurred_at AS contact_occurred_at,x.created_at AS contact_created_at,x.site_checks AS contact_checks
 FROM ppo.appointments a JOIN ppo.policy_criteria pc ON pc.workspace_id=a.workspace_id AND pc.policy_version_id=a.policy_version_id AND pc.criterion_code=$3
 LEFT JOIN ppo.scheduling_preparation_policies p ON p.workspace_id=a.workspace_id AND p.readiness_policy_id=a.policy_version_id
 LEFT JOIN LATERAL (SELECT c.* FROM ppo.contact_outcomes c WHERE c.workspace_id=a.workspace_id AND c.appointment_id=a.id
  AND c.schedule_version=a.schedule_version AND c.start_at=a.start_at AND c.end_at=a.end_at AND c.purpose='SiteReadiness'
  ORDER BY c.created_at DESC,c.id DESC LIMIT 1) x ON true
 WHERE a.workspace_id=$1 AND a.id=ANY($2::uuid[])`,
      [workspace, ids, SITE_READINESS],
    )
  ).rows;
  if (!appointments.length) return result;
  const calendarRows = (
    await c.query(
      `SELECT cal.*,x.appointment_id FROM ppo.assignments x
 JOIN ppo.appointments a ON (a.workspace_id,a.id,a.assignment_version)=(x.workspace_id,x.appointment_id,x.assignment_version)
 JOIN ppo.resources r ON (r.workspace_id,r.id)=(x.workspace_id,x.resource_id)
 JOIN ppo.working_calendars cal ON (cal.workspace_id,cal.company_id,cal.id)=(r.workspace_id,r.company_id,r.calendar_id)
 WHERE x.workspace_id=$1 AND x.appointment_id=ANY($2::uuid[]) AND x.active AND r.active AND x.crew_role='Lead' AND cal.status='Published'`,
      [workspace, appointments.map((a) => a.id)],
    )
  ).rows;
  const calendarIds = [...new Set(calendarRows.map((row) => row.id))];
  const intervalRows = (
    await c.query(
      "SELECT calendar_id,weekday,start_minute,end_minute FROM ppo.calendar_intervals WHERE workspace_id=$1 AND calendar_id=ANY($2::uuid[]) ORDER BY calendar_id,weekday,start_minute",
      [workspace, calendarIds],
    )
  ).rows;
  const exceptionRows = (
    await c.query(
      "SELECT calendar_id,start_at,end_at FROM ppo.calendar_exceptions WHERE workspace_id=$1 AND calendar_id=ANY($2::uuid[]) ORDER BY calendar_id,start_at,id",
      [workspace, calendarIds],
    )
  ).rows;
  for (const a of appointments)
    result.set(
      a.id,
      projectPreparation(a, calendarRows, intervalRows, exceptionRows),
    );
  return result;
}
export async function appointmentPreparation(
  c: QueryClient,
  workspace: string,
  appointment: string,
) {
  return (
    (await appointmentPreparations(c, workspace, [appointment])).get(
      appointment,
    ) ?? null
  );
}
// Rows are selected internally with fixed SQL; no request payload enters this projection.
type PreparationRow = {
  preparation_policy_id: string | null;
  id: string;
  reference: string;
  preparation_policy_version: number;
  start_at: Date;
  site_timezone: string;
  confirmation_opens_hours: number;
  confirmation_due_hours: number;
  issue_due_minute: number;
  contact_id: string | null;
  contact_outcome: string;
  contact_occurred_at: Date;
  contact_created_at: Date;
  contact_checks: SiteChecks;
  schedule_version: number;
};
type CalendarRow = {
  id: string;
  appointment_id: string;
  timezone: string;
  effective_from: Date;
  effective_to: Date;
};
type IntervalRow = {
  calendar_id: string;
  weekday: number;
  start_minute: number;
  end_minute: number;
};
type ExceptionRow = { calendar_id: string; start_at: Date; end_at: Date };
function projectPreparation(
  a: PreparationRow,
  calendarRows: CalendarRow[],
  intervalRows: IntervalRow[],
  exceptionRows: ExceptionRow[],
): SitePreparation {
  if (!a.preparation_policy_id)
    throw new AppError(
      422,
      "PolicyUnavailable",
      "The exact scheduling preparation policy is unavailable.",
    );
  const opens = new Date(
    a.start_at.getTime() - a.confirmation_opens_hours * 3600000,
  );
  const due = new Date(
    a.start_at.getTime() - a.confirmation_due_hours * 3600000,
  );
  const contact = a.contact_id
    ? {
        id: a.contact_id as string,
        outcome: a.contact_outcome as string,
        occurred_at: a.contact_occurred_at as Date,
        created_at: a.contact_created_at as Date,
        checks: a.contact_checks as SiteChecks,
      }
    : null;
  const outcome = siteReadinessOutcome(contact ?? null, opens);
  const calendars = calendarRows.filter((row) => row.appointment_id === a.id);
  let issue_due_at: string | null = null;
  let calendar_status = "Published lead calendar unavailable";
  if (calendars.length === 1) {
    const calendar = calendars[0];
    const intervals = intervalRows.filter(
      (row) => row.calendar_id === calendar.id,
    );
    const exceptions = exceptionRows.filter(
      (row) => row.calendar_id === calendar.id,
    );
    try {
      issue_due_at = preparationDeadline(
        a.start_at.toISOString(),
        a.site_timezone,
        a.issue_due_minute,
        {
          timezone: calendar.timezone,
          effective_from: calendar.effective_from.toISOString(),
          effective_to: calendar.effective_to.toISOString(),
          intervals: intervals as {
            weekday: number;
            start_minute: number;
            end_minute: number;
          }[],
          exceptions: exceptions.map((x) => ({
            start_at: x.start_at.toISOString(),
            end_at: x.end_at.toISOString(),
          })),
        },
      );
      calendar_status = issue_due_at
        ? "Published lead calendar"
        : "No preceding working day within published calendar authority";
    } catch {
      calendar_status =
        "Calendar contains an ambiguous or nonexistent local boundary";
    }
  }
  return {
    policy: {
      id: a.preparation_policy_id as string,
      reference: a.reference as string,
      version: a.preparation_policy_version as number,
      synthetic: true as const,
    },
    schedule_version: a.schedule_version as number,
    outcome,
    contact_id: contact?.id ?? null,
    opens_at: opens.toISOString(),
    confirmation_due_at: due.toISOString(),
    late:
      outcome === "Pass" &&
      !!contact &&
      (contact.occurred_at > due || contact.created_at > due),
    issue_due_at,
    calendar_status,
    issue_deadline_blocks_dispatch: false as const,
  };
}
