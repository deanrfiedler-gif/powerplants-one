import { runPendingRenderJobs } from "../src/documents/worker";
import { closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
localConfig();
try {
  const count = await runPendingRenderJobs();
  console.log(
    `P06: examined ${count} durable render intents. No external messages sent.`,
  );
} catch {
  console.error(
    "P06 worker unavailable. Pending intents are retained for recovery.",
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
