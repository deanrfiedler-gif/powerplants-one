import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession, type Principal } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import { readOperation } from "../../src/shared/receipts";
import {
  acceptRuleSetFinding,
  listRuleSets,
  publishRuleSet,
  readRuleSet,
  reviewRuleSet,
  saveRuleSet,
} from "../../src/cpq/rule-set-store";
import { CRM, crmBase } from "../helpers/crm";
import { synScreen } from "../fixtures/rule-sets/syn-screen";
import type { Capability } from "../../src/platform/permissions";
import type { RuleSetDefinition } from "../../src/cpq/rule-sets";

if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

const rows = async (q: string, v: unknown[] = []) => (await database().query(q, v)).rows;
const code = (expectedCode: string) => (e: unknown) => (e as { code: string }).code === expectedCode;
const pgCode = (expectedCode: string) => (e: unknown) => (e as { code?: string }).code === expectedCode;
const clone = (d: RuleSetDefinition) => JSON.parse(JSON.stringify(d)) as RuleSetDefinition;

async function grant(actor: string, caps: Capability[]) {
  for (const cap of caps)
    await rows(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,$4,'Company',$3)",
      [CRM.workspace, actor, CRM.company, cap],
    );
}

/** An owner who authors, an independent reviewer and a third-person publisher. */
async function people() {
  const author = (await createSession("coordinator")).principal;
  const reviewer = (await createSession("products-reviewer")).principal;
  const publisher = (await createSession("products-publisher")).principal;
  await grant(author.actor_id, ["cpq.read", "cpq.author"]);
  await grant(reviewer.actor_id, ["cpq.read", "cpq.review"]);
  await grant(publisher.actor_id, ["cpq.read", "cpq.publish"]);
  return { author, reviewer, publisher };
}

async function save(p: Principal, id: string, definition: RuleSetDefinition, expected_version: number, owner_id?: string) {
  return saveRuleSet(p, {
    ...crmBase(),
    id,
    company_id: CRM.company,
    expected_version,
    ...(owner_id ? { owner_id } : {}),
    definition,
  });
}

async function current(p: Principal, id: string) {
  const r = await readRuleSet(p, id);
  return { r, base: { expected_version: r.rule_set.version, revision_id: r.revision.id, content_hash: r.revision.content_hash } };
}

test("a rule set is saved, checked, reviewed and published, and published versions stay fixed", async () => {
  const { author, reviewer, publisher } = await people();
  const id = randomUUID();
  const saved = await save(author, id, synScreen(), 0, author.actor_id);
  assert.equal(saved.receipt.state, "Draft");
  assert.equal(saved.receipt.record_id, id);

  const first = await current(author, id);
  assert.equal(first.r.revision.test.summary.cases, 3);
  assert.equal(first.r.revision.test.summary.failed, 0);
  assert.deepEqual(first.r.revision.test.coverage.map((f) => f.code), ["ROW_UNREAD"]);
  assert.equal(first.r.owner.id, author.actor_id);
  assert.equal(first.r.capabilities.accept_findings, true);

  await reviewRuleSet(reviewer, id, { ...crmBase(), ...first.base, outcome: "Approved" });
  const reviewed = await current(author, id);
  assert.equal(reviewed.r.rule_set.state, "Reviewed");
  assert.equal(reviewed.r.review?.outcome, "Approved");

  await publishRuleSet(publisher, id, { ...crmBase(), ...reviewed.base, expected_publication_version: 0 });
  const published = await current(author, id);
  assert.equal(published.r.rule_set.state, "Published");
  assert.equal(published.r.head?.version, 1);
  assert.equal(published.r.head?.revision_id, first.r.revision.id);

  const changed = clone(synScreen());
  changed.label = "SYN retractable screens, revised";
  await save(author, id, changed, published.r.rule_set.version);
  const second = await current(author, id);
  assert.equal(second.r.rule_set.state, "Draft");
  assert.equal(second.r.revision.version, 2);
  assert.equal(second.r.revision.predecessor_id, first.r.revision.id);
  assert.equal(second.r.head?.revision_id, first.r.revision.id, "the published version is unchanged by a new draft");
  assert.equal(second.r.revisions.length, 2);

  const list = await listRuleSets(author, { company_id: CRM.company });
  assert.equal(list.items.length, 1);
  assert.equal(list.items[0].published_version, 1);
  assert.equal(list.items[0].key, "syn_screen");
});

