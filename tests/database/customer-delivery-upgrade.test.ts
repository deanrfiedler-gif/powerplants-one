import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFile } from "node:fs/promises";
import { migrate, seed } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { recordFact } from "../../src/supply/commands";
import { recover } from "../../src/supply/reads";
import { recoverSchema } from "../helpers/recover-schema";
import { principal, rows } from "../helpers/packs";
import {
  grant,
  contact,
  publishTemplate,
  switchOn,
  prepare,
  testSource,
  message,
} from "../helpers/customer-communications";
import {
  newDemand,
  fact,
  recordVersion,
  send,
} from "../helpers/customer-delivery";
import { customerDeliveryBindings } from "../helpers/customer-delivery-contract";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
after(closeDatabase);
const tables = async () =>
  (
    await rows(
      "SELECT tablename FROM pg_tables WHERE schemaname='ppo' ORDER BY tablename",
    )
  ).map((r) => r.tablename as string);
const captureOriginalRows = async (
  names: string[],
): Promise<Record<string, { row: Record<string, unknown> }[]>> =>
  Object.fromEntries(
    await Promise.all(
      names.map(async (name) => [
        name,
        await rows(
          `SELECT to_jsonb(t) AS row FROM ppo.${name} t ORDER BY to_jsonb(t)::text`,
        ),
      ]),
    ),
  );

test("0121 retains populated 0118 native movements, sent bytes, template hashes, grants and original receipts; replay is inert", async () => {
  await recoverSchema();
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(118);
  await seed(118);
  const actor = await principal("coordinator"),
    publisher = await principal("cs-reviewer");
  await grant(actor, [
    "template.read",
    "template.propose",
    "customer_message.send",
    "customer_message.switch",
  ]);
  await grant(publisher, [
    "template.read",
    "template.publish",
    "supply.coordinate",
    "shared.read",
  ]);
  await publishTemplate(actor, publisher, "DispatchNotice");
  await switchOn(actor, "DispatchNotice");
  const id = await newDemand(actor),
    person = await contact("s3.legacy@example.invalid");
  const prepared = await fact(actor, id, "Dispatch", {
    state: "Prepared",
    quantity: "4",
  });
  const movement = await fact(
    actor,
    id,
    "Dispatch",
    { state: "Moved", quantity: "4", movement_at: "2026-10-24T01:00:00.000Z" },
    prepared.cmd.id,
  );
  const legacy = await prepare(
    actor,
    testSource("DispatchNotice", id, person, await recordVersion(id)),
  );
  await send(actor, legacy.id);
  const sent = await message(legacy.id);
  const oldTables = await tables(),
    before = await captureOriginalRows(oldTables);
  const ledger = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  await migrate();
  await seed();
  const afterRows = await captureOriginalRows(oldTables);
  const bindings = afterRows.customer_email_bindings.map((r) => r.row);
  const old = new Set(
    before.customer_email_bindings.map(
      (r) => `${r.row.message_class}:${r.row.binding}`,
    ),
  );
  assert.deepEqual(
    afterRows.customer_email_bindings.filter((r) =>
      old.has(`${r.row.message_class}:${r.row.binding}`),
    ),
    before.customer_email_bindings,
  );
  const shape = (rs: Record<string, unknown>[]) =>
    rs
      .map((r) => `${r.message_class}:${r.binding}`)
      .sort(new Intl.Collator("en").compare);
  assert.deepEqual(
    shape(bindings.filter((r) => !old.has(`${r.message_class}:${r.binding}`))),
    shape(customerDeliveryBindings),
  );
  assert.deepEqual(
    afterRows.seed_receipts.filter(
      (r) => ![120, 121].includes(Number(r.row.version)),
    ),
    before.seed_receipts,
  );
  assert.deepEqual(
    afterRows.seed_receipts
      .filter((r) => [120, 121].includes(Number(r.row.version)))
      .map((r) => r.row.version),
    [120, 121],
  );
  const readinessV3 = "94000000-0000-4000-8000-000000000003";
  assert.equal(
    afterRows.policy_versions.filter((r) => r.row.id === readinessV3).length,
    1,
  );
  assert.equal(
    afterRows.policy_criteria.filter(
      (r) => r.row.policy_version_id === readinessV3,
    ).length,
    10,
  );
  assert.deepEqual(
    afterRows.contact_outcomes,
    before.contact_outcomes.map(({ row }) => ({
      row: { ...row, purpose: "DateAgreement", site_checks: null },
    })),
  );
  // 0122 gives every existing work order an unset typed project link and changes nothing else.
  assert.deepEqual(
    afterRows.work_orders,
    before.work_orders.map(({ row }) => ({ row: { ...row, project_id: null } })),
  );
  assert.deepEqual(
    {
      ...afterRows,
      work_orders: before.work_orders,
      policy_versions: afterRows.policy_versions.filter(
        (r) => r.row.id !== readinessV3,
      ),
      policy_criteria: afterRows.policy_criteria.filter(
        (r) => r.row.policy_version_id !== readinessV3,
      ),
      contact_outcomes: before.contact_outcomes,
      customer_email_bindings: before.customer_email_bindings,
      seed_receipts: before.seed_receipts,
    },
    before,
  );
  const upgradedLedger = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  assert.deepEqual(
    upgradedLedger.filter((r) => ![119, 120, 121, 122, 123].includes(Number(r.version))),
    ledger,
  );
  assert.deepEqual(
    upgradedLedger
      .filter((r) => [119, 120, 121, 122, 123].includes(Number(r.version)))
      .map((r) => r.version),
    [119, 120, 121, 122, 123],
  );
  for (const name of [
    "supply_customer_delivery_events",
    "supply_dispatch_details",
    "supply_customer_notice_sources",
  ])
    assert.deepEqual(await rows(`SELECT * FROM ppo.${name}`), []);
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.supply_customer_notice_options",
      )
    )[0].n,
    7,
  );
  assert.deepEqual(await message(legacy.id), sent);
  assert.deepEqual(
    (await recordFact(actor, id, movement.cmd)).receipt,
    movement.result.receipt,
  );
  assert.deepEqual(
    await recover(actor, movement.cmd.operation_id),
    movement.result.receipt,
  );
  const complete = await captureOriginalRows(await tables());
  await migrate();
  await seed();
  await database().query(
    await readFile(
      new URL("../../db/seed-customer-delivery-notices.sql", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(await captureOriginalRows(await tables()), complete);
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    upgradedLedger,
  );
});
