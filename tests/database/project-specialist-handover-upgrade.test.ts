import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFile } from "node:fs/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { migrate, seed } from "../../scripts/database";
import { handoverCommand } from "../../src/engineering/materials/commands";
import { readOperation } from "../../src/shared/receipts";
import {
  publishTemplate,
  readPublication,
} from "../../src/documents/publication/service";
import { reviewedDraft } from "../helpers/template-publication";
import {
  specialistHandoverFixture,
  handoverAction,
} from "../helpers/project-specialist-handover";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
after(closeDatabase);
for (const through of [103, 104])
  test(`PJ06-R2 upgrade from populated ${through} preserves every legacy payload, template publication, hash, grant, receipt and ledger exactly; repeat run adds nothing`, async () => {
    const c = database();
    await c.query(await readFile("db/migrations/0001-recover.sql", "utf8"));
    await c.query("DROP TABLE IF EXISTS public.ppo_migrations");
    await migrate(through);
    await seed(through);
    const publication = await reviewedDraft();
    const published = await publishTemplate(
      publication.publisher,
      publication.input.id,
      publication.command,
    );
    const originalPublication = await readPublication(
      publication.publisher,
      publication.command.id,
    );
    assert.equal(
      JSON.parse(originalPublication.publication.definition).renderer,
      through === 103 ? "DK06-OUT09-1" : "DK06-OUT09-2",
    );
    const f = await specialistHandoverFixture(),
      legacy: Record<string, unknown> = { ...f.prepare };
    delete legacy.specialist;
    const saved = await handoverCommand(f.owner, f.engineering.id, legacy);
    const send = handoverAction({
      action: "send",
      handover_id: legacy.id,
      expected_version: 1,
    });
    await handoverCommand(f.owner, f.engineering.id, send);
    const decide = handoverAction({
      action: "decide",
      handover_id: legacy.id,
      expected_version: 2,
      result: "Accepted",
    });
    const accepted = await handoverCommand(
      f.receiver,
      f.engineering.id,
      decide,
    );
    const tables = [
      "material_handovers",
      "material_events",
      "material_sources",
      "material_releases",
      "material_release_lines",
      "material_lines",
      "project_specialist_packages",
      "project_specialist_events",
      "project_commercial_events",
      "template_publications",
      "template_proposals",
      "template_proposal_revisions",
      "template_proposal_reviews",
      "template_proposal_events",
      "pack_templates",
      "operation_receipts",
      "audit_events",
      "outbox_jobs",
      "business_identities",
      "permission_grants",
      "users",
      "seed_receipts",
    ];
    const snapshot = async () =>
      Promise.all(
        tables.map(
          async (t) =>
            (
              await c.query(
                // Seeds 107 (SYN-PPO-P04 v2, field readiness gate) and 108 (Conversations grants) are the only later seeds; readiness-gate.test.ts and conversations-upgrade.test.ts prove them.
                `SELECT to_jsonb(x)${t === "material_handovers" ? "-'specialist_package_id'-'specialist_version'" : ""} row FROM ppo.${t} x${t === "seed_receipts" ? " WHERE x.version NOT IN (107,108,110)" : t === "permission_grants" ? " WHERE x.capability NOT LIKE 'conversation.%'" : ""} ORDER BY to_jsonb(x)::text`,
              )
            ).rows,
        ),
      );
    const original = await snapshot(),
      ledger = (
        await c.query("SELECT * FROM public.ppo_migrations ORDER BY version")
      ).rows;
    await migrate();
    await seed();
    assert.deepEqual(await snapshot(), original);
    assert.deepEqual(
      (
        await c.query(
          "SELECT * FROM public.ppo_migrations WHERE version<=$1 ORDER BY version",
          [through],
        )
      ).rows,
      ledger,
    );
    assert.deepEqual(
      (
        await c.query(
          "SELECT version FROM public.ppo_migrations WHERE version>$1 ORDER BY version",
          [through],
        )
      ).rows,
      through === 103
        ? [{ version: 104 }, { version: 105 }, { version: 106 }, { version: 107 }, { version: 108 }, { version: 109 }, { version: 110 }, { version: 113 }, { version: 114 }]
        : [{ version: 105 }, { version: 106 }, { version: 107 }, { version: 108 }, { version: 109 }, { version: 110 }, { version: 113 }, { version: 114 }],
    );
    assert.deepEqual(
      (
        await c.query(
          "SELECT specialist_package_id,specialist_version,payload->>'schema_version' AS schema FROM ppo.material_handovers",
        )
      ).rows,
      [{ specialist_package_id: null, specialist_version: null, schema: "1" }],
    );
    assert.deepEqual(
      (await handoverCommand(f.owner, f.engineering.id, legacy)).receipt,
      saved.receipt,
    );
    assert.deepEqual(
      await readOperation(f.receiver, decide.operation_id),
      accepted.receipt,
    );
    assert.deepEqual(
      await readPublication(publication.publisher, publication.command.id),
      originalPublication,
    );
    assert.deepEqual(
      await readOperation(
        publication.publisher,
        publication.command.operation_id,
      ),
      published.receipt,
    );
    const upgraded = (
      await c.query("SELECT * FROM public.ppo_migrations ORDER BY version")
    ).rows;
    await migrate();
    await seed();
    assert.deepEqual(await snapshot(), original);
    assert.deepEqual(
      (await c.query("SELECT * FROM public.ppo_migrations ORDER BY version"))
        .rows,
      upgraded,
    );
  });
