import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  confirmCustomerMessage,
  customerCommunicationQueue,
  readCustomerCommunication,
  readMessageClassSwitches,
  reconcileCustomerMessage,
  recordNoticePreference,
  runCustomerMessageJobs,
  setMessageClassSwitch,
  withdrawCustomerMessage,
} from "../../src/communications";
import { base, grant } from "../helpers/customer-communications";
import {
  delivery,
  moved,
  readyDemand,
  setupNotices,
} from "../helpers/customer-delivery";
import { principal } from "../helpers/packs";
import { CRM } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
test("EC-04 native M1/M2 projection, exact actions, held/unknown/failed states and all-view authorization stay synthetic", async () => {
  const originalFetch = globalThis.fetch;
  let externalCalls = 0;
  globalThis.fetch = async () => {
    externalCalls++;
    throw Error("No provider/network call is allowed in this native proof");
  };
  try {
    const { actor } = await setupNotices();
    const d = await readyDemand(actor),
      prepared = await moved(actor, d.id);
    const id = prepared.communication_id!;
    const detail = await readCustomerCommunication(actor, id);
    assert.equal(detail.actions.confirm, true);
    assert.equal(detail.current_hold, null);
    assert.equal(detail.sender.name, actor.display_name);
    assert.equal(detail.facts["dispatch.quantity"], "4");
    assert.equal(detail.customer_name, detail.facts["customer.name"]);
    const original = {
      ...base(),
      expected_version: detail.version,
      content_hash: detail.content_hash,
    };
    const confirmed = await confirmCustomerMessage(actor, id, original);
    assert.deepEqual(
      (await confirmCustomerMessage(actor, id, original)).receipt,
      confirmed.receipt,
    );
    await runCustomerMessageJobs();
    assert.equal((await readCustomerCommunication(actor, id)).state, "Sent");
    assert.ok(
      !(await customerCommunicationQueue(actor, {})).items.some(
        (m) => m.id === id,
      ),
    );
    assert.ok(
      (await customerCommunicationQueue(actor, { view: "all" })).items.some(
        (m) => m.id === id,
      ),
    );
    await delivery(actor, d.id, d.person, "2026-11-06", "SYN-DLR-000001");
    const delay = (
      await customerCommunicationQueue(actor, { view: "all" })
    ).items.find((m) => m.message_class === "DelayNotice")!;
    assert.ok(delay);
    const dm = await readCustomerCommunication(actor, delay.id);
    assert.equal(dm.facts["delay.previous_eta"], "2026-11-03");
    await withdrawCustomerMessage(actor, dm.id, {
      ...base(),
      expected_version: dm.version,
    });
    assert.equal(
      (await readCustomerCommunication(actor, dm.id)).actions.confirm,
      false,
    );
    for (const [tag, expected] of [
      ["bounce", "Failed"],
      ["lost-response", "OutcomeUnknown"],
    ] as const) {
      const next = await readyDemand(actor, `ec04+${tag}@example.invalid`),
        draft = await moved(actor, next.id);
      const message = await readCustomerCommunication(
        actor,
        draft.communication_id!,
      );
      await confirmCustomerMessage(actor, message.id, {
        ...base(),
        expected_version: message.version,
        content_hash: message.content_hash,
      });
      await runCustomerMessageJobs();
      const outcome = await readCustomerCommunication(actor, message.id);
      assert.equal(outcome.state, expected);
      assert.equal(outcome.actions.confirm, false);
      assert.equal(outcome.actions.reconcile, expected === "OutcomeUnknown");
      if (expected === "OutcomeUnknown") {
        await reconcileCustomerMessage(actor, outcome.id, {
          ...base(),
          expected_version: outcome.version,
        });
        assert.equal(
          (await readCustomerCommunication(actor, outcome.id)).state,
          "Sent",
        );
      }
    }
    const quiet = await readyDemand(actor, "ec04.quiet@example.invalid");
    await recordNoticePreference(actor, quiet.person, {
      ...base(),
      company_id: CRM.company,
      message_class: "DispatchNotice",
      expected_version: 0,
      preference: "DoNotNotify",
    });
    const held = await moved(actor, quiet.id),
      hm = await readCustomerCommunication(actor, held.communication_id!);
    assert.equal(hm.hold_reason, "DoNotNotify");
    assert.equal(hm.actions.confirm, false);
    assert.ok(hm.body);
    assert.ok(hm.follow_up);
    const next = await readyDemand(actor, "ec04.denial@example.invalid"),
      draft = await moved(actor, next.id);
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='customer_message.send'",
      [actor.actor_id],
    );
    const denied = await readCustomerCommunication(
      actor,
      draft.communication_id!,
    );
    assert.equal(denied.actions.confirm, false);
    assert.equal(denied.actions.duty, false);
    await assert.rejects(
      confirmCustomerMessage(actor, denied.id, {
        ...base(),
        expected_version: denied.version,
        content_hash: denied.content_hash,
      }),
      { code: "RecordUnavailable" },
    );
    const outsider = await principal("other-workspace");
    assert.equal(
      (await customerCommunicationQueue(outsider, { view: "all" })).items
        .length,
      0,
    );
    await assert.rejects(readCustomerCommunication(outsider, id), {
      code: "RecordUnavailable",
    });
    await grant(actor, ["customer_message.send"]);
    await assert.rejects(
      confirmCustomerMessage(actor, denied.id, {
        ...base(),
        expected_version: denied.version + 1,
        content_hash: denied.content_hash,
      }),
      { code: "VersionConflict" },
    );
    const sw = await readMessageClassSwitches(actor, {
      company_id: CRM.company,
    });
    assert.equal(sw.can_switch, true);
    const v = sw.classes.find(
      (c) => c.message_class === "DelayNotice",
    )!.version;
    await assert.rejects(
      setMessageClassSwitch(actor, {
        ...base(""),
        company_id: CRM.company,
        message_class: "DelayNotice",
        mode: "Off",
        expected_version: v,
      }),
      { code: "InvalidData" },
    );
    await setMessageClassSwitch(actor, {
      ...base("SYN operator holds delay notices"),
      company_id: CRM.company,
      message_class: "DelayNotice",
      mode: "Off",
      expected_version: v,
    });
    assert.equal(
      (
        await readMessageClassSwitches(actor, { company_id: CRM.company })
      ).classes.find((c) => c.message_class === "DelayNotice")!.reason,
      "SYN operator holds delay notices",
    );
    assert.equal(externalCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
