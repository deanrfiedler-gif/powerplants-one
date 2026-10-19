import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { readThreadContext } from "../../src/conversations/context";
import { createDocument, linkDocument } from "../../src/library/commands";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate, prepareQuote } from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import { crmBase, crmCreate } from "../helpers/crm";
import { estimateInput, quoteCommand } from "../helpers/estimating";
import { grantLibrary, libraryInput } from "../helpers/library";
import { begin, code, newDeal, newProject, person, post, principal, profiles, record, rows } from "../helpers/conversations";

// Conversations T1c-3 (PPO-CONV-T1C-DESIGN 11): the context panel is rebuilt for each viewer from their own access,
// stores nothing (S5), and leaves out, title included, anything the viewer cannot open.
if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

const revoke = (user: string, capability: string) =>
  database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability=$2", [user, capability]);
const reasons = (items: { title: string; why: string[] }[]) => items.map((x) => [x.title, x.why.join(" · ")]);

test("T1c-3 a deal thread's panel: the record, its people, this thread and its open asks", async () => {
  const sam = await principal(profiles.coordinator),
    dealer = await principal(profiles.dealReader),
    deal = await newDeal(sam);
  const thread = await begin(sam, deal, {
    body: "@{1} SYN when does the controller arrive?",
    mentions: [person(dealer.actor_id)],
    asks: [{ ordinal: 1, question: "SYN delivery date", reply_by: "2026-10-30" }],
  });
  const panel = await readThreadContext(sam, thread);
  const number = (await rows("SELECT display_number FROM ppo.opportunities WHERE id=$1", [deal]))[0].display_number;
  assert.equal(panel.thread_id, thread);
  assert.equal(panel.noun, "deal");
  assert.equal(panel.record.type, "Opportunity");
  assert.match(panel.record.title, new RegExp(`^Deal ${number} · `));
  assert.equal(panel.record.href, `/sales/opportunities/${deal}`);
  assert.equal(panel.record.why, "The record this thread is about");
  const facts = Object.fromEntries(panel.record.facts.map((f) => [f.label, f.value]));
  assert.ok(facts.Stage);
  assert.ok(facts.Owner);
  assert.equal(facts["Your access"], "Can open this deal");
  // Every item says why it is there.
  for (const group of [panel.documents, panel.contacts, panel.related, panel.thread])
    for (const item of group) assert.ok(item.why.length > 0, item.title);
  assert.deepEqual(
    panel.contacts.filter((c) => c.detail === "Deal owner").map((c) => c.why),
    [["On the deal"]],
  );
  const [participants, ask] = panel.thread;
  assert.equal(participants.detail, "2 participants");
  assert.match(participants.why[0], /^Started by /);
  assert.match(ask.title, /: SYN delivery date$/);
  assert.equal(ask.detail, "Open question · reply by 30 Oct 2026");
  assert.match(ask.why[0], /^Asked by /);
  // A deal's documents are its quotations; this deal has none, and nothing is invented.
  assert.deepEqual(panel.documents, []);
  // The asked person reads the same panel for their own access; a reply closes the ask, so it leaves the panel.
  await post(dealer, thread, { body: "SYN 30 October" });
  assert.equal((await readThreadContext(dealer, thread)).thread.length, 1);
});

test("T1c-3 a record mentioned in the thread appears only for readers who can open it", async () => {
  const sam = await principal(profiles.coordinator),
    dealer = await principal(profiles.dealReader),
    deal = await newDeal(sam),
    other = await newDeal(sam),
    project = await newProject(sam);
  const thread = await begin(sam, deal, { mentions: [person(dealer.actor_id)], body: "SYN Ask @{1} about it" });
  await post(sam, thread, { body: "SYN see #{1} and #{2} and #{3}", mentions: [record("Project", project, 1), record("Opportunity", other, 2), record("Opportunity", deal, 3)] });
  const projectNumber = (await rows("SELECT display_number,title FROM ppo.projects WHERE id=$1", [project]))[0];
  const own = await readThreadContext(sam, thread);
  const mentioned = own.related.filter((r) => r.why.some((w) => w.startsWith("Mentioned by ")));
  // The anchor itself is the Record card, not a related record.
  assert.deepEqual(mentioned.map((r) => r.key).sort(), [`Opportunity:${other}`, `Project:${project}`].sort());
  assert.ok(mentioned.find((r) => r.key === `Project:${project}`)!.title.includes(projectNumber.display_number));
  // The deal reader cannot open projects: the project is left out entirely, title, number and ID included.
  const theirs = await readThreadContext(dealer, thread);
  assert.deepEqual(theirs.related.map((r) => r.key), [`Opportunity:${other}`]);
  const text = JSON.stringify(theirs);
  assert.ok(!text.includes(project));
  assert.ok(!text.includes(projectNumber.display_number));
  assert.ok(!text.includes(projectNumber.title));
});

test("T1c-3 the panel exists only for a reader of the thread, and follows access as it changes", async () => {
  const sam = await principal(profiles.coordinator),
    dealer = await principal(profiles.dealReader),
    stranger = await principal(profiles.otherCompany),
    observer = await principal(profiles.observer),
    deal = await newDeal(sam);
  const thread = await begin(sam, deal, { mentions: [person(dealer.actor_id)], body: "SYN Ask @{1} about it" });
  await assert.rejects(readThreadContext(stranger, thread), code("RecordUnavailable"));
  await assert.rejects(readThreadContext(observer, thread), code("Forbidden"));
  await assert.rejects(readThreadContext(sam, randomUUID()), code("RecordUnavailable"));
  await assert.rejects(readThreadContext(sam, "not-an-id"), code("InvalidData"));
  await readThreadContext(dealer, thread);
  // S5: nothing is stored, so losing the record's read capability removes the panel on the next read.
  await revoke(dealer.actor_id, "crm.opportunity.read");
  await assert.rejects(readThreadContext(dealer, thread), code("RecordUnavailable"));
});

