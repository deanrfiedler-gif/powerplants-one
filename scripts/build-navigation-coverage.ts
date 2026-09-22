import { writeFile } from "node:fs/promises";
import { departmentRails, destination, workspaces } from "../src/shell/navigation";
const missing: Record<string, string> = {
  products: "No authorised shared catalogue list/read service. Equipment is a different entity.",
  insights: "No Sales analysis landing or agreed KPI projection. Deal Forecast remains inside Deals.",
  intake: "No estimating intake queue. Saved Discovery workspaces do not implement receiving intake.",
  pricing: "Supplier-pricing design exists; no native price-source register/service.",
  "estimate-reviews": "No native estimate review/approval queue; general work reviews are not a substitute.",
  basis: "No native design-basis/interface register; package fields are not an index.",
  drawings: "No controlled drawing register or authorised general drawing list.",
  "technical-reviews": "Engineering review workspace is a placeholder, not a technical-review queue.",
  readiness: "Delivery-readiness design only; no native assessment landing.",
  risks: "No native project risk/issue register.",
  variations: "No native variation/obligation register.",
  assurance: "Site-assurance design only; no native inspection/assurance register.",
  supply: "No native material-demand list or receiving workflow.",
  purchasing: "No native purchasing register or order workflow.",
  inbound: "No native inbound-shipment register.",
  receiving: "No native receipt/inspection workflow.",
  stock: "No native stock/reservation register; equipment is not stock.",
  deliveries: "No native dispatch/delivery register.",
  returns: "No native return/claim register.",
  performance: "No project-performance projection; D-017 financial definitions remain open.",
  claims: "No Finance claims/obligations register.",
  cash: "No native cash-outlook projection.",
  reconciliation: "Handoff reconciliation is a record action; no distinct reconciliation register.",
  exceptions: "Shared /admin recovery does not provide a finance-scoped exception list.",
};
const rows: string[] = [];
let wired = 0;
for (const workspace of workspaces) {
  for (const [index, id] of departmentRails[workspace.id].entries()) {
    const d = destination(id), ready = d.readiness === "ready";
    if (ready) wired++;
    const access = [(d.requires ?? []).join(" OR "), ...(d.requiresAll ?? []), d.requiresAny ? "(" + d.requiresAny.join(" OR ") + ")" : ""].filter(Boolean).join(" AND ");
    rows.push("| " + [workspace.label, index + 1, d.label, d.href ?? "Withheld", d.icon, access || "No capability invented", ready ? "Working route / adapter" : "Unavailable", ready ? id : "None", ready ? "Navigation unit + department browser rail; exact record guards retained" : missing[id]].join(" | ") + " |");
  }
}
await writeFile("docs/delivery/department-navigation-coverage.md", [
  "# Department navigation destination coverage", "",
  "Derived from the current destination catalogue and ordered rails against the supplied [prompt r01](../reference/ui/application-shell/PPO-Department-Navigation-Icons-VS-Code-Implementation-Prompt-r01.md) and [register r02](../reference/ui/application-shell/PPO-Department-Navigation-Icon-Register-r02.md). This supplements the [handover](department-navigation-icons.md); readiness is separate from permission and owner acceptance.", "",
  rows.length + " canonical positions; " + wired + " wired positions (My Work repeats across six departments); " + (rows.length - wired) + " withheld. All positions have outline/active artwork. Refresh with scripts/build-navigation-coverage.ts.", "",
  "| Department (short name) | Order | Destination | Route | Semantic glyph | Existing access source | Readiness | Active parent ID | Evidence / missing dependency |",
  "|---|---:|---|---|---|---|---|---|---|", ...rows, "",
  "Specific child routes take precedence. Fertigation selects Specialist configurations; Engineering materials, changes and commissioning retain their own destination. Programme view is consumed by the project schedule and supplies a return to its chooser. Sales task drawers keep Tasks selected; People/Organisation details select Contacts in Sales.", "",
  "More retains My Work for Sales, People, Organisations, Sites, Facilities, Equipment, My jobs, Priva Fertigation, Approvals & handovers, Integrations & recovery and local Foundation checks when permitted. Documents and Settings remain withheld without general landings. The catalogue includes Blinds for existing Screen Systems context; no geometry route, calculation or schema is added. Context-only symbols do not manufacture More entries.", "",
  "Full departments: Sales; Estimating & Quotation; Engineering & Design Control; Projects & Commercial Delivery; Service Operations; Supply Chain Management; Finance & Commercial Controls.", "",
].join("\n"));
console.log({ positions: rows.length, wired, withheld: rows.length - wired });
