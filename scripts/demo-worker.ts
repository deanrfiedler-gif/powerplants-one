import { demoConfig } from "../src/platform/demo-config";
import { runPendingQuoteJobs } from "../src/estimating/worker";
import { closeDatabase } from "../src/platform/database";
demoConfig();
try { await runPendingQuoteJobs(); console.log("Demo quotation queue examined."); }
catch { console.error("Demo quotation recovery remains pending."); process.exitCode = 1; }
finally { await closeDatabase(); }
