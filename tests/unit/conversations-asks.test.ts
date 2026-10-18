import assert from "node:assert/strict";
import { test } from "node:test";
import { askText, type ThreadAsk } from "../../src/conversations/ask-model";

const ask = (over: Partial<ThreadAsk> = {}): ThreadAsk => ({
  id: "k1",
  message_id: "m1",
  ordinal: 1,
  asker_id: "u-alex",
  asker_name: "Alex",
  asked_id: "u-sam",
  asked_name: "Sam",
  question: "delivery date",
  reply_by: "2026-10-30",
  state: "Open",
  version: 1,
  closed_at: null,
  closing_message_id: null,
  reminded_at: null,
  asker_told_at: null,
  ...over,
});

test("the person asked sees Waiting on you, the reply-by date and No answer needed", () => {
  assert.deepEqual(askText(ask(), "u-sam"), {
    lead: "Waiting on you · delivery date",
    detail: "Asked by Alex · reply by 30 Oct",
    canDecline: true,
    closed: false,
  });
});

test("anyone else sees who it waits on, without the decline action", () => {
  assert.deepEqual(askText(ask({ reply_by: null }), "u-alex"), {
    lead: "Waiting on Sam · delivery date",
    detail: "Asked by Alex",
    canDecline: false,
    closed: false,
  });
});

test("an answered ask is muted and names who answered", () => {
  const r = askText(ask({ state: "Answered" }), "u-sam");
  assert.equal(r.lead, "Answered by Sam");
  assert.equal(r.closed, true);
  assert.equal(r.canDecline, false);
});

test("an ask that needed no answer says so", () => {
  const r = askText(ask({ state: "NoAnswerNeeded" }), "u-alex");
  assert.equal(r.lead, "No answer needed");
  assert.equal(r.closed, true);
});
