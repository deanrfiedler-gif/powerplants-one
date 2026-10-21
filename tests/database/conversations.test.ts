import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { reset } from "../../scripts/database";
import { closeDatabase, database, transaction } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  closeAsk,
  markRead,
  postMessage,
  recordAskDeadline,
  reopenThread,
  resolveThread,
  startThread,
} from "../../src/conversations/commands";
import {
  conversationBadge,
  linkableRecords,
  listThreads,
  mentionablePeople,
  readThread,
} from "../../src/conversations/reads";
import { conversationNotices, projectConversationNotices } from "../../src/conversations/notices";
import { readOperation } from "../../src/shared/receipts";
import { crmBase } from "../helpers/crm";
import {
  begin,
  brisbaneToday,
  code,
  messageInput,
  newDeal,
  newProject,
  person,
  post,
  principal,
  profiles,
  record,
  rows,
  shiftDate,
  threadInput,
} from "../helpers/conversations";

if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

const revoke = (user: string, capability: string) =>
  database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability=$2", [user, capability]);
const secret = "SYN-secret-phrase-7731";

test("T1-1 start: a reader with the post right starts the main thread; the first message, participant, receipt, audit and outbox all land", async () => {
  const sam = await principal(profiles.coordinator),
    deal = await newDeal(sam),
    input = threadInput(deal, { body: `${secret} first words` });
  const first = await startThread(sam, input);
  assert.equal(first.replayed, false);
  assert.equal(first.receipt.state, "Open");
  assert.equal(first.receipt.record_version, 1);
  const thread = await readThread(sam, first.receipt.record_id);
  assert.equal(thread.is_main, true);
  assert.equal(thread.anchor.type, "Opportunity");
  assert.equal(thread.anchor.id, deal);
  assert.deepEqual(thread.participants.map((x) => [x.user_id, x.role]), [[sam.actor_id, "Creator"]]);
  assert.equal(thread.messages.length, 1);
  assert.equal(thread.messages[0].sequence, 1);
  assert.equal(thread.messages[0].author_id, sam.actor_id);
  // Replay returns the original receipt and writes nothing more.
  const before = await rows("SELECT (SELECT count(*) FROM ppo.conversation_threads) t,(SELECT count(*) FROM ppo.conversation_messages) m,(SELECT count(*) FROM ppo.audit_events) a");
  const again = await startThread(sam, input);
  assert.equal(again.replayed, true);
  assert.deepEqual(again.receipt, first.receipt);
  assert.deepEqual(await rows("SELECT (SELECT count(*) FROM ppo.conversation_threads) t,(SELECT count(*) FROM ppo.conversation_messages) m,(SELECT count(*) FROM ppo.audit_events) a"), before);
  await assert.rejects(startThread(sam, { ...input, title: "SYN Another title" }), code("OperationConflict"));
  assert.deepEqual(await readOperation(sam, input.operation_id), first.receipt);
  const evidence = await rows(
    `SELECT a.object_type,a.details->>'command' AS command,j.kind FROM ppo.audit_events a JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
     WHERE a.operation_id=$1`, [input.operation_id]);
  assert.deepEqual(evidence, [{ object_type: "ConversationThread", command: "Conversation:StartThread", kind: "ConversationChanged" }]);
  // Prose stays in the message row: audit, receipts and outbox hold identifiers only (T1-6, T1-7).
  for (const table of ["audit_events", "operation_receipts", "outbox_jobs"])
    assert.equal((await rows(`SELECT count(*)::int n FROM ppo.${table} x WHERE to_jsonb(x)::text LIKE $1`, [`%${secret}%`]))[0].n, 0, table);
});

test("U1 a second thread on the same record is not the main thread and any reader with the post right may start it", async () => {
  const sam = await principal(profiles.coordinator),
    reader = await principal(profiles.dealReader),
    deal = await newDeal(sam);
  const main = await begin(sam, deal);
  const other = await begin(reader, deal, { title: "SYN Delivery risk" });
  assert.equal((await readThread(sam, main)).is_main, true);
  const second = await readThread(reader, other);
  assert.equal(second.is_main, false);
  assert.equal(second.participants[0].user_id, reader.actor_id);
  assert.equal((await listThreads(sam, { anchor_type: "Opportunity", anchor_id: deal })).count, 2);
});

