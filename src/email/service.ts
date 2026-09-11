import type { Principal } from "../platform/identity";
import { database } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { sharedOperation } from "../platform/operations";
import {
  requireCapability,
  scopeSql,
  type QueryClient,
} from "../platform/permissions";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  narrative,
  instant,
  dateOnly,
} from "../shared/validation";
import { visibleOpportunity, opportunityVisibility } from "../crm/context";
import {
  activityVisibility,
  authoriseActivityInput,
  insertActivity,
  visibleActivity,
  type ActivityInput,
} from "../activities/activities";
export type EmailMessage = {
  id: string;
  company_id: string;
  owner_id: string;
  version: number;
  subject: string;
  body_text: string;
  sender_name: string;
  sender_address: string;
  received_at: Date;
  opportunity_id: string | null;
  followup_id: string | null;
};
function mailVisibility(cap: "email.read" | "email.edit" = "email.read") {
  return `m.owner_id=$2 AND ${scopeSql("m.company_id", "NULL::uuid", cap)} AND ${scopeSql("m.company_id", "NULL::uuid", "email.read")}
    AND ${scopeSql("m.company_id", "NULL::uuid", "shared.internal.read")}
    AND (m.opportunity_id IS NULL OR EXISTS(SELECT 1 FROM ppo.opportunities o WHERE o.workspace_id=m.workspace_id AND o.id=m.opportunity_id AND ${opportunityVisibility()}))
    AND (m.followup_id IS NULL OR EXISTS(SELECT 1 FROM ppo.activities a WHERE a.workspace_id=m.workspace_id AND a.id=m.followup_id AND ${activityVisibility("a", true)}))`;
}
export async function emailContext(
  c: QueryClient,
  p: Principal,
  id: string,
  edit = false,
) {
  const m = (
    await c.query<EmailMessage>(
      `SELECT m.* FROM ppo.email_messages m WHERE m.workspace_id=$1 AND m.id=$3 AND ${mailVisibility(edit ? "email.edit" : "email.read")}`,
      [p.workspace_id, p.actor_id, uuid(id, "id")],
    )
  ).rows[0];
  if (!m) throw unavailable();
  return m;
}
export async function listEmail(p: Principal, query: Record<string, string>) {
  await requireCapability(database(), p, "email.read");
  const search = (query.search ?? "").trim();
  if (search.length > 200)
    throw new AppError(422, "InvalidSearch", "Use a shorter search.");
  const rows = await database().query(
    `SELECT m.id,m.subject,m.sender_name,m.received_at,m.version,m.opportunity_id,m.followup_id FROM ppo.email_messages m WHERE m.workspace_id=$1 AND ${mailVisibility()} AND ($3='' OR strpos(lower(m.subject || ' ' || m.sender_name),lower($3))>0) ORDER BY m.received_at DESC,m.id LIMIT 101`,
    [p.workspace_id, p.actor_id, search],
  );
  return { items: rows.rows.slice(0, 100), truncated: rows.rows.length > 100 };
}
export async function readEmail(p: Principal, id: string) {
  const c = database(),
    m = await emailContext(c, p, id);
  const opportunity = m.opportunity_id
    ? await visibleOpportunity(c, p, m.opportunity_id)
    : null;
  const followup = m.followup_id
    ? await visibleActivity(c, p, m.followup_id)
    : null;
  return {
    ...m,
    opportunity: opportunity
      ? {
          id: opportunity.id,
          title: opportunity.title,
          display_number: opportunity.display_number,
        }
      : null,
    followup: followup
      ? {
          id: followup.id,
          summary: followup.summary,
          due_at: followup.due_at,
          status: followup.status,
        }
      : null,
  };
}
export async function emailOptions(p: Principal, id: string) {
  const c = database(),
    m = await emailContext(c, p, id, true);
  const rows = await c.query(
    `SELECT o.id,o.title,o.display_number FROM ppo.opportunities o WHERE o.workspace_id=$1 AND o.company_id=$3 AND ${opportunityVisibility()} ORDER BY o.title,o.id LIMIT 101`,
    [p.workspace_id, p.actor_id, m.company_id],
  );
  return { items: rows.rows.slice(0, 100), truncated: rows.rows.length > 100 };
}
export async function linkEmail(p: Principal, id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "opportunity_id",
  ]);
  const input = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    opportunity_id: uuid(r.opportunity_id, "opportunity_id"),
  };
  return sharedOperation(
    p,
    input,
    "LinkEmail",
    async (c) => {
      const m = await emailContext(c, p, id, true),
        o = await visibleOpportunity(c, p, input.opportunity_id);
      if (m.company_id !== o.company_id) throw unavailable();
      return m;
    },
    async (c, m) => {
      if (m.version !== input.expected_version)
        throw new AppError(
          409,
          "VersionConflict",
          "This email changed. Reload it before choosing a new link.",
        );
      if (m.followup_id)
        throw new AppError(
          409,
          "FollowUpExists",
          "Retain the opportunity associated with the saved follow-up.",
        );
      return (
        await c.query(
          `UPDATE ppo.email_messages SET opportunity_id=$1,version=version+1,updated_by=$2,updated_at=clock_timestamp() WHERE workspace_id=$3 AND id=$4 RETURNING id,version,updated_at,'Linked' AS state`,
          [input.opportunity_id, p.actor_id, p.workspace_id, id],
        )
      ).rows[0];
    },
    "EmailMessage",
    "EmailLinked",
  );
}
export async function createEmailFollowup(
  p: Principal,
  id: string,
  value: unknown,
) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "activity_id",
    "summary",
    "due_at",
  ]);
  const input = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    activity_id: uuid(r.activity_id, "activity_id"),
    summary: narrative(r.summary, "summary", 160),
    due_at: instant(r.due_at, "due_at"),
  };
  return sharedOperation(
    p,
    input,
    "CreateEmailFollowUp",
    async (c) => {
      const m = await emailContext(c, p, id, true);
      if (!m.opportunity_id)
        throw new AppError(422, "LinkRequired", "Choose an opportunity first.");
      const o = await visibleOpportunity(c, p, m.opportunity_id);
      const activity: ActivityInput = {
        id: input.activity_id,
        company_id: o.company_id,
        site_id: o.site_id,
        kind: "CustomerContact",
        owner_id: p.actor_id,
        summary: input.summary,
        due_at: input.due_at,
        due_needed: false,
        access_class: "Internal",
        links: [
          { object_type: "Organisation", object_id: o.organisation_id },
          ...(o.site_id
            ? [{ object_type: "Site" as const, object_id: o.site_id }]
            : []),
          { object_type: "Opportunity", object_id: o.id },
        ],
      };
      await authoriseActivityInput(c, p, activity);
      return { m, activity };
    },
    async (c, { m, activity }) => {
      if (m.version !== input.expected_version)
        throw new AppError(
          409,
          "VersionConflict",
          "This email changed. Reload it to see the saved action.",
        );
      if (m.followup_id)
        throw new AppError(
          409,
          "FollowUpExists",
          "This email already has a follow-up.",
        );
      await insertActivity(c, p, activity);
      return (
        await c.query(
          `UPDATE ppo.email_messages SET followup_id=$1,version=version+1,updated_by=$2,updated_at=clock_timestamp() WHERE workspace_id=$3 AND id=$4 RETURNING id,version,updated_at,'FollowUpPlanned' AS state`,
          [activity.id, p.actor_id, p.workspace_id, id],
        )
      ).rows[0];
    },
    "EmailMessage",
    "EmailFollowUpCreated",
  );
}
// Use the database's clock for the hosted request's default calendar date,
// consistently with grant expiry and the other persisted time-based reads.
export async function calendarToday(): Promise<string> {
  const result = await database().query<{ day: string }>(
    "SELECT to_char(clock_timestamp() AT TIME ZONE 'Australia/Brisbane','YYYY-MM-DD') AS day",
  );
  return result.rows[0].day;
}

