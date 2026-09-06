import { runReportJobs } from "../src/reports/worker";
import { runFinanceJobs } from "../src/finance/worker";
import { runPendingRenderJobs } from "../src/documents/worker";
import { closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
localConfig();
try {
  const count = await runPendingRenderJobs();
  const reports = await runReportJobs();
  const finance = await runFinanceJobs();
  console.log(
    `Examined ${count} pack, ${reports} report and ${finance} Finance render intents. No external messages sent.`,
  );
} catch {
  console.error(
    "P06 worker unavailable. Pending intents are retained for recovery.",
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
