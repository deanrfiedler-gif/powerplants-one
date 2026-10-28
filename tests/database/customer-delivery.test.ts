import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { recordFact } from "../../src/supply/commands";
import { recover } from "../../src/supply/reads";
import {
  recordCustomerDelivery,
  readCustomerDelivery,
  prepareSupplyCustomerNotice,
  customerDeliveryOptions,
} from "../../src/supply/customer-delivery";
import {
  confirmCustomerMessage,
  runCustomerMessageJobs,
  withdrawCustomerMessage,
  reconcileCustomerMessage,
  processCustomerMessageJob,
} from "../../src/communications";
import { SyntheticMailboxChannel } from "../../src/adapters/synthetic-mailbox";
import {
  base,
  contact,
  followUps,
  grant,
  latest,
  message,
} from "../helpers/customer-communications";
import {
  details,
  delivery,
  fact,
  moved,
  readyDemand,
  recordVersion,
  send,
  setupNotices,
} from "../helpers/customer-delivery";
import { principal, rows } from "../helpers/packs";
import { CRM } from "../helpers/crm";
import { supplyFact } from "../helpers/supply";
import type { Principal } from "../../src/platform/identity";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
let actor: Principal, publisher: Principal;
const confirm = async (p: Principal, id: string) =>
  confirmCustomerMessage(p, id, {
    ...base(),
    expected_version: (await latest(id)).version,
    content_hash: (await message(id)).content_hash,
  });

test("0121 seeds only seven fictional options; native notices remain Off and sending remains default denied", async () => {
  actor = await principal("coordinator");
  const options = await customerDeliveryOptions(actor, "", {
    company_id: CRM.company,
  });
  assert.equal(options.synthetic, true);
  assert.equal(options.options.length, 7);
  assert.deepEqual(
    await rows(
      "SELECT * FROM ppo.permission_grants WHERE capability LIKE 'customer_message.%'",
    ),
    [],
  );
  const ready = await readyDemand(actor);
  const movement = await moved(actor, ready.id);
  assert.equal(movement.communication_id, undefined);
  assert.equal(
    (
      await rows("SELECT count(*)::int AS n FROM ppo.customer_communications")
    )[0].n,
    0,
  );
  ({ actor, publisher } = await setupNotices());
});

