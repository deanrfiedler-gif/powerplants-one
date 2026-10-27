import assert from "node:assert/strict";
import { after, test } from "node:test";
import { migrate, seed } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { readAppointment, recordContact } from "../../src/scheduling/planner";
import { readOperation } from "../../src/shared/receipts";
import { appointmentPreparation } from "../../src/scheduling/site-readiness";
import { readBundle } from "../../src/documents/worker";
import { readPack } from "../../src/documents/packs";
import { issued, rows, base, id } from "../helpers/packs";
import { recoverSchema } from "../helpers/recover-schema";
import { randomUUID } from "node:crypto";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable database only");
after(closeDatabase);
for (const through of [117, 118, 119])
  test(`0120 from ${through} preserves populated contacts, original operations, policy pins and issued bytes; seed replay is inert`, async () => {
    await recoverSchema();
    await rows("DROP TABLE IF EXISTS public.ppo_migrations");
    await migrate(through);
    await seed(through);
    const f = await issued(),
      a = (await readAppointment(f.p, f.pack.appointment_id)).items[0];
    const cmd = {
      ...base(),
      id: randomUUID(),
      expected_version: a.version,
      recipient_id: id("60"),
      channel: "Simulated",
      outcome: "Confirmed",
      occurred_at: new Date().toISOString(),
      notes: "SYN original date agreement without purpose",
    };
    const original = await recordContact(f.p, a.id, cmd);
    const tables = [
      "appointments",
      "appointment_revisions",
      "scope_revisions",
      "policy_versions",
      "policy_criteria",
      "scheduling_policies",
      "scheduling_policy_members",
      "scheduling_policy_heads",
      "scheduling_policy_publications",
      "pack_revisions",
      "pack_issues",
      "pack_acknowledgements",
      "operation_receipts",
      "permission_grants",
      "users",
      "business_identities",
    ];
    // Snapshot actual complete rows, retaining every original hash, reference and pin.
    const before = new Map<string, Record<string, unknown>[]>();
    for (const table of tables)
      before.set(
        table,
        await rows(
          `SELECT to_jsonb(x) AS row FROM ppo.${table} x ORDER BY to_jsonb(x)::text`,
        ),
      );
    const contacts = await rows(
        "SELECT * FROM ppo.contact_outcomes ORDER BY id",
      ),
      ledger = await rows(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      ),
      receipts = await rows("SELECT * FROM ppo.seed_receipts ORDER BY version");
    const bytes = await readBundle(f.p, f.pack.issues[0].manifest);
    await migrate();
    await seed();
    for (const table of tables) {
      let current = await rows(
        `SELECT to_jsonb(x) AS row FROM ppo.${table} x ORDER BY to_jsonb(x)::text`,
      );
      if (table === "policy_versions")
        current = current.filter(
          (r) => r.row.id !== "94000000-0000-4000-8000-000000000003",
        );
      if (table === "policy_criteria")
        current = current.filter(
          (r) =>
            r.row.policy_version_id !== "94000000-0000-4000-8000-000000000003",
        );
      assert.deepEqual(current, before.get(table), table);
    }
    assert.deepEqual(
      await rows("SELECT * FROM ppo.contact_outcomes ORDER BY id"),
      contacts.map((r) => ({
        ...r,
        purpose: "DateAgreement",
        site_checks: null,
      })),
    );
    assert.deepEqual(
      await rows(
        `SELECT * FROM public.ppo_migrations WHERE version<=${through} ORDER BY version`,
      ),
      ledger,
    );
    assert.deepEqual(
      await rows(
        `SELECT version FROM public.ppo_migrations WHERE version>${through} ORDER BY version`,
      ),
      through === 117
        ? [{ version: 118 }, { version: 119 }, { version: 120 }]
        : through === 118 ? [{ version: 119 }, { version: 120 }] : [{ version: 120 }],
    );
    assert.deepEqual(
      await rows(
        "SELECT * FROM ppo.seed_receipts WHERE version<=117 ORDER BY version",
      ),
      receipts,
    );
    assert.deepEqual(
      await rows(
        "SELECT version FROM ppo.seed_receipts WHERE version>117 ORDER BY version",
      ),
      [{ version: 120 }],
    );
    assert.equal(
      await appointmentPreparation(database(), f.p.workspace_id, a.id),
      null,
    );
    assert.deepEqual(
      (await recordContact(f.p, a.id, cmd)).receipt,
      original.receipt,
    );
    assert.deepEqual(
      await readOperation(f.p, cmd.operation_id),
      original.receipt,
    );
    assert.deepEqual(await readBundle(f.p, f.pack.issues[0].manifest), bytes);
    assert.equal(
      (await readPack(f.p, f.pack.id)).items[0].issues[0].output_hash,
      f.pack.issues[0].output_hash,
    );
    const complete = await rows(
        "SELECT * FROM ppo.seed_receipts ORDER BY version",
      ),
      policies = await rows(
        "SELECT * FROM ppo.scheduling_preparation_policies ORDER BY id",
      );
    await migrate();
    await seed();
    assert.deepEqual(
      await rows("SELECT * FROM ppo.seed_receipts ORDER BY version"),
      complete,
    );
    assert.deepEqual(
      await rows(
        "SELECT * FROM ppo.scheduling_preparation_policies ORDER BY id",
      ),
      policies,
    );
  });
