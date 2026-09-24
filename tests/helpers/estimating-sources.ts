import { randomUUID } from "node:crypto";
import { CRM, crmBase } from "./crm";
export const sourceInput = () => ({
  ...crmBase(),
  id: randomUUID(),
  company_id: CRM.company,
  reference: `SYN-SOURCE-${randomUUID()}`,
  content: {
    title: "SYN Controller unit price",
    supplier_label: "SYN Fictional supplier",
    supplier_entity_key: null,
    item_reference: "SYN-CONTROLLER",
    unit: "each",
    currency: "AUD",
    tax_basis: "ExcludingTax",
    data_mode: "Synthetic",
    source_date: "2026-09-01",
    effective_from: "2026-09-01",
    valid_until: null,
    evidence_reference: "SYN-NOTE-ONE",
    evidence_excerpt:
      "Authored fictional price evidence for automated review; no supplier document or live price.",
    tiers: [
      { minimum_quantity: "1", unit_cost: "100" },
      { minimum_quantity: "10", unit_cost: "90" },
    ],
  },
});
