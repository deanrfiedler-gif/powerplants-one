import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";

// These proofs require a fresh database and compare complete business snapshots.
// They must never reset or inspect that database alongside mutating HTTP files.
const exclusive = new Set([
  "service-finding-next-action.test.ts",
  "crm-owner-transfer.test.ts",
  "estimating-e2-verification.test.ts",
  "project-commercial.test.ts",
  "project-specialist.test.ts",
  "project-specialist-handover.test.ts",
  "project-specialist-work.test.ts",
  // CPQ changes the company activation head and temporarily revokes source
  // access; run it apart from the shared estimate/CPQ authority scenarios.
  "cpq-costs.test.ts",
  "cpq-packages.test.ts",
  "cpq-rebase.test.ts",
    "cpq-quality.test.ts",
  "cpq-products.test.ts",
  "excel-import-review.test.ts",
  "excel-import-persistence.test.ts",
  "excel-reimport.test.ts",
  "excel-quotation.test.ts",
  "excel-capacity.test.ts",
  "excel-source-pricing.test.ts",
  "excel-fx.test.ts",
  "excel-landed.test.ts",
  "output-register.test.ts",
  "output-actions.test.ts",
  "template-catalogue.test.ts",
  "template-drafts.test.ts",
  "template-publication.test.ts",
  "template-publication-base.test.ts",
  "template-use.test.ts",
  // D-025 S2 resets and grants default-denied customer message duties.
  "customer-communications.test.ts",
]);
const files = (await readdir(new URL("../tests/http/", import.meta.url)))
  .filter((name) => name.endsWith(".test.ts"))
  .sort();
if (!files.length) throw Error("No HTTP tests discovered");

async function run(args: string[], reset = false) {
  const child = spawn(process.execPath, ["--env-file=.env.local", "--import", "tsx", ...args], {
    stdio: "inherit",
    env: reset
      ? { ...process.env, PPO_ALLOW_RESET: "dispose-synthetic", PPO_RESET_DATABASE: "ppo_synthetic_test" }
      : process.env,
  });
  const code = await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => signal
      ? reject(Error(`HTTP proof interrupted by ${signal}`))
      : resolve(code ?? 1));
  });
  if (code !== 0) process.exit(code);
}

const shared = files.filter((name) => !exclusive.has(name));
if (shared.length)
  await run(["--test", ...process.argv.slice(2), ...shared.map((name) => `tests/http/${name}`)]);
for (const name of files.filter((name) => exclusive.has(name))) {
  console.log(`Exclusive fresh-database HTTP proof: ${name}`);
  await run(["scripts/database.ts", "reset"], true);
  await run(["--test", ...process.argv.slice(2), `tests/http/${name}`]);
}

// Later integration proofs require the seeded permission baseline, not grants
// installed by an individual template scenario. Restore it before handing over.
await run(["scripts/database.ts", "reset"], true);