export async function readCalendar(
  p: Principal,
  query: Record<string, string>,
) {
  const c = database();
  await requireCapability(c, p, "activity.read");
  const day = dateOnly(query.day, "day");
  const start = new Date(day + "T00:00:00+10:00").toISOString(),
    end = new Date(Date.parse(start) + 86400000).toISOString();
  const meetings = await c.query(
    `SELECT e.id,e.title,e.starts_at,e.ends_at,e.private,'Synthetic Outlook' AS source FROM ppo.email_calendar_events e WHERE e.workspace_id=$1 AND e.owner_id=$2 AND ${scopeSql("e.company_id", "NULL::uuid", "email.read")} AND ${scopeSql("e.company_id", "NULL::uuid", "shared.internal.read")} AND e.starts_at<$4 AND e.ends_at>$3 ORDER BY e.starts_at,e.id LIMIT 101`,
    [p.workspace_id, p.actor_id, start, end],
  );
  const activities = await c.query(
    `SELECT a.id,a.summary AS title,a.due_at,a.status,'PPO Activity' AS source FROM ppo.activities a WHERE a.workspace_id=$1 AND a.owner_id=$2 AND ${activityVisibility("a", true)} AND a.due_at>=$3 AND a.due_at<$4 ORDER BY a.due_at,a.id LIMIT 101`,
    [p.workspace_id, p.actor_id, start, end],
  );
  return {
    day,
    timezone: "Australia/Brisbane",
    meetings: meetings.rows.slice(0, 100),
    activities: activities.rows.slice(0, 100),
    truncated: meetings.rows.length > 100 || activities.rows.length > 100,
  };
}
