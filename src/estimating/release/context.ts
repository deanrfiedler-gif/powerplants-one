import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { hasPermission } from "../../platform/permissions";
import { canonical } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import { digest } from "../../documents/store";
import { quoteContext, type QuoteRevision } from "../context";
import { estimateSite } from "../cost-basis-context";
import { exactBasis, reviewHistory } from "../review/context";
import { latestDecisions } from "../review/model";
import { visibleOpportunity, relationshipContext } from "../../crm/context";
import { quoteAmounts } from "../math";
import type { SafeQuote } from "../template";
import {
  releasePolicy,
  releasePolicyHash,
  releaseCapabilities,
  type ReleaseAction,
} from "./policy";
import { releaseTemplate } from "./template";
import type { draftBytes } from "../worker";

export type ReleaseQuote = QuoteRevision & { created_by: string };
export type ReleaseSource = {
  policy_id: string;
  policy_hash: string;
  estimate_id: string;
  estimate_version_id: string;
  estimate_hash: string;
  option_id: string;
  review: {
    submission_id: string | null;
    decisions: { id: string | null; kind: string; fingerprint: string }[];
  };
  choices: QuoteRevision["choices"];
  recipient: {
    organisation_id: string;
    organisation_version: number;
    customer: string;
    person_id: string | null;
    person_version: number | null;
    contact: string | null;
    site_id: string | null;
    site_version: number | null;
    site: string | null;
    opportunity_version: number;
  };
};
export type ReleaseBase = {
  revision_id: string;
  workspace_id: string;
  company_id: string;
  quote_id: string;
  source_revision_id: string;
  predecessor_issue_id: string | null;
  basis: ReleaseSource;
  basis_hash: string;
  created_by: string;
  created_at: Date;
  operation_id: string;
};
export type ReleaseEvent = {
  id: string;
  workspace_id: string;
  quote_id: string;
  revision_id: string;
  sequence: number;
  action: ReleaseAction;
  outcome: string;
  approval_id: string | null;
  issue_id: string | null;
  attempt_id: string | null;
  resolves_event_id: string | null;
  output_hash: string | null;
  manifest: Awaited<ReturnType<typeof draftBytes>>["manifest"] | null;
  reason: string;
  created_by: string;
  created_at: Date;
  operation_id: string;
};
export const releaseHash = (v: unknown) => digest(canonical(v));
export function releaseConflict(message: string): never {
  throw new AppError(409, "ReleaseConflict", message);
}

export async function releaseHistory(
  c: QueryClient,
  p: Principal,
  quoteId: string,
) {
  const events = (
    await c.query<ReleaseEvent>(
      "SELECT * FROM ppo.quote_release_events WHERE workspace_id=$1 AND quote_id=$2 ORDER BY sequence",
      [p.workspace_id, quoteId],
    )
  ).rows;
  return { events, sequence: events.at(-1)?.sequence ?? 0 };
}
export async function releaseBase(c: QueryClient, p: Principal, id: string) {
  return (
    (
      await c.query<ReleaseBase>(
        "SELECT * FROM ppo.quote_release_bases WHERE workspace_id=$1 AND revision_id=$2",
        [p.workspace_id, id],
      )
    ).rows[0] ?? null
  );
}
export async function releaseAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  action?: ReleaseAction,
) {
  const { q: raw, e } = await quoteContext(
      c,
      p,
      id,
      action === "Prepare"
        ? "estimating.quote.prepare"
        : "estimating.quote.read",
    ),
    q = raw as ReleaseQuote;
  // A read already obtained this exact context above. Preparation separately
  // requires both prepare and read authority, so it retains the second check.
  if (action === "Prepare") await quoteContext(c, p, id);
  if (
    digest(q.input_html) !== q.input_hash ||
    digest(q.template_definition) !== q.template_hash
  )
    releaseConflict(
      "The exact quotation input does not match its original evidence.",
    );
  await exactBasis(c, p, e.id, q.estimate_version_id);
  if (
    action &&
    !(await hasPermission(
      c,
      p,
      releaseCapabilities[action],
      e.company_id,
      estimateSite(e) ?? undefined,
    ))
  )
    throw unavailable();
  const base = await releaseBase(c, p, id);
  if (base) {
    if (releaseHash(base.basis) !== base.basis_hash)
      releaseConflict(
        "The retained release binding does not match its original hash.",
      );
    const o = await visibleOpportunity(c, p, e.opportunity_id),
      r = base.basis.recipient;
    await relationshipContext(
      c,
      p,
      {
        ...o,
        organisation_id: r.organisation_id,
        primary_person_id: r.person_id,
        site_id: r.site_id,
      },
      "estimating.quote.read",
    );
  }
  return { q, e, base };
}

