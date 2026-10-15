import type { QueryClient } from "../platform/permissions";
import type { Principal } from "../platform/identity";
import { AppError } from "../platform/errors";
import { estimateContext, versionContext } from "../estimating/context";
import { calculate } from "../estimating/math";
import { active, revision, run, type Release } from "./context";
import { productBindings } from "./products";
import { costBindings } from "./costs";
import { hash } from "./hash";
import { qualityIsolated } from "./runner";
import { qualityLimits, qualityMembers } from "./quality-model";

export function qualityBound(value: unknown, bytes: number) {
  if (Buffer.byteLength(JSON.stringify(value), "utf8") > bytes)
    throw new AppError(
      422,
      "CpqQualityLimit",
      "This quality assessment exceeds the bounded evidence budget. No partial report or approval is created.",
    );
}

// Same Draft-commercial-group boundary as requireDraftGroup, without taking a
// receiving lock or requiring the reader to own the estimate. No scoped subset.
const populationSql = `SELECT e.id,a.id adoption_id,a.run_id,a.estimate_version_id adopted_version_id
  FROM ppo.estimates e
  JOIN ppo.estimating_workspaces g ON (g.workspace_id,g.opportunity_id)=(e.workspace_id,e.opportunity_id)
  JOIN ppo.estimating_options o ON (o.workspace_id,o.id)=(e.workspace_id,e.option_id)
  JOIN LATERAL (
    SELECT a.* FROM ppo.cpq_adoptions a JOIN ppo.estimate_versions v ON (v.workspace_id,v.id)=(a.workspace_id,a.estimate_version_id)
    WHERE a.workspace_id=e.workspace_id AND a.estimate_id=e.id ORDER BY v.version DESC LIMIT 1
  ) a ON true
  WHERE e.workspace_id=$1 AND e.company_id=$2 AND e.state='Draft' AND g.state='Draft' AND o.state='Active'
  AND NOT EXISTS(SELECT 1 FROM ppo.estimates sibling WHERE sibling.workspace_id=e.workspace_id AND sibling.opportunity_id=e.opportunity_id AND sibling.state<>'Draft')
  AND NOT EXISTS(SELECT 1 FROM ppo.draft_quotes q JOIN ppo.estimates sibling ON (sibling.workspace_id,sibling.id)=(q.workspace_id,q.estimate_id)
    WHERE sibling.workspace_id=e.workspace_id AND sibling.opportunity_id=e.opportunity_id AND q.state<>'Draft')
  AND NOT EXISTS(SELECT 1 FROM ppo.draft_quote_revisions q JOIN ppo.estimates sibling ON (sibling.workspace_id,sibling.id)=(q.workspace_id,q.estimate_id)
    WHERE sibling.workspace_id=e.workspace_id AND sibling.opportunity_id=e.opportunity_id AND q.state<>'Draft')
  ORDER BY e.id LIMIT $3`;