test("only the owner accepts a blocking finding, and approval waits for it", async () => {
  const { author, reviewer } = await people();
  const id = randomUUID();
  const def = clone(synScreen());
  def.inputs[5].choices = ["Hooks", "Quad Clip", "Clips"];
  await save(author, id, def, 0, author.actor_id);
  const draft = await current(author, id);
  const blocking = draft.r.revision.test.coverage.filter((f) => f.severity === "Blocking");
  assert.deepEqual(blocking.map((f) => [f.code, f.subject]), [["OPTION_UNTESTED", "edge_fixing[2]"]]);

  await assert.rejects(reviewRuleSet(reviewer, id, { ...crmBase(), ...draft.base, outcome: "Approved" }), code("RuleSetFindingsOpen"));
  const accept = { ...crmBase(), expected_version: draft.base.expected_version, revision_id: draft.base.revision_id, code: "OPTION_UNTESTED", subject: "edge_fixing[2]" };
  await assert.rejects(acceptRuleSetFinding(reviewer, id, accept), code("RuleSetOwnerOnly"));
  await assert.rejects(acceptRuleSetFinding(author, id, { ...accept, operation_id: randomUUID(), code: "ROW_UNREAD", subject: "bay_sizes" }), code("RuleSetFindingUnknown"));
  await acceptRuleSetFinding(author, id, accept);
  const accepted = await current(author, id);
  assert.equal(accepted.r.acceptances.length, 1);
  await reviewRuleSet(reviewer, id, { ...crmBase(), ...accepted.base, outcome: "Approved" });
  assert.equal((await current(author, id)).r.rule_set.state, "Reviewed");
});

test("governance refusals: independence, ownership, failing cases, keys and unchanged content", async () => {
  const { author, reviewer, publisher } = await people();
  const id = randomUUID();
  await save(author, id, synScreen(), 0, author.actor_id);
  const draft = await current(author, id);

  await grant(author.actor_id, ["cpq.review", "cpq.publish"]);
  await assert.rejects(reviewRuleSet(author, id, { ...crmBase(), ...draft.base, outcome: "Approved" }), code("RuleSetIndependentReview"));
  await assert.rejects(publishRuleSet(publisher, id, { ...crmBase(), ...draft.base, expected_publication_version: 0 }), code("RuleSetRevisionChanged"));
  await assert.rejects(save(author, id, synScreen(), draft.base.expected_version), code("RuleSetUnchanged"));
  const renamed = clone(synScreen());
  renamed.key = "syn_screen_two";
  await assert.rejects(save(author, id, renamed, draft.base.expected_version), code("RuleSetKeyChanged"));
  await assert.rejects(save(author, randomUUID(), synScreen(), 0, author.actor_id), code("RuleSetKeyTaken"));
  await assert.rejects(save(author, randomUUID(), renamed, 0), code("InvalidData"));

  const broken = clone(synScreen());
  broken.derived[0].formula = "drives";
  await assert.rejects(save(author, randomUUID(), broken, 0, author.actor_id), (e: unknown) => {
    const err = e as { code: string; field_errors: { field: string; message: string }[] };
    return err.code === "RuleSetInvalid" && err.field_errors.some((f) => f.field === "definition.derived[0].formula" && /FORMULA_FORWARD/.test(f.message));
  });

  // A failing reference case is saved as a draft but cannot be approved.
  const failing = clone(synScreen());
  failing.key = "syn_screen_failing";
  (failing.reference_cases[0].expected as { lines: { part: string; quantity: string }[] }).lines[0].quantity = "1";
  const failingId = randomUUID();
  await save(author, failingId, failing, 0, author.actor_id);
  const failingDraft = await current(author, failingId);
  assert.equal(failingDraft.r.revision.test.summary.failed, 1);
  await assert.rejects(reviewRuleSet(reviewer, failingId, { ...crmBase(), ...failingDraft.base, outcome: "Approved" }), code("RuleSetCasesFailed"));
  await reviewRuleSet(reviewer, failingId, { ...crmBase(), ...failingDraft.base, outcome: "Rejected" });
  assert.equal((await current(author, failingId)).r.rule_set.state, "Rejected");

  // The owner must author or review: a rule set owned by someone else cannot be reviewed by a third person alone.
  const owned = clone(synScreen());
  owned.key = "syn_screen_owned";
  const ownedId = randomUUID();
  await assert.rejects(save(author, ownedId, owned, 0, publisher.actor_id), code("RuleSetOwnerUnauthorised"));
  await grant(publisher.actor_id, ["cpq.author"]);
  await save(author, ownedId, owned, 0, publisher.actor_id);
  const ownedDraft = await current(author, ownedId);
  await assert.rejects(reviewRuleSet(reviewer, ownedId, { ...crmBase(), ...ownedDraft.base, outcome: "Approved" }), code("RuleSetOwnerReview"));

  // The reviewer cannot also publish.
  await reviewRuleSet(reviewer, id, { ...crmBase(), ...draft.base, outcome: "Approved" });
  const reviewed = await current(author, id);
  await grant(reviewer.actor_id, ["cpq.publish"]);
  await assert.rejects(publishRuleSet(reviewer, id, { ...crmBase(), ...reviewed.base, expected_publication_version: 0 }), code("RuleSetIndependentPublication"));
  await assert.rejects(publishRuleSet(publisher, id, { ...crmBase(), ...reviewed.base, expected_publication_version: 1 }), code("VersionConflict"));
});

