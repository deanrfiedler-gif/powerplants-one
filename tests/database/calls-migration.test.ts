import { customerDeliveryBindings } from "../helpers/customer-delivery-contract";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomBytes, randomUUID } from "node:crypto";
import { migrate, seed } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { recoverSchema } from "../helpers/recover-schema";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
after(closeDatabase);
const rows = async (sql: string, values: unknown[] = []) =>
  (await database().query(sql, values)).rows;
const person = (n: number) => `60000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const snapshot = async (names: string[]) =>
  Object.fromEntries(
    (
      await rows(
        names
          .map(
            (name) =>
              `SELECT '${name}' AS name,coalesce(jsonb_agg(row_to_json(t) ORDER BY row_to_json(t)::text),'[]'::jsonb) AS rows FROM ppo.${name} t`,
          )
          .join(" UNION ALL "),
      )
    ).map((r) => [r.name, r.rows]),
  );
const violates = (code: string) => (e: unknown) => (e as { code?: string }).code === code;

test("0118 upgrades populated 0117 without changing any existing row and keeps each phone as one primary number needing checking", async () => {
  await recoverSchema();
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(117);
  await seed(117);
  await database().query("UPDATE ppo.people SET phone=' 0412 345 678 ' WHERE id=$1", [person(1)]);
  await database().query("UPDATE ppo.people SET phone='   ' WHERE id=$1", [person(2)]);
  const tables = (await rows("SELECT tablename FROM pg_tables WHERE schemaname='ppo' ORDER BY tablename")).map(
    (r) => r.tablename as string,
  );
  const before = await snapshot(tables),
    ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  await migrate();
  await seed();
  const after = await snapshot(tables);
  const readinessV3 = "94000000-0000-4000-8000-000000000003";
  assert.equal(after.policy_versions.filter((r: {id:string}) => r.id === readinessV3).length, 1);
  assert.equal(after.policy_criteria.filter((r: {policy_version_id:string}) => r.policy_version_id === readinessV3).length, 10);
  assert.deepEqual(after.seed_receipts.filter((r: {version:number}) => r.version > 117).map((r: {version:number}) => r.version), [120, 121]);
  after.policy_versions = after.policy_versions.filter((r: {id:string}) => r.id !== readinessV3);
  after.policy_criteria = after.policy_criteria.filter((r: {policy_version_id:string}) => r.policy_version_id !== readinessV3);
  after.seed_receipts = after.seed_receipts.filter((r: {version:number}) => ![120, 121].includes(r.version));
  assert.deepEqual(after.contact_outcomes, before.contact_outcomes.map((r: Record<string,unknown>) => ({...r,purpose:"DateAgreement",site_checks:null})));
  after.contact_outcomes = before.contact_outcomes;
  const oldBindings = new Set(before.customer_email_bindings.map((r: { message_class: string; binding: string }) => `${r.message_class}:${r.binding}`));
  assert.deepEqual(after.customer_email_bindings.filter((r: { message_class: string; binding: string }) => oldBindings.has(`${r.message_class}:${r.binding}`)), before.customer_email_bindings);
  const shape = (rs: { message_class: string; binding: string }[]) => rs.map(r => `${r.message_class}:${r.binding}`).sort(new Intl.Collator("en").compare);
  assert.deepEqual(shape(after.customer_email_bindings.filter((r: { message_class: string; binding: string }) => !oldBindings.has(`${r.message_class}:${r.binding}`))), shape(customerDeliveryBindings));
  after.customer_email_bindings = before.customer_email_bindings;
  assert.deepEqual(after, before);
  const upgraded = await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  assert.deepEqual(upgraded.slice(0, ledger.length), ledger);
  assert.deepEqual(upgraded.slice(ledger.length).map((r) => r.version), [118, 119, 120, 121, 122]);
  assert.deepEqual(
    await rows(
      "SELECT person_id,organisation_id,label,entered,e164,region,needs_checking,is_primary,position,created_by,updated_by FROM ppo.contact_numbers ORDER BY person_id",
    ),
    [
      {
        person_id: person(1),
        organisation_id: null,
        label: "Other",
        entered: "0412 345 678",
        e164: null,
        region: "AU",
        needs_checking: true,
        is_primary: true,
        position: 1,
        created_by: before.people.find((r: { id: string }) => r.id === person(1)).updated_by,
        updated_by: before.people.find((r: { id: string }) => r.id === person(1)).updated_by,
      },
    ],
  );
  for (const table of ["company_phone_settings", "call_events", "call_details"])
    assert.deepEqual(await rows(`SELECT * FROM ppo.${table}`), []);
  await migrate();
  await seed();
  assert.deepEqual(await rows("SELECT * FROM public.ppo_migrations ORDER BY version"), upgraded);
  assert.equal((await rows("SELECT count(*)::int AS n FROM ppo.contact_numbers"))[0].n, 1);
});

test("0118 constraints refuse two primaries, two parties, unread numbers not needing checking, Logged events without an activity, events naming two parties and any change to call details", async () => {
  const [{ workspace_id, created_by }] = await rows("SELECT workspace_id,created_by FROM ppo.people WHERE id=$1", [person(1)]);
  const number = (values: Record<string, unknown>) =>
    database().query(
      "INSERT INTO ppo.contact_numbers(id,workspace_id,person_id,organisation_id,label,entered,e164,region,needs_checking,is_primary,position,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,'AU',$8,$9,$10,$11,$11)",
      [randomUUID(), workspace_id, values.person_id ?? person(1), values.organisation_id ?? null, "Mobile", "0412 345 679", "e164" in values ? values.e164 : "+61412345679", values.needs_checking ?? false, values.is_primary ?? false, values.position ?? 2, created_by],
    );
  await assert.rejects(number({ is_primary: true }), violates("23505"));
  await assert.rejects(number({ position: 1 }), violates("23505"));
  const [{ id: organisation }] = await rows("SELECT id FROM ppo.organisations WHERE workspace_id=$1 LIMIT 1", [workspace_id]);
  await assert.rejects(number({ organisation_id: organisation }), violates("23514"));
  await assert.rejects(number({ e164: null, needs_checking: false }), violates("23514"));
  await number({});
  const event = (state: string) =>
    database().query(
      "INSERT INTO ppo.call_events(id,workspace_id,user_id,source,source_key,direction,number_e164,person_id,started_at,state,resolved_at,resolved_by,created_by) VALUES($1,$2,$3,'ClickToCall',$4,'Outgoing','+61412345679',$5,clock_timestamp(),$6,clock_timestamp(),$3,$3)",
      [randomUUID(), workspace_id, created_by, randomBytes(32).toString("hex"), person(1), state],
    );
  await assert.rejects(event("Logged"), violates("23514"));
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.call_events(id,workspace_id,user_id,source,source_key,direction,number_e164,person_id,organisation_id,started_at,created_by) VALUES($1,$2,$3,'ClickToCall',$4,'Outgoing','+61412345679',$5,$6,clock_timestamp(),$3)",
      [randomUUID(), workspace_id, created_by, randomBytes(32).toString("hex"), person(1), organisation],
    ),
    violates("23514"),
  );
  const [{ id: activity }] = await rows("SELECT id FROM ppo.activities WHERE workspace_id=$1 LIMIT 1", [workspace_id]);
  await database().query(
    "INSERT INTO ppo.call_details(activity_id,workspace_id,direction,result,started_at,created_by) VALUES($1,$2,'Outgoing','NoAnswer',clock_timestamp(),$3)",
    [activity, workspace_id, created_by],
  );
  await assert.rejects(database().query("UPDATE ppo.call_details SET result='Busy' WHERE activity_id=$1", [activity]));
  await assert.rejects(database().query("DELETE FROM ppo.call_details WHERE activity_id=$1", [activity]));
});
