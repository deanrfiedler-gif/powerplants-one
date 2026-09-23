import { expect, type Page } from "@playwright/test";
export const fixtureId = (t: string, n = 1) => `${t}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const commandBase = () => ({ operation_id: crypto.randomUUID(), schema_version: 1, reason: "SYN PL01 browser verification" });
export async function pl01Call(page: Page, path: string, body?: unknown) {
  const response = await page.request.fetch(`/api/v1/${path}`, { method: body ? "POST" : "GET", data: body,
    headers: body ? { Origin: new URL(page.url()).origin } : {} });
  const result = await response.json();
  expect(response.ok(), JSON.stringify(result)).toBeTruthy();
  return result;
}
export async function pl01Identity(page: Page, profile = "coordinator") {
  await page.goto("/schedule");
  await pl01Call(page, "local-session", { profile });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Unassigned demand" })).toBeVisible();
}
export const evidence = () => ({ title: "SYN PL01 exact evidence", content_text: "SYN authorised visual inspection only; service owner reviewed the fictional site and work controls.", source_reference: "SYN-PPO-PL01-TEST", source_version: "1" });
export async function createDemand(page: Page, summary = "SYN PL01 reviewed external visual inspection") {
  const orderId = crypto.randomUUID();
  await pl01Call(page, "service/work-orders", { ...commandBase(), id: orderId, company_id: fixtureId("20"), site_id: fixtureId("70"), customer_id: fixtureId("50"), service_owner_id: fixtureId("30"),
    tickets: [{ ticket_id: fixtureId("40", 20), issue_disposition: "SYN bounded external inspection" }] });
  let w = (await pl01Call(page, `service/work-orders/${orderId}`)).items[0];
  const scope = { summary, exclusions: "No shutdown, intervention or additional work.", diagnostic_limit: "External inspection only.", pending_account_plan: "SYN service owner refers charging to Finance.", authority_evidence: evidence(),
    coverage: { status: "Unknown", agreement_reference: null, source_version: null, effective_from: null, effective_to: null, assessment: "SYN coverage remains unverified.", reason: "SYN separate commercial review.", charging_route: "FinanceReview" },
    items: [{ task_kind: "Inspection", task_description: "Observe external display", expected_outcome: "Record observed display state", completion_requirements: ["Record observations", "Stop before intervention"], required_skill_codes: ["SYN-VISUAL"], shutdown_condition: null, access_condition: null, assets: [{ asset_id: fixtureId("80"), configuration_id: null, identification_plan: null }] }] };
  await pl01Call(page, `service/work-orders/${orderId}/save-scope`, { ...commandBase(), expected_version: w.version, scope });
  for (const criterion of ["SiteAccess", "SiteControls", "CompetencyPlan", "MandatoryIsolation", "ShutdownAuthority"]) {
    w = (await pl01Call(page, `service/work-orders/${orderId}`)).items[0];
    const r = w.scopes[0];
    await pl01Call(page, `service/work-orders/${orderId}/readiness`, { ...commandBase(), expected_version: w.version, assessment: {
      scope_revision_id: r.id, scope_version: r.version, criterion_code: criterion,
      outcome: ["MandatoryIsolation", "ShutdownAuthority"].includes(criterion) ? "NotApplicable" : "Pass",
      reason: "SYN reviewed non-intervention scope", evidence: evidence(), source_as_at: "2026-09-05T00:00:00Z",
    } });
  }
  w = (await pl01Call(page, `service/work-orders/${orderId}`)).items[0];
  await pl01Call(page, `service/work-orders/${orderId}/authorise`, { ...commandBase(), expected_version: w.version,
    scope_revision_id: w.scopes[0].id, scope_version: w.scopes[0].version, policy_version_id: w.scopes[0].policy_version_id });
  return { ...(await pl01Call(page, `service/work-orders/${orderId}`)).items[0], inputScope: scope };
}
export async function openDemand(page: Page, id: string, context = "/schedule") {
  await page.goto(context);
  const panel = await openDemandPanel(page, id);
  await expect(panel.getByRole("button", { name: "Save proposal", exact: true })).toBeEnabled();
  return panel;
}
export async function openDemandPanel(page: Page, id: string) {
  // Demand and the calendar load independently. Wait for the calendar above
  // the card to settle so its arrival cannot move Plan visit during the click.
  await expect(page.getByText("Complete permitted result within this date/site/resource filter", { exact: false })).toBeVisible();
  const card = page.locator("article").filter({ has: page.locator(`a[href='/service/work-orders/${id}']`) });
  await card.getByRole("button", { name: "Plan visit" }).click();
  const panel = page.getByRole("dialog", { name: "Plan visit", exact: true });
  await expect(panel).toBeVisible();
  return panel;
}
export async function fillProposal(page: Page, day = "2031-09-26") {
  const panel = page.getByRole("dialog", { name: "Plan visit", exact: true });
  await panel.getByLabel("Start (site time)", { exact: true }).fill(`${day}T14:00`);
  await panel.getByLabel("Finish (site time)", { exact: true }).fill(`${day}T15:00`);
  await panel.getByLabel("Preparation state", { exact: true }).selectOption("Preparing");
  return panel;
}
