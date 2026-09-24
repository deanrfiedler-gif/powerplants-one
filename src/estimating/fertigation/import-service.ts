import { randomUUID } from "node:crypto";
import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { sharedOperation } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  label,
  invalid,
} from "../../shared/validation";
import {
  workspaceAuthority,
  optionContext,
  requireActiveOption,
  requireDraftGroup,
} from "../discovery-workspace-context";
import { expected } from "../service";
import {
  bounded,
  coverage,
  hash,
  observeBinding,
  acceptedAuthority,
  notClosed,
} from "./context";
import { previewImport, requireConfirmableImport } from "./interchange";
import { parsePlacements } from "./import-placement";
import { insertRevision, sha } from "./service";
import type { FertigationRecord } from "./storage-types";
import { PORTABLE_BYTES } from "./portable-limits";
function parse(value: unknown, commit: boolean) {
  bounded(value, PORTABLE_BYTES);
  const r = object(value, [
    ...(commit ? commonKeys : []),
    "id",
    "name",
    "estimating_workspace_id",
    "option_id",
    "revision_id",
    "expected_workspace_version",
    "coverage",
    "raw_json",
    ...(commit ? ["proposal_signature", "placements"] : []),
  ]);
  if (typeof r.raw_json !== "string")
    invalid(
      "raw_json",
      "Read a portable JSON or PPO-FERT-VALVES-r01 CSV file before previewing it.",
    );
  return {
    id: uuid(r.id, "id"),
    name: label(r.name, "name", 200),
    estimating_workspace_id: uuid(
      r.estimating_workspace_id,
      "estimating_workspace_id",
    ),
    option_id: uuid(r.option_id, "option_id"),
    revision_id: uuid(r.revision_id, "revision_id"),
    expected_workspace_version: version(r.expected_workspace_version),
    coverage: coverage(r.coverage),
    raw_json: r.raw_json as string,
    ...(commit
      ? {
          ...common(r),
          proposal_signature: sha(r.proposal_signature, "proposal_signature"),
          placements:
            r.placements === undefined
              ? undefined
              : parsePlacements(r.placements),
        }
      : {}),
  };
}
export async function previewNativeImport(
  p: Principal,
  _id: string,
  value: unknown,
) {
  const input = parse(value, false),
    preview = previewImport(input.raw_json, input.id);
  return transaction(async (c) => {
    const g = await workspaceAuthority(
      c,
      p,
      input.estimating_workspace_id,
      true,
    );
    expected(g.version, input.expected_workspace_version);
    await requireDraftGroup(c, p, g);
    const option = await optionContext(c, g, input.option_id);
    requireActiveOption(option);
    if (option.current_revision_id !== input.revision_id)
      throw new AppError(
        409,
        "FertigationImportSourceChanged",
        "Select the current saved Discovery alternative.",
      );
    const binding = await observeBinding(
      c,
      p,
      g.id,
      option.id,
      input.revision_id,
      input.coverage,
    );
    return {
      ...preview,
      proposal_signature: hash({
        id: input.id,
        preview_hash: preview.preview_hash,
        binding,
        workspace_version: g.version,
        name: input.name,
      }),
      canonical_binding: binding,
    };
  });
}
export async function confirmNativeImport(
  p: Principal,
  _id: string,
  value: unknown,
) {
  const parsed = parse(value, true),
    input = {
      ...parsed,
      ...common(
        object(value, [
          ...commonKeys,
          "id",
          "name",
          "estimating_workspace_id",
          "option_id",
          "revision_id",
          "expected_workspace_version",
          "coverage",
          "raw_json",
          "proposal_signature",
          "placements",
        ]),
      ),
    };
  const preview = previewImport(input.raw_json, input.id),
    proposal = requireConfirmableImport(
      preview,
      preview.source_hash,
      preview.preview_hash,
      input.placements,
    );
  // Placements are retained with the import so the audit shows where every
  // held value went (ADR-0044).
  const provenance = input.placements
    ? {
        ...preview.provenance,
        placements: [...input.placements].sort((a, b) =>
          a.path.localeCompare(b.path),
        ),
      }
    : preview.provenance;
  proposal.name = input.name;
  return sharedOperation(
    p,
    input,
    "ImportFertigationScope",
    async (c) => {
      await notClosed(c, p, input.operation_id);
      const accepted = await acceptedAuthority(
        c,
        p,
        input.id,
        input.operation_id,
      );
      if (accepted) return { g: null, binding: null };
      const g = await workspaceAuthority(
          c,
          p,
          input.estimating_workspace_id,
          true,
        ),
        binding = await observeBinding(
          c,
          p,
          g.id,
          input.option_id,
          input.revision_id,
          input.coverage,
        );
      return { g, binding };
    },
    async (c, { g, binding }) => {
      if (!g || !binding) throw unavailable();
      expected(g.version, input.expected_workspace_version);
      await requireDraftGroup(c, p, g);
      const option = await optionContext(c, g, input.option_id);
      requireActiveOption(option);
      if (
        option.current_revision_id !== input.revision_id ||
        hash({
          id: input.id,
          preview_hash: preview.preview_hash,
          binding,
          workspace_version: g.version,
          name: input.name,
        }) !== input.proposal_signature
      )
        throw new AppError(
          409,
          "FertigationImportPreviewChanged",
          "The source, file, target name or preview changed. Preview the import again.",
        );
      const revisionId = randomUUID(),
        scope = (
          await c.query<FertigationRecord>(
            "INSERT INTO ppo.fertigation_scopes(id,workspace_id,company_id,estimating_workspace_id,option_id,name,owner_id,current_revision_id,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$7,$7) RETURNING *",
            [
              input.id,
              p.workspace_id,
              g.company_id,
              g.id,
              option.id,
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
        proposal,
        input.reason,
        null,
      );
      await c.query(
        "INSERT INTO ppo.fertigation_imports(id,workspace_id,scope_id,revision_id,source_hash,source_schema,preview_hash,provenance,identity_map,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
        [
          input.operation_id,
          p.workspace_id,
          scope.id,
          revisionId,
          preview.source_hash,
          preview.source_schema,
          preview.preview_hash,
          provenance,
          preview.identity_map,
          p.actor_id,
        ],
      );
      return {
        ...scope,
        audit_details: {
          revision_id: revisionId,
          source_revision_id: binding.revision_id,
          import_id: input.operation_id,
          source_hash: preview.source_hash,
        },
      };
    },
    "FertigationScope",
    "FertigationScopeSaved",
  );
}
