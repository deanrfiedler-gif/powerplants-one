import { randomUUID } from "node:crypto";
import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { transaction } from "../../platform/database";
import { sharedOperation } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  invalid,
  choice,
} from "../../shared/validation";
import {
  workspaceAuthority,
  optionContext,
  revisionAuthority,
  requireActiveOption,
  requireDraftGroup,
} from "../discovery-workspace-context";
import { hash, digestBasis, type Saved } from "./service";
import {
  assessmentEdition,
  blankAssessment,
  type Assessment,
  type AssessmentResult,
} from "./assessment-model";
import { boundAssessment, parseAssessment } from "./assessment-validation";
import { assess } from "./assessment-engine";
import { assessmentOutputs } from "./assessment-output";
type Workspace = Awaited<ReturnType<typeof workspaceAuthority>>;
async function source(
  c: QueryClient,
  p: Principal,
  g: Workspace,
  optionId: string,
  revisionId?: string,
  edit = false,
) {
  const n = (
    await c.query<Saved>(
      "SELECT * FROM ppo.nursery_discovery_revisions WHERE workspace_id=$1 AND estimating_workspace_id=$2 AND option_id=$3" +
        (revisionId ? " AND id=$4" : "") +
        " ORDER BY version DESC LIMIT 1",
      [p.workspace_id, g.id, optionId, ...(revisionId ? [revisionId] : [])],
    )
  ).rows[0];
  if (!n) {
    if (revisionId) throw unavailable();
    return null;
  }
  const d = await revisionAuthority(c, p, g, n.source_revision_id, edit);
  if (
    d.option_id !== optionId ||
    d.context_hash !== n.source_hash ||
    digestBasis(n) !== n.content_hash
  )
    throw unavailable();
  return {
    id: n.id,
    content_hash: n.content_hash,
    study: n.proposal,
    catalogue: n.catalogue,
    discovery: {
      id: d.id,
      hash: d.context_hash,
      site_id: d.site_id,
      readiness: d.scope_readiness,
      effort: d.input?.effort.value ?? "Unknown",
      systems:
        d.input?.configuration?.systems.map((s) => ({
          id: s.id,
          name: s.name,
        })) ?? [],
    },
  };
}
type Source = NonNullable<Awaited<ReturnType<typeof source>>>;
type SavedAssessment = {
  id: string;
  workspace_id: string;
  company_id: string;
  estimating_workspace_id: string;
  option_id: string;
  nursery_revision_id: string;
  nursery_hash: string;
  version: number;
  predecessor_id: string | null;
  rule_edition: string;
  source_snapshot: Source;
  proposal: Assessment;
  result: AssessmentResult;
  outputs: ReturnType<typeof assessmentOutputs>;
  content_hash: string;
  created_at: Date;
  created_by: string;
  reason: string;
};
function digest(
  r: Pick<
    SavedAssessment,
    | "estimating_workspace_id"
    | "option_id"
    | "nursery_revision_id"
    | "nursery_hash"
    | "rule_edition"
    | "source_snapshot"
    | "proposal"
    | "result"
    | "outputs"
  >,
) {
  return hash({
    estimating_workspace_id: r.estimating_workspace_id,
    option_id: r.option_id,
    nursery_revision_id: r.nursery_revision_id,
    nursery_hash: r.nursery_hash,
    rule_edition: r.rule_edition,
    source_snapshot: r.source_snapshot,
    proposal: r.proposal,
    result: r.result,
    outputs: r.outputs,
  });
}
async function available(c: QueryClient) {
  if (
    !(
      await c.query(
        "SELECT to_regclass('ppo.nursery_assessment_revisions') AS relation",
      )
    ).rows[0].relation
  )
    throw new AppError(
      503,
      "NurseryAssessmentUnavailable",
      "Technical assessment requires the compatible database upgrade.",
    );
}
async function history(
  c: QueryClient,
  p: Principal,
  g: Workspace,
  optionId: string,
) {
  return (
    await c.query<SavedAssessment>(
      "SELECT * FROM ppo.nursery_assessment_revisions WHERE workspace_id=$1 AND estimating_workspace_id=$2 AND option_id=$3 ORDER BY version DESC",
      [p.workspace_id, g.id, optionId],
    )
  ).rows;
}
async function verify(
  c: QueryClient,
  p: Principal,
  g: Workspace,
  row: SavedAssessment,
) {
  const original = await source(
    c,
    p,
    g,
    row.option_id,
    row.nursery_revision_id,
  );
  if (
    !original ||
    original.content_hash !== row.nursery_hash ||
    hash(original) !== hash(row.source_snapshot) ||
    digest(row) !== row.content_hash
  )
    throw unavailable();
}
export async function readAssessment(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  const q = object(query, ["option_id", "revision_id"]);
  return transaction(async (c) => {
    await available(c);
    const g = await workspaceAuthority(c, p, id),
      option = await optionContext(
        c,
        g,
        q.option_id ? uuid(q.option_id, "option_id") : g.selected_option_id,
      );
    const discovery = await revisionAuthority(
      c,
      p,
      g,
      option.current_revision_id,
    );
    const current = await source(c, p, g, option.id),
      rows = await history(c, p, g, option.id);
    for (const row of rows) await verify(c, p, g, row);
    const selected = q.revision_id
      ? rows.find((r) => r.id === uuid(q.revision_id, "revision_id"))
      : rows[0];
    if (q.revision_id && !selected) throw unavailable();
    let editable = false,
      draft = false,
      sourceEditable = false;
    try {
      await workspaceAuthority(c, p, g.id, true);
      editable = true;
      await revisionAuthority(
        c,
        p,
        g,
        current?.discovery.id ?? discovery.id,
        true,
      );
      sourceEditable = true;
      await requireDraftGroup(c, p, g);
      draft = true;
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404, 409].includes(e.status))
        throw e;
    }
    return {
      reader_id: p.actor_id,
      workspace: { id: g.id, version: g.version, company_id: g.company_id },
      option: { id: option.id, label: option.label, state: option.state },
      current_source: current,
      source_changed:
        !!selected && selected.nursery_revision_id !== current?.id,
      discovery_changed: !!current && current.discovery.id !== discovery.id,
      has_edit_permission: editable,
      can_edit:
        editable &&
        sourceEditable &&
        draft &&
        option.state === "Active" &&
        !q.revision_id &&
        !!current &&
        current.discovery.id === discovery.id,
      current_revision_id: rows[0]?.id ?? null,
      selected: selected
        ? {
            ...selected,
            outputs: Object.fromEntries(
              Object.entries(selected.outputs).map(([k, v]) => [
                k,
                { mime: v.mime, hash: v.hash, byte_length: v.byte_length },
              ]),
            ),
          }
        : null,
      proposal:
        selected?.proposal ?? (current ? blankAssessment(current.study) : null),
      current_rule_edition: assessmentEdition,
      history: rows.map((r) => ({
        id: r.id,
        version: r.version,
        reason: r.reason,
        created_at: r.created_at,
        nursery_revision_id: r.nursery_revision_id,
      })),
      handover:
        "Technical study only. Products publication, shared delivery facts, labour costing and CPQ receiving remain separate N3 work.",
    };
  });
}
export async function saveAssessment(p: Principal, id: string, value: unknown) {
  boundAssessment(value);
  const r = object(value, [
    ...commonKeys,
    "option_id",
    "nursery_revision_id",
    "nursery_hash",
    "expected_workspace_version",
    "expected_revision_id",
    "rule_edition",
    "proposal",
  ]);
  const input = {
    ...common(r),
    estimating_workspace_id: uuid(id, "workspace_id"),
    option_id: uuid(r.option_id, "option_id"),
    nursery_revision_id: uuid(r.nursery_revision_id, "nursery_revision_id"),
    nursery_hash: r.nursery_hash,
    expected_workspace_version: version(r.expected_workspace_version),
    expected_revision_id:
      r.expected_revision_id === null
        ? null
        : uuid(r.expected_revision_id, "expected_revision_id"),
    rule_edition: r.rule_edition,
    proposal: parseAssessment(r.proposal),
  };
  if (
    typeof input.nursery_hash !== "string" ||
    !/^[a-f0-9]{64}$/.test(input.nursery_hash)
  )
    invalid("nursery_hash", "Use the exact saved Nursery hash.");
  if (typeof input.rule_edition !== "string")
    invalid("rule_edition", "Use the exact technical rule edition.");
  return sharedOperation(
    p,
    input,
    "SaveNurseryAssessment",
    async (c) => {
      await available(c);
      const g = await workspaceAuthority(
        c,
        p,
        input.estimating_workspace_id,
        true,
      );
      const original = await source(
        c,
        p,
        g,
        input.option_id,
        input.nursery_revision_id,
        true,
      );
      if (!original || original.content_hash !== input.nursery_hash)
        throw unavailable();
      // Current permission precedes original recovery; freshness applies only to a new acceptance.
      return { g, original };
    },
    async (c, { g, original }) => {
      await requireDraftGroup(c, p, g);
      const option = await optionContext(c, g, input.option_id);
      requireActiveOption(option);
      const current = await source(c, p, g, option.id),
        prior = (await history(c, p, g, option.id))[0];
      if (
        g.version !== input.expected_workspace_version ||
        current?.id !== original.id ||
        option.current_revision_id !== original.discovery.id ||
        (prior?.id ?? null) !== input.expected_revision_id
      )
        throw new AppError(
          409,
          "NurseryAssessmentBasisChanged",
          "Discovery, Nursery source or assessment changed. Retain your draft and compare the latest saved basis.",
        );
      if (input.rule_edition !== assessmentEdition)
        throw new AppError(
          409,
          "NurseryRulesChanged",
          "Review the current technical rule edition before saving.",
        );
      const expected = original.study.scenarios.map((s) => s.id).sort();
      if (
        JSON.stringify(
          input.proposal.scenarios.map((s) => s.scenario_id).sort(),
        ) !== JSON.stringify(expected)
      )
        invalid(
          "scenarios",
          "Retain every exact source scenario. Start a new assessment after the Nursery source changes.",
        );
      const revisionId = randomUUID(),
        result = assess(original.study, input.proposal),
        outputs = assessmentOutputs(
          revisionId,
          original,
          input.proposal,
          result,
        );
      if (
        Object.values(outputs).reduce((n, o) => n + o.byte_length, 0) > 2097152
      )
        invalid(
          "outputs",
          "Required study outputs exceed 2 MiB. Nothing was saved or truncated.",
        );
      const row = {
        estimating_workspace_id: g.id,
        option_id: option.id,
        nursery_revision_id: original.id,
        nursery_hash: original.content_hash,
        rule_edition: assessmentEdition,
        source_snapshot: original,
        proposal: input.proposal,
        result,
        outputs,
      };
      await c.query(
        `INSERT INTO ppo.nursery_assessment_revisions
      (id,workspace_id,company_id,estimating_workspace_id,option_id,nursery_revision_id,nursery_hash,version,predecessor_id,rule_edition,source_snapshot,proposal,result,outputs,content_hash,created_by,reason)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          revisionId,
          p.workspace_id,
          g.company_id,
          g.id,
          option.id,
          original.id,
          original.content_hash,
          (prior?.version ?? 0) + 1,
          prior?.id ?? null,
          assessmentEdition,
          original,
          input.proposal,
          result,
          outputs,
          digest(row),
          p.actor_id,
          input.reason,
        ],
      );
      const updated = (
        await c.query<{ version: number; updated_at: Date }>(
          "UPDATE ppo.estimating_workspaces SET version=version+1,updated_at=clock_timestamp(),updated_by=$3 WHERE workspace_id=$1 AND id=$2 RETURNING version,updated_at",
          [p.workspace_id, g.id, p.actor_id],
        )
      ).rows[0];
      return {
        id: g.id,
        ...updated,
        state: "Draft",
        audit_details: {
          nursery_assessment_id: revisionId,
          nursery_revision_id: original.id,
          source_revision_id: original.discovery.id,
          option_id: option.id,
          content_hash: digest(row),
          rule_edition: assessmentEdition,
        },
      };
    },
    "EstimatingWorkspace",
    "EstimatingScopeSaved",
  );
}
export async function readAssessmentOutput(
  p: Principal,
  id: string,
  query: Record<string, string>,
) {
  const q = object(query, ["revision_id", "kind"]);
  const revisionId = uuid(q.revision_id, "revision_id"),
    kind = choice(q.kind, "kind", ["study", "clarifications"] as const);
  return transaction(async (c) => {
    await available(c);
    const g = await workspaceAuthority(c, p, id);
    const row = (
      await c.query<SavedAssessment>(
        "SELECT * FROM ppo.nursery_assessment_revisions WHERE workspace_id=$1 AND estimating_workspace_id=$2 AND id=$3",
        [p.workspace_id, g.id, revisionId],
      )
    ).rows[0];
    if (!row) throw unavailable();
    await optionContext(c, g, row.option_id);
    await verify(c, p, g, row);
    return {
      ...row.outputs[kind],
      filename: "nursery-" + kind + "-" + row.id + ".html",
    };
  });
}
