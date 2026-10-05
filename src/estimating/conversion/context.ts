import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { AppError, unavailable } from "../../platform/errors";
import { companyContext, scopedOwner } from "../../shared/authority";
import { visible } from "../../shared/reads";
import { responseContext } from "../response/context";
import { versionContext } from "../context";
import { releaseHash } from "../release/context";
import { supplyRecord } from "../../supply/context";
import { exactQuantity } from "../../supply/validation";
import {
  latestResolution,
  conversionPolicy,
  type ConversionEvent,
  type PlanBasis,
} from "./model";
export function conversionConflict(message: string): never {
  throw new AppError(409, "ConversionConflict", message);
}
export async function conversionHistory(
  c: QueryClient,
  p: Principal,
  id: string,
) {
  return (
    await c.query<ConversionEvent>(
      "SELECT * FROM ppo.quote_conversion_events WHERE workspace_id=$1 AND revision_id=$2 ORDER BY sequence",
      [p.workspace_id, id],
    )
  ).rows;
}
export async function conversionAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  write = false,
) {
  const d = await responseContext(c, p, id);
  await conversionScope(c, p, d, write);
  return d;
}
// Reuse an already authorised response only inside the same serialized read.
// Source evidence is never cached across requests, actors or native mutations.
export async function conversionScope(
  c: QueryClient,
  p: Principal,
  d: Pick<Awaited<ReturnType<typeof responseContext>>, "base" | "e" | "q">,
  write = false,
) {
  const site = d.base.basis.recipient.site_id;
  await companyContext(c, p, d.e.company_id, site, "supply.read");
  if (write)
    await companyContext(c, p, d.e.company_id, site, "supply.coordinate");
  const targets = (
    await c.query<{ target_id: string }>(
      "SELECT target_id FROM ppo.quote_conversion_targets WHERE workspace_id=$1 AND quote_id=$2",
      [p.workspace_id, d.q.quote_id],
    )
  ).rows;
  for (const t of targets)
    await supplyRecord(
      c,
      p,
      t.target_id,
      write ? "supply.coordinate" : "supply.read",
    );
}
export async function conversionReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  if (
    !(
      await c.query(
        "SELECT 1 FROM ppo.quote_conversion_events WHERE workspace_id=$1 AND revision_id=$2 AND created_by=$3 AND operation_id=$4",
        [p.workspace_id, id, p.actor_id, operation],
      )
    ).rowCount
  )
    throw unavailable();
  await conversionAuthority(c, p, id, true);
}
export async function conversionContext(
  c: QueryClient,
  p: Principal,
  id: string,
) {
  const d = await conversionAuthority(c, p, id),
    events = await conversionHistory(c, p, id);
  const v = await versionContext(c, p, d.e, d.q.estimate_version_id);
  const sourceLines = v.lines.filter((l) =>
    d.q.choices.some((x) => x.line_id === l.id && x.included),
  );
  const receiving = events.filter((e) => e.action === "Receive").at(-1) ?? null;
  const plan = events.filter((e) => e.action === "Plan").at(-1) ?? null;
  const preparation = d.state.preparation;
  const holds = [...d.state.holds];
  if (!d.state.preparedApplicable)
    holds.push(
      "The exact ES-06 preparation is absent or no longer applicable.",
    );
  if (!receiving || receiving.receiving?.decision !== "Received")
    holds.push("An attributable Received decision is required.");
  if (
    receiving &&
    (receiving.preparation_id !== preparation?.id ||
      receiving.response_id !== d.state.response?.id)
  )
    holds.push(
      "The receiving decision belongs to an earlier preparation or response.",
    );
  const products = sourceLines.filter((l) => l.category === "Product");
  if (!products.length)
    holds.push(
      "This offer has no Product lines supported by the native demand target.",
    );
  const lines = products.map((l) => {
    const resolution = latestResolution(events, l.id),
      r = resolution?.resolution;
    const problems: string[] = [];
    if (!r || r.state !== "OneOff")
      problems.push(`${r?.state ?? "Missing"} item resolution.`);
    if (
      r &&
      (r.company_id !== d.e.company_id ||
        r.unit !== l.unit ||
        r.entity !== "SupplyDemand")
    )
      problems.push("Incompatible item company, entity or exact unit.");
    if (l.unit.length > 30)
      problems.push(
        "The exact unit exceeds the native demand contract; no truncation is allowed.",
      );
    try {
      exactQuantity(l.quantity, "quantity", true);
    } catch {
      problems.push(
        "Quantity is incompatible with the native demand contract.",
      );
    }
    holds.push(...problems.map((s) => `${l.description}: ${s}`));
    return { source: l, resolution, holds: problems };
  });
  const siteId = d.base.basis.recipient.site_id,
    customerId = d.base.basis.recipient.organisation_id;
  let timezone: string | null = null;
  if (!siteId) holds.push("Native demand requires the exact issued site.");
  else {
    await visible(c, p, "Site", siteId);
    const site = (
      await c.query<{ timezone: string }>(
        "SELECT timezone FROM ppo.sites WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, siteId],
      )
    ).rows[0];
    timezone = site.timezone;
  }
  await visible(c, p, "Organisation", customerId);
  if (receiving) {
    try {
      await scopedOwner(
        c,
        p,
        receiving.receiving!.owner_id,
        d.e.company_id,
        siteId ?? undefined,
        "activity.edit",
      );
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      holds.push("The receiving follow-up owner is unavailable.");
    }
  }
  const basis: PlanBasis | null =
    preparation && d.state.response && receiving && siteId && timezone
      ? {
          policy_id: conversionPolicy.id,
          issue_id: d.issue.id,
          output_hash: d.issue.output_hash!,
          response_id: d.state.response.id,
          preparation_id: preparation.id,
          receiving_id: receiving.id,
          estimate_version_id: v.id,
          estimate_hash: v.content_hash,
          option_id: d.base.basis.option_id,
          source_lines: sourceLines,
          commercial: d.q.safe_snapshot,
          target: {
            provider: "Synthetic",
            configuration: "PPO-Native",
            company: d.e.company_id,
            entity: "SupplyDemand",
            site_id: siteId,
            customer_id: customerId,
            timezone,
          },
          follow_up: receiving.receiving!,
          lines: lines
            .filter((l) => l.resolution)
            .map((l) => ({
              line_id: l.source.id,
              resolution_id: l.resolution!.id,
              item_id: l.resolution!.resolution!.item_id,
              item: `SYN-ONEOFF-${l.resolution!.resolution!.item_id}`,
              label: l.resolution!.resolution!.label,
              quantity: l.source.quantity,
              unit: l.source.unit,
            })),
        }
      : null;
  const basisHash = basis ? releaseHash(basis) : null;
  const executions = (
    await c.query<ConversionEvent>(
      "SELECT * FROM ppo.quote_conversion_events WHERE workspace_id=$1 AND quote_id=$2 AND action='Execute'",
      [p.workspace_id, d.q.quote_id],
    )
  ).rows;
  const targets = (
    await c.query<{
      target_id: string;
      line_id: string;
      plan_id: string;
      original: Record<string, unknown>;
    }>(
      "SELECT t.target_id,t.line_id,t.plan_id,r.snapshot original FROM ppo.quote_conversion_targets t JOIN ppo.supply_revisions r ON (r.workspace_id,r.record_id,r.version)=(t.workspace_id,t.target_id,1) WHERE t.workspace_id=$1 AND t.quote_id=$2 ORDER BY t.line_id",
      [p.workspace_id, d.q.quote_id],
    )
  ).rows;
  const targetDetails = [];
  for (const t of targets) {
    const current = await supplyRecord(c, p, t.target_id);
    targetDetails.push({ ...t, current, changed: current.version !== 1 });
  }
  const planApplicable =
    !!plan && plan.plan?.basis_hash === basisHash && !holds.length;
  return {
    ...d,
    events,
    conversion_sequence: events.at(-1)?.sequence ?? 0,
    source_lines: sourceLines,
    receiving,
    plan,
    lines,
    basis,
    basis_hash: basisHash,
    holds,
    plan_applicable: planApplicable,
    executions,
    targets: targetDetails,
  };
}