test("T1c-3 a project thread's documents come from the library at their linked revision, for readers who may read them", async () => {
  const sam = await principal(profiles.coordinator),
    builder = await principal(profiles.projectReader),
    project = await newProject(sam);
  await grantLibrary(sam);
  const doc = libraryInput(sam.actor_id);
  await createDocument(sam, doc);
  await linkDocument(sam, doc.id, {
    ...crmBase(),
    revision_id: doc.revision_id,
    expected_version: 1,
    action: "Add",
    link_id: randomUUID(),
    target_kind: "Project",
    target_id: project,
    purpose: "SYN commissioning reference",
  });
  const thread = await begin(sam, project, { anchor_type: "Project", mentions: [person(builder.actor_id)], body: "SYN Ask @{1} about it" });
  const panel = await readThreadContext(sam, thread);
  assert.equal(panel.noun, "project");
  assert.equal(panel.record.href, `/projects/${project}`);
  assert.equal(Object.fromEntries(panel.record.facts.map((f) => [f.label, f.value]))["Target date"], "31 Mar 2028");
  assert.deepEqual(reasons(panel.documents), [["SYN Pump reference · rev 1", "Linked on the project"]]);
  assert.equal(panel.documents[0].href, `/api/v1/document-library/${doc.id}/content?revision_id=${doc.revision_id}`);
  assert.match(panel.documents[0].detail!, /SYN commissioning reference$/);
  assert.ok(panel.contacts.some((c) => c.detail === "Project coordinator" && c.why[0] === "On the project"));
  // The project reader holds no document.read: the document is left out, title included.
  const theirs = await readThreadContext(builder, thread);
  assert.deepEqual(theirs.documents, []);
  assert.ok(!JSON.stringify(theirs).includes("SYN Pump reference"));
});

test("T1c-3 a deal thread's documents are its quotations at each revision, for readers who may read them", async () => {
  const sam = await principal(profiles.coordinator),
    dealer = await principal(profiles.dealReader),
    deal = crmCreate();
  await createOpportunity(sam, deal);
  const estimate = estimateInput(deal.id);
  await createEstimate(sam, estimate);
  const quote = quoteCommand((await readEstimate(sam, estimate.id)).saved);
  await prepareQuote(sam, estimate.id, quote);
  const number = (await rows("SELECT h.display_number FROM ppo.draft_quote_revisions q JOIN ppo.draft_quotes h ON h.id=q.quote_id WHERE q.id=$1", [quote.id]))[0]
    .display_number as string;
  const thread = await begin(sam, deal.id, { mentions: [person(dealer.actor_id)], body: "SYN Ask @{1} about it" });
  const panel = await readThreadContext(sam, thread);
  assert.deepEqual(reasons(panel.documents), [[`${number} · rev 1`, "Linked on the deal"]]);
  assert.equal(panel.documents[0].href, `/estimating/quotes/${quote.id}`);
  assert.match(panel.documents[0].detail!, /^Draft quotation · /);
  // The deal reader holds no estimating.read: the quotation is left out, number included.
  const theirs = await readThreadContext(dealer, thread);
  assert.deepEqual(theirs.documents, []);
  assert.ok(!JSON.stringify(theirs).includes(number));
});

test("T1c-3 a customer contact's phone and email show only to a reader who may read the person", async () => {
  const sam = await principal(profiles.coordinator),
    deal = await newDeal(sam);
  const contact = (
    await rows(
      "SELECT pe.id,pe.display_name FROM ppo.opportunities o JOIN ppo.people pe ON (pe.workspace_id,pe.id)=(o.workspace_id,o.primary_person_id) WHERE o.id=$1",
      [deal],
    )
  )[0];
  assert.ok(contact, "the synthetic deal names a customer contact");
  await rows("UPDATE ppo.people SET email='syn.contact@example.test',phone='+61 7 5550 0100' WHERE id=$1", [contact.id]);
  const thread = await begin(sam, deal);
  const shown = (await readThreadContext(sam, thread)).contacts.find((c) => c.key === `Person:${contact.id}`)!;
  assert.equal(shown.title, contact.display_name);
  assert.equal(shown.email, "syn.contact@example.test");
  assert.equal(shown.phone, "+61 7 5550 0100");
  assert.equal(shown.href, `/people/${contact.id}`);
  // Internal people carry no contact details in PPO.
  const owner = (await readThreadContext(sam, thread)).contacts.find((c) => c.detail === "Deal owner")!;
  assert.equal(owner.email, undefined);
  assert.equal(owner.phone, undefined);
});

test("T1c-3 the panel writes nothing", async () => {
  const sam = await principal(profiles.coordinator),
    deal = await newDeal(sam);
  const thread = await begin(sam, deal);
  const count = () =>
    rows("SELECT (SELECT count(*) FROM ppo.audit_events) a,(SELECT count(*) FROM ppo.operation_receipts) r,(SELECT count(*) FROM ppo.outbox_jobs) o");
  const before = await count();
  await readThreadContext(sam, thread);
  assert.deepEqual(await count(), before);
});
