import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { transaction } from "../../platform/database";
import { AppError, unavailable } from "../../platform/errors";
import { canonical, sharedOperation } from "../../platform/operations";
import { companyContext } from "../../shared/authority";
import {
  common,
  object,
  uuid,
  version,
  narrative,
  instant,
  invalid,
} from "../../shared/validation";
import { publicationContext } from "../publication/service";
import { supportedTemplateDefinition } from "../publication/definition";
import { hashInput } from "../drafts/validation";
import { rendererVersion } from "../render";
import { digest } from "../store";
import {
  policy,
  legacyTemplate,
  baselineOf,
  serverTime,
  selectedTemplate,
  type Scope,
  type Assignment,
} from "./policy";

export function assignmentInput(value: unknown) {
  const q = object(value, [
    "operation_id",
    "schema_version",
    "reason",
    "id",
    "company_id",
    "site_id",
    "publication_id",
    "definition_hash",
    "expected_policy_version",
    "baseline_template_id",
    "baseline_policy_version",
    "baseline_hash",
    "effective_from",
    "effective_to",
    "predecessor_id",
    "approval_note",
  ]);
  if (
    !Number.isSafeInteger(q.expected_policy_version) ||
    Number(q.expected_policy_version) < 0
  )
    invalid(
      "expected_policy_version",
      "Use the exact non-negative current policy version.",
    );
  return {
    ...common(q),
    id: uuid(q.id, "id"),
    company_id: uuid(q.company_id, "company_id"),
    site_id: uuid(q.site_id, "site_id"),
    publication_id: uuid(q.publication_id, "publication_id"),
    definition_hash: hashInput(q.definition_hash, "definition_hash"),
    expected_policy_version: q.expected_policy_version as number,
    baseline_template_id: uuid(q.baseline_template_id, "baseline_template_id"),
    baseline_policy_version: version(q.baseline_policy_version),
    baseline_hash: hashInput(q.baseline_hash, "baseline_hash"),
    effective_from:
      q.effective_from === null
        ? null
        : instant(q.effective_from, "effective_from"),
    effective_to:
      q.effective_to === null ? null : instant(q.effective_to, "effective_to"),
    predecessor_id:
      q.predecessor_id === null
        ? null
        : uuid(q.predecessor_id, "predecessor_id"),
    approval_note: narrative(q.approval_note, "approval_note", 2000),
  };
}
async function scopeAuthority(
  c: QueryClient,
  p: Principal,
  s: Scope,
  write = false,
) {
  for (const cap of [
    "template.read",
    "pack.read",
    ...(write ? (["template.assign", "pack.check"] as const) : []),
  ] as const)
    await companyContext(c, p, s.company_id, s.site_id, cap);
}
async function source(c: QueryClient, p: Principal, s: Scope, id: string) {
  const pub = await publicationContext(c, p, id);
  if (
    pub.proposal_snapshot.company_id !== s.company_id ||
    pub.proposal_snapshot.site_id !== s.site_id
  )
    throw unavailable();
  return pub;
}
export async function assignmentContext(
  c: QueryClient,
  p: Principal,
  id: string,
  write = false,
) {
  const a = (
    await c.query<Assignment>(
      "SELECT * FROM ppo.template_use_intervals WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "assignment_id")],
    )
  ).rows[0];
  if (!a) throw unavailable();
  await scopeAuthority(c, p, a, write);
  await source(c, p, a, a.publication_id);
  if (a.predecessor_id) {
    const prev = (
      await c.query<Assignment>(
        "SELECT * FROM ppo.template_use_assignments WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, a.predecessor_id],
      )
    ).rows[0];
    await source(c, p, a, prev.publication_id);
  }
  return a;
}
export async function receiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  const a = await assignmentContext(c, p, id, true);
  if (a.actor_id !== p.actor_id || a.operation_id !== operation)
    throw unavailable();
}
export async function assignUse(p: Principal, value: unknown) {
  const input = assignmentInput(value);
  return sharedOperation(
    p,
    input,
    "Template:AssignUse",
    async (c) => {
      await scopeAuthority(c, p, input, true);
      const pub = await source(c, p, input, input.publication_id);
      if (input.predecessor_id)
        await assignmentContext(c, p, input.predecessor_id);
      return pub;
    },
    async (c, pub) => {
      const h = await policy(c, p.workspace_id, input),
        t = await legacyTemplate(c, p.workspace_id);
      if (!t) throw unavailable();
      const baseline = h ?? baselineOf(t);
      if ((h?.version ?? 0) !== input.expected_policy_version)
        throw new AppError(
          409,
          "StaleVersion",
          "Reload the exact current site template policy.",
        );
      if (
        input.baseline_template_id !== baseline.baseline_template_id ||
        input.baseline_policy_version !== baseline.baseline_policy_version ||
        input.baseline_hash !== baseline.baseline_hash
      )
        throw new AppError(
          409,
          "StaleTemplateBaseline",
          "Reload the exact retained baseline.",
        );
      if (
        pub.definition_hash !== input.definition_hash ||
        digest(pub.definition) !== pub.definition_hash ||
        (await supportedTemplateDefinition(
          "OUT-09",
          pub.runtime_version,
          pub.definition,
        )) !== pub.definition ||
        JSON.parse(pub.definition).renderer_version !== rendererVersion
      )
        throw new AppError(
          409,
          "StaleTemplate",
          "Assign only the exact currently supported published definition.",
        );
      const now = await serverTime(c),
        from = input.effective_from ? new Date(input.effective_from) : now,
        to = input.effective_to ? new Date(input.effective_to) : null;
      if (from < now || (to && to <= from))
        throw new AppError(
          422,
          "InvalidEffectiveInterval",
          "Use a current or future start and a later exclusive end.",
        );
      const intervals = (
        await c.query<Assignment>(
          "SELECT * FROM ppo.template_use_intervals WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3 ORDER BY effective_from,id",
          [p.workspace_id, input.company_id, input.site_id],
        )
      ).rows;
      const predecessor = intervals.find((a) => a.id === input.predecessor_id);
      if (
        input.predecessor_id &&
        (!predecessor ||
          predecessor.effective_to ||
          predecessor.successor_id ||
          predecessor.effective_from >= from)
      )
        throw new AppError(
          409,
          "InvalidPredecessor",
          "Name the exact earlier open-ended assignment that has no successor.",
        );
      for (const a of intervals) {
        const end =
          a.id === input.predecessor_id ? from : a.resolved_effective_to;
        if ((!to || a.effective_from < to) && (!end || from < end))
          throw new AppError(
            409,
            "AmbiguousTemplateUse",
            "Explicitly resolve the overlapping assignment before adopting this interval.",
          );
      }
      const next = input.expected_policy_version + 1;
      if (h)
        await c.query(
          "UPDATE ppo.template_use_policies SET version=version+1 WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3",
          [p.workspace_id, input.company_id, input.site_id],
        );
      else
        await c.query(
          "INSERT INTO ppo.template_use_policies(workspace_id,company_id,site_id,version,baseline_template_id,baseline_policy_version,baseline_hash) VALUES($1,$2,$3,1,$4,$5,$6)",
          [
            p.workspace_id,
            input.company_id,
            input.site_id,
            input.baseline_template_id,
            input.baseline_policy_version,
            input.baseline_hash,
          ],
        );
      const a = (
        await c.query<Assignment>(
          `INSERT INTO ppo.template_use_assignments(id,workspace_id,company_id,site_id,policy_version,publication_id,template_id,definition_hash,effective_from,effective_to,predecessor_id,actor_id,operation_id,reason,approval_note,command_hash)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
          [
            input.id,
            p.workspace_id,
            input.company_id,
            input.site_id,
            next,
            pub.id,
            pub.template_id,
            pub.definition_hash,
            from,
            to,
            input.predecessor_id,
            p.actor_id,
            input.operation_id,
            input.reason,
            input.approval_note,
            digest(canonical({ command: "Template:AssignUse", ...input })),
          ],
        )
      ).rows[0];
      return {
        id: a.id,
        version: next,
        state: "Assigned",
        updated_at: a.recorded_at,
        audit_details: {
          publication_id: pub.id,
          definition_hash: pub.definition_hash,
          company_id: a.company_id,
          site_id: a.site_id,
        },
      };
    },
    "TemplateUseAssignment",
    "TemplateUseAssigned",
  );
}
async function read<T>(p: Principal, work: (c: QueryClient) => Promise<T>) {
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    return work(c);
  });
}
export async function readAssignment(
  p: Principal,
  id: string,
  q: Record<string, string> = {},
) {
  object(q, []);
  return read(p, async (c) => ({
    synthetic: true,
    assignment: await assignmentContext(c, p, id),
    as_of: await serverTime(c),
  }));
}
export async function readUsePolicy(p: Principal, q: Record<string, string>) {
  object(q, ["company_id", "site_id", "after", "limit"]);
  const s = {
    company_id: uuid(q.company_id, "company_id"),
    site_id: uuid(q.site_id, "site_id"),
  };
  const after = q.after === undefined ? null : uuid(q.after, "after"),
    limit = q.limit === undefined ? 25 : Number(q.limit);
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50 ||
    (q.limit !== undefined && !/^[1-9][0-9]*$/.test(q.limit))
  )
    invalid("limit", "Use 1–50 rows.");
  return read(p, async (c) => {
    await scopeAuthority(c, p, s);
    const h = await policy(c, p.workspace_id, s),
      t = await legacyTemplate(c, p.workspace_id);
    if (!t) throw unavailable();
    const items: Assignment[] = [];
    let cursor = after;
    while (items.length <= limit) {
      const batch = (
        await c.query<{ id: string }>(
          "SELECT id FROM ppo.template_use_assignments WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3 AND ($4::uuid IS NULL OR id>$4) ORDER BY id LIMIT 100",
          [p.workspace_id, s.company_id, s.site_id, cursor],
        )
      ).rows;
      for (const a of batch) {
        cursor = a.id;
        try {
          items.push(await assignmentContext(c, p, a.id));
        } catch (e) {
          if (!(e instanceof AppError && [403, 404].includes(e.status)))
            throw e;
        }
        if (items.length > limit) break;
      }
      if (batch.length < 100) break;
    }
    let selectedAt: Date | undefined;
    let selection: {
        template_id: string;
        template_version: number;
        policy_version: number;
        assignment_id: string | null;
      } | null = null,
      hold: string | null = null;
    try {
      const active = await selectedTemplate(c, p.workspace_id, s);
      selectedAt = active.selected_at;
      if (active.use_assignment_id)
        await assignmentContext(c, p, active.use_assignment_id);
      selection = {
        template_id: active.id,
        template_version: active.version,
        policy_version: active.policy_version,
        assignment_id: active.use_assignment_id ?? null,
      };
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      hold = [403, 404].includes(e.status) ? "Unavailable" : e.code;
    }
    return {
      synthetic: true,
      family: "OUT-09",
      ...s,
      version: h?.version ?? 0,
      ...(h
        ? {
            baseline_template_id: h.baseline_template_id,
            baseline_policy_version: h.baseline_policy_version,
            baseline_hash: h.baseline_hash,
          }
        : baselineOf(t)),
      as_of: selectedAt ?? (await serverTime(c)),
      selection,
      hold,
      items: items.slice(0, limit),
      next_after: items.length > limit ? items[limit - 1].id : null,
      scope: "CurrentPermittedAssignments",
    };
  });
}
