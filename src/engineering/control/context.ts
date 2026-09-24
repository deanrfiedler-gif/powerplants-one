import { createHash } from "node:crypto";
import type { Principal } from "../../platform/identity";
import { AppError, unavailable } from "../../platform/errors";
import { canonical } from "../../platform/operations";
import {
  hasPermission,
  type Capability,
  type QueryClient,
} from "../../platform/permissions";
import { engineeringRow } from "../service";
import { uuid } from "../../shared/validation";
import {
  sourceIds,
  sourceBlockers,
  type ControlKind,
  type ControlRecord,
  type Purpose,
  type Source,
} from "./model";
import type { Action } from "./validation";

export const tables = {
  basis: "engineering_bases",
  document: "engineering_documents",
  query: "engineering_queries",
  submittal: "engineering_submittals",
  review: "engineering_reviews",
  issue: "engineering_issues",
  deliverable: "engineering_deliverables",
} as const;
export const duties = {
  author: "engineering.edit",
  review: "engineering.technical.review",
  issue: "engineering.technical.issue",
  distribute: "engineering.technical.distribute",
  source: "engineering.technical.source",
  read: "engineering.read",
} as const satisfies Record<string, Capability>;
export type Duty = keyof typeof duties;
export const hash = (value: unknown) =>
  createHash("sha256")
    .update(typeof value === "string" ? value : canonical(value))
    .digest("hex");
export const refuse = (code: string, message: string, status = 422) =>
  new AppError(status, code, message);
