import { runReportJobs } from "../src/reports/worker";
import { runPendingQuoteJobs } from "../src/estimating/worker";
import { runPendingRenderJobs } from "../src/documents/worker";
import { closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
localConfig();
try {
  const count = await runPendingRenderJobs();
  const reports = await runReportJobs();
  await runPendingQuoteJobs();
  console.log(
    `Examined ${count} pack and ${reports} report render intents. No external messages sent.`,
  );
} catch {
  console.error(
    "P06 worker unavailable. Pending intents are retained for recovery.",
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
