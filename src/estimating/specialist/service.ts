import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { sharedOperation } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import {
  object,
  common,
  commonKeys,
  uuid,
  version,
  label,
  choice,
} from "../../shared/validation";
import {
  workspaceAuthority,
  optionContext,
  requireActiveOption,
  requireDraftGroup,
  revisionAuthority,
} from "../discovery-workspace-context";
import { expected } from "../service";
import { bundleId, bundleHash, definition } from "./definition";
import { bounded, proposal, draftRequest, sha, list, raw } from "./validation";
import {
  configuration,
  draft,
  run,
  resolved,
  binding,
  coverage,
  requireAvailable,
  writable,
  acceptedAuthority,
  notClosed,
  validateInherited,
} from "./context";
import { calculate, commercial } from "./engine";
import { R } from "./rational";
import { hash } from "./hash";
import { comparePositions, requireResolved } from "./compare";
import type {
  Binding,
  Configuration,
  DraftProposal,
  RunSnapshot,
  ResolvedSnapshot,
  Decision,
} from "./types";

export async function insertDraft(
  c: PoolClient,
  p: Principal,
  cfg: Configuration,
  id: string,
  source: Binding,
  proposal: DraftProposal,
  reason: string,
  predecessor: string | null,
) {
  const rev = await revisionAuthority(
    c,
    p,
    await workspaceAuthority(c, p, cfg.estimating_workspace_id, true),
    source.revision_id,
    true,
  );
  validateInherited(proposal, rev);
  await c.query(
    `INSERT INTO ppo.specialist_drafts(id,workspace_id,company_id,configuration_id,option_id,revision_id,version,predecessor_id,binding,proposal,content_hash,definition_id,definition_hash,created_by,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      id,
      p.workspace_id,
      cfg.company_id,
      cfg.id,
      cfg.option_id,
      source.revision_id,
      cfg.version,
      predecessor,
      source,
      proposal,
      hash({ binding: source, proposal }),
      bundleId,
      bundleHash,
      p.actor_id,
      reason,
    ],
  );
}
export async function advance(
  c: PoolClient,
  p: Principal,
  cfg: Configuration,
  draftId: string,
  runId = cfg.current_run_id,
  resolvedId = cfg.current_resolved_id,
) {
  return (
    await c.query<Configuration>(
      "UPDATE ppo.specialist_configurations SET version=version+1,current_draft_id=$3,current_run_id=$4,current_resolved_id=$5,updated_by=$6,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
      [p.workspace_id, cfg.id, draftId, runId, resolvedId, p.actor_id],
    )
  ).rows[0];
}
export const acceptedDetails = (cfg: Configuration) => ({
  configuration_id: cfg.id,
  draft_id: cfg.current_draft_id,
  run_id: cfg.current_run_id,
  resolved_set_id: cfg.current_resolved_id,
});
async function commandAuthority(
  c: PoolClient,
  p: Principal,
  id: string,
  operationId: string,
) {
  await requireAvailable(c);
  await notClosed(c, p, operationId);
  return (
    (await acceptedAuthority(c, p, id, operationId)) ??
    (await configuration(c, p, id, true))
  );
}
export async function createConfiguration(p: Principal, value: unknown) {
  bounded(value);
  const r = object(value, [
      ...commonKeys,
      "id",
      "name",
      "estimating_workspace_id",
      "option_id",
      "revision_id",
      "coverage",
      "proposal",
      "expected_workspace_version",
    ]),
    input = {
      ...common(r),
      id: uuid(r.id, "id"),
      name: label(r.name, "name", 200),
      estimating_workspace_id: uuid(
        r.estimating_workspace_id,
        "estimating_workspace_id",
      ),
      option_id: uuid(r.option_id, "option_id"),
      revision_id: uuid(r.revision_id, "revision_id"),
      coverage: coverage(r.coverage),
      proposal: proposal(r.proposal),
      expected_workspace_version: version(r.expected_workspace_version),
    };
  return sharedOperation(
    p,
    input,
    "CreateSpecialistConfiguration",
    async (c) => {
      await requireAvailable(c);
      await notClosed(c, p, input.operation_id);
      const accepted = await acceptedAuthority(
        c,
        p,
        input.id,
        input.operation_id,
      );
      if (accepted) return { accepted, g: null, source: null };
      const g = await workspaceAuthority(
          c,
          p,
          input.estimating_workspace_id,
          true,
        ),
        source = await binding(
          c,
          p,
          g.id,
          input.option_id,
          input.revision_id,
          input.coverage,
        );
      return { accepted: null, g, source };
    },
    async (c, { g, source }) => {
      if (!g || !source) throw unavailable();
      expected(g.version, input.expected_workspace_version);
      await requireDraftGroup(c, p, g);
      requireActiveOption(await optionContext(c, g, input.option_id));
      const draftId = randomUUID(),
        cfg = (
          await c.query<Configuration>(
            `INSERT INTO ppo.specialist_configurations(id,workspace_id,company_id,estimating_workspace_id,option_id,display_number,name,owner_id,current_draft_id,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$8,$8) RETURNING *`,
            [
              input.id,
              p.workspace_id,
              g.company_id,
              g.id,
              input.option_id,
              `SYN-PPO-CFG-${input.id}`,
              input.name,
              p.actor_id,
              draftId,
            ],
          )
        ).rows[0];
      await insertDraft(
        c,
        p,
        cfg,
        draftId,
        source,
        input.proposal,
        input.reason,
        null,
      );
      return { ...cfg, audit_details: acceptedDetails(cfg) };
    },
    "SpecialistConfiguration",
    "SpecialistConfigurationSaved",
  );
}
export async function calculatePreview(
  c: PoolClient,
  p: Principal,
  cfg: Configuration,
  proposal: DraftProposal,
  decisions: Decision[],
  expectedVersion: number,
) {
  expected(cfg.version, expectedVersion);
  const { d, r } = await draft(c, p, cfg);
  validateInherited(proposal, r);
  const calculation = calculate(proposal),
    current = cfg.current_resolved_id
      ? await resolved(c, p, cfg, cfg.current_resolved_id)
      : null;
  const comparison =
    calculation.state === "Current"
      ? comparePositions(
          current?.snapshot.baseline ?? [],
          current?.snapshot.lines ?? [],
          calculation.positions,
          decisions,
        )
      : [];
  const resolvedLines = comparison.flatMap((d) =>
    d.resolved
      ? [
          d.decision?.choice === "retain"
            ? {
                ...d.resolved,
                origin: "retained manual" as const,
                edit_reason: d.decision.reason,
              }
            : d.resolved,
        ]
      : [],
  );
  const resolvedCommercial =
    calculation.state === "Current"
      ? commercial(proposal, resolvedLines)
      : calculation.commercial;
  if (comparison.some((row) => row.required && !row.decision)) {
    resolvedCommercial.complete = false;
    resolvedCommercial.missing.push(
      ...comparison
        .filter((row) => row.required && !row.decision)
        .map((row) => row.key),
    );
    for (const key of [
      "materials",
      "discount",
      "freight",
      "before",
      "total",
      "cost",
      "rounding_adjustment",
    ] as const)
      resolvedCommercial[key] = null;
  }
  return {
    expected_configuration_version: cfg.version,
    source_binding: d.binding,
    calculation,
    comparison,
    resolved_lines: resolvedLines,
    resolved_commercial: resolvedCommercial,
    proposal_signature: hash({
      configuration_id: cfg.id,
      version: cfg.version,
      binding: d.binding,
      proposal,
      decisions,
      current_resolved_hash: current?.content_hash ?? null,
    }),
  };
}
export async function previewConfiguration(
  p: Principal,
  id: string,
  value: unknown,
) {
  const input = draftRequest(value, false);
  return transaction(async (c) => {
    const cfg = await configuration(c, p, id);
    return calculatePreview(
      c,
      p,
      cfg,
      input.proposal,
      input.decisions,
      input.expected_version,
    );
  });
}
export async function saveDraft(p: Principal, id: string, value: unknown) {
  const parsed = draftRequest(value),
    input = {
      ...common(
        object(value, [
          ...commonKeys,
          "expected_version",
          "proposal",
          "decisions",
          "proposal_signature",
        ]),
      ),
      id: uuid(id, "id"),
      expected_version: parsed.expected_version,
      proposal: parsed.proposal,
    };
  return sharedOperation(
    p,
    input,
    "SaveSpecialistDraft",
    (c) => commandAuthority(c, p, id, input.operation_id),
    async (c, cfg) => {
      await writable(c, p, cfg);
      expected(cfg.version, input.expected_version);
      const { d } = await draft(c, p, cfg),
        next = randomUUID(),
        updated = await advance(c, p, cfg, next);
      await insertDraft(
        c,
        p,
        updated,
        next,
        d.binding,
        input.proposal,
        input.reason,
        d.id,
      );
      return { ...updated, audit_details: acceptedDetails(updated) };
    },
    "SpecialistConfiguration",
    "SpecialistConfigurationSaved",
  );
}
export async function saveRun(p: Principal, id: string, value: unknown) {
  const parsed = draftRequest(value),
    input = {
      ...common(
        object(value, [
          ...commonKeys,
          "expected_version",
          "proposal",
          "decisions",
          "proposal_signature",
        ]),
      ),
      id: uuid(id, "id"),
      expected_version: parsed.expected_version,
      proposal: parsed.proposal,
      decisions: parsed.decisions,
      proposal_signature: parsed.proposal_signature,
    };
  return sharedOperation(
    p,
    input,
    "SaveSpecialistRun",
    (c) => commandAuthority(c, p, id, input.operation_id),
    async (c, cfg) => {
      await writable(c, p, cfg);
      const preview = await calculatePreview(
        c,
        p,
        cfg,
        input.proposal,
        input.decisions,
        input.expected_version,
      );
      if (input.proposal_signature !== preview.proposal_signature)
        throw new AppError(
          409,
          "SpecialistPreviewChanged",
          "Review the exact current calculation before saving.",
        );
      if (
        preview.calculation.state !== "Current" ||
        preview.calculation.manual_review_required.length
      )
        throw new AppError(
          409,
          "SpecialistReviewRequired",
          "Correct calculation errors and review all 14 manual quantities against this basis.",
        );
      requireResolved(preview.comparison);
      const draftId = randomUUID(),
        runId = randomUUID(),
        setId = randomUUID(),
        at = (await c.query<{ at: Date }>("SELECT clock_timestamp() AS at"))
          .rows[0].at,
        updated = await advance(c, p, cfg, draftId, runId, setId);
      await insertDraft(
        c,
        p,
        updated,
        draftId,
        preview.source_binding,
        input.proposal,
        input.reason,
        cfg.current_draft_id,
      );
      const snapshot: RunSnapshot = {
        schema_version: 1,
        configuration_id: cfg.id,
        draft_id: draftId,
        binding: preview.source_binding,
        proposal: input.proposal,
        calculation: preview.calculation,
        manual_reviews: Object.fromEntries(
          Object.entries(input.proposal.manual_quantities).map(
            ([key, review]) => [
              key,
              {
                ...review,
                reviewed_by: p.actor_id,
                reviewed_at: at.toISOString(),
              },
            ],
          ),
        ),
        decisions: input.decisions,
        predecessor_id: cfg.current_run_id,
        created_by: p.actor_id,
        created_at: at.toISOString(),
        reason: input.reason,
        definition_bundle_hash: bundleHash,
      };
      const sequence = Number(
        (
          await c.query(
            "SELECT coalesce(max(sequence),0)+1 AS n FROM ppo.specialist_runs WHERE workspace_id=$1 AND configuration_id=$2",
            [p.workspace_id, cfg.id],
          )
        ).rows[0].n,
      );
      await c.query(
        "INSERT INTO ppo.specialist_runs(id,workspace_id,configuration_id,draft_id,sequence,snapshot,evidence_hash,created_at,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          runId,
          p.workspace_id,
          cfg.id,
          draftId,
          sequence,
          snapshot,
          hash(snapshot),
          at,
          p.actor_id,
        ],
      );
      const resolvedSnapshot: ResolvedSnapshot = {
        schema_version: 1,
        run_id: runId,
        baseline: preview.calculation.positions,
        lines: preview.resolved_lines,
        decisions: input.decisions,
        commercial: preview.resolved_commercial,
        predecessor_id: cfg.current_resolved_id,
        created_by: p.actor_id,
        created_at: at.toISOString(),
        reason: input.reason,
      };
      await insertResolved(c, p, cfg, setId, resolvedSnapshot);
      return {
        ...updated,
        audit_details: {
          ...acceptedDetails(updated),
          evidence_hash: hash(snapshot),
        },
      };
    },
    "SpecialistConfiguration",
    "SpecialistConfigurationSaved",
  );
}
async function insertResolved(
  c: PoolClient,
  p: Principal,
  cfg: Configuration,
  id: string,
  snapshot: ResolvedSnapshot,
) {
  await c.query(
    "INSERT INTO ppo.specialist_resolved_sets(id,workspace_id,configuration_id,run_id,snapshot,content_hash) VALUES($1,$2,$3,$4,$5,$6)",
    [id, p.workspace_id, cfg.id, snapshot.run_id, snapshot, hash(snapshot)],
  );
}
export async function adjustResolved(p: Principal, id: string, value: unknown) {
  bounded(value);
  const r = object(value, [
      ...commonKeys,
      "expected_version",
      "resolved_set_id",
      "resolved_set_hash",
      "changes",
    ]),
    input = {
      ...common(r),
      id: uuid(id, "id"),
      expected_version: version(r.expected_version),
      resolved_set_id: uuid(r.resolved_set_id, "resolved_set_id"),
      resolved_set_hash: sha(r.resolved_set_hash),
      changes: list(r.changes, "changes", 143).map((v) => {
        const x = object(v, ["key", "quantity", "remove", "reason"]);
        if (typeof x.remove !== "boolean")
          throw new AppError(422, "InvalidData", "Choose remove explicitly.");
        return {
          key: raw(x.key, "key"),
          quantity: x.quantity === null ? null : raw(x.quantity, "quantity"),
          remove: x.remove,
          reason: label(x.reason, "reason", 1000),
        };
      }),
    };
  if (new Set(input.changes.map((x) => x.key)).size !== input.changes.length)
    throw new AppError(
      422,
      "SpecialistDuplicateKey",
      "Duplicate adjustments are not accepted.",
    );
  return sharedOperation(
    p,
    input,
    "SaveSpecialistResolvedSet",
    (c) => commandAuthority(c, p, id, input.operation_id),
    async (c, cfg) => {
      await writable(c, p, cfg);
      expected(cfg.version, input.expected_version);
      if (cfg.current_resolved_id !== input.resolved_set_id)
        throw new AppError(
          409,
          "SpecialistPreviewChanged",
          "The resolved set changed.",
        );
      const prior = await resolved(c, p, cfg, input.resolved_set_id, true);
      if (prior.content_hash !== input.resolved_set_hash)
        throw new AppError(
          409,
          "SpecialistPreviewChanged",
          "The resolved evidence changed.",
        );
      const original = await run(c, p, cfg, prior.run_id);
      if (
        input.changes.some(
          (x) =>
            !prior.snapshot.lines.some((l) => l.key === x.key && l.row < 383),
        )
      )
        throw new AppError(
          422,
          "SpecialistDecisionInvalid",
          "Only existing non-adjustment lines can be edited.",
        );
      const lines = prior.snapshot.lines.flatMap((l) => {
        const change = input.changes.find((x) => x.key === l.key);
        if (!change) return [l];
        if (change.remove) return [];
        if (
          change.quantity === null ||
          !/^\d+(\.\d{1,6})?$/.test(change.quantity) ||
          R(change.quantity).cmp(1000000) > 0
        )
          throw new AppError(
            422,
            "InvalidData",
            "Use a bounded non-negative quantity.",
          );
        return [
          {
            ...l,
            effective_quantity: R(change.quantity).evidence(),
            origin: "manual" as const,
            edit_reason: change.reason,
          },
        ];
      });
      const setId = randomUUID(),
        snapshot: ResolvedSnapshot = {
          ...prior.snapshot,
          lines,
          commercial: commercial(original.snapshot.proposal, lines),
          predecessor_id: prior.id,
          reason: input.reason,
          created_by: p.actor_id,
          created_at: new Date().toISOString(),
        };
      await insertResolved(c, p, cfg, setId, snapshot);
      const updated = await advance(
        c,
        p,
        cfg,
        cfg.current_draft_id,
        cfg.current_run_id,
        setId,
      );
      return { ...updated, audit_details: acceptedDetails(updated) };
    },
    "SpecialistConfiguration",
    "SpecialistConfigurationSaved",
  );
}
export async function archiveConfiguration(
  p: Principal,
  id: string,
  value: unknown,
) {
  bounded(value);
  const r = object(value, [...commonKeys, "expected_version"]),
    input = {
      ...common(r),
      id: uuid(id, "id"),
      expected_version: version(r.expected_version),
    };
  return sharedOperation(
    p,
    input,
    "ArchiveSpecialistConfiguration",
    (c) => commandAuthority(c, p, id, input.operation_id),
    async (c, cfg) => {
      await writable(c, p, cfg);
      expected(cfg.version, input.expected_version);
      const updated = (
        await c.query<Configuration>(
          "UPDATE ppo.specialist_configurations SET state='Archived',version=version+1,updated_at=clock_timestamp(),updated_by=$3 WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, id, p.actor_id],
        )
      ).rows[0];
      return { ...updated, audit_details: acceptedDetails(updated) };
    },
    "SpecialistConfiguration",
    "SpecialistConfigurationSaved",
  );
}
export async function draftFromRun(p: Principal, id: string, value: unknown) {
  bounded(value);
  const r = object(value, [...commonKeys, "expected_version", "run_id"]),
    input = {
      ...common(r),
      id: uuid(id, "id"),
      expected_version: version(r.expected_version),
      run_id: uuid(r.run_id, "run_id"),
    };
  return sharedOperation(
    p,
    input,
    "CreateSpecialistDraftFromRun",
    (c) => commandAuthority(c, p, id, input.operation_id),
    async (c, cfg) => {
      await writable(c, p, cfg);
      expected(cfg.version, input.expected_version);
      const source = await run(c, p, cfg, input.run_id),
        next = randomUUID(),
        updated = await advance(c, p, cfg, next);
      const proposal = structuredClone(source.snapshot.proposal);
      for (const m of Object.values(proposal.manual_quantities))
        m.basis_hash = null;
      await insertDraft(
        c,
        p,
        updated,
        next,
        source.snapshot.binding,
        proposal,
        input.reason,
        cfg.current_draft_id,
      );
      return {
        ...updated,
        audit_details: {
          ...acceptedDetails(updated),
          source_run_id: source.id,
        },
      };
    },
    "SpecialistConfiguration",
    "SpecialistConfigurationSaved",
  );
}
export async function recordFinding(p: Principal, id: string, value: unknown) {
  bounded(value);
  const r = object(value, [
      ...commonKeys,
      "expected_version",
      "finding_id",
      "note",
      "next_action",
      "disposition",
    ]),
    input = {
      ...common(r),
      id: uuid(id, "id"),
      expected_version: version(r.expected_version),
      finding_id: label(r.finding_id, "finding_id", 30),
      note: label(r.note, "note", 1000),
      next_action: label(r.next_action, "next_action", 1000),
      disposition: choice(r.disposition, "disposition", [
        "Open",
        "Reviewed; unresolved",
      ] as const),
    };
  if (
    ![...definition.issues, ...definition.catalogue.quality].some(
      (f) => f.id === input.finding_id,
    )
  )
    throw new AppError(422, "InvalidData", "Unknown source finding.");
  return sharedOperation(
    p,
    input,
    "RecordSpecialistFindingReview",
    (c) => commandAuthority(c, p, id, input.operation_id),
    async (c, cfg) => {
      await writable(c, p, cfg);
      expected(cfg.version, input.expected_version);
      await c.query(
        "INSERT INTO ppo.specialist_reviews(id,workspace_id,configuration_id,draft_id,finding_id,note,owner_id,next_action,disposition,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$7)",
        [
          randomUUID(),
          p.workspace_id,
          id,
          cfg.current_draft_id,
          input.finding_id,
          input.note,
          p.actor_id,
          input.next_action,
          input.disposition,
        ],
      );
      const updated = await advance(c, p, cfg, cfg.current_draft_id);
      return { ...updated, audit_details: acceptedDetails(updated) };
    },
    "SpecialistConfiguration",
    "SpecialistConfigurationSaved",
  );
}
