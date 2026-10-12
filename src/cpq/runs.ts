import { randomUUID } from "node:crypto";
import type { QueryClient } from "../platform/permissions";
import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { sharedOperation } from "../platform/operations";
import { AppError, unavailable } from "../platform/errors";
import { common, commonKeys, object, uuid, label } from "../shared/validation";
import {
  selectedBasis,
  writeDiscoveryCosting,
} from "../estimating/cost-basis-service";
import { acceptedEstimateContext, versionContext } from "../estimating/context";
import { costingInput } from "../estimating/cost-basis-validation";
import { arithmeticPolicy, type CostLine } from "../estimating/math";
import { scope, parseLines } from "../estimating/validation";
import { active, duty, run, type Binding, type Run } from "./context";
import { calculationInput, digest } from "./validation";
import { calculateIsolated } from "./runner";
import { hash } from "./hash";

async function basis(
  c: QueryClient,
  p: Principal,
  id: string,
  option: string,
  revision: string,
) {
  const b = await selectedBasis(c, p, id, option, revision);
  await duty(c, p, b.g.company_id, "cpq.calculate");
  const head = await active(c, p, b.g.company_id);
  if (!head)
    throw new AppError(
      409,
      "CpqReleaseRequired",
      "Publish a reviewed CPQ release for this company before calculating.",
    );
  const saved = b.e
    ? await versionContext(c, p, b.e, b.e.current_version_id)
    : null;
  const binding: Binding = {
    estimating_workspace_id: b.g.id,
    option_id: b.option.id,
    revision_id: b.r.id,
    source_hash: b.r.content_hash!,
    context_hash: b.targets.context_hash,
    workspace_version: b.g.version,
    estimate_id: b.e?.id ?? null,
    estimate_version: b.e?.version ?? 0,
    estimate_content_hash: saved?.content_hash ?? null,
    activation_id: head.id,
    activation_version: head.version,
    release_revision_id: head.revision.id,
  };
  return { ...b, head, saved, binding };
}
export async function previewCalculation(
  p: Principal,
  id: string,
  query: Record<string, string>,
) {
  const q = object(query, ["option_id", "revision_id"]);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const b = await basis(
      c,
      p,
      id,
      uuid(q.option_id, "option_id"),
      uuid(q.revision_id, "revision_id"),
    );
    return {
      binding: b.binding,
      binding_hash: hash(b.binding),
      release: b.head.revision,
      discovery: b.r.input,
      selected_scope: b.targets.compiled,
      current_estimate: b.saved,
      synthetic: true,
    };
  });
}
export async function calculateRun(p: Principal, id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "id",
    "option_id",
    "revision_id",
    "binding_hash",
    "parent_id",
    "input",
  ]);
  const input = {
    ...common(r),
    workspace_id: uuid(id, "workspace_id"),
    id: uuid(r.id, "id"),
    option_id: uuid(r.option_id, "option_id"),
    revision_id: uuid(r.revision_id, "revision_id"),
    binding_hash: digest(r.binding_hash, "binding_hash"),
    parent_id: r.parent_id === null ? null : uuid(r.parent_id, "parent_id"),
    input: r.input,
  };
  return sharedOperation(
    p,
    input,
    "Cpq:Calculate",
    async (c) => {
      const prior = (
        await c.query(
          "SELECT 1 FROM ppo.cpq_runs WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, input.id],
        )
      ).rowCount;
      if (prior) {
        await run(c, p, input.id, true);
        return null;
      }
      return basis(
        c,
        p,
        input.workspace_id,
        input.option_id,
        input.revision_id,
      );
    },
    async (c, initial) => {
      const b =
        initial ??
        (await basis(
          c,
          p,
          input.workspace_id,
          input.option_id,
          input.revision_id,
        ));
      if (hash(b.binding) !== input.binding_hash)
        throw new AppError(
          409,
          "CpqBasisChanged",
          "Discovery, estimate or active rules changed. Refresh the calculation basis and compare before retrying.",
        );
      if (input.parent_id) {
        const parent = await run(c, p, input.parent_id, true);
        if (
          parent.option_id !== input.option_id ||
          parent.estimating_workspace_id !== input.workspace_id
        )
          throw unavailable();
      }
      const proposal = calculationInput(
          input.input,
          b.head.revision.definition.facts,
        ),
        result = await calculateIsolated(b.head.revision.definition, proposal);
      const content_hash = hash({
        binding: b.binding,
        input: proposal,
        result,
      });
      const saved = (
        await c.query<Run>(
          `INSERT INTO ppo.cpq_runs(id,workspace_id,company_id,display_number,estimating_workspace_id,option_id,discovery_revision_id,release_revision_id,activation_id,parent_id,binding,input,result,content_hash,state,reason,created_by,updated_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$17) RETURNING *`,
          [
            input.id,
            p.workspace_id,
            b.g.company_id,
            null,
            b.g.id,
            b.option.id,
            b.r.id,
            b.head.revision.id,
            b.head.id,
            input.parent_id,
            b.binding,
            proposal,
            result,
            content_hash,
            result.ready ? "Ready" : "Blocked",
            input.reason,
            p.actor_id,
          ],
        )
      ).rows[0];
      return {
        ...saved,
        audit_details: {
          content_hash,
          release_revision_id: b.head.revision.id,
          discovery_revision_id: b.r.id,
          parent_id: input.parent_id,
          result_hash: result.result_hash,
        },
      };
    },
    "CpqRun",
    "CpqChanged",
  );
}
async function receiving(c: QueryClient, p: Principal, id: string) {
  const saved = await run(c, p, id, true),
    b = await basis(
      c,
      p,
      saved.estimating_workspace_id,
      saved.option_id,
      saved.discovery_revision_id,
    );
  if (!saved.result.ready)
    throw new AppError(
      409,
      "CpqRunBlocked",
      "Resolve this calculation's diagnostics before adopting it.",
    );
  if (hash(b.binding) !== hash(saved.binding))
    throw new AppError(
      409,
      "CpqBasisChanged",
      "The source, estimate or active release changed. Recalculate against the current basis.",
    );
  const previous = b.e
    ? (
        await c.query<{ lines: CostLine[] }>(
          "SELECT a.lines FROM ppo.cpq_adoptions a JOIN ppo.estimate_versions v ON (v.workspace_id,v.id)=(a.workspace_id,a.estimate_version_id) WHERE a.workspace_id=$1 AND a.estimate_id=$2 ORDER BY v.version DESC LIMIT 1",
          [p.workspace_id, b.e.id],
        )
      ).rows[0]
    : null;
  const owned = previous?.lines ?? [],
    current = b.saved?.lines ?? [];
  for (const line of owned) {
    const present = current.find((l) => l.id === line.id);
    if (hash(present ?? null) !== hash(line))
      throw new AppError(
        409,
        "CpqOwnedLineChanged",
        "A previously adopted CPQ line was edited or removed in the estimate. Resolve that change before replacing it.",
      );
  }
  const retained = current.filter((l) => !owned.some((o) => o.id === l.id)),
    generated = saved.result.lines.map((l) => l.line);
  if (retained.some((l) => generated.some((g) => g.id === l.id)))
    throw new AppError(
      409,
      "CpqLineIdentityConflict",
      "A generated identity conflicts with a retained estimate line.",
    );
  if (retained.length + generated.length > 100)
    throw new AppError(
      409,
      "CpqReceivingLineLimit",
      "Generated and retained costs exceed the native estimate's 100-line limit.",
    );
  // Do not infer an allowance choice for a preserved schema-1 estimate.
  const lines = parseLines([...retained, ...generated], 2);
  const preview_hash = hash({
    run_id: saved.id,
    result_hash: saved.result.result_hash,
    binding: b.binding,
    lines,
  });
  return { saved, b, lines, generated, retained, preview_hash };
}
export async function previewAdoption(p: Principal, id: string) {
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const r = await receiving(c, p, id);
    return {
      run_id: id,
      result_hash: r.saved.result.result_hash,
      preview_hash: r.preview_hash,
      binding: r.b.binding,
      retained_lines: r.retained,
      generated_lines: r.generated,
      title: r.b.saved?.title ?? null,
      scope: r.b.saved?.scope ?? null,
      synthetic: true,
    };
  });
}
export async function adoptRun(p: Principal, id: string, value: unknown) {
  const r = object(value, [
      ...commonKeys,
      "preview_hash",
      "result_hash",
      "estimate_id",
      "title",
      "scope",
    ]),
    input = {
      ...common(r),
      id: uuid(id, "run_id"),
      preview_hash: digest(r.preview_hash, "preview_hash"),
      result_hash: digest(r.result_hash, "result_hash"),
      estimate_id: uuid(r.estimate_id, "estimate_id"),
      title: label(r.title, "title", 200),
      scope: scope(r.scope),
    };
  return sharedOperation(
    p,
    input,
    "Cpq:Adopt",
    async (c) => {
      await run(c, p, input.id, true);
      await acceptedEstimateContext(
        c,
        p,
        input.estimate_id,
        input.operation_id,
      );
    },
    async (c) => {
      const x = await receiving(c, p, input.id);
      if (
        x.preview_hash !== input.preview_hash ||
        x.saved.result.result_hash !== input.result_hash
      )
        throw new AppError(
          409,
          "CpqPreviewChanged",
          "Review the exact current adoption preview.",
        );
      const b = x.b.binding;
      if (b.estimate_id && b.estimate_id !== input.estimate_id)
        throw unavailable();
      const native = costingInput(b.estimating_workspace_id, {
        ...common(input),
        estimate_id: input.estimate_id,
        option_id: b.option_id,
        revision_id: b.revision_id,
        expected_workspace_version: b.workspace_version,
        expected_estimate_version: b.estimate_version,
        context_hash: b.context_hash,
        title: input.title,
        scope: input.scope,
        lines: x.lines,
        policy: arithmeticPolicy,
      });
      const result = await writeDiscoveryCosting(c, p, native);
      await c.query(
        "INSERT INTO ppo.cpq_adoptions(id,workspace_id,company_id,run_id,estimate_id,estimate_version_id,result_hash,lines,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          randomUUID(),
          p.workspace_id,
          x.saved.company_id,
          x.saved.id,
          result.id,
          result.current_version_id,
          x.saved.result.result_hash,
          JSON.stringify(x.generated),
          p.actor_id,
        ],
      );
      return {
        ...result,
        audit_details: {
          ...result.audit_details,
          cpq_run_id: x.saved.id,
          cpq_result_hash: x.saved.result.result_hash,
          cpq_release_revision_id: x.saved.release_revision_id,
        },
      };
    },
    "Estimate",
    "EstimateVersionSaved",
  );
}