test("S2 and Q3: only a deal or a project can anchor a thread, and the anchor must be one the sender can open", async () => {
  const sam = await principal(profiles.coordinator),
    deal = await newDeal(sam),
    project = await newProject(sam);
  await assert.rejects(startThread(sam, threadInput(deal, { anchor_type: "Ticket" })), code("InvalidData"));
  const onProject = await startThread(sam, threadInput(project, { anchor_type: "Project" }));
  assert.equal((await readThread(sam, onProject.receipt.record_id)).anchor.type, "Project");
  await assert.rejects(startThread(sam, threadInput("5a1b0d3e-1111-4111-8111-111111111111")), code("RecordUnavailable"));
  const stranger = await principal(profiles.otherCompany);
  await assert.rejects(startThread(stranger, threadInput(deal)), code("RecordUnavailable"));
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.conversation_threads"))[0].n, 1);
});

test("T1-1 read access follows the anchor record's capability, and a lost record takes the thread with it", async () => {
  const sam = await principal(profiles.coordinator),
    dealer = await principal(profiles.dealReader),
    builder = await principal(profiles.projectReader),
    deal = await newDeal(sam),
    project = await newProject(sam);
  const dealThread = await begin(sam, deal, { mentions: [person(dealer.actor_id)], body: "SYN Ask @{1} about it" });
  const projectThread = await begin(sam, project, { anchor_type: "Project" });
  // The deal reader opens the deal thread but not the project one; the project reader is the other way round.
  await readThread(dealer, dealThread);
  await assert.rejects(readThread(dealer, projectThread), code("RecordUnavailable"));
  await readThread(builder, projectThread);
  await assert.rejects(readThread(builder, dealThread), code("RecordUnavailable"));
  assert.deepEqual((await listThreads(builder, { anchor_type: "Project", anchor_id: project })).items.map((x) => x.id), [projectThread]);
  assert.equal((await listThreads(builder, { anchor_type: "Opportunity", anchor_id: deal })).count, 0);
  // Losing the record's read capability removes the thread, its sidebar row, badge count and receipts.
  assert.equal((await conversationBadge(dealer)).unread_threads, 1);
  await revoke(dealer.actor_id, "crm.opportunity.read");
  await assert.rejects(readThread(dealer, dealThread), code("RecordUnavailable"));
  assert.equal((await listThreads(dealer)).count, 0);
  assert.equal((await conversationBadge(dealer)).unread_threads, 0);
  // Losing the conversation capability alone also closes the thread.
  await revoke(builder.actor_id, "conversation.read");
  await assert.rejects(readThread(builder, projectThread), code("Forbidden"));
});

test("T1-2 the post right is separate from the read right", async () => {
  const sam = await principal(profiles.coordinator),
    reader = await principal(profiles.dealReader),
    deal = await newDeal(sam),
    thread = await begin(sam, deal);
  await revoke(reader.actor_id, "conversation.post");
  await readThread(reader, thread);
  await assert.rejects(post(reader, thread), code("Forbidden"));
  await assert.rejects(startThread(reader, threadInput(deal)), code("Forbidden"));
  const observer = await principal(profiles.observer);
  await assert.rejects(readThread(observer, thread), code("Forbidden"));
  await assert.rejects(listThreads(observer), code("Forbidden"));
});

test("T1-3 only a person who can already read the record can be tagged, and the picker lists only them", async () => {
  const sam = await principal(profiles.coordinator),
    dealer = await principal(profiles.dealReader),
    builder = await principal(profiles.projectReader),
    stranger = await principal(profiles.otherCompany),
    deal = await newDeal(sam);
  const ids = (await mentionablePeople(sam, { anchor_type: "Opportunity", anchor_id: deal })).items.map((x) => x.id);
  assert.ok(ids.includes(dealer.actor_id));
  assert.ok(!ids.includes(builder.actor_id), "a project-only reader cannot open the deal");
  assert.ok(!ids.includes(stranger.actor_id), "another company cannot open the deal");
  assert.ok(!ids.includes(sam.actor_id), "the sender is not offered");
  const tag = (who: string) => startThread(sam, threadInput(deal, { body: "SYN Please look @{1}", mentions: [person(who)] }));
  await assert.rejects(tag(builder.actor_id), code("TagNotPermitted"));
  await assert.rejects(tag(stranger.actor_id), code("TagNotPermitted"));
  await revoke(dealer.actor_id, "conversation.read");
  await assert.rejects(tag(dealer.actor_id), code("TagNotPermitted"));
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.conversation_threads"))[0].n, 0);
  assert.ok(!(await mentionablePeople(sam, { anchor_type: "Opportunity", anchor_id: deal })).items.some((x) => x.id === dealer.actor_id));
  await assert.rejects(mentionablePeople(builder, { anchor_type: "Opportunity", anchor_id: deal }), code("RecordUnavailable"));
});

