import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { changeDealStage } from "../../src/crm/refinements";
import { recordOpportunityOutcome } from "../../src/crm/outcomes";
import {
  createHandover,
  commandHandover,
  readHandover,
} from "../../src/sales/handover-service";
import { emptyHandover } from "../../src/sales/handover-model";
import { readDeliveryBinding } from "../../src/sales/delivery-binding";
import { createProject } from "../../src/projects/service";
import { crmBase, crmDiscovery } from "./crm";
import { projectInput } from "./projects";

export async function projectReceivingFixture() {
  const p = (await createSession("coordinator")).principal,
    deal = crmDiscovery();
  deal.initial_action.due_at="2031-10-01T00:00:00.000Z";
  deal.initial_action.due_needed=false;
  await createOpportunity(p, deal);
  for (const [i, stage_id] of [
    "Scoping",
    "Quoting",
    "Negotiation",
    "Closing",
  ].entries())
    await changeDealStage(p, deal.id, {
      ...crmBase(),
      expected_version: i + 1,
      stage_id,
      qualification_note: null,
      identification_activity_id: null,
    });
  await recordOpportunityOutcome(p, deal.id, {
    ...crmBase(),
    expected_version: 5,
    close_outcome: "Won",
    lost_reason: null,
    acceptance_evidence: "SYN reviewed order",
    commercial_source: {
      kind: "Independent",
      evidence: "SYN separate customer order",
    },
  });
  const handover = randomUUID(),
    content = {
      ...emptyHandover(),
      problem: "SYN exact original receiving problem",
      outcome: "SYN controls upgrade",
      included_scope: "SYN panels",
      exclusions: "SYN civil works",
      assumptions: "SYN site access to review",
      unknowns: "SYN receiver owns interface review",
      date_reason: "SYN requested date to agree",
      next_activity_id: deal.initial_action.id,
      destination: "Projects",
      routing_basis: "SYN explicit Projects route",
      delivery_items: "SYN controls package",
      release_prerequisites: "SYN technical review remains separate",
    };
  await createHandover(p, {
    ...crmBase(),
    id: handover,
    opportunity_id: deal.id,
    kind: "Won",
  });
  await commandHandover(p, handover, {
    ...crmBase(),
    action: "Save",
    expected_version: 1,
    content,
    receiving_owner_id: p.actor_id,
    note: "SYN prepare",
  });
  await commandHandover(p, handover, {
    ...crmBase(),
    action: "Submit",
    expected_version: 2,
    note: "SYN submit",
  });
  const submitted = await readHandover(p, handover);
  await commandHandover(p, handover, {
    ...crmBase(),
    action: "Accept",
    expected_version: 3,
    source_hash: submitted.record.source_hash,
    note: "SYN accept exact source",
  });
  const project = projectInput();
  await createProject(p, project);
  const read = await readDeliveryBinding(p, handover, {
    destination_id: project.id,
  });
  assert.ok(read.can_link && read.candidate && read.acceptance_event_id);
  const binding = {
    ...crmBase(),
    expected_version: read.version,
    acceptance_event_id: read.acceptance_event_id,
    source_hash: read.source_hash,
    destination_kind: "Projects",
    destination_id: project.id,
    destination_site_id: read.candidate.site_id,
    expected_destination_version: read.candidate.version,
  };
  return { p, deal, handover, content, project, binding };
}
