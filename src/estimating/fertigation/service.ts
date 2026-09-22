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
  invalid,
} from "../../shared/validation";
import { visible } from "../../shared/reads";
import {
  workspaceAuthority,
  optionContext,
  requireDraftGroup,
  requireActiveOption,
  revisionAuthority,
} from "../discovery-workspace-context";
import { expected } from "../service";
import { validateScope } from "./validation";
import { calculate } from "./engine";
import { calculationEdition, sourceHash } from "./definition";
import {
  bounded,
  coverage,
  hash,
  requireAvailable,
  scopeRecord,
  savedRevision,
  observeBinding,
  writable,
  acceptedAuthority,
  commandAuthority,
  notClosed,
} from "./context";
import type { FertigationRecord, SourceBinding } from "./storage-types";
import type { Scope } from "./types";

export async function validateNativeReferences(
  c: PoolClient,
  p: Principal,
  binding: SourceBinding,
  proposal: Scope,
  scopeId: string,
) {
  const g = await workspaceAuthority(c, p, binding.estimating_workspace_id);
  const source = await revisionAuthority(c, p, g, binding.revision_id);
  for (const area of proposal.areas) {
    if (!area.facility_id) continue;
    const observed = binding.facility_observations.find(
      (f) => f.id === area.facility_id,
    );
    if (!observed || area.facility_version !== observed.version)
      invalid(
        "areas",
        "A canonical Facility reference must identify the exact observed Facility in this scope binding.",
      );
    await visible(c, p, "Facility", area.facility_id);
  }
  for (const assetId of new Set(
    [...proposal.valves, ...proposal.controllers].flatMap((v) =>
      v.asset_id ? [v.asset_id] : [],
    ),
  )) {
    if (!source.input?.scope.equipment_ids.includes(assetId))
      throw unavailable();
    const asset = await visible(c, p, "Asset", assetId);
    if (asset.company_id !== g.company_id || asset.site_id !== binding.site_id)
      throw unavailable();
  }
  for (const evidence of proposal.evidence) {
    if (!evidence.reference.startsWith("ppo-file:")) continue;
    const evidenceId = uuid(evidence.reference.slice(9), "evidence.reference");
    const file = (
      await c.query<{ revision_id: string; sha256: string }>(
        "SELECT revision_id,sha256 FROM ppo.fertigation_evidence WHERE workspace_id=$1 AND scope_id=$2 AND id=$3",
        [p.workspace_id, scopeId, evidenceId],
      )
    ).rows[0];
    if (!file || file.sha256 !== evidence.sha256) throw unavailable();
    const scope = await scopeRecord(c, p, scopeId);
    await savedRevision(c, p, scope, file.revision_id);
  }
}
export async function insertRevision(
  c: PoolClient,
  p: Principal,
  scope: FertigationRecord,
  id: string,
  revision: number,
  binding: SourceBinding,
  proposal: Scope,
  reason: string,
  predecessorId: string | null,
) {
  await validateNativeReferences(c, p, binding, proposal, scope.id);
  const calculation = calculate(proposal);
  const contentHash = hash({
    binding,
    proposal,
    calculation,
    calculation_edition: calculationEdition,
    source_hash: sourceHash,
  });
  await c.query(
    `INSERT INTO ppo.fertigation_revisions(id,workspace_id,company_id,scope_id,option_id,source_revision_id,version,predecessor_id,binding,proposal,calculation,content_hash,calculation_edition,source_hash,created_by,reason,calculation_input_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [
      id,
      p.workspace_id,
      scope.company_id,
      scope.id,
      scope.option_id,
      binding.revision_id,
      revision,
      predecessorId,
      binding,
      proposal,
      calculation,
      contentHash,
      calculationEdition,
      sourceHash,
      p.actor_id,
      reason,
      hash({ proposal, calculation_edition: calculationEdition }),
    ],
  );
  // A newly accepted revision must be readable under the complete retained
  // authority graph, including prepared attachment origins and copy ancestry.
  await savedRevision(c, p, scope, id);
}
export async function createScope(p: Principal, value: unknown) {
  bounded(value);
  const raw = object(value, [
    ...commonKeys,
    "id",
    "name",
    "estimating_workspace_id",
    "option_id",
    "revision_id",
    "expected_workspace_version",
    "coverage",
    "proposal",
  ]);
  const input = {
    ...common(raw),
    id: uuid(raw.id, "id"),
    name: label(raw.name, "name", 200),
    estimating_workspace_id: uuid(
      raw.estimating_workspace_id,
      "estimating_workspace_id",
    ),
    option_id: uuid(raw.option_id, "option_id"),
    revision_id: uuid(raw.revision_id, "revision_id"),
    expected_workspace_version: version(raw.expected_workspace_version),
    coverage: coverage(raw.coverage),
    proposal: validateScope(raw.proposal),
  };
  bounded(input);
  return sharedOperation(
    p,
    input,
    "CreateFertigationScope",
    async (c) => {
      await requireAvailable(c);
      await notClosed(c, p, input.operation_id);
      const accepted = await acceptedAuthority(
        c,
        p,
        input.id,
        input.operation_id,
      );
      if (accepted) return { accepted, g: null, binding: null };
      const g = await workspaceAuthority(
        c,
        p,
        input.estimating_workspace_id,
        true,
      );
      const binding = await observeBinding(
        c,
        p,
        g.id,
        input.option_id,
        input.revision_id,
        input.coverage,
      );
      return { accepted: null, g, binding };
    },
    async (c, { g, binding }) => {
      if (!g || !binding) throw unavailable();
      expected(g.version, input.expected_workspace_version);
      await requireDraftGroup(c, p, g);
      const option = await optionContext(c, g, input.option_id);
      requireActiveOption(option);
      if (option.current_revision_id !== input.revision_id)
        throw new AppError(
          409,
          "FertigationSourceChanged",
          "Start from the current saved Discovery revision.",
        );
      const revisionId = randomUUID();
      const scope = (
        await c.query<FertigationRecord>(
          `INSERT INTO ppo.fertigation_scopes(id,workspace_id,company_id,estimating_workspace_id,option_id,name,owner_id,current_revision_id,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$7,$7) RETURNING *`,
          [
            input.id,
            p.workspace_id,
            g.company_id,
            g.id,
            input.option_id,
            input.name,
            p.actor_id,
            revisionId,
          ],
        )
      ).rows[0];
      await insertRevision(
        c,
        p,
        scope,
        revisionId,
        1,
        binding,
        input.proposal,
        input.reason,
        null,
      );
      return {
        ...scope,
        audit_details: {
          revision_id: revisionId,
          source_revision_id: binding.revision_id,
        },
      };
    },
    "FertigationScope",
    "FertigationScopeSaved",
  );
}
function saveInput(value: unknown) {
  bounded(value);
  const raw = object(value, [
    ...commonKeys,
    "expected_version",
    "expected_revision_id",
    "source_context_hash",
    "proposal",
  ]);
  const input = {
    ...common(raw),
    expected_version: version(raw.expected_version),
    expected_revision_id: uuid(
      raw.expected_revision_id,
      "expected_revision_id",
    ),
    source_context_hash: sha(raw.source_context_hash, "source_context_hash"),
    proposal: validateScope(raw.proposal),
  };
  bounded(input);
  return input;
}
export function sha(value: unknown, field: string) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value))
    invalid(field, "An exact SHA-256 fingerprint is required.");
  return value as string;
}
export async function saveScope(p: Principal, id: string, value: unknown) {
  const input = { ...saveInput(value), id: uuid(id, "id") };
  return sharedOperation(
    p,
    input,
    "SaveFertigationRevision",
    async (c) => commandAuthority(c, p, input.id, input.operation_id),
    async (c, scope) => {
      const { saved, g } = await writable(c, p, scope);
      expected(scope.version, input.expected_version);
      if (scope.current_revision_id !== input.expected_revision_id)
        throw new AppError(
          409,
          "FertigationRevisionChanged",
          "The saved revision changed. Retain this proposal and compare with the current revision.",
        );
      const option = await optionContext(c, g, scope.option_id);
      const current = await observeBinding(
        c,
        p,
        g.id,
        scope.option_id,
        saved.source_revision_id,
        saved.binding,
      );
      if (
        option.current_revision_id !== saved.source_revision_id ||
        input.source_context_hash !== current.upstream_context_hash ||
        current.upstream_context_hash !== saved.binding.upstream_context_hash
      )
        throw new AppError(
          409,
          "FertigationSourceChanged",
          "The upstream Discovery or Facility context changed. Review and explicitly refresh the source before saving this proposal.",
        );
      const revisionId = randomUUID();
      await insertRevision(
        c,
        p,
        scope,
        revisionId,
        saved.version + 1,
        saved.binding,
        input.proposal,
        input.reason,
        saved.id,
      );
      const updated = (
        await c.query<FertigationRecord>(
          "UPDATE ppo.fertigation_scopes SET version=version+1,current_revision_id=$3,name=$4,updated_at=clock_timestamp(),updated_by=$5 WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [
            p.workspace_id,
            scope.id,
            revisionId,
            input.proposal.name,
            p.actor_id,
          ],
        )
      ).rows[0];
      return {
        ...updated,
        audit_details: {
          revision_id: revisionId,
          predecessor_id: saved.id,
          source_revision_id: saved.source_revision_id,
          review_applicability:
            "New revision requires a separate review; historical reviews remain exact",
        },
      };
    },
    "FertigationScope",
    "FertigationScopeSaved",
  );
}
export async function previewScope(p: Principal, id: string, value: unknown) {
  bounded(value);
  const raw = object(value, ["expected_version", "proposal"]);
  const input = {
    expected_version: version(raw.expected_version),
    proposal: validateScope(raw.proposal),
  };
  return transaction(async (c) => {
    const scope = await scopeRecord(c, p, id),
      { saved } = await savedRevision(c, p, scope);
    expected(scope.version, input.expected_version);
    await validateNativeReferences(
      c,
      p,
      saved.binding,
      input.proposal,
      scope.id,
    );
    return {
      calculation: calculate(input.proposal),
      proposal_hash: hash(input.proposal),
      expected_version: scope.version,
      revision_id: saved.id,
    };
  });
}
export async function archiveScope(p: Principal, id: string, value: unknown) {
  const raw = object(value, [...commonKeys, "expected_version"]),
    input = {
      ...common(raw),
      id: uuid(id, "id"),
      expected_version: version(raw.expected_version),
    };
  return sharedOperation(
    p,
    input,
    "ArchiveFertigationScope",
    async (c) => commandAuthority(c, p, id, input.operation_id),
    async (c, scope) => {
      await writable(c, p, scope);
      expected(scope.version, input.expected_version);
      const updated = (
        await c.query<FertigationRecord>(
          "UPDATE ppo.fertigation_scopes SET state='Archived',version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, id, p.actor_id],
        )
      ).rows[0];
      return {
        ...updated,
        audit_details: { revision_id: scope.current_revision_id },
      };
    },
    "FertigationScope",
    "FertigationScopeSaved",
  );
}
export async function previewSource(p: Principal, id: string, value: unknown) {
  const raw = object(value, ["revision_id", "coverage"]);
  const revisionId = uuid(raw.revision_id, "revision_id"),
    selection = coverage(raw.coverage);
  return transaction(async (c) => {
    const scope = await scopeRecord(c, p, id, true),
      { saved } = await writable(c, p, scope);
    const binding = await observeBinding(
      c,
      p,
      scope.estimating_workspace_id,
      scope.option_id,
      revisionId,
      selection,
    );
    return {
      expected_version: scope.version,
      expected_revision_id: saved.id,
      before: saved.binding,
      after: binding,
      proposal_signature: hash({
        scope_id: id,
        version: scope.version,
        before: saved.id,
        binding,
      }),
    };
  });
}
export async function refreshSource(p: Principal, id: string, value: unknown) {
  bounded(value);
  const raw = object(value, [
    ...commonKeys,
    "revision_id",
    "coverage",
    "expected_version",
    "expected_revision_id",
    "proposal_signature",
    "proposal",
  ]);
  const input = {
    ...common(raw),
    id: uuid(id, "id"),
    revision_id: uuid(raw.revision_id, "revision_id"),
    coverage: coverage(raw.coverage),
    expected_version: version(raw.expected_version),
    expected_revision_id: uuid(
      raw.expected_revision_id,
      "expected_revision_id",
    ),
    proposal_signature: sha(raw.proposal_signature, "proposal_signature"),
    proposal: validateScope(raw.proposal),
  };
  return sharedOperation(
    p,
    input,
    "RefreshFertigationSource",
    async (c) => commandAuthority(c, p, id, input.operation_id),
    async (c, scope) => {
      const { saved, g } = await writable(c, p, scope);
      expected(scope.version, input.expected_version);
      const option = await optionContext(c, g, scope.option_id);
      if (
        option.current_revision_id !== input.revision_id ||
        saved.id !== input.expected_revision_id
      )
        throw new AppError(
          409,
          "FertigationSourceChanged",
          "Review the current source and scope revision again.",
        );
      const binding = await observeBinding(
        c,
        p,
        g.id,
        scope.option_id,
        input.revision_id,
        input.coverage,
      );
      if (
        hash({
          scope_id: id,
          version: scope.version,
          before: saved.id,
          binding,
        }) !== input.proposal_signature
      )
        throw new AppError(
          409,
          "FertigationSourceChanged",
          "The reviewed source context changed.",
        );
      const revisionId = randomUUID();
      await insertRevision(
        c,
        p,
        scope,
        revisionId,
        saved.version + 1,
        binding,
        input.proposal,
        input.reason,
        saved.id,
      );
      const updated = (
        await c.query<FertigationRecord>(
          "UPDATE ppo.fertigation_scopes SET version=version+1,current_revision_id=$3,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, id, revisionId, p.actor_id],
        )
      ).rows[0];
      return {
        ...updated,
        audit_details: {
          revision_id: revisionId,
          source_revision_id: input.revision_id,
          predecessor_id: saved.id,
        },
      };
    },
    "FertigationScope",
    "FertigationScopeSaved",
  );
}