test("U4 a tagged person joins as Tagged and becomes a Participant when they post; an untagged poster joins on posting", async () => {
  const sam = await principal(profiles.coordinator),
    dealer = await principal(profiles.dealReader),
    deal = await newDeal(sam),
    reviewer = await principal("quotation-approver");
  const thread = await begin(sam, deal, { body: "SYN Hello @{1}", mentions: [person(dealer.actor_id)] });
  const roles = async () => Object.fromEntries((await readThread(sam, thread)).participants.map((x) => [x.user_id, x.role]));
  assert.deepEqual(await roles(), { [sam.actor_id]: "Creator", [dealer.actor_id]: "Tagged" });
  assert.equal((await listThreads(dealer)).count, 1, "the tagged person sees the thread in their sidebar");
  await post(dealer, thread);
  assert.equal((await roles())[dealer.actor_id], "Participant");
  assert.equal((await listThreads(reviewer)).count, 0, "a reader who never took part has no sidebar row");
  await post(reviewer, thread);
  assert.equal((await roles())[reviewer.actor_id], "Participant");
  assert.equal((await listThreads(reviewer)).count, 1);
  const { messages } = await readThread(sam, thread);
  assert.deepEqual(messages.map((m) => m.sequence), [1, 2, 3]);
});

test("U2 and T1-5 messages are immutable plain text whose tokens must match their mentions", async () => {
  const sam = await principal(profiles.coordinator),
    dealer = await principal(profiles.dealReader),
    deal = await newDeal(sam),
    thread = await begin(sam, deal);
  const message = await post(sam, thread, { body: "SYN Ask @{1}", mentions: [person(dealer.actor_id)] });
  for (const sql of [
    "UPDATE ppo.conversation_messages SET body='SYN edited' WHERE id=$1",
    "DELETE FROM ppo.conversation_messages WHERE id=$1",
    "UPDATE ppo.conversation_mentions SET ordinal=2 WHERE message_id=$1",
    "DELETE FROM ppo.conversation_mentions WHERE message_id=$1",
  ])
    await assert.rejects(database().query(sql, [message]), code("55000"));
  await assert.rejects(database().query("DELETE FROM ppo.conversation_threads WHERE id=$1", [thread]), code("55000"));
  const bad = (extra: Record<string, unknown>) => post(sam, thread, extra);
  await assert.rejects(bad({ body: "SYN names @{1} twice @{1}", mentions: [person(dealer.actor_id)] }), code("InvalidData"));
  await assert.rejects(bad({ body: "SYN no token", mentions: [person(dealer.actor_id)] }), code("InvalidData"));
  await assert.rejects(bad({ body: "SYN stray @{2}", mentions: [] }), code("InvalidData"));
  await assert.rejects(bad({ body: "SYN wrong kind #{1}", mentions: [person(dealer.actor_id)] }), code("InvalidData"));
  await assert.rejects(bad({ body: "   " }), code("InvalidData"));
  await assert.rejects(bad({ body: "SYN extra field", format: "markdown" }), code("InvalidData"));
  assert.equal((await readThread(sam, thread)).messages.length, 2);
});