test("the database enforces governance when the service is bypassed", async () => {
  const { author, reviewer, publisher } = await people();
  const id = randomUUID();
  await save(author, id, synScreen(), 0, author.actor_id);
  const draft = await current(author, id);
  const revision = draft.r.revision;

  await assert.rejects(
    rows("INSERT INTO ppo.cpq_rule_set_reviews(id,workspace_id,revision_id,reviewer_id,outcome,content_hash,test,reason) VALUES($1,$2,$3,$4,'Approved',$5,$6,'x')", [
      randomUUID(), CRM.workspace, revision.id, author.actor_id, revision.content_hash, JSON.stringify(revision.test),
    ]),
    pgCode("23514"),
  );
  await assert.rejects(
    rows("INSERT INTO ppo.cpq_rule_set_acceptances(id,workspace_id,revision_id,code,subject,reason,accepted_by) VALUES($1,$2,$3,'OPTION_UNTESTED','edge_fixing','x',$4)", [
      randomUUID(), CRM.workspace, revision.id, reviewer.actor_id,
    ]),
    pgCode("23514"),
  );
  await assert.rejects(
    rows("INSERT INTO ppo.cpq_rule_set_acceptances(id,workspace_id,revision_id,code,subject,reason,accepted_by) VALUES($1,$2,$3,'ROW_UNREAD','bay_sizes','x',$4)", [
      randomUUID(), CRM.workspace, revision.id, author.actor_id,
    ]),
    pgCode("23514"),
  );
  await assert.rejects(rows("UPDATE ppo.cpq_rule_set_revisions SET reason='changed' WHERE id=$1", [revision.id]));
  await assert.rejects(rows("UPDATE ppo.cpq_rule_sets SET owner_id=$2 WHERE id=$1", [id, reviewer.actor_id]), pgCode("23514"));
  await assert.rejects(rows("UPDATE ppo.cpq_rule_sets SET synthetic=false WHERE id=$1", [id]));

  await reviewRuleSet(reviewer, id, { ...crmBase(), ...draft.base, outcome: "Approved" });
  const review = (await rows("SELECT id FROM ppo.cpq_rule_set_reviews WHERE revision_id=$1", [revision.id]))[0] as { id: string };
  await assert.rejects(
    rows("INSERT INTO ppo.cpq_rule_set_publications(id,workspace_id,company_id,rule_set_id,revision_id,review_id,version,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,1,'x',$7)", [
      randomUUID(), CRM.workspace, CRM.company, id, revision.id, review.id, reviewer.actor_id,
    ]),
    pgCode("23514"),
  );
  await assert.rejects(
    rows("INSERT INTO ppo.cpq_rule_set_reviews(id,workspace_id,revision_id,reviewer_id,outcome,content_hash,test,reason) VALUES($1,$2,$3,$4,'Rejected',$5,$6,'x')", [
      randomUUID(), CRM.workspace, revision.id, publisher.actor_id, revision.content_hash, JSON.stringify(revision.test),
    ]),
  );
});