// This source is read under the caller's workspace lock. It contains no costs in the customer document.
export async function releaseSource(
  c: QueryClient,
  p: Principal,
  q: ReleaseQuote,
) {
  const { e, v, basis } = await exactBasis(
      c,
      p,
      q.estimate_id,
      q.estimate_version_id,
    ),
    history = await reviewHistory(c, p, e.id);
  const current = await exactBasis(c, p, e.id),
    statuses = latestDecisions(
      history.submissions,
      history.decisions,
      current.basis,
    ),
    submission = history.submissions.at(-1);
  const problems: string[] = [];
  if (e.current_version_id !== q.estimate_version_id)
    problems.push(
      "The quotation uses an earlier saved estimate; prepare an explicit successor from the current version.",
    );
  if (
    submission?.estimate_version_id !== q.estimate_version_id ||
    !statuses.every((s) => s.applicable && s.decision?.outcome === "Reviewed")
  )
    problems.push(
      "Complete the exact estimate's independent completeness, source-price and technical reviews.",
    );
  if (basis.discovery_revision_id !== basis.current_discovery_revision_id)
    problems.push("The discovery scope changed; review the new saved basis.");
  const o = await visibleOpportunity(c, p, e.opportunity_id);
  const recipient = (
    await c.query<ReleaseSource["recipient"]>(
      `SELECT org.id organisation_id,org.version organisation_version,org.display_name customer,
    pe.id person_id,pe.version person_version,pe.display_name contact,s.id site_id,s.version site_version,s.display_name site,o.version opportunity_version
    FROM ppo.opportunities o JOIN ppo.organisations org ON (org.workspace_id,org.id)=(o.workspace_id,o.organisation_id)
    LEFT JOIN ppo.people pe ON (pe.workspace_id,pe.id)=(o.workspace_id,o.primary_person_id)
    LEFT JOIN ppo.sites s ON s.workspace_id=o.workspace_id AND s.id=$3 WHERE o.workspace_id=$1 AND o.id=$2`,
      [p.workspace_id, o.id, estimateSite(e)],
    )
  ).rows[0];
  if (!recipient.person_id) problems.push("Named recipient: Not configured.");
  const source: ReleaseSource = {
    policy_id: releasePolicy.id,
    policy_hash: releasePolicyHash,
    estimate_id: e.id,
    estimate_version_id: v.id,
    estimate_hash: v.content_hash,
    option_id: e.option_id,
    review: {
      submission_id: submission?.id ?? null,
      decisions: statuses.map((s) => ({
        id: s.decision?.id ?? null,
        kind: s.kind,
        fingerprint: current.basis.fingerprints[s.kind],
      })),
    },
    choices: q.choices,
    recipient,
  };
  const header = (
    await c.query<{
      id: string;
      version: number;
      current_revision_id: string;
      display_number: string;
    }>(
      "SELECT id,version,current_revision_id,display_number FROM ppo.draft_quotes WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, q.quote_id],
    )
  ).rows[0];
  const snapshot: SafeQuote = {
    synthetic: true,
    state: "Draft",
    display_number: header.display_number,
    revision: header.version + 1,
    title: v.title,
    customer: recipient.customer,
    site: recipient.site,
    contact: recipient.contact,
    scope: v.scope,
    ...quoteAmounts(v.lines, q.choices),
    tax_calculated: false,
  };
  return {
    e,
    v,
    source,
    source_hash: releaseHash(source),
    header,
    snapshot,
    problems,
  };
}
export async function releasePreview(c: QueryClient, p: Principal, id: string) {
  const { q } = await releaseAuthority(c, p, id),
    source = await releaseSource(c, p, q),
    template = await releaseTemplate(source.snapshot);
  if (source.header.current_revision_id !== id)
    source.problems.push(
      "Use the quotation's current revision before preparing a successor.",
    );
  return {
    ...source,
    template,
    basis_hash: releaseHash({
      source: source.source,
      source_revision_id: id,
      quote_version: source.header.version,
      template_hash: template.template_hash,
      input_hash: template.input_hash,
    }),
  };
}
export async function requireCurrentRelease(
  c: QueryClient,
  p: Principal,
  id: string,
  action?: ReleaseAction,
) {
  const context = await releaseAuthority(c, p, id, action);
  if (!context.base)
    releaseConflict("Prepare the synthetic release document first.");
  const source = await releaseSource(c, p, context.q);
  if (
    source.header.current_revision_id !== id ||
    source.problems.length ||
    source.source_hash !== context.base.basis_hash
  )
    releaseConflict(
      source.problems[0] ??
        "The source, recipient or quotation changed. Prepare a deliberate successor; existing approval and issue evidence is retained.",
    );
  const template = await releaseTemplate(context.q.safe_snapshot);
  if (
    template.template_hash !== context.q.template_hash ||
    template.input_hash !== context.q.input_hash
  )
    releaseConflict(
      "The demonstration terms or template changed. Prepare a deliberate successor.",
    );
  return { ...context, base: context.base, source };
}
export async function releaseReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  const event = (
    await c.query<ReleaseEvent>(
      "SELECT * FROM ppo.quote_release_events WHERE workspace_id=$1 AND revision_id=$2 AND created_by=$3 AND operation_id=$4",
      [p.workspace_id, id, p.actor_id, operation],
    )
  ).rows[0];
  if (!event) throw unavailable();
  await releaseAuthority(c, p, id, event.action);
}