export async function qualityReport(
  c: QueryClient,
  p: Principal,
  root: Release,
) {
  const candidate = await revision(c, p, root.current_revision_id);
  const baseline = await active(c, p, root.company_id);
  const products = await productBindings(
    c,
    p,
    root.company_id,
    candidate.definition,
    true,
  );
  const cost_sources = await costBindings(
    c,
    p,
    root.company_id,
    candidate.definition,
    true,
  );
  const population = (
    await c.query<{
      id: string;
      adoption_id: string;
      run_id: string;
      adopted_version_id: string;
    }>(populationSql, [
      p.workspace_id,
      root.company_id,
      qualityLimits.estimates + 1,
    ])
  ).rows;
  // Authorize before returning size diagnostics: hidden counts are not an API.
  const sources = [];
  for (const row of population) {
    const estimate = await estimateContext(c, p, row.id);
    const current = await versionContext(
      c,
      p,
      estimate,
      estimate.current_version_id,
    );
    const saved = await run(c, p, row.run_id);
    await versionContext(c, p, estimate, row.adopted_version_id);
    sources.push({ row, estimate, current, saved });
  }
  if (population.length > qualityLimits.estimates)
    throw new AppError(
      422,
      "CpqQualityLimit",
      "The complete impact population exceeds 25 open estimates. No partial assessment is available.",
    );
  const work = {
    definition: candidate.definition,
    baseline: baseline?.revision.definition ?? null,
    estimates: sources.map((s) => ({
      id: s.estimate.id,
      input: s.saved.input,
    })),
  };
  qualityBound(work, qualityLimits.input_bytes);
  const results = await qualityIsolated(work);
  const rule_members = (
    await c.query<{
      rule_key: string;
      rule_version_id: string;
      version: number;
      content_hash: string;
    }>(
      `SELECT m.rule_key,m.rule_version_id,v.version,v.content_hash FROM ppo.cpq_release_members m
     JOIN ppo.cpq_rule_versions v ON (v.workspace_id,v.id)=(m.workspace_id,m.rule_version_id)
     WHERE m.workspace_id=$1 AND m.revision_id=$2 ORDER BY m.rule_key`,
      [p.workspace_id, candidate.id],
    )
  ).rows;
  if (candidate.definition.schema_version === 3 &&
      (rule_members.length !== candidate.definition.rules.length ||
       candidate.definition.rules.some((rule) => !rule_members.some((member) =>
         member.rule_key === rule.key && member.content_hash === hash(rule)))))
    throw new AppError(409, "CpqEvidenceMismatch", "The native rule members do not match the exact candidate definition.");
  const { simulations, ...quality } = results;
  const report = {
    schema_version: 1 as const,
    release_id: root.id,
    company_id: root.company_id,
    candidate: {
      revision_id: candidate.id,
      content_hash: candidate.content_hash,
    },
    baseline: baseline
      ? {
          activation_id: baseline.id,
          activation_version: baseline.version,
          revision_id: baseline.revision.id,
          content_hash: baseline.revision.content_hash,
        }
      : null,
    members: qualityMembers(candidate.definition),
    rule_members,
    products,
    cost_sources,
    ...quality,
    affected_estimates: sources.map(({ row, estimate, current, saved }) => {
      const simulation = simulations.find(
        (s) => s.estimate_id === estimate.id,
      )!;
      const result = simulation.result;
      const targets = [
        ...new Set(
          [...saved.result.lines, ...(result?.lines ?? [])].map((l) => l.target),
        ),
      ].sort();
      return {
        estimate_id: estimate.id,
        estimate_version: estimate.version,
        estimate_version_id: current.id,
        estimate_content_hash: current.content_hash,
        adoption_id: row.adoption_id,
        adopted_version_id: row.adopted_version_id,
        run_id: saved.id,
        run_content_hash: saved.content_hash,
        current_native: {
          lines: current.lines,
          totals: calculate(current.lines),
        },
        previous_calculation: {
          result_hash: saved.result.result_hash,
          totals: saved.result.totals,
        },
        simulation: result,
        input_status: simulation.input_status,
        input_errors: simulation.input_errors,
        line_changes: result === null ? null : targets.flatMap((target) => {
          const before =
            saved.result.lines.find((l) => l.target === target)?.line ?? null;
          const after =
            result.lines.find((l) => l.target === target)?.line ?? null;
          return hash(before) === hash(after)
            ? []
            : [{ target, before, after }];
        }),
        receiving: "ExplicitRebaseAndAdoptionRequired" as const,
      };
    }),
    limits: qualityLimits,
    synthetic: true as const,
  };
  qualityBound(report, qualityLimits.report_bytes);
  return { report, report_hash: hash(report) };
}
export type QualityReport = Awaited<ReturnType<typeof qualityReport>>["report"];

// Historical authorization deliberately does not compare current population or
// current publication: accepted evidence/receipts survive later source changes.
export async function qualitySources(
  c: QueryClient,
  p: Principal,
  report: QualityReport,
) {
  const candidate = await revision(c, p, report.candidate.revision_id);
  if (
    candidate.release_id !== report.release_id ||
    candidate.content_hash !== report.candidate.content_hash ||
    candidate.company_id !== report.company_id
  )
    throw new AppError(
      409,
      "CpqEvidenceMismatch",
      "The quality candidate evidence does not match its source.",
    );
  if (report.baseline) {
    const baseline = await revision(c, p, report.baseline.revision_id);
    if (
      baseline.company_id !== report.company_id ||
      baseline.content_hash !== report.baseline.content_hash
    )
      throw new AppError(
        409,
        "CpqEvidenceMismatch",
        "The quality baseline evidence does not match its source.",
      );
  }
  for (const member of report.affected_estimates) {
    const estimate = await estimateContext(
      c,
      p,
      member.estimate_id,
      "estimating.read",
      member.estimate_version_id,
    );
    const current = await versionContext(
      c,
      p,
      estimate,
      member.estimate_version_id,
    );
    await versionContext(c, p, estimate, member.adopted_version_id);
    const saved = await run(c, p, member.run_id);
    if (
      estimate.company_id !== report.company_id ||
      current.content_hash !== member.estimate_content_hash ||
      saved.content_hash !== member.run_content_hash
    )
      throw new AppError(
        409,
        "CpqEvidenceMismatch",
        "The retained impact source does not match its hash.",
      );
  }
}
