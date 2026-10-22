import assert from "node:assert/strict";
import { test } from "node:test";
import {
  readJournal,
  writeJournal,
  type JournalEntry,
  type StoragePort,
} from "../../src/shared/lib/command-journal";
import {
  originalPostPreview,
  originalParticipantWarnings,
  retainedPost,
  reviewedParticipantPatch,
} from "../../src/conversations/reviewed-retry";

const id = (n: number) =>
  `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const scope = { actor_id: id(1), workspace_id: id(2) };
const original = (): JournalEntry => ({
  version: 1,
  phase: "pending",
  scope,
  path: `conversations/${id(3)}/messages`,
  body: {
    operation_id: id(4),
    schema_version: 1,
    reason: "Post a message",
    body: "SYN @{1} original question",
    mentions: [{ ordinal: 1, kind: "Person", person_id: id(5) }],
    asks: [{ ordinal: 1, question: "SYN delivery?", reply_by: null }],
    participant_acknowledgements: [{ person_id: id(5), basis: "a".repeat(64) }],
  },
  target: `/conversations/${id(3)}`,
  record_id: id(3),
  label: "Message",
});
const accepts = (e: JournalEntry) =>
  e.path === `conversations/${id(3)}/messages`;
const memory = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  } satisfies StoragePort;
};

test("a reviewed retry replaces only the expected pending snapshot without losing original operation, tags or asks", () => {
  const storage = memory(),
    before = writeJournal(storage, "key", original(), accepts);
  const next = {
    ...before,
    body: {
      ...before.body,
      participant_acknowledgements: [
        { person_id: id(5), basis: "b".repeat(64) },
      ],
    },
  };
  // An ordinary send still cannot replace an unresolved original.
  assert.throws(
    () => writeJournal(storage, "key", next, accepts),
    /Resolve the original/,
  );
  const saved = writeJournal(storage, "key", next, accepts, 32768, before);
  assert.deepEqual(readJournal(storage, "key", scope, accepts), saved);
  assert.equal(saved.body.operation_id, before.body.operation_id);
  assert.equal(saved.body.body, before.body.body);
  assert.deepEqual(saved.body.mentions, before.body.mentions);
  assert.deepEqual(saved.body.asks, before.body.asks);
  assert.throws(
    () => writeJournal(storage, "key", before, accepts, 32768, before),
    /changed/,
  );
});

test("a reviewed journal update cannot resurrect a removed operation or replace its identity or scope", () => {
  const storage = memory(),
    before = original();
  assert.throws(
    () => writeJournal(storage, "key", before, accepts, 32768, before),
    /changed/,
  );
  writeJournal(storage, "key", before, accepts);
  for (const next of [
    { ...before, body: { ...before.body, operation_id: id(6) } },
    { ...before, record_id: id(6) },
    { ...before, scope: { ...scope, actor_id: id(6) } },
    { ...before, phase: "accepted" as const },
  ])
    assert.throws(
      () => writeJournal(storage, "key", next, accepts, 32768, before),
      /changed/,
    );
  assert.deepEqual(readJournal(storage, "key", scope, accepts), before);
});

const refusal = { status: 409, code: "ParticipantWarningRequired" };
const approved = [{ person_id: id(5), basis: "b".repeat(64) }];
test("only the exact post refusal permits fresh acknowledgement metadata, retaining all business fields", () => {
  const before = original(),
    snapshot = JSON.stringify(before);
  assert.deepEqual(reviewedParticipantPatch(before, refusal, approved), {
    participant_acknowledgements: approved,
  });
  assert.deepEqual(reviewedParticipantPatch(before, refusal, []), {
    participant_acknowledgements: [],
  });
  assert.equal(JSON.stringify(before), snapshot);
  for (const failure of [
    { status: 404, code: "ParticipantWarningRequired" },
    { status: 403, code: "Forbidden" },
    { status: 500, code: "InternalError" },
    { status: 409, code: "OperationConflict" },
    { ...refusal, retryable: true },
  ])
    assert.equal(reviewedParticipantPatch(before, failure, approved), null);
  assert.equal(
    reviewedParticipantPatch(
      { ...before, path: "local-session" },
      refusal,
      approved,
    ),
    null,
  );
  assert.equal(
    reviewedParticipantPatch(
      { ...before, phase: "accepted" },
      refusal,
      approved,
    ),
    null,
  );
});

test("review metadata refuses malformed, duplicated or unrelated people and cannot inject command fields", () => {
  for (const review of [
    undefined,
    null,
    { ...approved[0], body: "replacement" },
    [{ ...approved[0], basis: "bad" }],
    [approved[0], approved[0]],
    [{ ...approved[0], person_id: id(6) }],
    [{ ...approved[0], operation_id: id(6) }],
  ])
    assert.equal(reviewedParticipantPatch(original(), refusal, review), null);
});

test("original review previews retain AI/person distinction and asks without restoring cached record names or links", () => {
  const entry = original();
  entry.body.body = "SYN @{1} @{2} #{3}";
  entry.body.mentions = [
    { ordinal: 1, kind: "Agent" },
    { ordinal: 2, kind: "Person", person_id: id(5) },
    {
      ordinal: 3,
      kind: "Record",
      record_type: "Opportunity",
      record_id: id(9),
    },
  ];
  entry.body.asks = [
    { ordinal: 2, question: "SYN original delivery?", reply_by: "2026-10-30" },
  ];
  const input = retainedPost(entry)!;
  const preview = originalPostPreview(input, [
    { id: id(5), display_name: "Carl Jensen", role: "Role not recorded" },
  ]);
  assert.match(preview, /@Carl · AI assistant @Carl Jensen #Linked record/);
  assert.match(
    preview,
    /Ask Carl Jensen: SYN original delivery\? \(reply by 2026-10-30\)/,
  );
  assert.ok(!preview.includes(id(9)) && !preview.includes("/sales/"));
});

test("storage failure cannot silently replace the original pending command", () => {
  const storage = memory(),
    before = writeJournal(storage, "key", original(), accepts);
  const next = {
    ...before,
    body: { ...before.body, participant_acknowledgements: approved },
  };
  assert.throws(
    () =>
      writeJournal(
        {
          ...storage,
          setItem: () => {
            throw Error("quota");
          },
        },
        "key",
        next,
        accepts,
        32768,
        before,
      ),
    /quota/,
  );
  assert.deepEqual(readJournal(storage, "key", scope, accepts), before);
});

test("reviewing the original requires every tagged person in the current people projection", () => {
  const input = retainedPost(original())!;
  const person = { id: id(5), display_name: "SYN Original person", role: "Role not recorded" };
  assert.equal(originalParticipantWarnings(input, []), null);
  assert.equal(originalParticipantWarnings(input, [{ ...person, id: id(6) }]), null);
  assert.deepEqual(originalParticipantWarnings(input, [person]), []);
  const warned = { ...person, history_warning: { count: 1, basis: "b".repeat(64) } };
  assert.deepEqual(originalParticipantWarnings(input, [warned]), [warned]);
});
