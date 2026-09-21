import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { AppError, unavailable } from "../../platform/errors";
import { sharedOperation } from "../../platform/operations";
import {
  estimateContext,
  versionContext,
  acceptedEstimateContext,
  type Estimate,
} from "../context";
import {
  optionContext,
  revisionAuthority,
} from "../discovery-workspace-context";
import { prepareDiscoveryTargets } from "../discovery-context";
import { expected, insertVersion, versionHash } from "../service";
import { parseLines } from "../validation";
import { calculate as money, type CostLine } from "../math";
import {
  configuration,
  draft,
  run,
  resolved,
  writable,
  acceptedAuthority,
  notClosed,
  mismatch,
} from "./context";
import { adoptionRequest } from "./validation";
import { exact } from "./engine";
import { compare, requireResolved } from "./compare";
import { readLineage, writeLineage } from "./lineage";
import {
  receivingPolicy,
  receivingPolicyHash,
  profile,
} from "./fixture-policy";
import { hash } from "./hash";
import type {
  AdoptionRequest,
  Configuration,
  Contribution,
  Diagnostic,
} from "./types";
function lineId(
  configurationId: string,
  key: string,
  part: string,
  unit: string,
) {
  const h = hash({ configurationId, key, part, unit });
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
async function build(
  c: PoolClient,
  p: Principal,
  cfg: Configuration,
  input: AdoptionRequest,
) {
  const g = await writable(c, p, cfg);
  expected(cfg.version, input.expected_configuration_version);
  expected(g.version, input.expected_workspace_version);
  const savedRun = await run(c, p, cfg, input.run_id, true),
    set = await resolved(c, p, cfg, input.resolved_set_id, true);
  if (
    set.run_id !== savedRun.id ||
    set.content_hash !== input.resolved_set_hash ||
    cfg.current_run_id !== savedRun.id ||
    cfg.current_resolved_id !== set.id
  )
    throw new AppError(
      409,
      "SpecialistPreviewChanged",
      "Review the current immutable run and resolved-set revision.",
    );
  const e = await estimateContext(c, p, input.estimate_id, "estimating.edit"),
    v = await versionContext(c, p, e, input.estimate_version_id);
  expected(e.version, input.expected_estimate_version);
  if (e.current_version_id !== v.id || versionHash(v) !== v.content_hash)
    mismatch();
  if (e.company_id !== cfg.company_id || e.option_id !== cfg.option_id)
    throw unavailable();
  const lineage = await readLineage(c, p, v),
    prior = lineage?.snapshot.contributions ?? [],
    owned = prior.filter((x) => x.configuration_id === cfg.id),
    others = prior.filter((x) => x.configuration_id !== cfg.id);
  const blockers: Diagnostic[] = [],
    block = (code: string, message: string, key: string | null = null) =>
      blockers.push({
        code,
        severity: "Error",
        key,
        field: null,
        message,
        source: receivingPolicy.id,
        action:
          "Review the exact saved source, mapping, prices or comparison before applying",
      });
  const source = savedRun.snapshot.binding,
    option = await optionContext(c, g, cfg.option_id),
    revision = await revisionAuthority(c, p, g, source.revision_id, true);
  const currentTargets = await prepareDiscoveryTargets(
    c,
    p,
    g.opportunity_id,
    revision.input,
  );
  if (
    option.state !== "Active" ||
    g.selected_option_id !== cfg.option_id ||
    option.current_revision_id !== source.revision_id ||
    revision.scope_readiness !== "Complete" ||
    currentTargets.compiled.scope_readiness !== "Complete"
  )
    block(
      "SpecialistSourceChanged",
      "Receiving requires the selected Active alternative and current Complete saved discovery.",
    );
  if (
    !e.discovery_basis ||
    e.discovery_basis.revision_id !== source.revision_id ||
    e.discovery_basis.context_hash !== source.context_hash ||
    input.discovery_revision_id !== source.revision_id ||
    input.source_context_hash !== source.context_hash ||
    currentTargets.context_hash !== source.context_hash
  )
    block(
      "SpecialistSourceChanged",
      "Adopt the exact discovery basis for costing and review any source rebase first.",
    );
  const latest = await draft(c, p, cfg);
  if (
    hash(latest.d.binding) !== hash(source) ||
    hash(latest.d.proposal) !== hash(savedRun.snapshot.proposal)
  )
    block(
      "SpecialistReviewRequired",
      "A newer draft is not the saved review run. Save a current run before receiving.",
    );
  const policy = (
    await c.query("SELECT * FROM ppo.specialist_policies WHERE id=$1", [
      receivingPolicy.id,
    ])
  ).rows[0];
  if (
    !policy ||
    policy.content_hash !== receivingPolicyHash ||
    hash(policy.manifest) !== receivingPolicyHash
  )
    mismatch();
  const fixture = receivingPolicy.context;
  if (
    input.receiving_policy_id !== receivingPolicy.id ||
    input.receiving_policy_hash !== receivingPolicyHash ||
    p.workspace_id !== fixture.workspace ||
    cfg.company_id !== fixture.company ||
    cfg.id !== fixture.configuration ||
    source.revision_id !== fixture.revision ||
    cfg.estimating_workspace_id !== fixture.estimating_workspace ||
    cfg.option_id !== fixture.option ||
    source.site_id !== fixture.site ||
    hash(source.facility_ids) !== hash([fixture.facility]) ||
    source.kind !== "FacilityScope" ||
    !receivingPolicy.profiles.includes(profile(savedRun.snapshot.proposal))
  )
    block(
      "SpecialistEligibilityBlocked",
      "This run is outside the exact SYN-ES08-RECEIVE-01 fixture profiles. Native review remains available.",
    );
  for (const warning of savedRun.snapshot.calculation.diagnostics)
    if (!receivingPolicy.permitted_findings.includes(warning.code))
      block(
        "SpecialistEligibilityBlocked",
        `The synthetic policy does not permit finding ${warning.code}.`,
        warning.key,
      );
  const proposed: { key: string; value: CostLine }[] = [],
    mapping = new Map(receivingPolicy.mappings.map((m) => [m.key, m]));
  for (const l of set.snapshot.lines) {
    if (l.excluded || l.row >= 383) continue;
    if (l.effective_quantity === null) {
      block(
        "SpecialistReviewRequired",
        "An active required quantity remains unresolved.",
        l.key,
      );
      continue;
    }
    const qty = exact(l.effective_quantity);
    if (qty.cmp(0) === 0) continue;
    const m = mapping.get(l.key);
    if (
      !m ||
      m.unit !== l.unit ||
      l.part_state === "Conflict" ||
      (l.part_id !== m.part_id &&
        !(
          l.key === "CE-LINE-223" &&
          m.part_id === "SYN-SCREEN-CLOTH-01" &&
          l.part_state === "Not in catalogue"
        ))
    ) {
      block(
        "SpecialistMappingUnresolved",
        "No exact reviewed synthetic part/unit mapping exists.",
        l.key,
      );
      continue;
    }
    const quantity = qty.exact(3);
    if (quantity === null || qty.cmp(100000) > 0) {
      block(
        "SpecialistPrecisionUnsupported",
        "Quantity cannot be represented exactly within native three-decimal / 100,000 limits.",
        l.key,
      );
      continue;
    }
    const rate = input.price_and_unit_proposals.find((x) => x.key === l.key);
    if (!rate) {
      block(
        "SpecialistPriceUnavailable",
        "Enter reviewed AUD unit cost, sell, source date and reason.",
        l.key,
      );
      continue;
    }
    const old = owned.find((x) => x.key === l.key),
      id =
        old && old.part_id === m.part_id && old.unit === m.unit
          ? old.line_id
          : lineId(cfg.id, l.key, m.part_id, m.unit);
    try {
      const line = parseLines(
        [
          {
            id,
            description: l.description,
            category: m.category,
            allowance: m.allowance,
            quantity,
            unit: m.unit,
            unit_cost: rate.unit_cost,
            unit_sell: rate.unit_sell,
            source: `SYN-ES08 AUD proposal: ${rate.reason}`,
            effective_date: rate.effective_date,
          },
        ],
        2,
      )[0];
      proposed.push({ key: l.key, value: line });
    } catch (error) {
      if (error instanceof AppError)
        block(
          "SpecialistPriceInvalid",
          "Review native AUD precision, sell ≥ cost, source and date.",
          l.key,
        );
      else throw error;
    }
  }
  if (
    input.price_and_unit_proposals.some(
      (x) => !set.snapshot.lines.some((l) => l.key === x.key),
    )
  )
    throw new AppError(
      422,
      "SpecialistPriceInvalid",
      "A price proposal names no saved resolved position.",
    );
  const rows = compare(
    owned.map((x) => ({ key: x.key, value: x.generated })),
    owned.flatMap((x) => {
      const current = v.lines.find((l) => l.id === x.line_id);
      return current ? [{ key: x.key, value: current }] : [];
    }),
    proposed,
    input.decisions,
    (a, b) => a.id === b.id && a.unit === b.unit,
  );
  // A retained removal is a deliberate manual contribution even when its
  // numeric tuple happens to equal the returning generated proposal.
  for (const row of rows) {
    const priorContribution = owned.find((x) => x.key === row.key);
    if (
      priorContribution?.disposition === "RetainedManual" &&
      row.current &&
      row.candidate &&
      row.kind !== "Incompatible"
    ) {
      row.kind = "Manual edit";
      row.required = true;
      if (!row.decision) row.resolved = null;
    }
  }
  for (const row of rows)
    if (row.required && !row.decision)
      block(
        "SpecialistReviewRequired",
        `Resolve ${row.kind.toLowerCase()} against the current estimate.`,
        row.key,
      );
  const removedIds = new Set(owned.map((x) => x.line_id)),
    lines = v.lines.filter((l) => !removedIds.has(l.id));
  // Keep surviving unrelated lines byte-for-byte and in their original positions.
  const replacements = new Map(
    rows.flatMap((r) =>
      r.resolved ? [[r.resolved.id, r.resolved] as const] : [],
    ),
  );
  const full = v.lines.flatMap((l) =>
    removedIds.has(l.id)
      ? replacements.has(l.id)
        ? [replacements.get(l.id)!]
        : []
      : [l],
  );
  for (const row of rows)
    if (row.resolved && !full.some((l) => l.id === row.resolved!.id))
      full.push(row.resolved);
  if (full.length > 100)
    block(
      "SpecialistCapacityExceeded",
      `The resulting estimate has ${full.length} lines (${lines.length} unrelated). Maximum 100; no lines were truncated.`,
    );
  if (new Set(full.map((l) => l.id)).size !== full.length)
    throw new AppError(
      422,
      "SpecialistDuplicateKey",
      "Receiving would duplicate a cost-line identity.",
    );
  const contributions: Contribution[] = [
    ...others,
    ...rows.flatMap((row) => {
      const old = owned.find((x) => x.key === row.key),
        candidate = proposed.find((x) => x.key === row.key)?.value,
        m = mapping.get(row.key),
        adopted = row.resolved ?? candidate ?? old?.adopted;
      if (!adopted) return [];
      return [
        {
          configuration_id: cfg.id,
          key: row.key,
          run_id: savedRun.id,
          resolved_set_id: set.id,
          resolved_set_hash: set.content_hash,
          line_id: adopted.id,
          part_id:
            row.decision?.choice === "retain"
              ? old!.part_id
              : (m?.part_id ?? old!.part_id),
          unit: adopted.unit,
          generated: candidate ?? old!.generated,
          adopted,
          current: row.resolved,
          disposition:
            row.decision?.choice === "retain"
              ? ("RetainedManual" as const)
              : row.resolved
                ? ("Owned" as const)
                : ("Omitted" as const),
          source_revision_id: source.revision_id,
          source_basis_changed: false,
          mapping_policy: receivingPolicy.mapping_version,
          price_policy: receivingPolicy.price_policy,
        },
      ];
    }),
  ];
  const totals = money(full),
    adoptionBasis = {
      run_id: savedRun.id,
      resolved_set_id: set.id,
      resolved_set_hash: set.content_hash,
      policy_id: receivingPolicy.id,
      policy_hash: receivingPolicyHash,
      source_revision_id: source.revision_id,
      lines: full,
      contributions,
    };
  const last = (
    await c.query(
      "SELECT id,snapshot,content_hash FROM ppo.specialist_adoptions WHERE workspace_id=$1 AND configuration_id=$2 AND estimate_version_id=$3",
      [p.workspace_id, cfg.id, v.id],
    )
  ).rows[0];
  if (last && hash(last.snapshot) !== last.content_hash) mismatch();
  const alreadyCurrent = Boolean(
    last && hash(last.snapshot.adoption_basis) === hash(adoptionBasis),
  );
  return {
    configuration_id: cfg.id,
    run_id: savedRun.id,
    resolved_set_id: set.id,
    source_binding: source,
    estimate_id: e.id,
    estimate_version_id: v.id,
    expected_configuration_version: cfg.version,
    expected_workspace_version: g.version,
    expected_estimate_version: e.version,
    policy_id: receivingPolicy.id,
    policy_hash: receivingPolicyHash,
    blockers,
    comparison: rows,
    lines: full,
    totals,
    previous_totals: money(v.lines),
    contributions,
    already_current: alreadyCurrent,
    existing_adoption_id: last?.id ?? null,
    adoption_basis: adoptionBasis,
    proposal_signature: hash({
      input,
      configuration_version: cfg.version,
      estimate_hash: v.content_hash,
      lineage_hash: lineage?.content_hash ?? null,
      run_hash: savedRun.evidence_hash,
      set_hash: set.content_hash,
      adoptionBasis,
    }),
    e,
    v,
  };
}
const publicPreview = (result: Awaited<ReturnType<typeof build>>) => {
  const { e: _, v: __, ...dto } = result;
  void _;
  void __;
  return dto;
};
export async function previewReceiving(
  p: Principal,
  id: string,
  value: unknown,
) {
  const parsed = adoptionRequest(value),
    {
      operation_id: _,
      reason: __,
      schema_version: ___,
      proposal_signature: ____,
      ...input
    } = parsed;
  void _;
  void __;
  void ___;
  void ____;
  return transaction(async (c) =>
    publicPreview(
      await build(c, p, await configuration(c, p, id, true), input),
    ),
  );
}
export async function applyReceiving(p: Principal, id: string, value: unknown) {
  const parsed = adoptionRequest(value, true),
    { operation_id, reason, schema_version, proposal_signature, ...request } =
      parsed,
    input = { ...parsed, id };
  return sharedOperation(
    p,
    input,
    "ApplySpecialistConfiguration",
    async (c) => {
      await notClosed(c, p, operation_id);
      const accepted = await acceptedEstimateContext(
        c,
        p,
        request.estimate_id,
        operation_id,
      );
      const cfg = accepted
        ? await acceptedAuthority(c, p, id, operation_id)
        : await configuration(c, p, id, true);
      if (!cfg) throw unavailable();
      return cfg;
    },
    async (c, cfg) => {
      const preview = await build(c, p, cfg, request);
      if (preview.proposal_signature !== proposal_signature)
        throw new AppError(
          409,
          "SpecialistPreviewChanged",
          "Review the exact current estimate comparison before applying.",
        );
      if (preview.blockers.length)
        throw new AppError(
          422,
          preview.blockers[0].code,
          preview.blockers[0].message,
          preview.blockers.map((b) => ({
            field: b.key ?? "receiving",
            message: b.message,
          })),
        );
      requireResolved(preview.comparison);
      const { e, v } = preview;
      if (preview.already_current)
        return {
          ...e,
          audit_details: {
            configuration_id: cfg.id,
            draft_id: (await run(c, p, cfg, request.run_id)).draft_id,
            run_id: request.run_id,
            resolved_set_id: request.resolved_set_id,
            saved_version_id: v.id,
            adoption_id: preview.existing_adoption_id,
            outcome: "Already current",
          },
        };
      // Validate the complete resulting native estimate, retaining the existing line ordering.
      parseLines(preview.lines, 2);
      const next = randomUUID(),
        adoptionId = randomUUID();
      const updated = (
        await c.query<Estimate>(
          "UPDATE ppo.estimates SET version=version+1,current_version_id=$3,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, e.id, next, p.actor_id],
        )
      ).rows[0];
      await insertVersion(
        c,
        p,
        updated,
        {
          schema_version: 2,
          title: v.title,
          scope: v.scope,
          lines: preview.lines,
          policy: "SYN-EST-ARITHMETIC-01",
          reason,
        },
        next,
        v.id,
      );
      await c.query(
        "INSERT INTO ppo.estimate_discovery_bases(workspace_id,company_id,estimate_id,estimate_version_id,revision_id) SELECT workspace_id,company_id,estimate_id,$3,revision_id FROM ppo.estimate_discovery_bases WHERE workspace_id=$1 AND estimate_version_id=$2",
        [p.workspace_id, v.id, next],
      );
      await writeLineage(c, p, next, v.id, preview.contributions);
      const snapshot = {
        schema_version,
        adoption_basis: preview.adoption_basis,
        predecessor_estimate_version_id: v.id,
        result_estimate_version_id: next,
        decisions: request.decisions,
        prices: request.price_and_unit_proposals,
        proposal_signature,
        reason,
        created_by: p.actor_id,
      };
      await c.query(
        "INSERT INTO ppo.specialist_adoptions(id,workspace_id,company_id,configuration_id,run_id,resolved_set_id,estimate_id,estimate_version_id,policy_id,snapshot,content_hash,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
        [
          adoptionId,
          p.workspace_id,
          cfg.company_id,
          cfg.id,
          request.run_id,
          request.resolved_set_id,
          e.id,
          next,
          receivingPolicy.id,
          snapshot,
          hash(snapshot),
          p.actor_id,
        ],
      );
      return {
        ...updated,
        audit_details: {
          configuration_id: cfg.id,
          draft_id: (await run(c, p, cfg, request.run_id)).draft_id,
          run_id: request.run_id,
          resolved_set_id: request.resolved_set_id,
          saved_version_id: next,
          adoption_id: adoptionId,
          predecessor_id: v.id,
        },
      };
    },
    "Estimate",
    "EstimateVersionSaved",
  );
}
