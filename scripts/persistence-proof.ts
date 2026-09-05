import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createSession } from "../src/platform/identity";
import { readTicket, saveDraft } from "../src/service/tickets";
import { createOrganisation } from "../src/shared/commands";
import { readShared } from "../src/shared/reads";
import { readOperation } from "../src/shared/receipts";
import { closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw new Error("Persistence proof requires ppo_synthetic_test.");
try {
  const p = (await createSession("coordinator")).principal,
    id = "40000000-0000-4000-8000-000000000001",
    current = await readTicket(p, id);
  if (process.argv[2] === "write") {
    await saveDraft(p, id, {
      operation_id: randomUUID(),
      schema_version: 1,
      expected_version: current.version,
      summary: "SYN database restart sentinel",
      reason: "P01 PostgreSQL process restart proof",
    });
    await createOrganisation(p, {
      operation_id: "95000000-0000-4000-8000-000000000001",
      schema_version: 1,
      id: "95000000-0000-4000-8000-000000000002",
      company_id: "20000000-0000-4000-8000-000000000001",
      display_name: "SYN shared restart sentinel",
      relationship_status: "Prospect",
      owner_id: p.actor_id,
      reason: "P02 PostgreSQL restart proof",
    });
  } else {
    assert.equal(current.summary, "SYN database restart sentinel");
    assert.ok(current.version > 1);
    assert.equal(
      (
        await readShared(
          p,
          "Organisation",
          "95000000-0000-4000-8000-000000000002",
        )
      ).id,
      "95000000-0000-4000-8000-000000000002",
    );
    assert.equal(
      (await readOperation(p, "95000000-0000-4000-8000-000000000001"))
        .record_version,
      1,
    );
    console.log(
      "PostgreSQL restart: P01 ticket, P02 organisation and original operation receipt verified",
    );
  }
} finally {
  await closeDatabase();
}