test("T1-4 a # link is stored as type and ID and drawn for each reader from their own access", async () => {
  const sam = await principal(profiles.coordinator),
    dealer = await principal(profiles.dealReader),
    builder = await principal(profiles.projectReader),
    stranger = await principal(profiles.otherCompany),
    deal = await newDeal(sam),
    project = await newProject(sam);
  // The project reader joins the project thread and links the deal they cannot open: refused at the sender.
  const projectThread = await begin(sam, project, { anchor_type: "Project" });
  await assert.rejects(post(builder, projectThread, { body: "SYN see #{1}", mentions: [record("Opportunity", deal)] }), code("LinkNotPermitted"));
  await assert.rejects(post(builder, projectThread, { body: "SYN see #{1}", mentions: [record("Project", "5a1b0d3e-2222-4222-8222-222222222222")] }), code("LinkNotPermitted"));
  // The coordinator links the deal in the project thread. The project reader sees no title, number or ID.
  await post(sam, projectThread, { body: "SYN see #{1} for context", mentions: [record("Opportunity", deal)] });
  const asSam = (await readThread(sam, projectThread)).messages[1].mentions[0] as Record<string, unknown>;
  assert.equal(asSam.can_open, true);
  assert.equal(asSam.record_id, deal);
  assert.match(String(asSam.display_number), /^SYN-OPP-/);
  assert.ok(String(asSam.title).length > 0);
  const asBuilder = (await readThread(builder, projectThread)).messages[1].mentions[0];
  assert.deepEqual(asBuilder, { ordinal: 1, kind: "Record", can_open: false });
  // The stored link is only type and ID: the body holds a placeholder, never the title.
  const stored = await rows("SELECT record_type,record_id FROM ppo.conversation_mentions WHERE kind='Record'");
  assert.deepEqual(stored, [{ record_type: "Opportunity", record_id: deal }]);
  assert.ok(!(await rows("SELECT body FROM ppo.conversation_messages WHERE sequence=2")).some((r) => /SYN Controls/.test(r.body)));
  // The # picker lists only what the sender can open.
  assert.ok((await linkableRecords(sam, { q: "" })).items.some((r) => r.id === deal));
  assert.ok(!(await linkableRecords(builder, {})).items.some((r) => r.id === deal));
  assert.ok((await linkableRecords(builder, {})).items.some((r) => r.id === project));
  assert.equal((await linkableRecords(stranger, {})).items.length, 0);
  assert.ok(dealer);
});

test("asks: a reply by the person asked closes the ask, reading closes nothing and No answer needed is theirs alone", async () => {
  const sam = await principal(profiles.coordinator),
    dealer = await principal(profiles.dealReader),
    deal = await newDeal(sam),
    thread = await begin(sam, deal, {
      body: "SYN Can you confirm the delivery date @{1}?",
      mentions: [person(dealer.actor_id)],
      asks: [{ ordinal: 1, question: "SYN Delivery date?", reply_by: await shiftDate(3) }],
    });
  const ask = (await readThread(sam, thread)).asks[0];
  assert.equal(ask.state, "Open");
  assert.equal(ask.asker_id, sam.actor_id);
  assert.equal(ask.asked_id, dealer.actor_id);
  assert.equal((await listThreads(dealer, { filter: "WaitingOnYou" })).items[0].waiting_on_you, 1);
  assert.equal((await listThreads(sam, { filter: "WaitingOnYou" })).count, 0);
  // Reading does not close the ask.
  await markRead(dealer, thread, { ...crmBase(), through_sequence: 1 });
  assert.equal((await readThread(dealer, thread)).asks[0].state, "Open");
  // Only the person asked can mark No answer needed; the asker and others cannot.
  await assert.rejects(closeAsk(sam, ask.id, { ...crmBase(), expected_version: 1 }), code("Forbidden"));
  await assert.rejects(closeAsk(dealer, ask.id, { ...crmBase(), expected_version: 2 }), code("VersionConflict"));
  const closed = await closeAsk(dealer, ask.id, { ...crmBase(), expected_version: 1 });
  assert.equal(closed.receipt.state, "NoAnswerNeeded");
  assert.equal((await readThread(sam, thread)).asks[0].state, "NoAnswerNeeded");
  await assert.rejects(closeAsk(dealer, ask.id, { ...crmBase(), expected_version: 2 }), code("AskClosed"));
  assert.equal((await listThreads(dealer, { filter: "WaitingOnYou" })).count, 0);
  // A reply in the thread closes the open ask it answers.
  const second = await post(sam, thread, { body: "SYN And the site power @{1}?", mentions: [person(dealer.actor_id)], asks: [{ ordinal: 1, question: "SYN Site power?" }] });
  assert.ok(second);
  assert.equal((await readThread(sam, thread)).asks.at(-1)!.state, "Open");
  const reply = await post(dealer, thread, { body: "SYN It is a three-phase supply." });
  const answered = (await readThread(sam, thread)).asks.at(-1)!;
  assert.equal(answered.state, "Answered");
  assert.equal(answered.closing_message_id, reply);
  assert.equal(answered.version, 2);
  // An ask is made of someone else, and a reply-by date cannot be in the past.
  await assert.rejects(post(sam, thread, { body: "SYN me @{1}", mentions: [person(sam.actor_id)], asks: [{ ordinal: 1, question: "SYN Myself?" }] }), code("SelfAsk"));
  await assert.rejects(
    post(sam, thread, { body: "SYN late @{1}", mentions: [person(dealer.actor_id)], asks: [{ ordinal: 1, question: "SYN When?", reply_by: await shiftDate(-1) }] }),
    code("ReplyByInPast"),
  );
  await assert.rejects(post(sam, thread, { body: "SYN no person", asks: [{ ordinal: 1, question: "SYN Who?" }] }), code("InvalidData"));
});

