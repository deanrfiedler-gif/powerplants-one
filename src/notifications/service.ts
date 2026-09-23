import { database, transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import { requireCapability } from "../platform/permissions";
import {
  expectedVersion,
  readPersonal,
  savePersonal,
} from "../platform/personal-preferences";
import { object, choice, uuid, invalid } from "../shared/validation";
import {
  readActivity,
  visibleActivity,
  activityVisibility,
} from "../activities/activities";
import {
  defaultNotificationPreferences,
  parseNotificationPreferences,
} from "./model";

// Pull projection from the existing durable audit log; no job is consumed or source state mutated.
// Current ownership defines subscription (including historical catch-up); the event never claims
// historical assignment. Only immutable event identity/version/time is copied, never private prose.
export async function projectActivityNotices(p: Principal) {
  const c = database();
  await requireCapability(c, p, "activity.read");
  await c.query(
    `INSERT INTO ppo.notification_events(workspace_id,recipient_id,event_id,source_type,source_id,source_version,event_at,category)
    SELECT e.workspace_id,$2,e.id,'Activity',e.object_id,(e.details->>'record_version')::integer,e.occurred_at,'OwnedWork'
    FROM ppo.audit_events e JOIN ppo.activities a ON (a.workspace_id,a.id)=(e.workspace_id,e.object_id)
    WHERE e.workspace_id=$1 AND e.object_type='Activity' AND e.outcome='Accepted' AND a.owner_id=$2
    AND ${activityVisibility("a", true, true, true)}
    ON CONFLICT(workspace_id,recipient_id,event_id) DO NOTHING`,
    [p.workspace_id, p.actor_id],
  );
}
type NoticeRow = {
  id: string;
  source_id: string;
  source_version: number | null;
  event_at: Date;
  version: number;
  is_read: boolean;
  archived: boolean;
};
export type Notice = {
  id: string;
  event_at: string;
  source_id: string;
  source_version: number | null;
  version: number;
  is_read: boolean;
  archived: boolean;
  title: string;
  context: string;
  status: string;
  current_version: number;
  required: boolean;
  due_at: string | null;
  owner_name: string;
  href: string;
  stale: boolean;
  category: "OwnedWork";
};
async function resolve(p: Principal, row: NoticeRow): Promise<Notice> {
  const a = await readActivity(p, row.source_id);
  return {
    ...row,
    event_at: row.event_at.toISOString(),
    title: a.summary,
    context: a.links.map((l) => l.label).join(" · "),
    status: a.status,
    current_version: a.version,
    required:
      a.owner_id === p.actor_id && ["Open", "InProgress"].includes(a.status),
    due_at: a.due_at,
    owner_name: a.owner_name,
    href: `/work/${a.id}`,
    stale: row.source_version !== null && row.source_version !== a.version,
    category: "OwnedWork",
  };
}
const selectNotices = `SELECT n.id,n.source_id,n.source_version,n.event_at,coalesce(s.version,0) AS version,coalesce(s.is_read,false) AS is_read,coalesce(s.archived,false) AS archived
 FROM ppo.notification_events n LEFT JOIN ppo.notification_states s ON (s.workspace_id,s.user_id,s.notification_id)=(n.workspace_id,n.recipient_id,n.id)`;
export async function notificationInbox(p: Principal, input: unknown = {}) {
  const b = object(input, ["limit"]),
    limit = Number(b.limit ?? 200);
  if (!Number.isInteger(limit) || limit < 1 || limit > 500)
    invalid("limit", "Read up to 500 notices.");
  await projectActivityNotices(p);
  // Permission filtering happens before the bounded window and counts, not after a hidden-row limit.
  const rows = (
    await database().query<NoticeRow>(
      `${selectNotices} JOIN ppo.activities a ON (a.workspace_id,a.id)=(n.workspace_id,n.source_id)
    WHERE n.workspace_id=$1 AND n.recipient_id=$2 AND ${activityVisibility("a", true, true, true)}
    ORDER BY n.event_at DESC,n.id LIMIT $3`,
      [p.workspace_id, p.actor_id, limit + 1],
    )
  ).rows;
  const items: Notice[] = [];
  let failures = 0;
  for (const row of rows.slice(0, limit))
    try {
      items.push(await resolve(p, row));
    } catch (e) {
      if (!(e instanceof AppError && [403, 404].includes(e.status))) failures++;
    }
  // Required work is independently read from source obligations, including records with no notice.
  const obligations = (
    await database().query(
      `SELECT a.id,a.summary,a.version,a.due_at,a.status FROM ppo.activities a WHERE a.workspace_id=$1 AND a.owner_id=$2 AND a.status IN ('Open','InProgress') AND ${activityVisibility("a", true, true, true)} ORDER BY a.due_at NULLS LAST,a.id`,
      [p.workspace_id, p.actor_id],
    )
  ).rows;
  return {
    items,
    obligations: obligations.map((a) => ({
      ...a,
      href: `/work/${a.id}`,
      notice_count: items.filter((n) => n.source_id === a.id).length,
    })),
    unread: items.filter((n) => !n.is_read && (!n.archived || n.required))
      .length,
    owned: obligations.length,
    state: failures ? (items.length ? "partial" : "unavailable") : "complete",
    bounded: rows.length > limit,
    observed_at: new Date().toISOString(),
    source: "Activity events and current owned Activities",
    delivery:
      "Email, push and SMS are not connected. Preferences do not send messages.",
  };
}
export async function notificationTarget(p: Principal, id: string) {
  const row = (
    await database().query<NoticeRow>(
      `${selectNotices} WHERE n.workspace_id=$1 AND n.recipient_id=$2 AND n.id=$3`,
      [p.workspace_id, p.actor_id, uuid(id, "id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  return resolve(p, row);
}
export async function changeNotices(p: Principal, input: unknown) {
  const b = object(input, ["action", "items"]),
    action = choice(b.action, "action", [
      "read",
      "unread",
      "archive",
      "restore",
    ]);
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > 200)
    invalid("items", "Select 1–200 displayed notices.");
  const items = (b.items as unknown[])
    .map((v) => {
      const i = object(v, ["id", "expected_version"]);
      return {
        id: uuid(i.id, "id"),
        version: expectedVersion(i.expected_version),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  if (new Set(items.map((i) => i.id)).size !== items.length)
    invalid("items", "Select each notice once.");
  return transaction(async (c) => {
    await requireCapability(c, p, "activity.read");
    for (const item of items) {
      const n = (
        await c.query(
          `SELECT source_id FROM ppo.notification_events WHERE workspace_id=$1 AND recipient_id=$2 AND id=$3 FOR UPDATE`,
          [p.workspace_id, p.actor_id, item.id],
        )
      ).rows[0];
      if (!n) throw unavailable();
      const a = await visibleActivity(c, p, n.source_id);
      if (
        action === "archive" &&
        a.owner_id === p.actor_id &&
        ["Open", "InProgress"].includes(a.status)
      )
        throw new AppError(
          422,
          "RequiredWork",
          "Active required work cannot be archived. Open its source workflow.",
        );
      const old = (
        await c.query(
          "SELECT * FROM ppo.notification_states WHERE workspace_id=$1 AND user_id=$2 AND notification_id=$3",
          [p.workspace_id, p.actor_id, item.id],
        )
      ).rows[0];
      const field =
          action === "read" || action === "unread" ? "is_read" : "archived",
        value = action === "read" || action === "archive";
      if ((old?.[field] ?? false) === value) continue; // Repeating the same personal effect is safe.
      if ((old?.version ?? 0) !== item.version)
        throw new AppError(
          409,
          "VersionConflict",
          "These notices changed elsewhere. Refresh before trying again.",
        );
      await c.query(
        `INSERT INTO ppo.notification_states(workspace_id,user_id,notification_id,${field}) VALUES($1,$2,$3,$4)
        ON CONFLICT(workspace_id,user_id,notification_id) DO UPDATE SET ${field}=$4,version=notification_states.version+1,updated_at=clock_timestamp()`,
        [p.workspace_id, p.actor_id, item.id, value],
      );
    }
    return { changed: items.length };
  });
}
export async function notificationPreferences(p: Principal) {
  await requireCapability(database(), p, "activity.read");
  return readPersonal(
    p,
    "notification_preferences",
    defaultNotificationPreferences,
  );
}
export async function saveNotificationPreferences(
  p: Principal,
  input: unknown,
) {
  const b = object(input, ["expected_version", "settings"]);
  await requireCapability(database(), p, "activity.read");
  return savePersonal(
    p,
    "notification_preferences",
    expectedVersion(b.expected_version),
    parseNotificationPreferences(b.settings),
  );
}
