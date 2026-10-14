import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { transaction } from "../platform/database";
import { sharedOperation } from "../platform/operations";
import { AppError } from "../platform/errors";
import {
  common,
  commonKeys,
  invalid,
  object,
  uuid,
} from "../shared/validation";
import { digest } from "./validation";
import { run, revision } from "./context";
import { basis } from "./runs";
import { boundInput } from "./source-facts";
import { rebaseDecisions } from "./rebase-model";
import { rebaseIsolated } from "./runner";
import { storeRun } from "./run-store";
import { hash } from "./hash";

function proposal(value: unknown) {
  const r = object(value, ["revision_id", "input", "decisions"]);
  return {
    revision_id: uuid(r.revision_id, "revision_id"),
    input: r.input,
    decisions: rebaseDecisions(r.decisions),
  };
}
async function prepare(
  c: QueryClient,
  p: Principal,
  id: string,
  input: ReturnType<typeof proposal>,
) {
  const parent = await run(c, p, id, true);
  const b = await basis(
    c,
    p,
    parent.estimating_workspace_id,
    parent.option_id,
    input.revision_id,
  );
  const raw = boundInput(b.head.revision.definition, input.input, b.r.input);
  if (raw.overrides.length)
    invalid(
      "overrides",
      "Rebase supplies explicit decisions for the prior overrides; keep this proposal's overrides empty.",
    );
  const old = await revision(c, p, parent.release_revision_id);
  const calculated = await rebaseIsolated(
    b.head.revision.definition,
    raw,
    old.definition,
    parent.input.overrides,
    input.decisions,
  );
  const preview_hash = hash({
    schema_version: 1,
    parent_id: parent.id,
    parent_content_hash: parent.content_hash,
    binding: b.binding,
    proposal: raw,
    decisions: input.decisions,
    input: calculated.input,
    result_hash: calculated.result.result_hash,
  });
  return { parent, b, calculated, preview_hash };
}
export async function previewRebase(p: Principal, id: string, value: unknown) {
  const input = proposal(value);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const x = await prepare(c, p, uuid(id, "parent_id"), input);
    return {
      schema_version: 1,
      parent_id: x.parent.id,
      parent_content_hash: x.parent.content_hash,
      binding: x.b.binding,
      binding_hash: hash(x.b.binding),
      preview_hash: x.preview_hash,
      prior_overrides: x.parent.input.overrides,
      ...x.calculated,
      synthetic: true,
    };
  });
}
export async function rebaseRun(p: Principal, id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "id",
    "revision_id",
    "input",
    "decisions",
    "preview_hash",
  ]);
  const input = {
    ...common(r),
    ...proposal({
      revision_id: r.revision_id,
      input: r.input,
      decisions: r.decisions,
    }),
    id: uuid(r.id, "id"),
    parent_id: uuid(id, "parent_id"),
    preview_hash: digest(r.preview_hash, "preview_hash"),
  };
  if (input.id === input.parent_id)
    invalid("id", "A rebase creates a new run identity.");
  return sharedOperation(
    p,
    input,
    "Cpq:Rebase",
    async (c) => {
      await run(c, p, input.parent_id, true);
      const prior = (
        await c.query(
          "SELECT id FROM ppo.cpq_runs WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, input.id],
        )
      ).rows[0];
      if (prior) await run(c, p, input.id, true);
    },
    async (c) => {
      const x = await prepare(c, p, input.parent_id, input);
      if (x.preview_hash !== input.preview_hash)
        throw new AppError(
          409,
          "CpqRebasePreviewChanged",
          "The source or proposal changed. Review a new rebase preview.",
        );
      if (!x.calculated.ready)
        throw new AppError(
          409,
          "CpqRebaseDecisionsRequired",
          "Resolve every prior override before saving this successor.",
        );
      return storeRun(c, p, {
        ...input,
        company_id: x.parent.company_id,
        proposal: x.calculated.input,
        result: x.calculated.result,
        binding: {
          ...x.b.binding,
          rebase: {
            schema_version: 1,
            parent_id: x.parent.id,
            parent_content_hash: x.parent.content_hash,
            preview_hash: x.preview_hash,
            decisions: input.decisions,
          },
        },
      });
    },
    "CpqRun",
    "CpqChanged",
  );
}
