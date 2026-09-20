import { randomUUID } from "node:crypto";
import { prepareFieldAppointment } from "./field-http";
import { base, id } from "./packs";

// Node's HTTP files run concurrently. Each mutating journey owns its work order
// and approved scope; read-only site, customer, ticket and policy fixtures remain
// shared. Prepare the same single visual-inspection task through actual HTTP
// commands, without bypassing authorisation or changing the stale-source guard.
export async function prepareIsolatedFieldAppointment(
  call: Parameters<typeof prepareFieldAppointment>[0],
  day: string,
) {
  const wid = randomUUID();
  await call("service/work-orders", {
    ...base(),
    id: wid,
    company_id: id("20"),
    site_id: id("70"),
    customer_id: id("50"),
    service_owner_id: id("30"),
    tickets: [{
      ticket_id: id("40", 20),
      issue_disposition: "SYN P05 authorised visual inspection; no extra work.",
    }],
  });
  const evidence = {
    title: "SYN P05 reviewed scope and preparation",
    content_text: "SYN P05 authority and preparation evidence: external visual inspection, current access reviewed, no shutdown/intervention, collection plan owned by coordinator.",
    source_reference: "SYN-PPO-P05-AUTH",
    source_version: "1",
  };
  let work = (await call(`service/work-orders/${wid}`)).items[0];
  await call(`service/work-orders/${wid}/save-scope`, {
    ...base(),
    expected_version: work.version,
    scope: {
      summary: "SYN Planned controller inspection — coordination and customer date review",
      exclusions: "No shutdown, replacement, energised access, repair or financial approval.",
      diagnostic_limit: "External visual inspection only.",
      pending_account_plan: "Service owner obtains account clarification; Finance independently reviews charging.",
      authority_evidence: evidence,
      coverage: {
        status: "Covered",
        agreement_reference: null,
        source_version: null,
        effective_from: null,
        effective_to: null,
        assessment: "SYN manual coverage assessment; billability undecided.",
        reason: "Fictional agreement",
        charging_route: "FinanceReview",
      },
      items: [{
        task_kind: "Inspection",
        task_description: "Observe controller display and external sensor identity",
        expected_outcome: "Record observations and remaining questions",
        completion_requirements: ["Record observations", "Stop before intervention"],
        required_skill_codes: ["SYN-VISUAL"],
        shutdown_condition: null,
        access_condition: null,
        assets: [{
          asset_id: id("80"),
          configuration_id: null,
          identification_plan: null,
        }],
      }],
    },
  });
  work = (await call(`service/work-orders/${wid}`)).items[0];
  const scope = work.scopes.find((s: { id: string }) => s.id === work.scope_revision_id);
  for (const criterion_code of [
    "SiteAccess", "SiteControls", "CompetencyPlan", "MandatoryIsolation", "ShutdownAuthority",
  ]) {
    work = (await call(`service/work-orders/${wid}`)).items[0];
    await call(`service/work-orders/${wid}/readiness`, {
      ...base(),
      expected_version: work.version,
      assessment: {
        scope_revision_id: scope.id,
        scope_version: scope.version,
        criterion_code,
        outcome: ["MandatoryIsolation", "ShutdownAuthority"].includes(criterion_code)
          ? "NotApplicable" : "Pass",
        reason: "SYN reviewed external visual scope; no shutdown or intervention.",
        evidence,
        source_as_at: "2026-09-05T00:00:00Z",
        valid_until: "2027-01-01T00:00:00Z",
      },
    });
  }
  work = (await call(`service/work-orders/${wid}`)).items[0];
  await call(`service/work-orders/${wid}/authorise`, {
    ...base(),
    expected_version: work.version,
    scope_revision_id: scope.id,
    scope_version: scope.version,
    policy_version_id: scope.policy_version_id,
  });
  const source = {
    work_order_id: wid,
    scope_revision_id: scope.id as string,
    scope_version: scope.version as number,
  };
  return { ...await prepareFieldAppointment(call, day, source), ...source };
}
