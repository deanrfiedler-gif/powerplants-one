import assert from "node:assert/strict";
import { test } from "node:test";
import { parseContent, type CsRow, type ReadinessContent } from "../../src/shared/cs/model";
import { parseRequirementsDraft } from "../../src/shared/cs/requirement-revisions";
import { accessReadinessFixture } from "../helpers/access-readiness-fixture";

test("CS06 draft parsing increments only changed requirement revisions and leaves active sources untouched", () => {
  const raw = accessReadinessFixture().data.record;
  const row = { ...raw, updated_at: new Date(raw.updated_at) } as CsRow;
  const active = structuredClone(row.content) as ReadinessContent;
  assert.equal(parseRequirementsDraft(row, active.requirements)[0].revision, 2);
  const updated = parseRequirementsDraft(row, [{ ...active.requirements[0], revision: 99, title: "SYN changed instruction" }]);
  assert.equal(updated[0].revision, 3);
  assert.deepEqual(row.content, active);
  assert.deepEqual(parseRequirementsDraft(row, []), []);
  assert.equal((row.content as ReadinessContent).requirements.length, 1);
});
test("CS06 retained evidence for a removed requirement stays readable but cannot be changed into a new orphan", () => {
  const active = accessReadinessFixture().data.record.content as ReadinessContent;
  const retired = { ...active, requirements: [] };
  assert.deepEqual((parseContent("Readiness", retired, retired) as ReadinessContent).evidence, active.evidence);
  assert.throws(() => parseContent("Readiness", { ...retired, evidence: [{ ...retired.evidence[0], source: "SYN changed orphan" }] }, retired));
  assert.throws(() => parseContent("Readiness", retired));
});
