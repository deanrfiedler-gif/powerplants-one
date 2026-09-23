// Personal saved views for My Work (F04, personal scope). A view stores criteria and a name,
// never records and never authority: every use runs the ordinary reads under current grants.
// The document is replaced whole under optimistic concurrency, after crm/directory.ts.
// Team-shared views are not offered: the application has no team concept to share them with.
import { workViewRegistry } from "../platform/view-targets";
import { database } from "../platform/database";
import { AppError } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { requireCapability } from "../platform/permissions";
import { choice, invalid, object, optionalId, uuid } from "../shared/validation";
import { activityKinds } from "./activities";
import { activityTypes } from "./work-view";

export const workViewTargets = Object.keys(workViewRegistry) as (keyof typeof workViewRegistry)[];
export type WorkViewCriteria = {
  owner: "mine" | "all";
  company_id: string | null;
  kind: (typeof activityKinds)[number] | null;
  activity_type: (typeof activityTypes)[number] | null;
  sort: "Due" | "Title" | "Updated";
  status: "Active" | "Completed" | "Cancelled" | "All";
  due: "Overdue" | "Today" | "Upcoming" | "Needed" | null;
  linked: "Lead" | "Opportunity" | "Ticket" | "Other" | null;
  q: string;
};
export type WorkView = {
  id: string;
  name: string;
  target: (typeof workViewTargets)[number];
  pinned: boolean;
  criteria: WorkViewCriteria;
};
const nullable = <T extends string>(
  value: unknown,
  field: string,
  values: readonly T[],
) =>
  value === null || value === undefined || value === ""
    ? null
    : choice(value, field, values);

export function parseWorkViews(value: unknown): WorkView[] {
  if (!Array.isArray(value) || value.length > 12)
    invalid("views", "Save up to twelve views.");
  const names = new Set<string>(),
    ids = new Set<string>();
  return (value as unknown[]).map((entry) => {
    const v = object(entry, ["id", "name", "target", "pinned", "criteria"]);
    const name = typeof v.name === "string" ? v.name.trim() : "";
    if (!name || name.length > 60 || names.has(name.toLowerCase()))
      invalid("name", "Use unique view names of up to 60 characters.");
    names.add(name.toLowerCase());
    const id = uuid(v.id, "id");
    if (ids.has(id)) invalid("id", "Each saved view needs its own identifier.");
    ids.add(id);
    if (typeof v.pinned !== "boolean")
      invalid("pinned", "Choose whether the view is pinned.");
    const k = object(v.criteria, [
      "owner",
      "company_id",
      "kind",
      "activity_type",
      "sort",
      "status",
      "due",
      "linked",
      "q",
    ]);
    if (typeof k.q !== "string" || k.q.length > 200)
      invalid("q", "Use up to 200 search characters.");
    return {
      id,
      name,
      target: choice(v.target, "target", workViewTargets),
      pinned: v.pinned as boolean,
      criteria: {
        owner: choice(k.owner, "owner", ["mine", "all"] as const),
        company_id: optionalId(k.company_id, "company_id"),
        kind: nullable(k.kind, "kind", activityKinds),
        activity_type: nullable(k.activity_type, "activity_type", activityTypes),
        sort: choice(k.sort, "sort", ["Due", "Title", "Updated"] as const),
        status: choice(k.status, "status", [
          "Active",
          "Completed",
          "Cancelled",
          "All",
        ] as const),
        due: nullable(k.due, "due", [
          "Overdue",
          "Today",
          "Upcoming",
          "Needed",
        ] as const),
        linked: nullable(k.linked, "linked", [
          "Lead",
          "Opportunity",
          "Ticket",
          "Other",
        ] as const),
        q: k.q as string,
      },
    };
  });
}
export async function readWorkViews(p: Principal) {
  const c = database();
  await requireCapability(c, p, "activity.read");
  return (
    (
      await c.query<{ version: number; views: WorkView[] }>(
        "SELECT version,views FROM ppo.work_view_preferences WHERE workspace_id=$1 AND user_id=$2",
        [p.workspace_id, p.actor_id],
      )
    ).rows[0] ?? { version: 0, views: [] }
  );
}
export async function saveWorkViews(p: Principal, input: unknown) {
  const b = object(input, ["expected_version", "views"]);
  if (
    !Number.isSafeInteger(b.expected_version) ||
    Number(b.expected_version) < 0
  )
    invalid("expected_version", "Use the current saved version.");
  const views = parseWorkViews(b.views),
    c = database();
  await requireCapability(c, p, "activity.read");
  const created = await c.query<{ version: number; views: WorkView[] }>(
    "INSERT INTO ppo.work_view_preferences(workspace_id,user_id,views,version) SELECT $1,$2,$3,1 WHERE $4=0 ON CONFLICT(workspace_id,user_id) DO NOTHING RETURNING version,views",
    [p.workspace_id, p.actor_id, JSON.stringify(views), b.expected_version],
  );
  if (created.rows[0]) return created.rows[0];
  const updated = await c.query<{ version: number; views: WorkView[] }>(
    "UPDATE ppo.work_view_preferences SET views=$3,version=version+1,updated_at=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND version=$4 RETURNING version,views",
    [p.workspace_id, p.actor_id, JSON.stringify(views), b.expected_version],
  );
  if (!updated.rows[0])
    throw new AppError(
      409,
      "VersionConflict",
      "Your saved views changed elsewhere. Your entries are kept here; reload the views, then save again.",
    );
  return updated.rows[0];
}
