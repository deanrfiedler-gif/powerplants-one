import { createHash, randomUUID } from "node:crypto";
import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { transaction } from "../../platform/database";
import { canonical, sharedOperation } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  invalid,
} from "../../shared/validation";
import {
  workspaceAuthority,
  optionContext,
  revisionAuthority,
  requireActiveOption,
  requireDraftGroup,
  type DiscoveryRevision,
} from "../discovery-workspace-context";
import { catalogue } from "./catalogue";
import { blankStudy, findings, type Study } from "./model";
import { bounded, parseStudy } from "./validation";
export const hash = (v: unknown) =>
  createHash("sha256").update(canonical(v)).digest("hex");
export const catalogueHash = hash(catalogue);
type Saved = {
  id: string;
  workspace_id: string;
  company_id: string;
  estimating_workspace_id: string;
  option_id: string;
  source_revision_id: string;
  source_hash: string;
  version: number;
  predecessor_id: string | null;
  proposal: Study;
  catalogue: typeof catalogue;
  content_hash: string;
  created_at: Date;
  created_by: string;
  reason: string;
};
async function available(c: QueryClient) {
  if (
    !(
      await c.query(
        "SELECT to_regclass('ppo.nursery_discovery_revisions') AS relation",
      )
    ).rows[0].relation
  )
    throw new AppError(
      503,
      "NurseryUnavailable",
      "Nursery discovery requires the compatible database upgrade.",
    );
}
function digestBasis(
  row: Pick<
    Saved,
    | "estimating_workspace_id"
    | "option_id"
    | "source_revision_id"
    | "source_hash"
    | "proposal"
    | "catalogue"
  >,
) {
  return hash({
    estimating_workspace_id: row.estimating_workspace_id,
    option_id: row.option_id,
    source_revision_id: row.source_revision_id,
    source_hash: row.source_hash,
    proposal: row.proposal,
    catalogue: row.catalogue,
  });
}
async function history(
  c: QueryClient,
  p: Principal,
  workspaceId: string,
  optionId: string,
) {
  return (
    await c.query<Saved>(
      "SELECT * FROM ppo.nursery_discovery_revisions WHERE workspace_id=$1 AND estimating_workspace_id=$2 AND option_id=$3 ORDER BY version DESC",
      [p.workspace_id, workspaceId, optionId],
    )
  ).rows;
}
function sourceContext(source: DiscoveryRevision) {
  return {
    id: source.id,
    hash: source.context_hash,
    site_id: source.site_id,
    readiness: source.scope_readiness,
    effort: source.input?.effort.value ?? "Unknown",
    systems:
      source.input?.configuration?.systems.map((s) => ({
        id: s.id,
        name: s.name,
      })) ?? [],
  };
}
export async function readNursery(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  const q = object(query, ["option_id", "revision_id"]);
  return transaction(async (c) => {
    await available(c);
    const g = await workspaceAuthority(c, p, id);
    const option = await optionContext(
      c,
      g,
      q.option_id ? uuid(q.option_id, "option_id") : g.selected_option_id,
    );
    const source = await revisionAuthority(c, p, g, option.current_revision_id);
    const rows = await history(c, p, g.id, option.id);
    const sources = new Map([[source.id, source]]);
    // Every disclosed historical revision retains current source authority, even after rebinding.
    for (const row of rows) {
      const original = await revisionAuthority(c, p, g, row.source_revision_id);
      sources.set(original.id, original);
      if (
        original.option_id !== option.id ||
        original.context_hash !== row.source_hash ||
        digestBasis(row) !== row.content_hash
      )
        throw unavailable();
    }
    const selected = q.revision_id
      ? rows.find((r) => r.id === uuid(q.revision_id, "revision_id"))
      : rows[0];
    if (q.revision_id && !selected) throw unavailable();
    let editable = false;
    try {
      await workspaceAuthority(c, p, g.id, true);
      editable = true;
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    }
    const canEdit =
      editable &&
      option.state === "Active" &&
      !q.revision_id &&
      source.kind === "Discovery";
    return {
      reader_id: p.actor_id,
      workspace: { id: g.id, company_id: g.company_id, version: g.version },
      option: { id: option.id, label: option.label, state: option.state },
      source: sourceContext(source),
      selected_source: sourceContext(
        selected ? sources.get(selected.source_revision_id)! : source,
      ),
      current_revision_id: rows[0]?.id ?? null,
      current_version: rows[0]?.version ?? 0,
      selected: selected ?? null,
      proposal: selected?.proposal ?? blankStudy(),
      catalogue: selected?.catalogue ?? catalogue,
      current_catalogue: catalogue,
      catalogue_hash: catalogueHash,
      source_changed: !!selected && selected.source_revision_id !== source.id,
      catalogue_changed:
        !!selected && hash(selected.catalogue) !== catalogueHash,
      findings: findings(selected?.proposal ?? blankStudy()),
      can_edit: canEdit,
      history: rows.map((r) => ({
        id: r.id,
        version: r.version,
        created_at: r.created_at,
        reason: r.reason,
        source_revision_id: r.source_revision_id,
      })),
      handover:
        "Not available in N1; technical assessment and paired shared CPQ receiving are later stages.",
    };
  });
}
export async function saveNursery(p: Principal, id: string, value: unknown) {
  bounded(value);
  const r = object(value, [
    ...commonKeys,
    "option_id",
    "source_revision_id",
    "source_hash",
    "expected_workspace_version",
    "expected_revision_id",
    "catalogue_hash",
    "proposal",
  ]);
  const input = {
    ...common(r),
    estimating_workspace_id: uuid(id, "workspace_id"),
    option_id: uuid(r.option_id, "option_id"),
    source_revision_id: uuid(r.source_revision_id, "source_revision_id"),
    source_hash: r.source_hash,
    expected_workspace_version: version(r.expected_workspace_version),
    expected_revision_id:
      r.expected_revision_id === null
        ? null
        : uuid(r.expected_revision_id, "expected_revision_id"),
    catalogue_hash: r.catalogue_hash,
    proposal: parseStudy(r.proposal),
  };
  for (const key of ["source_hash", "catalogue_hash"] as const)
    if (typeof input[key] !== "string" || !/^[a-f0-9]{64}$/.test(input[key]))
      invalid(key, "Use an exact saved source hash.");
  return sharedOperation(
    p,
    input,
    "SaveNurseryDiscovery",
    async (c) => {
      await available(c);
      const g = await workspaceAuthority(
        c,
        p,
        input.estimating_workspace_id,
        true,
      );
      const source = await revisionAuthority(
        c,
        p,
        g,
        input.source_revision_id,
        true,
      );
      if (
        source.option_id !== input.option_id ||
        source.kind !== "Discovery" ||
        source.context_hash !== input.source_hash
      )
        throw unavailable();
      // Authorisation precedes original receipt recovery. Freshness checks below apply only to first acceptance.
      return { g, source };
    },
    async (c, { g, source }) => {
      await requireDraftGroup(c, p, g);
      const option = await optionContext(c, g, input.option_id);
      requireActiveOption(option);
      const prior = (await history(c, p, g.id, option.id))[0];
      if (
        g.version !== input.expected_workspace_version ||
        option.current_revision_id !== source.id ||
        (prior?.id ?? null) !== input.expected_revision_id
      )
        throw new AppError(
          409,
          "NurseryBasisChanged",
          "The saved source or study changed. Keep your draft, compare the latest version, then save again.",
        );
      if (input.catalogue_hash !== catalogueHash)
        throw new AppError(
          409,
          "NurseryCatalogueChanged",
          "Review the current equipment catalogue before saving.",
        );
      if (
        input.proposal.system_id &&
        !source.input?.configuration?.systems.some(
          (s) => s.id === input.proposal.system_id,
        )
      )
        invalid(
          "system_id",
          "Select a system from the exact saved Discovery source.",
        );
      const revisionId = randomUUID();
      const row = {
        estimating_workspace_id: g.id,
        option_id: option.id,
        source_revision_id: source.id,
        source_hash: source.context_hash!,
        proposal: input.proposal,
        catalogue,
      };
      await c.query(
        `INSERT INTO ppo.nursery_discovery_revisions
      (id,workspace_id,company_id,estimating_workspace_id,option_id,source_revision_id,source_hash,version,predecessor_id,proposal,catalogue,content_hash,created_by,reason)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          revisionId,
          p.workspace_id,
          g.company_id,
          g.id,
          option.id,
          source.id,
          source.context_hash,
          (prior?.version ?? 0) + 1,
          prior?.id ?? null,
          input.proposal,
          catalogue,
          digestBasis(row),
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
          nursery_revision_id: revisionId,
          source_revision_id: source.id,
          option_id: option.id,
          content_hash: digestBasis(row),
        },
      };
    },
    "EstimatingWorkspace",
    "EstimatingScopeSaved",
  );
}
