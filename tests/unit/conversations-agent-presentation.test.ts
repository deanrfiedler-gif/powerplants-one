import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Message,
  AssistantTurnStatus,
  type ThreadMessage,
} from "../../src/conversations/components/message";
import { turnStates } from "../../src/assistant/model";

const answer = {
  id: "answer",
  sequence: 3,
  author_kind: "Agent",
  author_id: null,
  author_name: "Carl · AI assistant",
  body: "The deal is in Discovery. [1]\nGap: The simulated adapter does not interpret the question.\n1 source left out because not everyone here can see it.",
  created_at: "2026-10-22T00:20:00.000Z",
  mentions: [],
  acted_for: { user_id: "sam", display_name: "Sam" },
  agent: {
    outcome: "Answered",
    adapter: "Simulated",
    label: "Simulated",
    left_out: 1,
    claims: [
      {
        ordinal: 1,
        kind: "Fact",
        text: "The deal is in Discovery.",
        source_numbers: [1],
        withheld: false,
      },
    ],
    sources: [
      {
        number: 1,
        can_open: true,
        type: "Opportunity",
        record_id: "deal",
        label: "OPP-0142 · Green Valley",
        route: "/sales/opportunities/deal",
      },
      { number: 2, can_open: false },
    ],
  },
} as unknown as ThreadMessage;

test("T2c answer labels, acted-for attribution, checked plain text and permitted source chips", () => {
  const html = renderToStaticMarkup(
    createElement(Message, { message: answer }),
  );
  assert.match(html, /Carl · AI assistant/);
  assert.match(html, /Simulated/);
  assert.match(html, /Acting for Sam/);
  assert.match(html, /OPP-0142/);
  assert.match(html, /A record you can&#x27;t open/);
  assert.match(html, /1 source left out/);
  assert.doesNotMatch(
    html,
    /Make a task|Branch here|Pin as decision|Watch|Edit answer/,
  );
});

test("T2c withheld text and sources have only the server's safe placeholders and no action", () => {
  const projected = {
    ...answer,
    body: "A statement from a record you can't open",
    agent: {
      outcome: "Answered",
      adapter: "Simulated",
      label: "Simulated",
      left_out: 0,
      claims: [
        {
          ordinal: 1,
          kind: "Fact",
          text: null,
          source_numbers: [1],
          withheld: true,
        },
      ],
      sources: [{ number: 1, can_open: false }],
    },
  } as unknown as ThreadMessage;
  const html = renderToStaticMarkup(
    createElement(Message, { message: projected }),
  );
  assert.match(html, /A statement from a record/);
  assert.doesNotMatch(html, /href=|title=|OPP-0142|Discovery/);
});

test("T2c turn presentation covers every outcome; other readers receive no reason-specific copy", () => {
  for (const state of turnStates) {
    const html = renderToStaticMarkup(
      createElement(AssistantTurnStatus, {
        turn: {
          id: "turn",
          trigger_message_id: "trigger",
          state,
          acted_for_id: "sam",
          reason: null,
        },
        actedFor: "Sam",
      }),
    );
    if (state === "Answered" || state === "CannotAnswer")
      assert.equal(html, "", "the agent message is the result");
    else {
      assert.match(html, /Carl/);
      assert.doesNotMatch(html, /budget|switched off|credit|permission/i);
    }
  }
  const reason = renderToStaticMarkup(
    createElement(AssistantTurnStatus, {
      turn: {
        id: "turn",
        trigger_message_id: "trigger",
        state: "Unavailable",
        acted_for_id: "sam",
        reason: "BudgetSpent",
      },
      actedFor: "Sam",
    }),
  );
  assert.match(reason, /budget/i);
});

test("T2c output stays text even if a presentation fixture includes markup", () => {
  const html = renderToStaticMarkup(
    createElement(Message, {
      message: { ...answer, body: "<script>alert(1)</script> **plain**" },
    }),
  );
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /\*\*plain\*\*/);
});

test("T2c CannotAnswer is still a labelled simulated agent message", () => {
  const html = renderToStaticMarkup(createElement(Message, { message: {
    ...answer, body: "Carl can't help with that request.",
    agent: { ...answer.agent!, outcome: "CannotAnswer", claims: [], sources: [] },
  } }));
  assert.match(html, /Carl · AI assistant/);
  assert.match(html, /Simulated/);
  assert.match(html, /Acting for Sam/);
  assert.doesNotMatch(html, /href=/);
});