test("N7: one reminder on the reply-by date, then the asker is told; each step happens once, in order, while the ask is open", async () => {
  const sam = await principal(profiles.coordinator),
    dealer = await principal(profiles.dealReader),
    deal = await newDeal(sam),
    open = async (reply_by: string | null) => {
      const thread = await begin(sam, deal, { body: "SYN Ask @{1}", mentions: [person(dealer.actor_id)], asks: [{ ordinal: 1, question: "SYN When?", reply_by }] });
      return (await readThread(sam, thread)).asks[0];
    };
  const step = (who: typeof sam, ask: string, name: string) => recordAskDeadline(who, ask, { ...crmBase(), step: name });
  const undated = await open(null);
  await assert.rejects(step(dealer, undated.id, "Remind"), code("NoReplyBy"));
  const future = await open(await shiftDate(2));
  await assert.rejects(step(dealer, future.id, "Remind"), code("NotDue"));
  await assert.rejects(step(dealer, future.id, "TellAsker"), code("ReminderFirst"));
  // A reply-by date of today is due for the reminder, not yet for telling the asker.
  const due = await open(await brisbaneToday());
  await assert.rejects(step(dealer, due.id, "TellAsker"), code("ReminderFirst"));
  const reminded = await step(dealer, due.id, "Remind");
  assert.equal(reminded.receipt.record_version, 2);
  await assert.rejects(step(sam, due.id, "Remind"), code("StepRecorded"));
  await assert.rejects(step(sam, due.id, "TellAsker"), code("NotDue"));
  // Move the date back so the day after has passed (test-only: a guard forbids changing reply-by).
  await transaction(async (c) => {
    await c.query("ALTER TABLE ppo.conversation_asks DISABLE TRIGGER guard");
    await c.query("UPDATE ppo.conversation_asks SET reply_by=reply_by-2 WHERE id=$1", [due.id]);
    await c.query("ALTER TABLE ppo.conversation_asks ENABLE TRIGGER guard");
  });
  const told = await step(sam, due.id, "TellAsker");
  assert.equal(told.receipt.record_version, 3);
  await assert.rejects(step(sam, due.id, "TellAsker"), code("StepRecorded"));
  const stranger = await principal("quotation-approver");
  await assert.rejects(step(stranger, due.id, "Remind"), code("RecordUnavailable"));
  // Once answered, no step is recorded.
  const done = await open(await brisbaneToday());
  await closeAsk(dealer, done.id, { ...crmBase(), expected_version: 1 });
  await assert.rejects(step(dealer, done.id, "Remind"), code("AskClosed"));
  const state = (await rows("SELECT reminded_at IS NOT NULL r,asker_told_at IS NOT NULL t FROM ppo.conversation_asks WHERE id=$1", [due.id]))[0];
  assert.deepEqual(state, { r: true, t: true });
});

