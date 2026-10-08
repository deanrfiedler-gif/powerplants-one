// Bounded synthetic fixture only; no reset, migrations, seeds or production access.
import { mkdir, writeFile } from "node:fs/promises";
import { localConfig } from "../src/platform/config";
import { closeDatabase } from "../src/platform/database";
import { act, contextFixture, PJ, seedStage, stable } from "../tests/helpers/acceptance";
import { detail } from "../tests/helpers/acceptance-journey";
if (localConfig().database_name !== "ppo_synthetic_test") throw Error("NAV fixtures require ppo_synthetic_test");
try {
  await contextFixture();
  const fixture = await seedStage(PJ.project, "nav", "SYN NAV acceptance source");
  const obligation = stable("nav:obligation");
  let data = await detail(PJ.project, fixture.stage);
  if (!data.obligations.some(o => o.id === obligation)) await act("coordinator", PJ.project, fixture.stage, "obligation", {
    id: obligation, unit_id: fixture.unit, title: "SYN NAV verify equipment labels", owner_id: PJ.sam,
    recipient_id: PJ.receiver, due: null, due_basis: "SYN agreed visit needed", conditions: "SYN continuing clerical check",
    required_evidence: "SYN dated labels", control_reference: "SYN NAV reference", eligible: true, review_rule: "SYN weekly review",
  });
  data = await detail(PJ.project, fixture.stage);
  const row = data.obligations.find(o => o.id === obligation)!;
  await mkdir("verification-evidence/navigation", { recursive: true });
  await writeFile("verification-evidence/navigation/acceptance-fixture.json", JSON.stringify({ stage: fixture.stage, obligation, activity: row.activity_id, summary: row.title }, null, 2));
} finally { await closeDatabase(); }
