import type { PoolClient } from "pg";
import { insert } from "../documents/packs";
import { hash } from "./context";
import { currentFinanceTemplate } from "./render";
export async function seedFinance(c: PoolClient) {
  const workspace_id = "10000000-0000-4000-8000-000000000001",
    actor = "30000000-0000-4000-8000-000000000007",
    id = "f1000000-0000-4000-8000-000000000001",
    definition = {
      schema_version: 1,
      synthetic: true,
      name: "P10 independently specified F-01–F-07",
      modes: ["SyntheticManual", "SyntheticApi"],
      quantity: {
        scale: 6,
        tolerance: "0",
        conversion:
          "Whole elapsed minutes only; 60 captured seconds = 1 MIN exactly. Other minute fractions unavailable; no rounding.",
        allocation: "All quantities in each selected report",
        target: "SyntheticServiceCharge",
        directions: ["Labour", "Consumed", "Returned"],
      },
      currency: {
        code: "AUD",
        scale: 2,
        tolerance: "0",
        basis:
          "Fictional supplied source amounts only; no tax, rates or foreign exchange",
      },
      account: {
        invoice: "1100.00",
        payment: "400.00",
        credit: "100.00",
        remaining: "600.00",
        reversed_remaining: "1000.00",
        unapplied: "200.00",
      },
      operational_policy: "Not defined",
    };
  await insert(c, "finance_definitions", {
    id,
    workspace_id,
    version: 1,
    definition,
    content_hash: hash(definition),
  });
  await insert(c, "finance_policy", {
    workspace_id,
    version: 1,
    definition_id: id,
  });
  const mappings = (
    await c.query(
      "SELECT * FROM ppo.erp_account_mappings WHERE workspace_id=$1 ORDER BY id",
      [workspace_id],
    )
  ).rows;
  for (let i = 0; i < mappings.length; i++) {
    const m = mappings[i];
    await insert(c, "finance_accounts", {
      id: `f2000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      workspace_id,
      company_id: m.company_id,
      organisation_id: m.organisation_id,
      mapping_id: m.id,
      mapping_version: m.version,
      mapping_snapshot: JSON.parse(JSON.stringify(m)),
      verification_basis:
        "F-01–F-07 independently specify this fictional company/customer/AUD context. This does not verify or enable a live ERP mapping.",
      currency: "AUD",
      fixture_key: `SYN-ACCOUNT-${i + 1}`,
      created_by: actor,
      updated_by: actor,
    });
  }
  const template = await currentFinanceTemplate();
  await insert(c, "finance_templates", {
    id: "f3000000-0000-4000-8000-000000000001",
    workspace_id,
    version: 1,
    definition: template,
    content_hash: hash(template),
  });
  await insert(c, "finance_template_policy", {
    workspace_id,
    version: 1,
    template_id: "f3000000-0000-4000-8000-000000000001",
  });
}