test("T1-7 notices are a projection from the audit log into Mentions, with no prose and the reader's current access checked", async () => {
  const sam = await principal(profiles.coordinator),
    dealer = await principal(profiles.dealReader),
    tagged = await principal("quotation-approver"),
    deal = await newDeal(sam);
  const thread = await begin(sam, deal, {
    body: `${secret} @{1} please confirm, @{2} for information`,
    mentions: [person(dealer.actor_id, 1), person(tagged.actor_id, 2)],
    asks: [{ ordinal: 1, question: `${secret} question`, reply_by: await shiftDate(1) }],
  });
  await projectConversationNotices(dealer);
  await projectConversationNotices(dealer);
  const asked = await conversationNotices(dealer);
  assert.equal(asked.length, 1, "the projection is idempotent");
  assert.deepEqual([asked[0].reason, asked[0].category, asked[0].thread_id, asked[0].sequence], ["Ask", "Mentions", thread, 1]);
  assert.deepEqual((await conversationNotices(tagged)).map((n) => n.reason), ["Mention"]);
  assert.equal((await conversationNotices(sam)).length, 0, "the author is not notified of their own message");
  const notice = await rows("SELECT * FROM ppo.notification_events WHERE recipient_id=$1", [dealer.actor_id]);
  assert.equal(JSON.stringify(notice).includes(secret), false);
  assert.deepEqual(Object.keys(notice[0]).sort(), ["category", "event_at", "event_id", "id", "reason", "recipient_id", "source_id", "source_type", "source_version", "workspace_id"]);
  // A reply is not a notice; a later mention is.
  await post(dealer, thread);
  await post(sam, thread, { body: "SYN Thanks @{1}", mentions: [person(dealer.actor_id)] });
  assert.deepEqual((await conversationNotices(dealer)).map((n) => n.reason).sort(), ["Ask", "Mention"]);
  // Deadline steps notify the right person: the reminder goes to the asked, the overdue notice to the asker.
  const ask = (await readThread(sam, thread)).asks[0];
  await transaction(async (c) => {
    await c.query("ALTER TABLE ppo.conversation_asks DISABLE TRIGGER guard");
    await c.query("UPDATE ppo.conversation_asks SET reply_by=reply_by-4 WHERE id=$1", [ask.id]);
    await c.query("ALTER TABLE ppo.conversation_asks ENABLE TRIGGER guard");
  });
  // Posting by the asked person answered it, so use a fresh ask for the deadline.
  const fresh = await begin(sam, deal, { body: "SYN Ask @{1}", mentions: [person(dealer.actor_id)], asks: [{ ordinal: 1, question: "SYN Again?", reply_by: await brisbaneToday() }] });
  const freshAsk = (await readThread(sam, fresh)).asks[0];
  await recordAskDeadline(dealer, freshAsk.id, { ...crmBase(), step: "Remind" });
  await transaction(async (c) => {
    await c.query("ALTER TABLE ppo.conversation_asks DISABLE TRIGGER guard");
    await c.query("UPDATE ppo.conversation_asks SET reply_by=reply_by-2 WHERE id=$1", [freshAsk.id]);
    await c.query("ALTER TABLE ppo.conversation_asks ENABLE TRIGGER guard");
  });
  await recordAskDeadline(sam, freshAsk.id, { ...crmBase(), step: "TellAsker" });
  assert.ok((await conversationNotices(dealer)).some((n) => n.reason === "Reminder" && n.thread_id === fresh));
  assert.deepEqual((await conversationNotices(sam)).map((n) => n.reason), ["AskOverdue"]);
  // The notice follows the reader's present access to the thread.
  await revoke(dealer.actor_id, "crm.opportunity.read");
  assert.deepEqual(await conversationNotices(dealer), []);
  assert.ok((await rows("SELECT count(*)::int n FROM ppo.notification_events WHERE recipient_id=$1 AND source_type='Conversation'", [dealer.actor_id]))[0].n >= 3, "stored notices are kept; only the reader hides them");
});

test("thread state: the creator or a participant with the post right resolves and reopens; a resolved thread takes no post", async () => {
  const sam = await principal(profiles.coordinator),
    dealer = await principal(profiles.dealReader),
    onlooker = await principal("quotation-approver"),
    deal = await newDeal(sam),
    thread = await begin(sam, deal);
  const state = (_who: typeof sam, v: number) => ({ ...crmBase(), expected_version: v });
  await assert.rejects(resolveThread(onlooker, thread, state(onlooker, 1)), code("RecordUnavailable"));
  await post(dealer, thread);
  await assert.rejects(resolveThread(dealer, thread, state(dealer, 2)), code("VersionConflict"));
  const resolved = await resolveThread(dealer, thread, state(dealer, 1));
  assert.equal(resolved.receipt.state, "Resolved");
  assert.equal(resolved.receipt.record_version, 2);
  await assert.rejects(post(sam, thread), code("ThreadResolved"));
  await assert.rejects(resolveThread(sam, thread, state(sam, 2)), code("AlreadyInState"));
  const detail = await readThread(sam, thread);
  assert.equal(detail.state, "Resolved");
  assert.notEqual(detail.resolved_at, null);
  const reopened = await reopenThread(sam, thread, state(sam, 2));
  assert.equal(reopened.receipt.state, "Open");
  assert.equal(reopened.receipt.record_version, 3);
  await post(sam, thread);
  assert.equal((await readThread(sam, thread)).messages.length, 3);
});