test("native partial dispatch drafts atomically with exact quantities, replay and original-operation recovery", async () => {
  const ready = await readyDemand(actor);
  const first = await moved(actor, ready.id);
  assert.ok(first.communication_id);
  const m = await message(first.communication_id);
  assert.equal(m.facts["dispatch.quantity"], "4");
  assert.equal(m.facts["dispatch.outstanding_quantity"], "6");
  assert.equal(m.facts["dispatch.carrier"], "Synthetic Orchard Freight");
  assert.match(m.body, /https:\/\/tracking.example\//);
  assert.doesNotMatch(m.body, /internal explanation|retained observation/);
  assert.equal((await latest(m.id)).state, "Prepared");
  assert.deepEqual(
    (await recordFact(actor, ready.id, first.cmd)).receipt,
    first.result.receipt,
  );
  assert.deepEqual(
    await recover(actor, first.cmd.operation_id),
    first.result.receipt,
  );
  assert.equal((await readCustomerDelivery(actor, ready.id)).notices.length, 1);
  await assert.rejects(
    recordFact(actor, ready.id, {
      ...first.cmd,
      dispatch_notice: { ...details, tracking_number: "CHANGED" },
    }),
    { code: "OperationConflict" },
  );
  await send(actor, m.id);
  assert.equal((await latest(m.id)).state, "Sent");
  const second = await moved(actor, ready.id, "6");
  const secondMessage = await message(second.communication_id!);
  assert.equal(secondMessage.correction, false);
  assert.equal(secondMessage.facts["dispatch.dispatched_quantity"], "10");
  assert.equal(secondMessage.facts["dispatch.outstanding_quantity"], "0");
  assert.deepEqual(await message(m.id), m);
  await assert.rejects(
    prepareSupplyCustomerNotice(actor, ready.id, {
      ...base(),
      expected_version: await recordVersion(ready.id),
      dispatch_fact_id: first.cmd.id,
    }),
    { code: "MessageAlreadyPrepared" },
  );
});

test("delay uses the last ETA actually sent to this contact; supplier facts never choose the customer date", async () => {
  const ready = await readyDemand(actor);
  await delivery(actor, ready.id, ready.person, "2026-11-04", "SYN-DLR-000001");
  assert.equal((await readCustomerDelivery(actor, ready.id)).notices.length, 0);
  const movement = await moved(actor, ready.id);
  await confirm(actor, movement.communication_id!);
  await delivery(actor, ready.id, ready.person, "2026-11-05", "SYN-DLR-000001");
  assert.equal(
    (await readCustomerDelivery(actor, ready.id)).notices.length,
    1,
    "Queued is not sent",
  );
  await runCustomerMessageJobs(100);
  assert.equal(
    (await latest(movement.communication_id!)).hold_reason,
    "SourceChanged",
  );
  await withdrawCustomerMessage(actor, movement.communication_id!, {
    ...base(),
    expected_version: (await latest(movement.communication_id!)).version,
  });
  await prepareSupplyCustomerNotice(actor, ready.id, {
    ...base(),
    expected_version: await recordVersion(ready.id),
    dispatch_fact_id: movement.cmd.id,
  });
  const current = (await readCustomerDelivery(actor, ready.id)).notices.at(
    -1,
  )!.communication_id;
  await send(actor, current);
  const before = (
    await rows("SELECT data FROM ppo.supply_records WHERE id=$1", [ready.id])
  )[0].data;
  await delivery(actor, ready.id, ready.person, "2026-11-07", "SYN-DLR-000002");
  const view = await readCustomerDelivery(actor, ready.id),
    delayId = view.notices.at(-1)!.communication_id;
  const delay = await message(delayId);
  assert.equal(delay.message_class, "DelayNotice");
  assert.equal(delay.facts["delay.previous_eta"], "2026-11-05");
  assert.equal(delay.facts["delivery.customer_eta"], "2026-11-07");
  assert.equal(
    delay.facts["delay.reason"],
    "Additional preparation is required before dispatch.",
  );
  assert.equal(view.last_sent_eta?.id, current);
  assert.deepEqual(
    (
      await rows("SELECT data FROM ppo.supply_records WHERE id=$1", [ready.id])
    )[0].data,
    before,
  );
  await send(actor, delayId);
  assert.equal((await latest(delayId)).state, "Sent");
  const other = await contact("s3.new-contact@example.invalid");
  await delivery(actor, ready.id, other, "2026-11-09", "SYN-DLR-000001");
  assert.equal(
    (await readCustomerDelivery(actor, ready.id)).notices.length,
    view.notices.length,
    "another contact has no sent baseline",
  );
});

test("named role changes and revoked sender authority hold before any handover with one owned follow-up", async () => {
  const ready = await readyDemand(actor),
    movement = await moved(actor, ready.id);
  const other = await contact("s3.replacement@example.invalid");
  await delivery(actor, ready.id, other, "2026-11-03");
  const held = await confirm(actor, movement.communication_id!);
  assert.equal(held.receipt.state, "Held");
  assert.equal(
    (await latest(movement.communication_id!)).hold_reason,
    "RecipientChanged",
  );
  assert.equal((await followUps(movement.communication_id!)).length, 1);
  const fresh = await readyDemand(actor),
    queued = await moved(actor, fresh.id);
  await confirm(publisher, queued.communication_id!);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='customer_message.send'",
    [publisher.actor_id],
  );
  await runCustomerMessageJobs(100);
  assert.equal(
    (await latest(queued.communication_id!)).hold_reason,
    "SenderUnauthorised",
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.synthetic_mailbox_messages WHERE communication_id=$1",
        [queued.communication_id],
      )
    )[0].n,
    0,
  );
  await grant(publisher, ["customer_message.send"]);
});