test("receipts replay to people who still hold the duty, and reads need cpq.read", async () => {
  const { author } = await people();
  const id = randomUUID();
  const body = { ...crmBase(), id, company_id: CRM.company, expected_version: 0, owner_id: author.actor_id, definition: synScreen() };
  const first = await saveRuleSet(author, body);
  const again = await saveRuleSet(author, body);
  assert.deepEqual(again.receipt, first.receipt);
  assert.equal(again.replayed, true);
  assert.equal((await readOperation(author, body.operation_id)).record_id, id);

  const observer = (await createSession("observer")).principal;
  await assert.rejects(readRuleSet(observer, id));
  await assert.rejects(readOperation(observer, body.operation_id));
  await rows("DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='cpq.author'", [CRM.workspace, author.actor_id]);
  await assert.rejects(readOperation(author, body.operation_id));
  await assert.rejects(save(author, id, synScreen(), 1), code("RecordUnavailable"));
});

test("review: each untested option needs its own acceptance, and only an owner who still holds a duty accepts", async () => {
  const { author, reviewer } = await people();
  const id = randomUUID();
  const def = clone(synScreen());
  def.inputs[5].choices = ["Hooks", "Quad Clip", "Clips", "Wire"];
  await save(author, id, def, 0, author.actor_id);
  const draft = await current(author, id);
  const subjects = draft.r.revision.test.coverage.filter((f) => f.severity === "Blocking").map((f) => f.subject);
  assert.deepEqual(subjects, ["edge_fixing[2]", "edge_fixing[3]"]);
  const accept = (subject: string, v: number) => ({ ...crmBase(), expected_version: v, revision_id: draft.base.revision_id, code: "OPTION_UNTESTED", subject });
  await acceptRuleSetFinding(author, id, accept("edge_fixing[2]", draft.base.expected_version));
  const one = await current(author, id);
  await assert.rejects(reviewRuleSet(reviewer, id, { ...crmBase(), ...one.base, outcome: "Approved" }), code("RuleSetFindingsOpen"));
  await assert.rejects(acceptRuleSetFinding(author, id, accept("edge_fixing[3]", one.base.expected_version - 1)), code("VersionConflict"));

  await rows("DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='cpq.author'", [CRM.workspace, author.actor_id]);
  await assert.rejects(acceptRuleSetFinding(author, id, accept("edge_fixing[3]", one.base.expected_version)), code("RuleSetOwnerUnauthorised"));
});