test("D7 last-read only advances and the badge counts threads with an unread message", async () => {
  const sam = await principal(profiles.coordinator),
    dealer = await principal(profiles.dealReader),
    deal = await newDeal(sam),
    thread = await begin(sam, deal, { body: "SYN Hello @{1}", mentions: [person(dealer.actor_id)] });
  assert.equal((await conversationBadge(sam)).unread_threads, 1, "the author has not read their own message");
  await markRead(sam, thread, { ...crmBase(), through_sequence: 1 });
  assert.equal((await conversationBadge(sam)).unread_threads, 0);
  assert.equal((await conversationBadge(dealer)).unread_threads, 1);
  await post(sam, thread);
  assert.equal((await conversationBadge(dealer)).unread_threads, 1);
  await markRead(dealer, thread, { ...crmBase(), through_sequence: 2 });
  assert.equal((await conversationBadge(dealer)).unread_threads, 0);
  const result = await markRead(dealer, thread, { ...crmBase(), through_sequence: 1 });
  assert.ok(result.receipt);
  const mine = (await readThread(dealer, thread)).participants.find((x) => x.user_id === dealer.actor_id)!;
  assert.equal(mine.last_read_sequence, 2, "reading an older message does not move the position back");
  await assert.rejects(markRead(dealer, thread, { ...crmBase(), through_sequence: 9 }), code("MessageNotFound"));
  const reader = await principal("quotation-approver");
  await assert.rejects(markRead(reader, thread, { ...crmBase(), through_sequence: 1 }), code("NotAParticipant"));
  await assert.rejects(
    database().query("UPDATE ppo.conversation_participants SET last_read_sequence=0 WHERE user_id=$1", [dealer.actor_id]),
    code("55000"),
  );
});

test("sidebar filters: Mentions and Waiting on you are per person, and the record list shows every readable thread", async () => {
  const sam = await principal(profiles.coordinator),
    dealer = await principal(profiles.dealReader),
    other = await principal("quotation-approver"),
    deal = await newDeal(sam);
  const tagged = await begin(sam, deal, { body: "SYN Look @{1}", mentions: [person(dealer.actor_id)] });
  const asking = await begin(sam, deal, { title: "SYN Needs a date", body: "SYN Date @{1}?", mentions: [person(dealer.actor_id)], asks: [{ ordinal: 1, question: "SYN Date?" }] });
  const plain = await begin(other, deal, { title: "SYN Quiet thread" });
  const ids = async (who: typeof sam, filter: string) => (await listThreads(who, { filter })).items.map((x) => x.id).sort();
  assert.deepEqual(await ids(dealer, "Mentions"), [tagged, asking].sort());
  assert.deepEqual(await ids(dealer, "WaitingOnYou"), [asking]);
  assert.deepEqual(await ids(dealer, "All"), [tagged, asking].sort());
  assert.deepEqual(await ids(sam, "Mentions"), []);
  assert.deepEqual(await ids(other, "All"), [plain]);
  const record = await listThreads(other, { anchor_type: "Opportunity", anchor_id: deal });
  assert.equal(record.count, 3, "the record page shows every thread the reader can open, as Q4");
  assert.equal(record.items.find((x) => x.id === plain)!.participating, true);
  assert.equal(record.items.find((x) => x.id === tagged)!.participating, false);
  assert.equal((await listThreads(sam, { limit: 1 })).count, 1);
  await assert.rejects(listThreads(sam, { filter: "Everything" }), code("InvalidData"));
});