test("current-authority refusal applies to replay/recovery; duplicate concurrent commands create one evidence row", async () => {
  const ready = await readyDemand(actor);
  const cmd = {
    ...base(),
    expected_version: await recordVersion(ready.id),
    contact_id: ready.person,
    customer_eta: "2026-11-04",
    delay_reason_code: null,
  };
  const [a, b] = await Promise.all([
    recordCustomerDelivery(actor, ready.id, cmd),
    recordCustomerDelivery(actor, ready.id, cmd),
  ]);
  assert.deepEqual(a.receipt, b.receipt);
  assert.notEqual(a.replayed, b.replayed);
  assert.deepEqual(await recover(actor, cmd.operation_id), a.receipt);
  await assert.rejects(
    recordCustomerDelivery(actor, ready.id, {
      ...cmd,
      customer_eta: "2026-11-05",
    }),
    { code: "OperationConflict" },
  );
  await assert.rejects(
    recordCustomerDelivery(actor, ready.id, { ...cmd, ...base() }),
    { code: "VersionConflict" },
  );
  for (const profile of ["observer", "second-company", "other-workspace"]) {
    const other = await principal(profile);
    await assert.rejects(
      recordCustomerDelivery(other, ready.id, { ...cmd, ...base() }),
    );
    await assert.rejects(recover(other, cmd.operation_id));
    if (profile !== "observer")
      await assert.rejects(readCustomerDelivery(other, ready.id));
  }
  const grants = await rows(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='supply.coordinate' RETURNING *",
    [actor.actor_id],
  );
  await assert.rejects(recordCustomerDelivery(actor, ready.id, cmd));
  await assert.rejects(recover(actor, cmd.operation_id));
  for (const g of grants) {
    const keys = Object.keys(g);
    await database().query(
      `INSERT INTO ppo.permission_grants(${keys.join(",")}) VALUES(${keys.map((_, i) => `$${i + 1}`).join(",")})`,
      Object.values(g),
    );
  }
});

test("unknown outcomes reconcile without duplicate delivery; sent movement corrections preserve original bytes", async () => {
  const ready = await readyDemand(actor, "s3+lost-response@example.invalid"),
    movement = await moved(actor, ready.id);
  await send(actor, movement.communication_id!);
  assert.equal(
    (await latest(movement.communication_id!)).state,
    "OutcomeUnknown",
  );
  await runCustomerMessageJobs(100);
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.synthetic_mailbox_messages WHERE communication_id=$1",
        [movement.communication_id],
      )
    )[0].n,
    1,
  );
  await reconcileCustomerMessage(actor, movement.communication_id!, {
    ...base(),
    expected_version: (await latest(movement.communication_id!)).version,
  });
  const original = await message(movement.communication_id!);
  const correction = await fact(
    actor,
    ready.id,
    "Dispatch",
    { state: "Moved", quantity: "4", movement_at: "2026-10-24T03:00:00.000Z" },
    movement.cmd.id,
    { ...details, tracking_number: "SYN-CORRECTED-000001" },
  );
  const view = await readCustomerDelivery(actor, ready.id),
    corrected = await message(
      view.notices.find((n) => n.dispatch_fact_id === correction.cmd.id)!
        .communication_id,
    );
  assert.equal(corrected.correction, true);
  assert.equal(corrected.supersedes_id, original.id);
  assert.match(corrected.subject, /Correction/);
  assert.deepEqual(await message(original.id), original);
  for (const table of [
    "supply_customer_delivery_events",
    "supply_dispatch_details",
    "supply_customer_notice_sources",
  ])
    await assert.rejects(
      database().query(`DELETE FROM ppo.${table} WHERE demand_id=$1`, [
        ready.id,
      ]),
      { code: "55000" },
    );
  await assert.rejects(
    database().query(
      "UPDATE ppo.supply_customer_notice_options SET label='Changed' WHERE code='SYN-CAR-000001'",
    ),
    { code: "55000" },
  );
});

