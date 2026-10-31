import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { editDealInformation } from "../../src/crm/refinements";
import {
  createHandover,
  commandHandover,
  readHandover,
} from "../../src/sales/handover-service";
import {
  listReceivingBriefs,
  readReceivingBrief,
  exportReceivingBriefs,
} from "../../src/sales/receiving-queue";
import { emptyHandover } from "../../src/sales/handover-model";
import { crmBase, crmDiscovery } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const code = (expected: string) => (e: unknown) =>
  (e as { code: string }).code === expected;
test("CR-02 queue: native clarification, source drift, successor isolation, full counts/paging and revoked export", async () => {
  const p = (await createSession("coordinator")).principal;
  async function prepare(title: string) {
    const o = crmDiscovery();
    o.title = title;
    o.initial_action.due_at = "2031-10-01T00:00:00.000Z";
    o.initial_action.due_needed = false;
    await createOpportunity(p, o);
    const id = randomUUID();
    await createHandover(p, {
      ...crmBase(),
      id,
      opportunity_id: o.id,
      kind: "Estimating",
    });
    const content = {
      ...emptyHandover(),
      problem: "SYN original problem",
      outcome: "SYN outcome",
      included_scope: "SYN original scope",
      exclusions: "None",
      assumptions: "None",
      unknowns: "None",
      requested_date: "2031-10-01",
      date_reason: "Customer request",
      next_activity_id: o.initial_action.id,
    };
    await commandHandover(p, id, {
      ...crmBase(),
      action: "Save",
      expected_version: 1,
      content,
      receiving_owner_id: p.actor_id,
      note: "SYN save",
    });
    return { id, o, content };
  }
  async function action(
    id: string,
    action: string,
    extra: Record<string, unknown> = {},
  ) {
    const d = await readHandover(p, id);
    return commandHandover(p, id, {
      ...crmBase(),
      expected_version: d.record.version,
      action,
      note: `SYN ${action}`,
      ...extra,
    });
  }
  const first = await prepare("SYN Receiving register original");
  assert.equal((await listReceivingBriefs(p)).total, 0);
  await action(first.id, "Submit");
  let queue = await listReceivingBriefs(p);
  assert.equal(queue.total, 1);
  assert.equal(queue.counts.Awaiting, 1);
  const original = queue.items[0];
  const other = (await createSession("second-company")).principal;
  const hiddenQueue = await listReceivingBriefs(other);
  assert.equal(hiddenQueue.total, 0);
  assert.equal(hiddenQueue.counts.All, 0);
  assert.deepEqual(hiddenQueue.customers, []);
  assert.deepEqual(hiddenQueue.owners, []);
  await assert.rejects(
    readReceivingBrief(other, first.id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    exportReceivingBriefs(other, `${original.id}:${original.token}`),
    code("RecordUnavailable"),
  );
  assert.equal(
    (
      await readReceivingBrief(p, first.id, {
        revision: "1",
        token: original.token,
      })
    ).content.problem,
    "SYN original problem",
  );
  assert.equal(
    (await exportReceivingBriefs(p, `${original.id}:${original.token}`)).count,
    1,
  );
  await action(first.id, "Clarify");
  const question = (await readHandover(p, first.id)).history.at(-1)!.id;
  queue = await listReceivingBriefs(p);
  assert.equal(queue.counts.Awaiting, 0);
  assert.equal(queue.counts.ClarificationRequested, 1);
  await assert.rejects(
    exportReceivingBriefs(p, `${original.id}:${original.token}`),
    code("ReceivingQueueChanged"),
  );
  await action(first.id, "Answer", { question_id: question });
  assert.equal((await listReceivingBriefs(p)).counts.Awaiting, 1);
  await assert.rejects(
    action(first.id, "Accept", {
      source_hash: (await readHandover(p, first.id)).record.source_hash,
    }),
    code("VersionConflict"),
  );
  await action(first.id, "Resolve", { question_id: question });
  await editDealInformation(p, first.o.id, {
    ...crmBase(),
    expected_version: 1,
    title: "SYN Changed source title",
    primary_person_id: first.o.primary_person_id,
    contact_unknown_reason: first.o.contact_unknown_reason,
    value_amount: "123.00",
    expected_close_date: "2031-12-01",
  });
  queue = await listReceivingBriefs(p);
  assert.equal(queue.items[0].source_changed, true);
  assert.equal(queue.items[0].opportunity.title, first.o.title);
  assert.equal(queue.counts.SourceChanged, 1);
  assert.equal(queue.counts.Awaiting, 1);
  await assert.rejects(
    action(first.id, "Accept", {
      source_hash: (await readHandover(p, first.id)).record.source_hash,
    }),
    code("VersionConflict"),
  );
  await action(first.id, "Return");
  const returned = (await listReceivingBriefs(p)).items[0];
  await action(first.id, "Successor");
  await action(first.id, "Save", {
    content: {
      ...first.content,
      problem: "SYN unsubmitted successor",
      requested_date: "2032-01-01",
    },
    receiving_owner_id: null,
  });
  queue = await listReceivingBriefs(p);
  assert.equal(queue.total, 1);
  assert.equal(queue.items[0].revision, 1);
  assert.equal(queue.items[0].state, "Returned");
  assert.equal(queue.items[0].receiving_owner?.id, p.actor_id);
  assert.equal(queue.items[0].updated_at, returned.updated_at);
  assert.equal(queue.items[0].token, returned.token);
  assert.equal(queue.counts.SourceChanged, 0);
  assert.equal(queue.items[0].requested_date, "2031-10-01");
  assert.equal(
    (await readReceivingBrief(p, first.id)).content.problem,
    "SYN original problem",
  );
  await action(first.id, "Save", {
    content: { ...first.content, problem: "SYN reviewed successor" },
    receiving_owner_id: p.actor_id,
  });
  await action(first.id, "Submit");
  const successor = (await listReceivingBriefs(p)).items[0];
  assert.equal(successor.revision, 2);
  assert.equal(successor.source_changed, false);
  await assert.rejects(
    readReceivingBrief(p, first.id, { revision: "1" }),
    code("ReceivingQueueChanged"),
  );
  await action(first.id, "Accept", {
    source_hash: (await readHandover(p, first.id)).record.source_hash,
  });
  assert.equal((await listReceivingBriefs(p)).counts.Accepted, 1);
  for (let i = 0; i < 3; i++) {
    const item = await prepare(`SYN Paging ${i}`);
    await action(item.id, "Submit");
  }
  const page1 = await listReceivingBriefs(p, { limit: "2" });
  assert.equal(page1.items.length, 2);
  assert.equal(page1.total, 4);
  assert.equal(page1.counts.All, 4);
  assert.equal(page1.counts.Awaiting, 3);
  assert.equal(page1.has_more, true);
  const page2 = await listReceivingBriefs(p, {
    limit: "2",
    offset: "2",
    basis: page1.basis,
  });
  assert.equal(page2.total, 4);
  assert.equal(page2.items.length, 2);
  assert.equal(page2.has_more, false);
  assert.equal(
    new Set([...page1.items, ...page2.items].map((r) => r.id)).size,
    4,
  );
  const filtered = await listReceivingBriefs(p, {
    q: "Paging",
    owner: p.actor_id,
    customer: page1.items[0].customer.id,
    limit: "1",
  });
  assert.equal(filtered.items.length, 1);
  assert.equal(filtered.total, 3);
  assert.equal(filtered.counts.All, 3);
  const empty = await listReceivingBriefs(p, { q: "No such synthetic brief" });
  assert.equal(empty.total, 0);
  assert.equal(empty.counts.All, 0);
  await action(page1.items[0].id, "Clarify");
  await assert.rejects(
    listReceivingBriefs(p, { limit: "2", offset: "2", basis: page1.basis }),
    code("ReceivingQueueChanged"),
  );
  const current = (await listReceivingBriefs(p)).items[0];
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='estimating.edit'",
    [p.workspace_id, p.actor_id],
  );
  await assert.rejects(listReceivingBriefs(p), code("Forbidden"));
  await assert.rejects(
    readReceivingBrief(p, current.id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    exportReceivingBriefs(p, `${current.id}:${current.token}`),
    code("RecordUnavailable"),
  );
});
