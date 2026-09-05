import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createSession } from "../src/platform/identity";
import { readTicket, saveDraft } from "../src/service/tickets";
import { closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw new Error("Persistence proof requires ppo_synthetic_test.");
try {
  const p = (await createSession("coordinator")).principal,
    id = "40000000-0000-4000-8000-000000000001",
    current = await readTicket(p, id);
  if (process.argv[2] === "write")
    await saveDraft(p, id, {
      operation_id: randomUUID(),
      schema_version: 1,
      expected_version: current.version,
      summary: "SYN database restart sentinel",
      reason: "P01 PostgreSQL process restart proof",
    });
  else {
    assert.equal(current.summary, "SYN database restart sentinel");
    assert.ok(current.version > 1);
    console.log("PostgreSQL restart: persisted command result verified");
  }
} finally {
  await closeDatabase();
}