test("missing typed dispatch details hold even when omitted by the template; invalid catalogue rolls back native movement", async () => {
  await setupNotices(true, false);
  const ready = await readyDemand(actor);
  const prepared = await fact(actor, ready.id, "Dispatch", {
    state: "Prepared",
    quantity: "4",
  });
  const cmd = {
    ...supplyFact("Dispatch", await recordVersion(ready.id), {
      state: "Moved",
      quantity: "4",
      movement_at: "2026-10-24T02:00:00.000Z",
    }),
    predecessor_id: prepared.cmd.id,
    dispatch_notice: { ...details, carrier_code: "SYN-CAR-999999" },
  };
  const before = await rows("SELECT * FROM ppo.supply_records WHERE id=$1", [
    ready.id,
  ]);
  await assert.rejects(recordFact(actor, ready.id, cmd), {
    code: "UnknownSyntheticOption",
  });
  assert.deepEqual(
    await rows("SELECT * FROM ppo.supply_records WHERE id=$1", [ready.id]),
    before,
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.supply_facts WHERE id=$1", [cmd.id]),
    [],
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.operation_receipts WHERE operation_id=$1", [
      cmd.operation_id,
    ]),
    [],
  );
  const missing: Omit<typeof cmd, "dispatch_notice"> & {
    dispatch_notice?: typeof cmd.dispatch_notice;
  } = { ...cmd };
  delete missing.dispatch_notice;
  await recordFact(actor, ready.id, missing);
  const id = (await readCustomerDelivery(actor, ready.id)).notices[0]
    .communication_id;
  assert.equal((await latest(id)).state, "Held");
  assert.equal((await latest(id)).hold_reason, "MissingData");
  assert.equal((await followUps(id)).length, 1);
  await runCustomerMessageJobs(100);
  assert.deepEqual(
    await rows(
      "SELECT * FROM ppo.synthetic_mailbox_messages WHERE communication_id=$1",
      [id],
    ),
    [],
  );
  await setupNotices();
});

test("an unresolved earlier dispatch outcome holds a correction until reconciliation and deliberate re-preparation", async () => {
  const ready = await readyDemand(
    actor,
    "s3.correction+lost-response@example.invalid",
  );
  const movement = await moved(actor, ready.id);
  await send(actor, movement.communication_id!);
  assert.equal(
    (await latest(movement.communication_id!)).state,
    "OutcomeUnknown",
  );
  const corrected = await fact(
    actor,
    ready.id,
    "Dispatch",
    { state: "Moved", quantity: "4", movement_at: "2026-10-24T03:00:00.000Z" },
    movement.cmd.id,
    { ...details, tracking_number: "SYN FIX/000002" },
  );
  const heldId = (await readCustomerDelivery(actor, ready.id)).notices.find(
    (n) => n.dispatch_fact_id === corrected.cmd.id,
  )!.communication_id;
  assert.equal((await latest(heldId)).hold_reason, "PriorOutcomeUnknown");
  assert.equal((await followUps(heldId)).length, 1);
  await reconcileCustomerMessage(actor, movement.communication_id!, {
    ...base(),
    expected_version: (await latest(movement.communication_id!)).version,
  });
  await withdrawCustomerMessage(actor, heldId, {
    ...base(),
    expected_version: (await latest(heldId)).version,
  });
  await prepareSupplyCustomerNotice(actor, ready.id, {
    ...base(),
    expected_version: await recordVersion(ready.id),
    dispatch_fact_id: corrected.cmd.id,
  });
  const successor = (await readCustomerDelivery(actor, ready.id)).notices.at(
    -1,
  )!.communication_id;
  assert.equal((await latest(successor)).state, "Prepared");
  assert.equal(
    (await message(successor)).supersedes_id,
    movement.communication_id,
  );
  assert.match((await message(successor)).body, /SYN%20FIX%2F000002/);
  assert.deepEqual(
    await rows(
      "SELECT * FROM ppo.synthetic_mailbox_messages WHERE communication_id=$1",
      [heldId],
    ),
    [],
  );
});

