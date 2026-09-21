import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { sharedOperation, canonical } from "../platform/operations";
import { AppError, unavailable } from "../platform/errors";
import { object, optionalId } from "../shared/validation";
import { requireCapability } from "../platform/permissions";
import { visibleOpportunity } from "../crm/context";
import { digest } from "../documents/store";
import { configurationConfirmations, copyConfiguration } from "./configuration";
import { savedOptionCost, discoveryHistoryCounts } from "./discovery-reads";
import {
  compareDiscovery,
  compileDiscovery,
  inheritDiscovery,
  type DiscoveryInput,
} from "./discovery";
import {
  readDiscoveryTargets,
  prepareDiscoveryTargets,
  expectDiscoveryContext,
} from "./discovery-context";
import {
  workspaceAuthority,
  optionContext,
  revisionAuthority,
  currentGroup,
  requireDraftGroup,
  requireActiveOption,
  discoveryReceiptAuthority,
  type DiscoveryWorkspace,
  type DiscoveryOption,
  type DiscoveryRevision,
  type AnswerAttribution,
} from "./discovery-workspace-context";
import {
  discoveryCreateProposal,
  createWorkspaceInput,
  discoveryChangeProposal,
  changeWorkspaceInput,
  optionActionInput,
  type DiscoveryChange,
} from "./discovery-workspace-validation";

