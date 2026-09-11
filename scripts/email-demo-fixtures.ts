import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createSession } from "../src/platform/identity";
import { closeDatabase } from "../src/platform/database";
import { createOpportunity } from "../src/crm/opportunities";
// Explicit, repeatable fixture command: never changes the ordinary CRM seed baseline.
export async function emailDemoFixtures() {
  const p = (await createSession("coordinator")).principal;
  for (const n of ["1", "2"])
    await createOpportunity(p, {
      operation_id: `ec500000-0000-4000-8000-00000000000${n}`,
      schema_version: 1,
      reason: "SYN Email Calendar demonstration fixture",
      id: `ec200000-0000-4000-8000-00000000000${n}`,
      company_id: "20000000-0000-4000-8000-000000000001",
      organisation_id: "50000000-0000-4000-8000-000000000001",
      site_id: "70000000-0000-4000-8000-000000000001",
      primary_person_id: "60000000-0000-4000-8000-000000000001",
      site_unknown_reason: null,
      contact_unknown_reason: null,
      title: n === "1" ? "SYN Irrigation upgrade" : "SYN Climate monitoring",
      need_summary: "Review the fictional growing area requirements",
      source_channel: "Email",
      source_basis: "Synthetic Email Calendar fixture",
      owner_id: p.actor_id,
      pipeline_definition_id: "c1000000-0000-4000-8000-000000000001",
      initial_action: {
        id: `ec300000-0000-4000-8000-00000000000${n}`,
        owner_id: p.actor_id,
        kind: "CustomerContact",
        summary: "SYN Initial qualification",
        due_at: null,
        due_needed: true,
      },
    });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    await emailDemoFixtures();
    console.log(
      "Two fictional opportunities available. Existing data retained.",
    );
  } finally {
    await closeDatabase();
  }
}