test("review: stale revisions, a reviewer who lost the duty, and forged or malformed test results are refused", async () => {
  const { author, reviewer, publisher } = await people();
  const id = randomUUID();
  await save(author, id, synScreen(), 0, author.actor_id);
  const first = await current(author, id);

  // A re-save makes the earlier revision stale for review and for direct inserts.
  const changed = clone(synScreen());
  changed.label = "SYN screens, second draft";
  await save(author, id, changed, first.base.expected_version);
  await assert.rejects(reviewRuleSet(reviewer, id, { ...crmBase(), ...first.base, expected_version: first.base.expected_version + 1, outcome: "Approved" }), code("RuleSetRevisionChanged"));
  await assert.rejects(
    rows("INSERT INTO ppo.cpq_rule_set_reviews(id,workspace_id,revision_id,reviewer_id,outcome,content_hash,test,reason) VALUES($1,$2,$3,$4,'Approved',$5,$6,'x')", [
      randomUUID(), CRM.workspace, first.r.revision.id, reviewer.actor_id, first.r.revision.content_hash, JSON.stringify(first.r.revision.test),
    ]),
    pgCode("23514"),
  );

  // A forged passing result cannot approve a revision whose stored result fails.
  const failing = clone(synScreen());
  failing.key = "syn_screen_failing";
  (failing.reference_cases[0].expected as { lines: { part: string; quantity: string }[] }).lines[0].quantity = "1";
  const failingId = randomUUID();
  await save(author, failingId, failing, 0, author.actor_id);
  const bad = await current(author, failingId);
  for (const forged of [
    { valid: true, summary: { cases: 3, failed: 0 }, coverage: [] },
    { valid: true, summary: { cases: 3 }, coverage: [] },
    { valid: true, summary: { cases: "x", failed: 0 }, coverage: [] },
  ])
    await assert.rejects(
      rows("INSERT INTO ppo.cpq_rule_set_reviews(id,workspace_id,revision_id,reviewer_id,outcome,content_hash,test,reason) VALUES($1,$2,$3,$4,'Approved',$5,$6,'x')", [
        randomUUID(), CRM.workspace, bad.r.revision.id, reviewer.actor_id, bad.r.revision.content_hash, JSON.stringify(forged),
      ]),
      pgCode("23514"),
    );

  // A reviewer who loses the duty before publication must review again.
  const second = await current(author, id);
  await reviewRuleSet(reviewer, id, { ...crmBase(), ...second.base, outcome: "Approved" });
  const reviewed = await current(author, id);
  await rows("DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='cpq.review'", [CRM.workspace, reviewer.actor_id]);
  await assert.rejects(publishRuleSet(publisher, id, { ...crmBase(), ...reviewed.base, expected_publication_version: 0 }), code("RuleSetReviewerUnauthorised"));
  await grant(reviewer.actor_id, ["cpq.review"]);
  await publishRuleSet(publisher, id, { ...crmBase(), ...reviewed.base, expected_publication_version: 0 });

  // The head only moves forward and is never removed.
  await assert.rejects(rows("DELETE FROM ppo.cpq_rule_set_heads WHERE rule_set_id=$1", [id]), pgCode("23514"));
  await assert.rejects(rows("UPDATE ppo.cpq_rule_set_heads SET publication_id=publication_id WHERE rule_set_id=$1", [id]), pgCode("23514"));
});

test("review: receipts for acceptance, review and publication replay, and other companies cannot read", async () => {
  const { author, reviewer, publisher } = await people();
  const id = randomUUID();
  const def = clone(synScreen());
  def.inputs[5].choices = ["Hooks", "Quad Clip", "Clips"];
  await save(author, id, def, 0, author.actor_id);
  const draft = await current(author, id);
  const acceptBody = { ...crmBase(), expected_version: draft.base.expected_version, revision_id: draft.base.revision_id, code: "OPTION_UNTESTED", subject: "edge_fixing[2]" };
  const accepted = await acceptRuleSetFinding(author, id, acceptBody);
  assert.deepEqual((await acceptRuleSetFinding(author, id, acceptBody)).receipt, accepted.receipt);
  await assert.rejects(readOperation(reviewer, acceptBody.operation_id));
  const ready = await current(author, id);
  const reviewBody = { ...crmBase(), ...ready.base, outcome: "Approved" };
  const reviewedReceipt = await reviewRuleSet(reviewer, id, reviewBody);
  assert.deepEqual((await reviewRuleSet(reviewer, id, reviewBody)).receipt, reviewedReceipt.receipt);
  assert.equal((await readOperation(reviewer, reviewBody.operation_id)).record_id, id);
  const done = await current(author, id);
  const publishBody = { ...crmBase(), ...done.base, expected_publication_version: 0 };
  await publishRuleSet(publisher, id, publishBody);
  assert.equal((await readOperation(publisher, publishBody.operation_id)).record_id, id);

  const other = (await createSession("second-company")).principal;
  await assert.rejects(readRuleSet(other, id));
  await assert.rejects(listRuleSets(other, { company_id: CRM.company }));
});