type Targets = Awaited<ReturnType<typeof readDiscoveryTargets>>;
function confirmConfiguration(required: { fact_id: string; fingerprint: string }[], supplied: { fact_id: string; fingerprint: string }[]) {
  if (canonical(required) !== canonical(supplied)) throw new AppError(422, "ConfigurationConfirmationRequired", "Review and acknowledge the exact changed configuration facts and their current sources.");
}
function expected(actual: number, wanted: number | string) {
  if (actual !== wanted)
    throw new AppError(
      409,
      "VersionConflict",
      "This workspace changed. Keep the proposal and compare the current selected option and revision.",
    );
}
function exactRevision(option: DiscoveryOption, id: string) {
  if (option.current_revision_id !== id)
    throw new AppError(
      409,
      "DiscoveryRevisionChanged",
      "Compare the current saved scope before creating a successor.",
    );
}
async function originalAuthority(
  c: PoolClient,
  p: Principal,
  operationId: string,
) {
  const prior = (
    await c.query<{ record_id: string }>(
      "SELECT record_id FROM ppo.operation_receipts WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
      [p.workspace_id, p.actor_id, operationId],
    )
  ).rows[0];
  if (prior)
    await discoveryReceiptAuthority(c, p, prior.record_id, operationId);
}
function requiredConfirmations(
  input: DiscoveryInput,
  previous: DiscoveryRevision | null,
  copy: boolean,
) {
  if (copy) return [];
  const comparison = previous?.input
    ? compareDiscovery(previous.input, input)
    : null;
  return input.answers
    .filter(
      (answer) =>
        answer.state === "Confirmed" &&
        (!previous?.input ||
          comparison!.questions.find(
            (q) => q.question_id === answer.question_id,
          )?.requires_confirmation ||
          canonical(
            previous.input.answers.find(
              (a) => a.question_id === answer.question_id,
            ),
          ) !== canonical(answer)),
    )
    .map((a) => a.question_id)
    .sort();
}
function confirm(
  input: DiscoveryInput,
  required: string[],
  confirmed: string[],
) {
  if (
    confirmed.some(
      (id) =>
        !input.answers.some(
          (a) => a.question_id === id && a.state === "Confirmed",
        ),
    ) ||
    required.some((id) => !confirmed.includes(id))
  )
    throw new AppError(
      422,
      "DiscoveryConfirmationRequired",
      "Confirm each changed or newly active answer explicitly, or retain it as unconfirmed with an owned follow-up.",
    );
}
function attribution(
  input: DiscoveryInput,
  previous: DiscoveryRevision | null,
  confirmed: string[],
  p: Principal,
  at: string,
) {
  const result: Record<string, AnswerAttribution> = {};
  for (const answer of input.answers) {
    const old = previous?.input?.answers.find(
      (a) => a.question_id === answer.question_id,
    );
    result[answer.question_id] =
      old &&
      canonical(old) === canonical(answer) &&
      !confirmed.includes(answer.question_id) &&
      previous!.answer_attribution[answer.question_id]
        ? previous!.answer_attribution[answer.question_id]
        : {
            actor_id: p.actor_id,
            recorded_at: at,
            confirmed_by: answer.state === "Confirmed" ? p.actor_id : null,
            confirmed_at: answer.state === "Confirmed" ? at : null,
          };
  }
  return result;
}
function proposedInput(change: DiscoveryChange, source: DiscoveryRevision) {
  if (change.kind === "Branch" && change.branch_mode === "CopyDiscovery") {
    if (!source.input || !source.answer_snapshot_id)
      throw new AppError(
        422,
        "DiscoverySourceNotRecorded",
        "This legacy revision has no questionnaire to copy. Start fresh discovery explicitly.",
      );
    const inherited = inheritDiscovery(
      source.input,
      source.answer_snapshot_id,
      change.copy_follow_up!,
    ).input;
    if (!source.input.configuration) return inherited;
    if (!change.copy_allocation_id) throw new AppError(422, "CopyAllocationRequired", "Allocate the destination graph before reviewing a structured copy.");
    return { ...inherited, configuration: copyConfiguration(source.input.configuration, source.id, change.copy_allocation_id, change.copy_follow_up!) };
  }
  if (change.kind === "Save" && source.input?.configuration && !change.discovery?.configuration) throw new AppError(422, "ConfigurationRequired", "Retain the captured configuration schema in a successor; it cannot be discarded by using the legacy parser.");
  return change.discovery!;
}
function comparisonFor(
  g: DiscoveryWorkspace,
  o: DiscoveryOption,
  source: DiscoveryRevision,
  change: DiscoveryChange,
  targets: Targets,
) {
  const comparison = source.input
    ? compareDiscovery(source.input, targets.compiled.input)
    : {
        previous_hash: null,
        proposed_hash: targets.compiled.content_hash,
        source_kind: source.kind,
        questions: targets.compiled.input.answers.map((a) => ({
          question_id: a.question_id,
          disposition: "BecameActive",
          previous: null,
          proposed: a,
          requires_confirmation: true,
        })),
        retained_hidden_answers: [],
        delivery_routing: targets.compiled.delivery_routing,
      };
  // Fresh branch starts with an empty history; its comparison can describe the
  // source without silently copying hidden answers or confirmation attribution.
  const retain =
    change.kind === "Save" ? comparison.retained_hidden_answers : [];
  const required = requiredConfirmations(
    targets.compiled.input,
    change.kind === "Save" ? source : null,
    change.branch_mode === "CopyDiscovery",
  );
  const source_context_changed = canonical(source.observed_context) !== canonical(targets.references);
  const configuration_confirmations = configurationConfirmations(targets.compiled.input.configuration, change.kind === "Save" && !source_context_changed ? source.input?.configuration : undefined, targets.context_hash);
  const evidence = {
    workspace_id: g.id,
    workspace_version: g.version,
    selected_option_id: g.selected_option_id,
    option_id: o.id,
    source_revision_id: source.id,
    kind: change.kind,
    branch_mode: change.branch_mode,
    context_hash: targets.context_hash,
    comparison,
    required_confirmation_ids: required,
    ...(targets.compiled.input.configuration ? { configuration_confirmations, source_context_changed, copy_allocation_id: change.copy_allocation_id ?? null, historical_source_id: change.historical_source_id ?? null } : {}),
  };
  return {
    comparison: evidence,
    comparison_hash: digest(canonical(evidence)),
    retained_hidden_answers: retain,
    required_confirmation_ids: required,
    configuration_confirmations,
  };
}
async function readChange(
  c: PoolClient,
  p: Principal,
  g: DiscoveryWorkspace,
  change: DiscoveryChange,
) {
  const option = await optionContext(c, g, change.option_id),
    source = await revisionAuthority(
      c,
      p,
      g,
      change.expected_revision_id,
      true,
    );
  if (source.option_id !== option.id) throw unavailable();
  if (change.historical_source_id) {
    const historical = await revisionAuthority(c, p, g, change.historical_source_id, true);
    if (historical.option_id !== option.id || !historical.input) throw unavailable();
  }
  const targets = await readDiscoveryTargets(
    c,
    p,
    g.opportunity_id,
    proposedInput(change, source),
  );
  return { option, source, targets };
}
export async function previewDiscoveryCreate(p: Principal, value: unknown) {
  const input = discoveryCreateProposal(value);
  return transaction(async (c) => {
    const targets = await prepareDiscoveryTargets(
      c,
      p,
      input.opportunity_id,
      input.discovery,
    );
    const existing = (
      await c.query<{ id: string }>(
        "SELECT id FROM ppo.estimating_workspaces WHERE workspace_id=$1 AND opportunity_id=$2",
        [p.workspace_id, input.opportunity_id],
      )
    ).rows[0];
    if (existing) {
      await workspaceAuthority(c, p, existing.id, true);
      throw new AppError(
        409,
        "RelationshipConflict",
        "Open the existing estimating workspace for this opportunity.",
      );
    }
    return {
      ...targets,
      expected_opportunity_version: targets.references.opportunity.version,
      required_confirmation_ids: requiredConfirmations(
        targets.compiled.input,
        null,
        false,
      ),
      configuration_confirmations: configurationConfirmations(targets.compiled.input.configuration, undefined, targets.context_hash),
    };
  });
}
export async function previewDiscoveryChange(
  p: Principal,
  id: string,
  value: unknown,
) {
  const change = discoveryChangeProposal(value);
  return transaction(async (c) => {
    const g = await workspaceAuthority(c, p, id, true);
    await requireDraftGroup(c, p, g);
    expected(g.version, change.expected_version);
    const { option, source } = await readChange(c, p, g, change);
    requireActiveOption(option);
    exactRevision(option, change.expected_revision_id);
    const targets = await prepareDiscoveryTargets(
      c,
      p,
      g.opportunity_id,
      proposedInput(change, source),
    );
    return { ...targets, ...comparisonFor(g, option, source, change, targets) };
  });
}
async function advance(
  c: PoolClient,
  p: Principal,
  g: DiscoveryWorkspace,
  selection = g.selected_option_id,
) {
  return (
    await c.query<DiscoveryWorkspace>(
      "UPDATE ppo.estimating_workspaces SET version=version+1,selected_option_id=$3,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
      [p.workspace_id, g.id, selection, p.actor_id],
    )
  ).rows[0];
}
async function insertRevision(
  c: PoolClient,
  p: Principal,
  g: DiscoveryWorkspace,
  optionId: string,
  revisionId: string,
  version: number,
  targets: Targets,
  source: DiscoveryRevision | null,
  predecessor: string | null,
  copiedFrom: string | null,
  comparison: Record<string, unknown>,
  hidden: DiscoveryRevision["retained_hidden_answers"],
  confirmed: string[],
  reason: string,
) {
  const scopeId = randomUUID(),
    answerId = randomUUID(),
    at = (await c.query<{ at: Date }>("SELECT clock_timestamp() AS at")).rows[0]
      .at;
  const input = targets.compiled.input;
  await c.query(
    `INSERT INTO ppo.estimation_revisions(id,workspace_id,company_id,estimating_workspace_id,option_id,version,predecessor_id,copied_from_id,kind,
    scope_snapshot_id,answer_snapshot_id,site_id,input,observed_context,content_hash,context_hash,scope_readiness,comparison,retained_hidden_answers,answer_attribution,reason,created_by,created_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,'Discovery',$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
    [
      revisionId,
      p.workspace_id,
      g.company_id,
      g.id,
      optionId,
      version,
      predecessor,
      copiedFrom,
      scopeId,
      answerId,
      input.scope.site_id,
      input,
      targets.references,
      targets.compiled.content_hash,
      targets.context_hash,
      targets.compiled.scope_readiness,
      comparison,
      JSON.stringify(hidden),
      attribution(input, source, confirmed, p, at.toISOString()),
      reason,
      p.actor_id,
      at,
    ],
  );
  for (const facility of input.scope.facility_ids)
    await c.query(
      "INSERT INTO ppo.estimating_scope_facilities(workspace_id,company_id,site_id,scope_snapshot_id,facility_id) VALUES($1,$2,$3,$4,$5)",
      [p.workspace_id, g.company_id, input.scope.site_id, scopeId, facility],
    );
  for (const asset of input.scope.equipment_ids)
    await c.query(
      "INSERT INTO ppo.estimating_scope_equipment(workspace_id,company_id,site_id,scope_snapshot_id,asset_id) VALUES($1,$2,$3,$4,$5)",
      [p.workspace_id, g.company_id, input.scope.site_id, scopeId, asset],
    );
}
export async function createDiscoveryWorkspace(p: Principal, value: unknown) {
  const input = createWorkspaceInput(value);
  return sharedOperation(
    p,
    input,
    "CreateEstimatingWorkspace",
    async (c) => {
      await originalAuthority(c, p, input.operation_id);
      return readDiscoveryTargets(c, p, input.opportunity_id, input.discovery);
    },
    async (c) => {
      const targets = await prepareDiscoveryTargets(
        c,
        p,
        input.opportunity_id,
        input.discovery,
      );
      expected(
        targets.references.opportunity.version,
        input.expected_opportunity_version,
      );
      expectDiscoveryContext(input.context_hash, targets);
      confirm(
        targets.compiled.input,
        requiredConfirmations(targets.compiled.input, null, false),
        input.confirmed_question_ids,
      );
      confirmConfiguration(configurationConfirmations(targets.compiled.input.configuration, undefined, targets.context_hash), input.configuration_confirmations ?? []);
      const g = (
        await c.query<DiscoveryWorkspace>(
          `INSERT INTO ppo.estimating_workspaces(id,workspace_id,company_id,opportunity_id,owner_id,selected_option_id,created_by,updated_by)
      VALUES($1,$2,$3,$4,$5,$6,$5,$5) RETURNING *`,
          [
            input.id,
            p.workspace_id,
            targets.references.opportunity.company_id,
            input.opportunity_id,
            p.actor_id,
            input.option_id,
          ],
        )
      ).rows[0];
      await c.query(
        `INSERT INTO ppo.estimating_options(id,workspace_id,company_id,estimating_workspace_id,ordinal,label,current_revision_id,workspace_version,created_by,updated_by)
      VALUES($1,$2,$3,$4,1,$7,$5,1,$6,$6)`,
        [
          input.option_id,
          p.workspace_id,
          g.company_id,
          g.id,
          input.revision_id,
          p.actor_id,
          input.option_label ?? "A",
        ],
      );
      await insertRevision(
        c,
        p,
        g,
        input.option_id,
        input.revision_id,
        1,
        targets,
        null,
        null,
        null,
        {},
        [],
        input.confirmed_question_ids,
        input.reason,
      );
      return {
        ...g,
        audit_details: {
          option_id: input.option_id,
          revision_id: input.revision_id,
          selected_option_id: input.option_id,
          context_hash: targets.context_hash,
          content_hash: targets.compiled.content_hash,
        },
      };
    },
    "EstimatingWorkspace",
    "EstimatingWorkspaceCreated",
  );
}
export async function changeDiscoveryWorkspace(
  p: Principal,
  id: string,
  value: unknown,
) {
  const input = changeWorkspaceInput(id, value);
  return sharedOperation(
    p,
    input,
    input.kind === "Save" ? "SaveEstimatingScope" : "BranchEstimatingOption",
    async (c) => {
      const g = await workspaceAuthority(c, p, id, true);
      await originalAuthority(c, p, input.operation_id);
      return { g, ...(await readChange(c, p, g, input)) };
    },
    async (c, { g, option, source }) => {
      const options = await requireDraftGroup(c, p, g);
      expected(g.version, input.expected_version);
      exactRevision(option, input.expected_revision_id);
      requireActiveOption(option);
      if (input.kind === "Branch" && options.length >= 10)
        throw new AppError(
          422,
          "EstimatingOptionLimit",
          "Keep at most ten options, including archived originals, in this workspace.",
        );
      const targets = await prepareDiscoveryTargets(
        c,
        p,
        g.opportunity_id,
        proposedInput(input, source),
      );
      expectDiscoveryContext(input.context_hash, targets);
      const comparison = comparisonFor(g, option, source, input, targets);
      if (input.comparison_hash !== comparison.comparison_hash)
        throw new AppError(
          409,
          "DiscoveryComparisonChanged",
          "Review the exact current source and proposed scope comparison before saving.",
        );
      confirm(
        targets.compiled.input,
        comparison.required_confirmation_ids,
        input.confirmed_question_ids,
      );
      confirmConfiguration(comparison.configuration_confirmations, input.configuration_confirmations ?? []);
      const updated = await advance(c, p, g),
        optionId = input.kind === "Branch" ? input.new_option_id! : option.id;
      if (input.kind === "Branch")
        await c.query(
          `INSERT INTO ppo.estimating_options(id,workspace_id,company_id,estimating_workspace_id,ordinal,label,current_revision_id,predecessor_option_id,workspace_version,created_by,updated_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
          [
            optionId,
            p.workspace_id,
            g.company_id,
            g.id,
            options.length + 1,
            input.label,
            input.revision_id,
            option.id,
            updated.version,
            p.actor_id,
          ],
        );
      else
        await c.query(
          "UPDATE ppo.estimating_options SET current_revision_id=$3,version=version+1,workspace_version=$4,updated_by=$5,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
          [
            p.workspace_id,
            option.id,
            input.revision_id,
            updated.version,
            p.actor_id,
          ],
        );
      await insertRevision(
        c,
        p,
        updated,
        optionId,
        input.revision_id,
        input.kind === "Save" ? source.version + 1 : 1,
        targets,
        input.kind === "Save" ? source : null,
        input.kind === "Save" ? source.id : null,
        input.branch_mode === "CopyDiscovery" ? source.id : null,
        comparison.comparison,
        comparison.retained_hidden_answers,
        input.confirmed_question_ids,
        input.reason,
      );
      return {
        ...updated,
        audit_details: {
          option_id: optionId,
          revision_id: input.revision_id,
          source_revision_id: source.id,
          ...(input.historical_source_id ? { historical_source_id: input.historical_source_id } : {}),
          selected_option_id: updated.selected_option_id,
          branch_mode: input.branch_mode,
          comparison_hash: comparison.comparison_hash,
          context_hash: targets.context_hash,
          content_hash: targets.compiled.content_hash,
        },
      };
    },
    "EstimatingWorkspace",
    input.kind === "Save" ? "EstimatingScopeSaved" : "EstimatingOptionBranched",
  );
}
export async function changeDiscoveryOption(
  p: Principal,
  id: string,
  value: unknown,
) {
  const input = optionActionInput(id, value);
  return sharedOperation(
    p,
    input,
    `${input.action}EstimatingOption`,
    async (c) => {
      const g = await workspaceAuthority(c, p, id, true);
      await originalAuthority(c, p, input.operation_id);
      const option = await optionContext(c, g, input.option_id),
        source = await revisionAuthority(
          c,
          p,
          g,
          input.expected_revision_id,
          true,
        );
      if (source.option_id !== option.id) throw unavailable();
      return { g, option, source };
    },
    async (c, { g, option, source }) => {
      await requireDraftGroup(c, p, g);
      expected(g.version, input.expected_version);
      exactRevision(option, input.expected_revision_id);
      if (g.selected_option_id !== input.expected_selected_option_id)
        throw new AppError(
          409,
          "DiscoverySelectionChanged",
          "Compare the selected option before changing this workspace.",
        );
      if (input.action === "Archive" && g.selected_option_id === option.id)
        throw new AppError(
          422,
          "SelectedOptionRequired",
          "Select another active option before archiving this option.",
        );
      if (input.action === "Select" && g.selected_option_id === option.id)
        throw new AppError(
          422,
          "OptionAlreadySelected",
          "This option is already selected.",
        );
      if (input.action === "Reopen") {
        if (option.state !== "Archived")
          throw new AppError(
            422,
            "OptionAlreadyActive",
            "This option is already active.",
          );
      } else requireActiveOption(option);
      const updated = await advance(
        c,
        p,
        g,
        input.action === "Select" ? option.id : g.selected_option_id,
      );
      if (input.action !== "Select")
        await c.query(
          "UPDATE ppo.estimating_options SET state=$3,version=version+1,workspace_version=$4,updated_by=$5,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
          [
            p.workspace_id,
            option.id,
            input.action === "Archive" ? "Archived" : "Active",
            updated.version,
            p.actor_id,
          ],
        );
      return {
        ...updated,
        audit_details: {
          option_id: option.id,
          revision_id: source.id,
          previous_selected_option_id: g.selected_option_id,
          selected_option_id: updated.selected_option_id,
          previous_state: option.state,
          state: input.action === "Archive" ? "Archived" : "Active",
        },
      };
    },
    "EstimatingWorkspace",
    `EstimatingOption${input.action === "Select" ? "Selected" : input.action === "Archive" ? "Archived" : "Reopened"}`,
  );
}
export async function readDiscoveryWorkspace(p: Principal, id: string) {
  return transaction(async (c) => {
    const workspace = await workspaceAuthority(c, p, id),
      options = await currentGroup(c, p, workspace);
    let can_edit = false;
    try {
      await workspaceAuthority(c, p, id, true);
      await requireDraftGroup(c, p, workspace);
      can_edit = true;
    } catch (error) {
      if (
        !(error instanceof AppError) ||
        ![403, 404, 409].includes(error.status)
      )
        throw error;
    }
    const presented = [], counts = await discoveryHistoryCounts(c, p, workspace);
    for (const item of options) {
      const cost = await savedOptionCost(c, p, item.option.id);
      presented.push({ ...item, history_count: counts.get(item.option.id) ?? null, evaluation: item.revision.input ? compileDiscovery(item.revision.input) : null, cost: cost.status === "Available" ? { status: cost.status, version: cost.version, amount: cost.sell_total, basis: cost.basis } : { status: cost.status } });
    }
    return {
      workspace,
      options: presented,
      can_edit,
      context: {
        title: (await visibleOpportunity(c, p, workspace.opportunity_id)).title,
        owner: (await c.query<{display_name: string}>("SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2", [p.workspace_id, workspace.owner_id])).rows[0]?.display_name ?? "Estimating owner",
      },
      manual_costing: { status: "Implemented", action: "Review scope for manual costing" },
      delivery_routing: { status: "NotConfigured" },
      costing_import: { status: "NotImplemented" },
    };
  });
}
export async function readDiscoveryRevision(
  p: Principal,
  id: string,
  revisionId: string,
) {
  return transaction(async (c) =>
    revisionAuthority(c, p, await workspaceAuthority(c, p, id), revisionId),
  );
}

