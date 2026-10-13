import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import { issueContext } from "../documents/context";
import { reportContext } from "../reports/context";
import { readBundle, type OutputManifest } from "../documents/worker";
import { readReportBundle, type ReportManifest } from "../reports/worker";
import { digest, documentStore } from "../documents/store";
import { canonical } from "../platform/operations";
import type { Source, SourceInput } from "./types";
export const exactUnavailable = () =>
  new AppError(
    503,
    "ExactDocumentUnavailable",
    "The exact revision is unavailable. Retain its reference and recover the original content; no successor is substituted.",
  );
export async function nativeSource(
  c: QueryClient,
  p: Principal,
  kind: "JobPackIssue" | "ReportIssue",
  id: string,
) {
  try {
    if (kind === "JobPackIssue") {
      const { issue, pack, a, w } = await issueContext(c, p, id);
      const revision = (
        await c.query(
          "SELECT created_by FROM ppo.pack_revisions WHERE workspace_id=$1 AND pack_id=$2 AND id=$3",
          [p.workspace_id, pack.id, issue.revision_id],
        )
      ).rows[0];
      if (!revision) throw unavailable();
      return {
        manifest: issue.manifest as OutputManifest,
        company_id: a.company_id,
        site_id: a.site_id,
        organisation_id: w.customer_id,
        author_id: revision.created_by as string,
        current:
          pack.current_issue_id === id &&
          pack.status === "Issued" &&
          !pack.needs_review,
        bytes: async () =>
          Buffer.from((await readBundle(p, issue.manifest)).pdf),
      };
    }
    const issue = (
      await c.query(
        "SELECT * FROM ppo.report_issues WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, id],
      )
    ).rows[0];
    if (!issue) throw unavailable();
    const { report, w } = await reportContext(c, p, issue.report_id);
    const revision = (
      await c.query(
        "SELECT actor_id FROM ppo.report_revisions WHERE workspace_id=$1 AND report_id=$2 AND id=$3",
        [p.workspace_id, report.id, issue.revision_id],
      )
    ).rows[0];
    if (!revision) throw unavailable();
    return {
      manifest: issue.manifest as ReportManifest,
      company_id: report.company_id,
      site_id: report.site_id,
      organisation_id: w.customer_id,
      author_id: revision.actor_id as string,
      current: report.current_issue_id === id && report.status === "Issued",
      bytes: async () =>
        Buffer.from((await readReportBundle(p, issue.manifest)).pdf),
    };
  } catch (e) {
    if (e instanceof AppError && (e.status === 403 || e.status === 404))
      throw unavailable();
    throw e;
  }
}
export function envelope(
  document_id: string,
  revision_id: string,
  source: Pick<Source, "operation_id" | "command_hash">,
  text: string,
) {
  return Buffer.from(
    canonical({
      schema_version: 1,
      document_id,
      revision_id,
      operation_id: source.operation_id,
      command_hash: source.command_hash,
      text,
    }),
    "utf8",
  );
}
export async function sourceAuthority(
  c: QueryClient,
  p: Principal,
  source: Source,
) {
  if (source.kind === "SyntheticText") return { current: true };
  const n = await nativeSource(c, p, source.kind, source.issue_id!);
  if (
    n.manifest.pdf_hash !== source.content_hash ||
    n.manifest.pdf_bytes !== source.byte_count ||
    n.author_id !== source.author_id
  )
    throw exactUnavailable();
  return { current: n.current };
}
export async function capture(
  c: QueryClient,
  p: Principal,
  input: SourceInput,
  ctx: {
    id: string;
    company_id: string;
    site_id: string | null;
    organisation_id: string;
  },
  revision_id: string,
  operation_id: string,
  command_hash: string,
): Promise<Source> {
  if (input.kind !== "SyntheticText") {
    const n = await nativeSource(c, p, input.kind, input.issue_id);
    if (
      n.company_id !== ctx.company_id ||
      n.site_id !== ctx.site_id ||
      n.organisation_id !== ctx.organisation_id
    )
      throw unavailable();
    const source: Source = {
      kind: input.kind,
      issue_id: input.issue_id,
      author_id: n.author_id,
      content_hash: n.manifest.pdf_hash,
      byte_count: n.manifest.pdf_bytes,
      content_type: "application/pdf",
      store_key: null,
      envelope_hash: null,
      operation_id,
      command_hash,
    };
    await exactBytes(c, p, ctx.id, revision_id, source);
    return source;
  }
  const bytes = Buffer.from(input.text, "utf8"),
    wrapped = envelope(
      ctx.id,
      revision_id,
      { operation_id, command_hash },
      input.text,
    );
  const key = await documentStore().store(
    { ...p, operation_id },
    wrapped,
    digest(wrapped),
  );
  const source: Source = {
    kind: input.kind,
    issue_id: null,
    author_id: p.actor_id,
    content_hash: digest(bytes),
    byte_count: bytes.length,
    content_type: "text/plain; charset=utf-8",
    store_key: key,
    envelope_hash: digest(wrapped),
    operation_id,
    command_hash,
  };
  await exactBytes(c, p, ctx.id, revision_id, source);
  return source;
}
export async function exactBytes(
  c: QueryClient,
  p: Principal,
  document_id: string,
  revision_id: string,
  source: Source,
) {
  await sourceAuthority(c, p, source);
  let bytes: Buffer;
  try {
    if (source.kind === "SyntheticText") {
      if (!source.store_key) throw exactUnavailable();
      const wrapped = Buffer.from(
        await documentStore().read(
          { ...p, operation_id: source.operation_id },
          source.store_key,
        ),
      );
      if (digest(wrapped) !== source.envelope_hash) throw exactUnavailable();
      const value = JSON.parse(wrapped.toString("utf8"));
      if (
        typeof value.text !== "string" ||
        !wrapped.equals(envelope(document_id, revision_id, source, value.text))
      )
        throw exactUnavailable();
      bytes = Buffer.from(value.text, "utf8");
    } else
      bytes = await (
        await nativeSource(c, p, source.kind, source.issue_id!)
      ).bytes();
    if (
      bytes.length !== source.byte_count ||
      digest(bytes) !== source.content_hash
    )
      throw exactUnavailable();
  } catch (e) {
    if (e instanceof AppError && (e.status === 403 || e.status === 404))
      throw unavailable();
    throw exactUnavailable();
  }
  await sourceAuthority(c, p, source);
  return bytes;
}
export async function recoverExact(
  p: Principal,
  document_id: string,
  revision_id: string,
  source: Source,
  text: string,
) {
  if (source.kind !== "SyntheticText")
    throw new AppError(
      409,
      "NativeRecoveryRequired",
      "Recover this exact issue through its owning document workflow.",
    );
  const bytes = Buffer.from(text, "utf8"),
    wrapped = envelope(document_id, revision_id, source, text);
  if (
    digest(bytes) !== source.content_hash ||
    bytes.length !== source.byte_count ||
    digest(wrapped) !== source.envelope_hash
  )
    throw new AppError(
      409,
      "RecoveryMismatch",
      "Recovery must reproduce the original exact content.",
    );
  const key = await documentStore().store(
    { ...p, operation_id: source.operation_id },
    wrapped,
    digest(wrapped),
  );
  if (canonical(key) !== canonical(source.store_key)) throw exactUnavailable();
}