test("a correction recorded during claimed hand-over stays held until the original is resolved and a correction is prepared", async () => {
  const ready = await readyDemand(actor);
  const first = await moved(actor, ready.id);
  await confirm(actor, first.communication_id!);
  const [job] = await rows(
    "SELECT id FROM ppo.outbox_jobs WHERE kind='CustomerMessageConfirmed' AND payload->>'record_id'=$1",
    [first.communication_id],
  );
  const mailbox = new SyntheticMailboxChannel();
  let corrected: Awaited<ReturnType<typeof fact>> | undefined;
  await processCustomerMessageJob(String(job.id), {
    name: "Synthetic",
    async submit(outbound) {
      // The claim has committed, but the provider result is not yet recorded.
      corrected = await fact(
        actor,
        ready.id,
        "Dispatch",
        {
          state: "Moved",
          quantity: "4",
          movement_at: "2026-10-24T03:00:00.000Z",
        },
        first.cmd.id,
        { ...details, tracking_number: "SYN-RACE-000002" },
      );
      return mailbox.submit(outbound);
    },
    observe: (workspace, id) => mailbox.observe(workspace, id),
  });
  assert.ok(corrected, "the native correction committed during hand-over");
  const heldId = (await readCustomerDelivery(actor, ready.id)).notices.find(
    (n) => n.dispatch_fact_id === corrected!.cmd.id,
  )!.communication_id;
  assert.equal((await latest(heldId)).state, "Held");
  assert.equal((await latest(heldId)).hold_reason, "PriorOutcomeUnknown");
  assert.equal((await followUps(heldId)).length, 1);
  await runCustomerMessageJobs(100);
  assert.equal((await latest(first.communication_id!)).state, "Sent");
  await assert.rejects(confirm(actor, heldId), { code: "MessageNotPrepared" });
  assert.deepEqual(
    await rows(
      "SELECT communication_id FROM ppo.synthetic_mailbox_messages WHERE communication_id=$1",
      [heldId],
    ),
    [],
  );
  await withdrawCustomerMessage(actor, heldId, {
    ...base(),
    expected_version: (await latest(heldId)).version,
  });
  await prepareSupplyCustomerNotice(actor, ready.id, {
    ...base(),
    expected_version: await recordVersion(ready.id),
    dispatch_fact_id: corrected.cmd.id,
  });
  const successor = (await readCustomerDelivery(actor, ready.id)).notices.at(
    -1,
  )!.communication_id;
  assert.equal((await message(successor)).correction, true);
  assert.equal(
    (await message(successor)).supersedes_id,
    first.communication_id,
  );
  assert.match((await message(successor)).subject, /Correction/);
  await send(actor, successor);
  assert.equal((await latest(successor)).state, "Sent");
  const copies = await rows(
    "SELECT communication_id FROM ppo.synthetic_mailbox_messages WHERE communication_id=ANY($1::uuid[]) ORDER BY communication_id",
    [[first.communication_id, heldId, successor]],
  );
  assert.deepEqual(
    copies.map((r) => r.communication_id).sort(),
    [first.communication_id, successor].sort(),
  );
});

