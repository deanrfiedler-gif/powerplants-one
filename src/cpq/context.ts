import type { Principal } from "../platform/identity";
import { hasPermission, type QueryClient } from "../platform/permissions";
import { companyContext } from "../shared/authority";
import { uuid } from "../shared/validation";
import { AppError, unavailable } from "../platform/errors";
import {
  workspaceAuthority,
  revisionAuthority,
} from "../estimating/discovery-workspace-context";
import { hash } from "./hash";
import type {
  Calculation,
  CalculationInput,
  Definition,
  ProductSnapshot,
} from "./types";
import { productBindings } from "./products";
import { draftAuthority } from "./drafts";

export type Duty =
  "cpq.read" | "cpq.author" | "cpq.review" | "cpq.publish" | "cpq.calculate";
export type Release = {
  id: string;
  workspace_id: string;
  company_id: string;
  label: string;
  version: number;
  current_revision_id: string;
  state: string;
  updated_at: Date;
};
export type Revision = {
  id: string;
  workspace_id: string;
  company_id: string;
  release_id: string;
  version: number;
  definition: Definition;
  content_hash: string;
  created_by: string;
};
export type Binding = {
  estimating_workspace_id: string;
  option_id: string;
  revision_id: string;
  source_hash: string;
  context_hash: string;
  workspace_version: number;
  estimate_id: string | null;
  estimate_version: number;
  estimate_content_hash: string | null;
  activation_id: string;
  activation_version: number;
  release_revision_id: string;
  products?: ProductSnapshot[];
};
export type Run = {
  id: string;
  workspace_id: string;
  company_id: string;
  estimating_workspace_id: string;
  option_id: string;
  discovery_revision_id: string;
  release_revision_id: string;
  activation_id: string;
  parent_id: string | null;
  binding: Binding;
  input: CalculationInput;
  result: Calculation;
  content_hash: string;
  state: string;
  version: number;
  updated_at: Date;
  created_by: string;
};
export async function duty(
  c: QueryClient,
  p: Principal,
  company: string,
  cap: Duty = "cpq.read",
) {
  await companyContext(c, p, company, null, "cpq.read");
  if (cap !== "cpq.read" && !(await hasPermission(c, p, cap, company)))
    throw unavailable();
}
export async function release(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: Duty = "cpq.read",
) {
  const r = (
    await c.query<Release>(
      "SELECT * FROM ppo.cpq_releases WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "release_id")],
    )
  ).rows[0];
  if (!r) throw unavailable();
  await duty(c, p, r.company_id, cap);
  return r;
}
export async function revision(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: Duty = "cpq.read",
) {
  const r = (
    await c.query<Revision>(
      "SELECT * FROM ppo.cpq_revisions WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "revision_id")],
    )
  ).rows[0];
  if (!r) throw unavailable();
  await duty(c, p, r.company_id, cap);
  if (hash(r.definition) !== r.content_hash)
    throw new AppError(
      409,
      "CpqEvidenceMismatch",
      "The saved release evidence does not match its hash.",
    );
  await productBindings(c, p, r.company_id, r.definition);
  return r;
}
export async function active(c: QueryClient, p: Principal, company: string) {
  await duty(c, p, company);
  const a = (
    await c.query<{ id: string; version: number; revision_id: string }>(
      "SELECT a.* FROM ppo.cpq_heads h JOIN ppo.cpq_activations a ON (a.workspace_id,a.id)=(h.workspace_id,h.activation_id) WHERE h.workspace_id=$1 AND h.company_id=$2",
      [p.workspace_id, company],
    )
  ).rows[0];
  return a ? { ...a, revision: await revision(c, p, a.revision_id) } : null;
}
export async function run(
  c: QueryClient,
  p: Principal,
  id: string,
  edit = false,
) {
  const r = (
    await c.query<Run>(
      "SELECT * FROM ppo.cpq_runs WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "run_id")],
    )
  ).rows[0];
  if (!r) throw unavailable();
  await duty(c, p, r.company_id, edit ? "cpq.calculate" : "cpq.read");
  const g = await workspaceAuthority(c, p, r.estimating_workspace_id, edit);
  await revisionAuthority(c, p, g, r.discovery_revision_id, edit);
  await revision(c, p, r.release_revision_id);
  const { result_hash, ...body } = r.result;
  if (
    hash(body) !== result_hash ||
    hash({ binding: r.binding, input: r.input, result: r.result }) !==
      r.content_hash
  )
    throw new AppError(
      409,
      "CpqEvidenceMismatch",
      "The saved calculation evidence does not match its hash.",
    );
  return r;
}
export async function receiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  command: string,
  operationId: string,
) {
  if (command === "Cpq:Draft") {
    await draftAuthority(c, p, id, true);
  } else if (command === "Cpq:Adopt") {
    const a = (
      await c.query<{ details: { cpq_run_id: string } }>(
        "SELECT details FROM ppo.audit_events WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
        [p.workspace_id, p.actor_id, operationId],
      )
    ).rows[0];
    if (!a?.details.cpq_run_id) throw unavailable();
    await run(c, p, a.details.cpq_run_id, true);
  } else if (command === "Cpq:Calculate") await run(c, p, id, true);
  else {
    await release(
      c,
      p,
      id,
      command === "Cpq:Save"
        ? "cpq.author"
        : command === "Cpq:Review"
          ? "cpq.review"
          : "cpq.publish",
    );
    const evidence = (
      await c.query<{ details: { revision_id: string } }>(
        "SELECT details FROM ppo.audit_events WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
        [p.workspace_id, p.actor_id, operationId],
      )
    ).rows[0];
    if (!evidence?.details.revision_id) throw unavailable();
    await revision(c, p, evidence.details.revision_id);
  }
}
