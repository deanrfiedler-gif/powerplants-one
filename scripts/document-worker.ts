import { runReportJobs } from "../src/reports/worker";
import { runFinanceJobs } from "../src/finance/worker";
import { runPendingQuoteJobs } from "../src/estimating/worker";
import { runPendingRenderJobs } from "../src/documents/worker";
import { runCustomerMessageJobs } from "../src/communications";
import { runAssistantTurns } from "../src/assistant/turns";
import { closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
localConfig();
try {
  const count = await runPendingRenderJobs();
  const reports = await runReportJobs();
  const finance = await runFinanceJobs();
  await runPendingQuoteJobs();
  // D-025 S2: confirmed customer messages go to the synthetic channel only.
  const messages = await runCustomerMessageJobs();
  const turns = await runAssistantTurns(10);
  console.log(
    `Examined ${count} pack, ${reports} report and ${finance} Finance render intents, ${messages.examined} confirmed customer messages (synthetic channel) and ${turns} assistant turns.`,
  );
} catch {
  console.error(
    "P06 worker unavailable. Pending intents are retained for recovery.",
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