for (const unavailableOwner of [
  "Inactive",
  "activity.read",
  "shared.read",
] as const) {
  test(`native dispatch and ETA survive ${unavailableOwner} owner setup and recover only by explicit preparation`, async () => {
    const owner = {
      ...actor,
      actor_id: randomUUID(),
      display_name: "SYN notice recovery owner",
    };
    await database().query(
      "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-LocalSynthetic',$4,$3)",
      [owner.actor_id, owner.workspace_id, owner.display_name, owner.actor_id],
    );
    await grant(owner, ["activity.read", "shared.read"]);
    const dispatch = await readyDemand(actor),
      eta = await readyDemand(actor);
    const baseline = await moved(actor, eta.id);
    await send(actor, baseline.communication_id!);
    assert.equal((await latest(baseline.communication_id!)).state, "Sent");
    // Fixture ownership changes still retain the exact native revision sequence.
    await database().query(
      "UPDATE ppo.supply_records SET owner_id=$1,version=version+1 WHERE workspace_id=$2 AND id=ANY($3::uuid[])",
      [owner.actor_id, owner.workspace_id, [dispatch.id, eta.id]],
    );
    if (unavailableOwner === "Inactive")
      await database().query("UPDATE ppo.users SET active=false WHERE id=$1", [
        owner.actor_id,
      ]);
    else
      await database().query(
        "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability=$2",
        [owner.actor_id, unavailableOwner],
      );

    const movement = await moved(actor, dispatch.id);
    const changed = await delivery(
      actor,
      eta.id,
      eta.person,
      "2026-11-08",
      "SYN-DLR-000001",
    );
    assert.equal(movement.communication_id, undefined);
    assert.equal(
      (await readCustomerDelivery(actor, dispatch.id)).notices.length,
      0,
    );
    const etaView = await readCustomerDelivery(actor, eta.id);
    assert.equal(etaView.notices.length, 1);
    assert.equal(etaView.current?.customer_eta, "2026-11-08");
    assert.equal(
      (
        await rows(
          "SELECT data->>'state' AS state FROM ppo.supply_facts WHERE id=$1",
          [movement.cmd.id],
        )
      )[0].state,
      "Moved",
    );
    for (const operation of [
      movement.cmd.operation_id,
      changed.cmd.operation_id,
    ]) {
      const [audit] = await rows(
        "SELECT details FROM ppo.audit_events WHERE operation_id=$1",
        [operation],
      );
      assert.equal(audit.details.communication_id, null);
      assert.equal(audit.details.notice_outcome, "NotPrepared");
      assert.equal(audit.details.notice_reason, "OwnerUnavailable");
    }
    const recoverCommand = {
      ...base(),
      expected_version: await recordVersion(dispatch.id),
      dispatch_fact_id: movement.cmd.id,
    };
    await assert.rejects(
      prepareSupplyCustomerNotice(actor, dispatch.id, recoverCommand),
      { code: "NoticeOwnerUnavailable" },
    );
    await database().query("UPDATE ppo.users SET active=true WHERE id=$1", [
      owner.actor_id,
    ]);
    await grant(owner, ["activity.read", "shared.read"]);
    assert.deepEqual(
      (await recordFact(actor, dispatch.id, movement.cmd)).receipt,
      movement.result.receipt,
    );
    assert.deepEqual(
      (await recordCustomerDelivery(actor, eta.id, changed.cmd)).receipt,
      changed.result.receipt,
    );
    assert.deepEqual(
      await recover(actor, movement.cmd.operation_id),
      movement.result.receipt,
    );
    assert.equal(
      (await readCustomerDelivery(actor, dispatch.id)).notices.length,
      0,
    );
    assert.equal((await readCustomerDelivery(actor, eta.id)).notices.length, 1);
    await prepareSupplyCustomerNotice(actor, dispatch.id, recoverCommand);
    await prepareSupplyCustomerNotice(actor, eta.id, {
      ...base(),
      expected_version: await recordVersion(eta.id),
    });
    for (const id of [dispatch.id, eta.id]) {
      const notice = (await readCustomerDelivery(actor, id)).notices.at(
        -1,
      )!.communication_id;
      assert.equal((await message(notice)).owner_id, owner.actor_id);
      assert.equal((await latest(notice)).state, "Prepared");
      await send(actor, notice);
      assert.equal((await latest(notice)).state, "Sent");
    }
  });
}

test("an ETA that was not rendered is not a sent baseline; missing delivery contact is held without guessing", async () => {
  await setupNotices(false);
  const ready = await readyDemand(actor);
  const movement = await moved(actor, ready.id);
  await send(actor, movement.communication_id!);
  assert.equal((await latest(movement.communication_id!)).state, "Sent");
  assert.equal(
    (await readCustomerDelivery(actor, ready.id)).last_sent_eta,
    null,
  );
  await delivery(actor, ready.id, ready.person, "2026-11-08", "SYN-DLR-000001");
  assert.equal((await readCustomerDelivery(actor, ready.id)).notices.length, 1);
  const unnamed = await readyDemand(actor);
  await delivery(actor, unnamed.id, null, "2026-11-03");
  const held = await moved(actor, unnamed.id);
  assert.equal(
    (await latest(held.communication_id!)).hold_reason,
    "NoRecipient",
  );
  assert.equal((await message(held.communication_id!)).recipient_address, null);
  assert.equal((await followUps(held.communication_id!)).length, 1);
  await setupNotices();
});
