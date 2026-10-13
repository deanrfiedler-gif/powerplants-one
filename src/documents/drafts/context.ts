import type { Principal } from "../../platform/identity";
import { AppError, unavailable } from "../../platform/errors";
import {
  hasPermission,
  type Capability,
  type QueryClient,
} from "../../platform/permissions";
import { companyContext } from "../../shared/authority";
import { uuid } from "../../shared/validation";
import { canonical } from "../../platform/operations";
import { digest } from "../store";
import type { OutputFamily } from "../p11-template";
import {
  bindingCatalogue,
  bodyInput,
  familyRead,
  type ProposalBody,
} from "./validation";

export type Duty = "template.read" | "template.propose" | "template.review";
export type Proposal = {
  id: string;
  workspace_id: string;
  company_id: string;
  site_id: string;
  family: OutputFamily;
  version: number;
  current_revision_id: string;
  state: "Draft" | "Reviewed" | "ChangesRequested";
  created_by: string;
  updated_by: string;
  updated_at: Date;
};
export type Base = {
  id: string;
  version: number;
  content_hash: string;
  definition: string;
  renderer_version: string | null;
};
export type Revision = {
  id: string;
  workspace_id: string;
  proposal_id: string;
  revision: number;
  proposal_version: number;
  base: Base;
  body: ProposalBody;
  content_hash: string;
  created_by: string;
};
export async function scopeAuthority(
  c: QueryClient,
  p: Principal,
  scope: Pick<Proposal, "company_id" | "site_id" | "family">,
  duty: Duty = "template.read",
) {
  const { company_id, site_id, family } = scope;
  for (const cap of new Set<Capability>([
    "template.read",
    duty,
    familyRead[family],
    ...(family === "OUT-14" ? ["shared.finance.read" as const] : []),
  ]))
    await companyContext(c, p, company_id, site_id, cap);
}
export async function bindingAuthority(
  c: QueryClient,
  p: Principal,
  scope: Pick<Proposal, "company_id" | "site_id" | "family">,
  body: ProposalBody,
) {
  bodyInput(body, scope.family);
  for (const capability of new Set(
    body.fields.map(
      (f) => bindingCatalogue[scope.family][f.binding].capability,
    ),
  ))
    if (
      !(await hasPermission(c, p, capability, scope.company_id, scope.site_id))
    )
      throw unavailable();
}
export async function proposalContext(
  c: QueryClient,
  p: Principal,
  id: string,
  duty: Duty = "template.read",
) {
  const d = (
    await c.query<Proposal>(
      "SELECT * FROM ppo.template_proposals WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "proposal_id")],
    )
  ).rows[0];
  if (!d) throw unavailable();
  await scopeAuthority(c, p, d, duty);
  const r = await revisionContext(c, p, d, d.current_revision_id);
  return { d, r };
}
export async function revisionContext(
  c: QueryClient,
  p: Principal,
  d: Proposal,
  id: string,
) {
  const r = (
    await c.query<Revision>(
      "SELECT * FROM ppo.template_proposal_revisions WHERE workspace_id=$1 AND proposal_id=$2 AND id=$3",
      [p.workspace_id, d.id, uuid(id, "revision_id")],
    )
  ).rows[0];
  if (!r) throw unavailable();
  await bindingAuthority(c, p, d, r.body);
  if (r.content_hash !== digest(canonical({ base: r.base, body: r.body })))
    throw new AppError(
      409,
      "EvidenceIntegrity",
      "The retained proposal does not match its fingerprint.",
    );
  return r;
}
export async function captureBase(
  c: QueryClient,
  p: Principal,
  family: OutputFamily,
  id: string,
  hash: string,
): Promise<Base> {
  const table = {
    "OUT-09": "pack_templates",
    "OUT-10": "report_templates",
    "OUT-14": "finance_templates",
  }[family];
  const r = (
    await c.query<Base>(
      `SELECT id,version,content_hash,definition,${family === "OUT-09" ? "renderer_version" : "NULL::text AS renderer_version"} FROM ppo.${table} WHERE workspace_id=$1 AND id=$2`,
      [p.workspace_id, id],
    )
  ).rows[0];
  if (!r) throw unavailable();
  if (r.content_hash !== hash || digest(r.definition) !== hash)
    throw new AppError(
      409,
      "StaleTemplate",
      "Reload the exact retained base template.",
    );
  return r;
}
export function current(
  d: Proposal,
  expected_version: number,
  revision_id: string,
) {
  if (d.version !== expected_version || d.current_revision_id !== revision_id)
    throw new AppError(
      409,
      "StaleVersion",
      "Reload the proposal's current exact version and revision.",
    );
}
export async function receiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  const e = (
    await c.query(
      "SELECT command,revision_id FROM ppo.template_proposal_events WHERE workspace_id=$1 AND proposal_id=$2 AND actor_id=$3 AND operation_id=$4",
      [p.workspace_id, id, p.actor_id, operation],
    )
  ).rows[0];
  if (!e) throw unavailable();
  const { d } = await proposalContext(
    c,
    p,
    id,
    e.command === "Review" ? "template.review" : "template.propose",
  );
  await revisionContext(c, p, d, e.revision_id);
}
