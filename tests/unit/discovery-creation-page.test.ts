import assert from "node:assert/strict";
import { test } from "node:test";
import { initialCreationDraft, creationIssues, creationBriefLabel } from "../../src/components/discovery-creation-model";
import { creationContextFixture, creationFormFixture } from "../helpers/discovery-creation";

test("Sales handover imports reported answers without inventing confirmations, work tags or follow-up reasons", () => {
  const draft = initialCreationDraft(creationFormFixture, creationContextFixture.brief);
  assert.deepEqual(draft.scope.systems, []);
  assert.equal(draft.configuration?.schema_version, 2);
  assert.ok(draft.answers.slice(0, 3).every(a => a.state === "Answered" && a.follow_up?.reason === ""));
  assert.equal(draft.answers[0].value, creationContextFixture.brief!.content.included_scope);
  assert.ok(!draft.answers.some(a => a.state === "Confirmed"));
  const issues = creationIssues(draft, creationFormFixture, creationFormFixture.owner.id);
  assert.ok(issues.some(i => i.field === "scope.systems"));
  assert.ok(issues.some(i => i.question === "Q01" && i.field === "Q01-reason"));
});

test("stale Sales sources cannot prefill discovery; oversized accepted text stays intact for explicit review", () => {
  const stale = initialCreationDraft(creationFormFixture, { ...creationContextFixture.brief!, source_changed: true });
  assert.ok(stale.answers.every(a => a.state === "Empty" && a.value === null));
  const brief = { ...creationContextFixture.brief!, content: { ...creationContextFixture.brief!.content, included_scope: "x".repeat(2100) } };
  const draft = initialCreationDraft(creationFormFixture, brief);
  assert.equal((draft.answers[0].value as string).length, 2100);
  assert.ok(creationIssues(draft, creationFormFixture, creationFormFixture.owner.id).some(i => i.question === "Q01" && i.message.includes("2000")));
});

test("partial and restricted Sales labels preserve absence versus unavailable context", () => {
  assert.equal(creationBriefLabel(null), "no Sales brief");
  assert.equal(creationBriefLabel({ state: "Unavailable", revision: null }), "Sales context unavailable");
  assert.equal(creationBriefLabel({ state: "Accepted", revision: 2 }), "accepted Sales brief r2");
});
