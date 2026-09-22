import type { Principal } from "../../platform/identity";
import type { PoolClient } from "pg";
import type { DocumentKey } from "../../adapters/contracts";
import { database } from "../../platform/database";
import { sharedOperation } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  choice,
} from "../../shared/validation";
import { documentStore, digest } from "../../documents/store";
import { expected } from "../service";
import { scopeRecord, savedRevision, notClosed } from "./context";
import {
  reportModel,
  reportHtml,
  nativeExport,
  valveCsv,
  outputTemplate,
  type ReportAudience,
  type OutputBasis,
  type ReportContext,
} from "./output";
import type { FertigationRecord, ScopeRevision } from "./storage-types";
import { renderReportPdf } from "./render";

export function outputBasis(
  scope: FertigationRecord,
  revision: ScopeRevision,
): OutputBasis {
  return {
    scope_id: scope.id,
    reference: scope.display_number,
    revision_id: revision.id,
    revision_number: revision.version,
    content_hash: revision.content_hash,
    source_revision_id: revision.source_revision_id,
    source_context_hash: revision.binding.upstream_context_hash,
    created_at: revision.created_at.toISOString(),
    calculation_edition: revision.calculation_edition,
  };
}
export async function exactOutput(
  c: PoolClient | ReturnType<typeof database>,
  p: Principal,
  id: string,
  revisionId: string,
  audience: ReportAudience,
) {
  const scope = await scopeRecord(c, p, id),
    { saved } = await savedRevision(c, p, scope, revisionId);
  const calculation = saved.calculation;
  const review = (
    await c.query<{
      id: string;
      disposition: string;
      created_by: string;
      created_at: Date;
      basis_hash: string;
    }>(
      "SELECT id,disposition,created_by,created_at,basis_hash FROM ppo.fertigation_reviews WHERE workspace_id=$1 AND scope_id=$2 AND revision_id=$3 AND content_hash=$4 ORDER BY created_at DESC,id DESC LIMIT 1",
      [p.workspace_id, scope.id, saved.id, saved.content_hash],
    )
  ).rows[0];
  const context: ReportContext = {
    author_id: saved.created_by,
    review: review
      ? { ...review, created_at: review.created_at.toISOString() }
      : null,
  };
  const model = reportModel(
    outputBasis(scope, saved),
    saved.proposal,
    calculation,
    audience,
    context,
  );
  return { scope, saved, model, html: reportHtml(model), calculation };
}
export async function exportScope(
  p: Principal,
  id: string,
  revisionId: string,
  format: "json" | "valves",
) {
  const { scope, saved, calculation } = await exactOutput(
    database(),
    p,
    id,
    revisionId,
    "internal",
  );
  const provenance = (
    await database().query(
      "SELECT revision_id,source_hash,source_schema,preview_hash,provenance,identity_map FROM ppo.fertigation_imports WHERE workspace_id=$1 AND scope_id=$2",
      [p.workspace_id, scope.id],
    )
  ).rows;
  for (const retained of provenance)
    await savedRevision(database(), p, scope, retained.revision_id);
  return format === "valves"
    ? {
        mime: "text/csv; charset=utf-8",
        filename: `${scope.display_number}-r${saved.version}-valves.csv`,
        body: valveCsv(saved.proposal),
      }
    : {
        mime: "application/json; charset=utf-8",
        filename: `${scope.display_number}-r${saved.version}.json`,
        body: JSON.stringify(
          {
            ...nativeExport(
              outputBasis(scope, saved),
              saved.proposal,
              calculation,
            ),
            import_provenance: provenance.map(
              ({
                source_hash,
                source_schema,
                preview_hash,
                provenance: origin,
                identity_map,
              }) => ({
                source_hash,
                source_schema,
                preview_hash,
                provenance: origin,
                identity_map,
              }),
            ),
          },
          null,
          2,
        ),
      };
}
export async function prepareOutput(p: Principal, id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "revision_id",
    "audience",
    "format",
  ]);
  const input = {
    ...common(r),
    scope_id: uuid(id, "scope_id"),
    expected_version: version(r.expected_version),
    revision_id: uuid(r.revision_id, "revision_id"),
    audience: choice(r.audience, "audience", ["customer", "internal"] as const),
    format:
      r.format === undefined
        ? ("html" as const)
        : choice(r.format, "format", ["html", "pdf"] as const),
  };
  return sharedOperation(
    p,
    input,
    "PrepareFertigationOutput",
    async (c) => {
      await notClosed(c, p, input.operation_id);
      const scope = await scopeRecord(c, p, id, true);
      const { saved } = await savedRevision(
        c,
        p,
        scope,
        input.revision_id,
        true,
      );
      return { scope, saved };
    },
    async (c, { scope, saved }) => {
      expected(scope.version, input.expected_version);
      const { html, model } = await exactOutput(
          c,
          p,
          id,
          saved.id,
          input.audience,
        ),
        bytes =
          input.format === "pdf"
            ? await renderReportPdf(model)
            : Buffer.from(html),
        contentHash = digest(bytes);
      const key = await documentStore().store(
        {
          workspace_id: p.workspace_id,
          actor_id: p.actor_id,
          operation_id: input.operation_id,
        },
        bytes,
        contentHash,
      );
      await c.query(
        `INSERT INTO ppo.fertigation_outputs(id,workspace_id,company_id,scope_id,revision_id,audience,template_id,source_hash,content_hash,mime_type,document_key,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          input.operation_id,
          p.workspace_id,
          scope.company_id,
          scope.id,
          saved.id,
          input.audience,
          input.format === "pdf"
            ? `${outputTemplate}-PDF-chrome153`
            : outputTemplate,
          saved.content_hash,
          contentHash,
          input.format === "pdf" ? "application/pdf" : "text/html",
          key,
          p.actor_id,
        ],
      );
      return {
        ...scope,
        audit_details: {
          revision_id: saved.id,
          output_id: input.operation_id,
          content_hash: contentHash,
        },
      };
    },
    "FertigationScope",
    "FertigationScopeSaved",
  );
}
export async function readOutput(p: Principal, id: string, outputId: string) {
  const scope = await scopeRecord(database(), p, id);
  const row = (
    await database().query<{
      revision_id: string;
      content_hash: string;
      document_key: DocumentKey;
      audience: ReportAudience;
      mime_type: string;
    }>(
      "SELECT revision_id,content_hash,document_key,audience,mime_type FROM ppo.fertigation_outputs WHERE workspace_id=$1 AND scope_id=$2 AND id=$3",
      [p.workspace_id, scope.id, uuid(outputId, "output_id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  await savedRevision(database(), p, scope, row.revision_id);
  const bytes = await documentStore().read(
    {
      workspace_id: p.workspace_id,
      actor_id: p.actor_id,
      operation_id: outputId,
    },
    row.document_key,
  );
  if (digest(bytes) !== row.content_hash)
    throw new AppError(
      409,
      "FertigationOutputMismatch",
      "The exact retained report requires recovery.",
    );
  return {
    bytes,
    hash: row.content_hash,
    mime:
      row.mime_type === "application/pdf"
        ? "application/pdf"
        : "text/html; charset=utf-8",
    filename: `${scope.display_number}-${row.audience}-${outputId}.${row.mime_type === "application/pdf" ? "pdf" : "html"}`,
  };
}