export async function listDiscoveryWorkspaces(
  p: Principal,
  query: Record<string, string> = {},
) {
  const input = object(query, ["opportunity_id"]),
    opportunityId = optionalId(input.opportunity_id, "opportunity_id");
  return transaction(async (c) => {
    await requireCapability(c, p, "estimating.read");
    if (opportunityId) await visibleOpportunity(c, p, opportunityId);
    const rows = (
      await c.query<{ id: string }>(
        "SELECT id FROM ppo.estimating_workspaces WHERE workspace_id=$1 AND ($2::uuid IS NULL OR opportunity_id=$2) ORDER BY updated_at DESC,id LIMIT 100",
        [p.workspace_id, opportunityId],
      )
    ).rows;
    const items = [];
    for (const row of rows) {
      try {
        const workspace = await workspaceAuthority(c, p, row.id),
          options = await currentGroup(c, p, workspace),
          opportunity = await visibleOpportunity(
            c,
            p,
            workspace.opportunity_id,
          );
        items.push({
          id: workspace.id,
          version: workspace.version,
          opportunity_id: opportunity.id,
          title: opportunity.title,
          display_number: opportunity.display_number,
          selected_option_id: workspace.selected_option_id,
          options: options.map(({ option, revision }) => ({
            id: option.id,
            label: option.label,
            state: option.state,
            revision_id: revision.id,
            revision: revision.version,
            scope_readiness: revision.scope_readiness,
          })),
        });
      } catch (error) {
        if (!(error instanceof AppError) || error.status !== 404) throw error;
      }
    }
    return { items, limit: 100, synthetic: true };
  });
}
