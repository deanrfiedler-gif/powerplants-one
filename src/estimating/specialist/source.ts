import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { sharedOperation } from "../../platform/operations";
import { AppError } from "../../platform/errors";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  label,
  choice,
} from "../../shared/validation";
import {
  workspaceAuthority,
  revisionAuthority,
  requireDraftGroup,
} from "../discovery-workspace-context";
import { expected } from "../service";
import {
  configuration,
  draft,
  run,
  binding,
  coverage,
  writable,
  acceptedAuthority,
  notClosed,
} from "./context";
import { insertDraft, advance, acceptedDetails } from "./service";
import { bounded, list, raw, sha } from "./validation";
import { hash } from "./hash";
import type { Configuration } from "./types";
function rebaseInput(value: unknown, mutation = false) {
  bounded(value);
  const r = object(value, [
    ...(mutation ? commonKeys : []),
    "expected_version",
    "revision_id",
    "coverage",
    "field_decisions",
    "proposal_signature",
  ]);
  return {
    ...(mutation
      ? common(r)
      : { operation_id: "", schema_version: 1 as const, reason: "" }),
    expected_version: version(r.expected_version),
    revision_id: uuid(r.revision_id, "revision_id"),
    coverage: coverage(r.coverage),
    field_decisions: list(r.field_decisions, "field_decisions", 64).map((v) => {
      const x = object(v, ["key", "choice", "reason"]);
      return {
        key: raw(x.key, "key"),
        choice: choice(x.choice, "choice", ["source", "keep-entered"] as const),
        reason: label(x.reason, "reason", 1000),
      };
    }),
    proposal_signature:
      r.proposal_signature === undefined ? null : sha(r.proposal_signature),
  };
}
async function preview(
  c: PoolClient,
  p: Principal,
  cfg: Configuration,
  input: ReturnType<typeof rebaseInput>,
) {
  await writable(c, p, cfg);
  expected(cfg.version, input.expected_version);
  const old = await draft(c, p, cfg),
    source = await binding(
      c,
      p,
      cfg.estimating_workspace_id,
      cfg.option_id,
      input.revision_id,
      input.coverage,
    ),
    next = await revisionAuthority(c, p, old.g, source.revision_id, true);
  const changes = Object.entries(old.d.proposal.inputs)
    .filter(([, v]) => v.attribution.kind === "inherited")
    .flatMap(([key, v]) => {
      const f = next.input?.configuration?.facts.find(
        (f) => f.id === v.attribution.source_field,
      );
      return !f || String(f.value) !== v.raw
        ? [
            {
              key,
              before: v.raw,
              after: f ? String(f.value) : null,
              decision:
                input.field_decisions.find((d) => d.key === key) ?? null,
            },
          ]
        : [];
    });
  if (
    new Set(input.field_decisions.map((d) => d.key)).size !==
      input.field_decisions.length ||
    input.field_decisions.some((d) => !changes.some((c) => c.key === d.key))
  )
    throw new AppError(
      422,
      "SpecialistDecisionInvalid",
      "Resolve each changed inherited field once.",
    );
  const proposal = structuredClone(old.d.proposal);
  for (const change of changes) {
    if (!change.decision) continue;
    const v = proposal.inputs[change.key];
    if (change.decision.choice === "source") {
      if (change.after === null)
        throw new AppError(
          422,
          "SpecialistSourceChanged",
          "The inherited fact was removed. Keep it explicitly as entered evidence or supply the missing fact in discovery.",
        );
      v.raw = change.after;
    } else
      v.attribution = {
        kind: "entered",
        note: `Retained from ${old.d.binding.revision_id}: ${change.decision.reason}`,
        source_field: null,
      };
  }
  for (const m of Object.values(proposal.manual_quantities))
    m.basis_hash = null;
  return {
    old_binding: old.d.binding,
    new_binding: source,
    changes,
    source_facts_before: old.r.input?.configuration?.facts ?? [],
    source_facts_after: next.input?.configuration?.facts ?? [],
    proposal,
    proposal_signature: hash({
      configuration_id: cfg.id,
      version: cfg.version,
      old: old.d.content_hash,
      source,
      decisions: input.field_decisions,
    }),
  };
}
export async function previewRebase(p: Principal, id: string, value: unknown) {
  const input = rebaseInput(value);
  return transaction(async (c) =>
    preview(c, p, await configuration(c, p, id, true), input),
  );
}
export async function rebaseSource(p: Principal, id: string, value: unknown) {
  const input = { ...rebaseInput(value, true), id };
  return sharedOperation(
    p,
    input,
    "RebaseSpecialistSource",
    async (c) => {
      await notClosed(c, p, input.operation_id);
      return (
        (await acceptedAuthority(c, p, id, input.operation_id)) ??
        configuration(c, p, id, true)
      );
    },
    async (c, cfg) => {
      const result = await preview(c, p, cfg, input);
      if (
        result.proposal_signature !== input.proposal_signature ||
        result.changes.some((x) => !x.decision)
      )
        throw new AppError(
          409,
          "SpecialistReviewRequired",
          "Review the exact source and inherited-field changes before rebasing.",
        );
      const next = randomUUID(),
        updated = await advance(c, p, cfg, next);
      await insertDraft(
        c,
        p,
        updated,
        next,
        result.new_binding,
        result.proposal,
        input.reason,
        cfg.current_draft_id,
      );
      return {
        ...updated,
        audit_details: {
          ...acceptedDetails(updated),
          previous_draft_id: cfg.current_draft_id,
        },
      };
    },
    "SpecialistConfiguration",
    "SpecialistConfigurationSaved",
  );
}
export async function copyConfiguration(
  p: Principal,
  id: string,
  value: unknown,
) {
  bounded(value);
  const r = object(value, [
      ...commonKeys,
      "id",
      "name",
      "source_run_id",
      "estimating_workspace_id",
      "option_id",
      "revision_id",
      "coverage",
      "expected_workspace_version",
    ]),
    input = {
      ...common(r),
      source_id: uuid(id, "source_id"),
      id: uuid(r.id, "id"),
      name: label(r.name, "name", 200),
      source_run_id: uuid(r.source_run_id, "source_run_id"),
      estimating_workspace_id: uuid(
        r.estimating_workspace_id,
        "estimating_workspace_id",
      ),
      option_id: uuid(r.option_id, "option_id"),
      revision_id: uuid(r.revision_id, "revision_id"),
      coverage: coverage(r.coverage),
      expected_workspace_version: version(r.expected_workspace_version),
    };
  return sharedOperation(
    p,
    input,
    "CopySpecialistConfiguration",
    async (c) => {
      await notClosed(c, p, input.operation_id);
      const source = await configuration(c, p, id),
        saved = await run(c, p, source, input.source_run_id),
        g = await workspaceAuthority(c, p, input.estimating_workspace_id, true);
      return {
        source,
        saved,
        g,
        accepted: await acceptedAuthority(c, p, input.id, input.operation_id),
      };
    },
    async (c, { source, saved, g }) => {
      expected(g.version, input.expected_workspace_version);
      await requireDraftGroup(c, p, g);
      const destination = await binding(
          c,
          p,
          g.id,
          input.option_id,
          input.revision_id,
          input.coverage,
        ),
        next = randomUUID();
      const cfg = (
        await c.query<Configuration>(
          "INSERT INTO ppo.specialist_configurations(id,workspace_id,company_id,estimating_workspace_id,option_id,display_number,name,owner_id,current_draft_id,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$8,$8) RETURNING *",
          [
            input.id,
            p.workspace_id,
            g.company_id,
            g.id,
            input.option_id,
            `SYN-PPO-CFG-${input.id}`,
            input.name,
            p.actor_id,
            next,
          ],
        )
      ).rows[0];
      const proposal = structuredClone(saved.snapshot.proposal);
      for (const v of Object.values(proposal.inputs))
        v.attribution = {
          kind: "assumption",
          source_field: null,
          note: `Copied proposal from ${source.id}, run ${saved.id}; destination confirmation required`,
        };
      for (const m of Object.values(proposal.manual_quantities))
        m.basis_hash = null;
      await insertDraft(
        c,
        p,
        cfg,
        next,
        destination,
        proposal,
        input.reason,
        null,
      );
      return {
        ...cfg,
        audit_details: {
          ...acceptedDetails(cfg),
          source_configuration_id: source.id,
          source_draft_id: saved.draft_id,
          source_run_id: saved.id,
        },
      };
    },
    "SpecialistConfiguration",
    "SpecialistConfigurationSaved",
  );
}