export function expected(actual: number, proposed: number | null) {
  if (actual !== proposed)
    throw refuse(
      "VersionConflict",
      "This record changed. Your entries are retained; inspect the latest version before making a new decision.",
      409,
    );
}
export function dutyFor(action: Action): Duty {
  if (
    ["dispose", "finding", "accept_finding", "decide_review"].includes(action)
  )
    return "review";
  if (["issue", "withdraw"].includes(action)) return "issue";
  if (action === "distribution") return "read"; // command checks evidence-specific duty and recipient
  return "author";
}
export type Policy = {
  id: string;
  policy_version: number;
  independent_review: boolean;
  independent_issue: boolean;
  grants: {
    actor_id: string;
    duty: Duty;
    purposes: Purpose[];
    disciplines: string[];
  }[];
};
export async function access(c: QueryClient, p: Principal, packageId: string) {
  const pkg = await engineeringRow(c, p, uuid(packageId, "package_id"));
  const can = {} as Record<Duty, boolean>;
  for (const [key, cap] of Object.entries(duties))
    can[key as Duty] = await hasPermission(
      c,
      p,
      cap,
      pkg.company_id,
      pkg.site_id ?? undefined,
    );
  const policy =
    (
      await c.query<Policy>(
        "SELECT * FROM ppo.engineering_control_policies WHERE workspace_id=$1 AND company_id=$2 AND (site_id IS NULL OR site_id=$3) AND effective_from<=clock_timestamp() ORDER BY policy_version DESC LIMIT 1",
        [p.workspace_id, pkg.company_id, pkg.site_id],
      )
    ).rows[0] ?? null;
  return { pkg, can, policy };
}
export type Access = Awaited<ReturnType<typeof access>>;
export function requireDuty(a: Access, duty: Duty) {
  if (!a.can[duty])
    throw refuse(
      "Forbidden",
      `This identity does not hold the ${duty} duty for this package.`,
      403,
    );
}
export function authority(
  a: Access,
  p: Principal,
  duty: Duty,
  purpose: Purpose,
) {
  requireDuty(a, duty);
  if (!a.policy)
    throw refuse(
      "AuthorityNotConfigured",
      "Technical authority is not configured. Review and issue cannot proceed.",
      403,
    );
  if (
    !a.policy.grants.some(
      (g) =>
        g.actor_id === p.actor_id &&
        g.duty === duty &&
        g.purposes.includes(purpose) &&
        g.disciplines.includes(a.pkg.discipline),
    )
  )
    throw refuse(
      "Forbidden",
      "The current synthetic policy does not authorise this person for this duty, discipline and purpose.",
      403,
    );
}
export async function person(
  c: QueryClient,
  p: Principal,
  a: Access,
  id: string,
  duty: Duty = "read",
) {
  const user = (
    await c.query<{ id: string; display_name: string }>(
      "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2 AND active",
      [p.workspace_id, id],
    )
  ).rows[0];
  if (!user) throw unavailable();
  const other = { ...p, actor_id: id, display_name: user.display_name };
  await engineeringRow(c, other, a.pkg.id);
  if (
    !(await hasPermission(
      c,
      other,
      duties[duty],
      a.pkg.company_id,
      a.pkg.site_id ?? undefined,
    ))
  )
    throw unavailable();
  return other;
}
export async function sources(
  c: QueryClient,
  p: Principal,
  a: Access,
): Promise<Source[]> {
  return (
    await c.query<Source>(
      `SELECT s.id,s.reference,s.title,s.revision,s.file_version,s.content_hash,s.content,s.restricted,s.completeness,s.kind,s.permitted_purpose,s.predecessor_id,coalesce(ch.change,'Current') AS use
   FROM ppo.material_sources s LEFT JOIN ppo.material_source_changes ch ON (ch.workspace_id,ch.source_id)=(s.workspace_id,s.id)
   WHERE s.workspace_id=$1 AND s.package_id=$2 AND ((NOT s.restricted AND coalesce(ch.change,'Current')<>'Restricted') OR $3) ORDER BY s.created_at,s.id`,
      [p.workspace_id, a.pkg.id, a.can.source],
    )
  ).rows;
}
export async function requireSources(
  c: QueryClient,
  p: Principal,
  a: Access,
  ids: string[],
  current = false,
) {
  const all = await sources(c, p, a);
  if (ids.some((id) => !all.some((s) => s.id === id))) throw unavailable();
  if (current) {
    const blockers = sourceBlockers(ids, all);
    if (blockers.length) throw refuse("SourceChanged", blockers.join(" "), 409);
  }
  return ids.map((id) => all.find((s) => s.id === id)!);
}
export async function row<K extends ControlKind>(
  c: QueryClient,
  p: Principal,
  a: Access,
  kind: K,
  id: string,
): Promise<ControlRecord<K>> {
  const record = (
    await c.query<ControlRecord<K>>(
      `SELECT *,due_date::text FROM ppo.${tables[kind]} WHERE workspace_id=$1 AND package_id=$2 AND id=$3`,
      [p.workspace_id, a.pkg.id, id],
    )
  ).rows[0];
  if (!record) throw unavailable();
  await requireSources(c, p, a, sourceIds(record.content));
  return record;
}
export async function receiptAuthority(
  c: QueryClient,
  p: Principal,
  packageId: string,
  operationId: string,
) {
  const a = await access(c, p, packageId);
  const event = (
    await c.query<{
      action: Action;
      content: {
        source_ids?: string[];
        required_duty?: Duty;
        record?: ControlRecord;
      };
    }>(
      "SELECT action,content FROM ppo.engineering_control_events WHERE workspace_id=$1 AND package_id=$2 AND recorded_by=$3 AND operation_id=$4",
      [p.workspace_id, packageId, p.actor_id, operationId],
    )
  ).rows[0];
  if (!event) throw unavailable();
  const duty = event.content.required_duty ?? dutyFor(event.action);
  requireDuty(a, duty);
  if (["review", "issue", "distribute"].includes(duty)) {
    const content = event.content.record?.content;
    authority(
      a,
      p,
      duty,
      content && "purpose" in content ? content.purpose : "DesignPreparation",
    );
    if (content && ("submission" in content || "manifest" in content)) {
      const snapshot = (
        "submission" in content
          ? content.submission
          : (content.manifest as { exact_content: unknown }).exact_content
      ) as {
        documents?: { discipline: string }[];
      };
      for (const document of snapshot.documents ?? [])
        authority(
          { ...a, pkg: { ...a.pkg, discipline: document.discipline } },
          p,
          duty,
          content.purpose,
        );
    }
  }
  await requireSources(c, p, a, event.content.source_ids ?? []);
}
