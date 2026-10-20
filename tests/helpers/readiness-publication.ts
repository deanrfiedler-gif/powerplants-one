import { randomUUID } from "node:crypto";
import { createSession, type Principal } from "../../src/platform/identity";
import { csAction, hash, readCs, saveCs } from "../../src/shared/cs/service";
import type { CsKind, ReadinessContent } from "../../src/shared/cs/model";

/** Existing journey fixtures now establish their requirements through independent publication. */
export async function saveCsWithReviewedRequirements(
  p: Principal,
  kind: CsKind,
  id: string,
  input: unknown,
) {
  if (kind !== "Readiness") return saveCs(p, kind, id, input);
  const value = input as {
    content: ReadinessContent;
    expected_version: number;
    reason: string;
  };
  const current = await readCs(p, kind, id);
  if (
    value.expected_version !== current.record.version ||
    hash(value.content.requirements) ===
      hash((current.record.content as ReadinessContent).requirements)
  )
    return saveCs(p, kind, id, input);
  const base = () => ({
    schema_version: 1,
    operation_id: randomUUID(),
    reason: "SYN independently establish requirements for journey fixture",
  });
  await csAction(p, kind, id, {
    ...base(),
    expected_version: current.record.version,
    action: "draft_requirements",
    requirements: value.content.requirements,
  });
  const submitted = await readCs(p, kind, id);
  const reviewer = (await createSession("cs-reviewer")).principal;
  await csAction(reviewer, kind, id, {
    ...base(),
    expected_version: submitted.record.version,
    action: "publish_requirements",
    snapshot_id: submitted.requirements_draft!.id,
  });
  const published = await readCs(p, kind, id);
  return saveCs(p, kind, id, {
    ...(input as Record<string, unknown>),
    expected_version: published.record.version,
    content: {
      ...value.content,
      requirements: (published.record.content as ReadinessContent).requirements,
    },
  });
}
