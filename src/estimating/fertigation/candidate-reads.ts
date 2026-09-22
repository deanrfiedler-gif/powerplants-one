import type { Principal } from "../../platform/identity";
import { database } from "../../platform/database";
import { unavailable } from "../../platform/errors";
import { object, uuid, invalid } from "../../shared/validation";
import { scopeRecord, savedRevision } from "./context";
import { candidateConstraints } from "./candidate-constraints";
export async function readCandidateConstraints(
  p: Principal,
  id: string,
  query: Record<string, string>,
) {
  const q = object(query, ["revision_id", "candidate_id", "offset"]),
    offset = q.offset === undefined ? 0 : Number(q.offset);
  if (
    (q.offset !== undefined && !/^\d+$/.test(String(q.offset))) ||
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    offset > 1_000_000
  )
    invalid("offset", "Use a bounded non-negative constraint offset.");
  const c = database(),
    scope = await scopeRecord(c, p, id),
    { saved } = await savedRevision(
      c,
      p,
      scope,
      uuid(q.revision_id, "revision_id"),
    );
  const page = candidateConstraints(
    saved.proposal,
    saved.calculation,
    uuid(q.candidate_id, "candidate_id"),
    offset,
  );
  if (!page) throw unavailable();
  return {
    scope_id: scope.id,
    revision_id: saved.id,
    content_hash: saved.content_hash,
    scenario_id: saved.calculation.scenario_id,
    ...page,
  };
}
