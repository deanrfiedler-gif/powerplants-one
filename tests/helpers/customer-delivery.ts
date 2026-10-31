import { randomUUID } from "node:crypto";
import type { Principal } from "../../src/platform/identity";
import { database } from "../../src/platform/database";
import { saveRecord, allocate, recordFact } from "../../src/supply/commands";
import {
  recordCustomerDelivery,
  readCustomerDelivery,
} from "../../src/supply/customer-delivery";
import {
  proposeCustomerEmailTemplate,
  publishCustomerEmailTemplate,
  confirmCustomerMessage,
  runCustomerMessageJobs,
} from "../../src/communications";
import {
  base,
  contact,
  definition,
  grant,
  latest,
  message,
  switchOn,
} from "./customer-communications";
import { supplyFact, supplyInput } from "./supply";
import { principal } from "./packs";
import { CRM } from "./crm";
import type { FactKind, Fields } from "../../src/supply/model";

export const details = {
  carrier_code: "SYN-CAR-000001",
  platform_code: "SYN-PLT-000001",
  tracking_number: "SYN-CONSIGN-000001",
};
let reference = 201;
export async function setupNotices(includeEta = true, includeTracking = true) {
  const actor = await principal("coordinator"),
    publisher = await principal("cs-reviewer");
  await grant(actor, [
    "template.read",
    "template.propose",
    "customer_message.send",
    "customer_message.switch",
    "supply.fulfil",
  ]);
  await grant(publisher, [
    "template.read",
    "template.publish",
    "shared.read",
    "shared.internal.read",
    "supply.read",
    "supply.coordinate",
    "activity.read",
    "customer_message.send",
  ]);
  for (const cls of ["DispatchNotice", "DelayNotice"] as const) {
    const body =
      cls === "DispatchNotice"
        ? [
            "Hello {{recipient.name}},",
            "{{dispatch.quantity}} {{dispatch.unit}} of {{dispatch.item}} moved at {{dispatch.movement_at}}.",
            "{{dispatch.dispatched_quantity}} dispatched; {{dispatch.outstanding_quantity}} outstanding.",
            ...(includeTracking ? ["{{dispatch.carrier}} via {{dispatch.platform}}. Tracking {{dispatch.tracking_number}}: {{dispatch.tracking_url}}"] : []),
            ...(includeEta ? ["Customer ETA {{delivery.customer_eta}}."] : []),
          ]
        : [
            "Hello {{recipient.name}},",
            "Your customer ETA changed from {{delay.previous_eta}} to {{delivery.customer_eta}}.",
            "{{delay.reason}}",
          ];
    const proposed = await proposeCustomerEmailTemplate(actor, {
      ...base(),
      company_id: CRM.company,
      message_class: cls,
      definition: { ...definition(cls), body },
    });
    const hash = (
      await database().query(
        "SELECT definition_hash FROM ppo.customer_email_template_proposals WHERE id=$1",
        [proposed.receipt.record_id],
      )
    ).rows[0].definition_hash;
    await publishCustomerEmailTemplate(publisher, proposed.receipt.record_id, {
      ...base(),
      definition_hash: hash,
      approval_note:
        "SYN customer-safe catalogue wording approved for this proof.",
    });
    const mode = (
      await database().query(
        "SELECT mode FROM ppo.customer_message_switch_events WHERE company_id=$1 AND message_class=$2 ORDER BY version DESC LIMIT 1",
        [CRM.company, cls],
      )
    ).rows[0]?.mode;
    if (mode !== "Synthetic") await switchOn(actor, cls);
  }
  return { actor, publisher };
}
export const recordVersion = async (id: string) =>
  Number(
    (
      await database().query(
        "SELECT version FROM ppo.supply_records WHERE id=$1",
        [id],
      )
    ).rows[0].version,
  );
export async function newDemand(p: Principal) {
  const input = supplyInput("Demand", {
    reference: `SYN-SC-${String(reference++).padStart(6, "0")}`,
  });
  input.data = { ...input.data, customer_id: CRM.org };
  await saveRecord(p, input);
  const stock = supplyInput("Supply", {
    reference: `SYN-SC-${String(reference++).padStart(6, "0")}`,
  });
  await saveRecord(p, stock);
  await allocate(p, {
    ...base(),
    id: randomUUID(),
    expected_version: null,
    demand_id: input.id,
    supply_id: stock.id,
    demand_version: await recordVersion(input.id),
    supply_version: 1,
    quantity: "10",
    unit: "EA",
    basis: "Usable",
  });
  await fact(p, input.id, "Pick", { quantity: "10" });
  await fact(p, input.id, "Stage", { quantity: "10" });
  return input.id;
}
export async function fact(
  p: Principal,
  id: string,
  kind: FactKind,
  data: Fields,
  predecessor_id: string | null = null,
  notice?: typeof details,
) {
  const cmd = {
    ...supplyFact(kind, await recordVersion(id), data),
    predecessor_id,
    ...(notice ? { dispatch_notice: notice } : {}),
  };
  return { cmd, result: await recordFact(p, id, cmd) };
}
export async function delivery(
  p: Principal,
  id: string,
  person: string | null,
  eta: string | null,
  reason: string | null = null,
) {
  const cmd = {
    ...base("SYN internal explanation must never become customer text"),
    expected_version: await recordVersion(id),
    contact_id: person,
    customer_eta: eta,
    delay_reason_code: reason,
  };
  return { cmd, result: await recordCustomerDelivery(p, id, cmd) };
}
export async function readyDemand(
  p: Principal,
  email = "s3.contact@example.invalid",
) {
  const id = await newDemand(p),
    person = await contact(email);
  await delivery(p, id, person, "2026-11-03");
  return { id, person };
}
export async function moved(
  p: Principal,
  id: string,
  amount = "4",
  notice: typeof details | undefined = details,
) {
  const prepared = await fact(p, id, "Dispatch", {
    state: "Prepared",
    quantity: amount,
  });
  const movement = await fact(
    p,
    id,
    "Dispatch",
    {
      state: "Moved",
      quantity: amount,
      movement_at: "2026-10-24T02:00:00.000Z",
    },
    prepared.cmd.id,
    notice,
  );
  const projection = await readCustomerDelivery(p, id);
  return {
    ...movement,
    communication_id: projection.notices.find(
      (n) => n.dispatch_fact_id === movement.cmd.id,
    )?.communication_id as string | undefined,
  };
}
export async function send(p: Principal, id: string) {
  const m = await message(id),
    l = await latest(id);
  await confirmCustomerMessage(p, id, {
    ...base(),
    expected_version: l.version,
    content_hash: m.content_hash,
  });
  await runCustomerMessageJobs(100);
}