test("database backstops: no message without its audit event, one main thread, tagging and last-read rules hold below the service", async () => {
  const sam = await principal(profiles.coordinator),
    deal = await newDeal(sam),
    thread = await begin(sam, deal);
  const ws = sam.workspace_id;
  // A message written outside a typed command has no audit event, so the commit is refused.
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "INSERT INTO ppo.conversation_messages(id,workspace_id,thread_id,sequence,author_id,body,operation_id) VALUES(gen_random_uuid(),$1,$2,2,$3,'SYN direct write',gen_random_uuid())",
        [ws, thread, sam.actor_id],
      );
    }),
    code("23514"),
  );
  // A sequence must be the next one; a resolved thread takes no message.
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "INSERT INTO ppo.conversation_messages(id,workspace_id,thread_id,sequence,author_id,body,operation_id) VALUES(gen_random_uuid(),$1,$2,7,$3,'SYN gap',gen_random_uuid())",
        [ws, thread, sam.actor_id],
      );
    }),
    code("23514"),
  );
  // A second thread cannot claim to be main, and a thread must carry its anchor's company.
  const company = (await rows("SELECT company_id FROM ppo.conversation_threads WHERE id=$1", [thread]))[0].company_id;
  const insert = (id: string, main: boolean, co: string) =>
    transaction((c) => c.query(
      "INSERT INTO ppo.business_identities(workspace_id,id,object_type) VALUES($1,$2,'ConversationThread')",
      [ws, id],
    ).then(() => c.query(
      "INSERT INTO ppo.conversation_threads(id,workspace_id,company_id,anchor_type,anchor_id,title,is_main,created_by) VALUES($2,$1,$4,'Opportunity',$5,'SYN x',$3,$6)",
      [ws, id, main, co, deal, sam.actor_id],
    )));
  await assert.rejects(insert("5a1b0d3e-3333-4333-8333-333333333333", true, company), code("23514"));
  await assert.rejects(insert("5a1b0d3e-4444-4444-8444-444444444444", false, "20000000-0000-4000-8000-000000000002"), code("23514"));
  // The thread's title and anchor are permanent.
  await assert.rejects(database().query("UPDATE ppo.conversation_threads SET title='SYN renamed' WHERE id=$1", [thread]), code("55000"));
  // A mention of someone without the read capability is refused by the table.
  const nobody = await principal(profiles.observer);
  await assert.rejects(
    transaction(async (c) => {
      await c.query("SELECT 1");
      await c.query(
        "INSERT INTO ppo.conversation_mentions(workspace_id,message_id,ordinal,kind,person_id) SELECT $1,id,2,'Person',$2 FROM ppo.conversation_messages WHERE thread_id=$3",
        [ws, nobody.actor_id, thread],
      );
    }),
    (e) => ["23514", "55000"].includes((e as { code?: string }).code ?? ""),
  );
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.conversation_messages WHERE thread_id=$1", [thread]))[0].n, 1);
});

test("every command refuses a missing or foreign thread and writes nothing for a refused call", async () => {
  const sam = await principal(profiles.coordinator),
    stranger = await principal(profiles.otherCompany),
    deal = await newDeal(sam),
    thread = await begin(sam, deal),
    snapshot = () => rows("SELECT (SELECT count(*) FROM ppo.audit_events) a,(SELECT count(*) FROM ppo.operation_receipts) r,(SELECT count(*) FROM ppo.outbox_jobs) o,(SELECT count(*) FROM ppo.conversation_messages) m");
  const before = await snapshot();
  await assert.rejects(readThread(stranger, thread), code("RecordUnavailable"));
  await assert.rejects(post(stranger, thread), code("RecordUnavailable"));
  await assert.rejects(markRead(stranger, thread, { ...crmBase(), through_sequence: 1 }), code("RecordUnavailable"));
  await assert.rejects(resolveThread(stranger, thread, { ...crmBase(), expected_version: 1 }), code("RecordUnavailable"));
  await assert.rejects(post(sam, "5a1b0d3e-5555-4555-8555-555555555555"), code("RecordUnavailable"));
  await assert.rejects(closeAsk(sam, "5a1b0d3e-6666-4666-8666-666666666666", { ...crmBase(), expected_version: 1 }), code("RecordUnavailable"));
  await assert.rejects(readOperation(stranger, messageInput().operation_id), code("RecordUnavailable"));
  assert.deepEqual(await snapshot(), before);
  // A stored receipt is disclosed only to someone who can still read the thread.
  const posted = await postMessage(sam, thread, messageInput());
  assert.deepEqual(await readOperation(sam, posted.receipt.operation_id), posted.receipt);
  await revoke(sam.actor_id, "conversation.read");
  await assert.rejects(readOperation(sam, posted.receipt.operation_id), code("Forbidden"));
});
