import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { AppError, unavailable } from "../../platform/errors";
import type { QueryClient } from "../../platform/permissions";
import { canonical, sharedOperation } from "../../platform/operations";
import { companyContext } from "../../shared/authority";
import {
  common,
  object,
  uuid,
  version,
  narrative,
} from "../../shared/validation";
import { current, proposalContext, revisionContext } from "../drafts/context";
import { hashInput } from "../drafts/validation";
import { digest } from "../store";
import { rendererVersion } from "../render";
import { definition, publicationRenderer } from "./contracts";

export function publicationInput(value: unknown) {
  const q = object(value, [
    "operation_id",
    "schema_version",
    "reason",
    "id",
    "template_id",
    "expected_version",
    "revision_id",
    "content_hash",
    "review_id",
    "runtime_version",
    "definition_hash",
    "approval_note",
  ]);
  return {
    ...common(q),
    id: uuid(q.id, "id"),
    template_id: uuid(q.template_id, "template_id"),
    expected_version: version(q.expected_version),
    revision_id: uuid(q.revision_id, "revision_id"),
    content_hash: hashInput(q.content_hash),
    review_id: uuid(q.review_id, "review_id"),
    runtime_version: version(q.runtime_version),
    definition_hash: hashInput(q.definition_hash, "definition_hash"),
    approval_note: narrative(q.approval_note, "approval_note", 2000),
  };
}
async function authority(
  c: QueryClient,
  p: Principal,
  id: string,
  publish = false,
) {
  const ctx = await proposalContext(
    c,
    p,
    id,
    publish ? "template.publish" : "template.read",
  );
  if (publish)
    await companyContext(c, p, ctx.d.company_id, ctx.d.site_id, "pack.check");
  return ctx;
}
export async function publicationContext(
  c: QueryClient,
  p: Principal,
  id: string,
  publish = false,
) {
  const pub = (
    await c.query(
      "SELECT * FROM ppo.template_publications WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "publication_id")],
    )
  ).rows[0];
  if (!pub) throw unavailable();
  const { d } = await authority(c, p, pub.proposal_id, publish);
  await revisionContext(c, p, d, pub.revision_id);
  return pub;
}
export async function receiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  const pub = await publicationContext(c, p, id, true);
  if (pub.publisher_id !== p.actor_id || pub.operation_id !== operation)
    throw unavailable();
}
async function candidate(c: QueryClient, p: Principal, id: string) {
  const { d, r } = await authority(c, p, id, true);
  if (d.family !== "OUT-09")
    throw new AppError(
      422,
      "UnsupportedTemplateFamily",
      "R3 supports OUT-09 publication only.",
    );
  const review = (
    await c.query(
      "SELECT * FROM ppo.template_proposal_reviews WHERE workspace_id=$1 AND proposal_id=$2 AND revision_id=$3 ORDER BY proposal_version DESC LIMIT 1",
      [p.workspace_id, d.id, r.id],
    )
  ).rows[0];
  if (
    d.state !== "Reviewed" ||
    !review ||
    review.outcome !== "Reviewed" ||
    review.proposal_version !== d.version ||
    review.content_hash !== r.content_hash
  )
    throw new AppError(
      409,
      "ReviewRequired",
      "Review the exact current proposal before publication.",
    );
  if (
    (
      await c.query(
        "SELECT 1 FROM ppo.template_proposal_revisions WHERE workspace_id=$1 AND proposal_id=$2 AND created_by=$3",
        [p.workspace_id, d.id, p.actor_id],
      )
    ).rowCount
  )
    throw new AppError(
      409,
      "IndependentPublicationRequired",
      "A contributor cannot publish this proposal.",
    );
  const published = (
    await c.query(
      "SELECT id FROM ppo.template_publications WHERE workspace_id=$1 AND revision_id=$2",
      [p.workspace_id, r.id],
    )
  ).rows[0];
  if (published)
    throw new AppError(
      409,
      "AlreadyPublished",
      "This exact revision already has a publication; recover its original operation.",
    );
  const next = (
    await c.query(
      "SELECT greatest(coalesce(max(version),2)+1,3) AS version FROM ppo.pack_templates WHERE workspace_id=$1",
      [p.workspace_id],
    )
  ).rows[0].version;
  const retained = await definition(
    await publicationRenderer(c),
    next,
    r.body,
    {
      proposal_id: d.id,
      revision_id: r.id,
      content_hash: r.content_hash,
    },
  );
  return {
    d,
    r,
    review,
    runtime_version: next,
    definition: retained,
    definition_hash: digest(retained),
  };
}
export async function publicationReadiness(
  p: Principal,
  id: string,
  q: Record<string, string> = {},
) {
  object(q, []);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const v = await candidate(c, p, id);
    return {
      synthetic: true,
      publication_eligible: true,
      use_assigned: false,
      proposal_id: v.d.id,
      expected_version: v.d.version,
      revision_id: v.r.id,
      content_hash: v.r.content_hash,
      review_id: v.review.id,
      runtime_version: v.runtime_version,
      definition: v.definition,
      definition_hash: v.definition_hash,
    };
  });
}
export async function readPublication(
  p: Principal,
  id: string,
  q: Record<string, string> = {},
) {
  object(q, []);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const pub = await publicationContext(c, p, id);
    const { supportedTemplateDefinition } = await import("./contracts");
    let runtime_support = "Unavailable";
    try {
      runtime_support =
        (await supportedTemplateDefinition(
          "OUT-09",
          pub.runtime_version,
          pub.definition,
        )) === pub.definition
          ? "Supported"
          : "DefinitionChanged";
    } catch (e) {
      if (
        !["ENOENT", "EACCES", "EPERM"].includes(
          (e as NodeJS.ErrnoException).code ?? "",
        )
      )
        throw e;
    }
    return {
      synthetic: true,
      publication: pub,
      runtime_support,
      use_assignment: "SeparatePolicyDecision",
    };
  });
}
export async function publishTemplate(
  p: Principal,
  id: string,
  value: unknown,
) {
  const input = {
    ...publicationInput(value),
    proposal_id: uuid(id, "proposal_id"),
  };
  return sharedOperation(
    p,
    input,
    "Template:Publish",
    async (c) => {
      const ctx = await authority(c, p, input.proposal_id, true);
      await revisionContext(c, p, ctx.d, input.revision_id);
      return ctx;
    },
    async (c, { d, r }) => {
      current(d, input.expected_version, input.revision_id);
      const v = await candidate(c, p, d.id);
      if (
        r.content_hash !== input.content_hash ||
        v.review.id !== input.review_id ||
        v.runtime_version !== input.runtime_version ||
        v.definition_hash !== input.definition_hash
      )
        throw new AppError(
          409,
          "StalePublication",
          "Reload the exact reviewed proposal and current renderer support.",
        );
      await c.query(
        "INSERT INTO ppo.pack_templates(id,workspace_id,version,name,renderer_version,definition,content_hash) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          input.template_id,
          p.workspace_id,
          v.runtime_version,
          r.body.title,
          rendererVersion,
          v.definition,
          v.definition_hash,
        ],
      );
      const pub = (
        await c.query(
          `INSERT INTO ppo.template_publications(id,workspace_id,proposal_id,revision_id,review_id,proposal_version,template_id,runtime_version,definition,definition_hash,publisher_id,operation_id,reason,approval_note,command_hash,proposal_snapshot,review_snapshot)
      SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,to_jsonb(d),to_jsonb(r)
      FROM ppo.template_proposals d JOIN ppo.template_proposal_reviews r ON r.workspace_id=d.workspace_id AND r.proposal_id=d.id
      WHERE d.workspace_id=$2 AND d.id=$3 AND r.id=$5 RETURNING *`,
          [
            input.id,
            p.workspace_id,
            d.id,
            r.id,
            v.review.id,
            d.version,
            input.template_id,
            v.runtime_version,
            v.definition,
            v.definition_hash,
            p.actor_id,
            input.operation_id,
            input.reason,
            input.approval_note,
            digest(canonical({ command: "Template:Publish", ...input })),
          ],
        )
      ).rows[0];
      return {
        id: pub.id,
        version: 1,
        state: "Published",
        updated_at: pub.published_at,
        audit_details: {
          template_id: input.template_id,
          revision_id: r.id,
          review_id: v.review.id,
          definition_hash: v.definition_hash,
        },
        publication_event: {
          family: "OUT-09",
          publication_type: "TemplateDefinition" as const,
          template_id: input.template_id,
          template_version: v.runtime_version,
          definition_hash: v.definition_hash,
          review_id: v.review.id,
          proposal_revision_id: r.id,
          use_assigned: false as const,
        },
      };
    },
    "TemplatePublication",
    "PolicyOrTemplatePublished",
  );
}
