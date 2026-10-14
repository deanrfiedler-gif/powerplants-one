import { randomUUID } from "node:crypto";
import { database } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { changeDealStage } from "../../src/crm/refinements";
import { recordOpportunityOutcome } from "../../src/crm/outcomes";
import { readOutcomeBasis } from "../../src/crm/outcome-sources";
import { createEstimate, prepareQuote } from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import { readResponse } from "../../src/estimating/response/reads";
import { recordResponse } from "../../src/estimating/response/service";
import {
  createHandover,
  commandHandover,
  readHandover,
} from "../../src/sales/handover-service";
import { emptyHandover } from "../../src/sales/handover-model";
import {
  readDeliveryBinding,
  bindDelivery,
} from "../../src/sales/delivery-binding";
import { createProject } from "../../src/projects/service";
import { createDocument, reviewDocument } from "../../src/library/commands";
import { readCommercialOptions } from "../../src/projects/commercial/reads";
import { commandCommercial } from "../../src/projects/commercial/commands";
import { crmBase, crmDiscovery } from "./crm";
import { projectInput } from "./projects";
import { estimateInput, quoteCommand } from "./estimating";
import { reviewed, prepared, issued } from "./quotation-release";
import { response } from "./quotation-response";
import { grantLibrary, libraryInput } from "./library";

export const commercialContent = (owner_id: string) => ({
  title: "SYN commercial control",
  detail: "Fictional bounded delivery terms",
  clause: "SYN clause 4",
  owner_id,
  action_ids: [] as string[],
});
export const commercialAction = (
  id: string,
  expected_version: number,
  action: string,
) => ({
  ...crmBase(),
  id,
  expected_version,
  action,
  note: "SYN exact commercial action",
});
export async function commercialFixture() {
  const owner = (await createSession("coordinator")).principal,
    reviewer = (await createSession("estimating-source-reviewer")).principal,
    approver = (await createSession("quotation-approver")).principal,
    issuer = (await createSession("quotation-issuer")).principal;
  // Explicit test-only duties; no application seed grants the new authority.
  await grantLibrary(owner, [
    "project.commercial.read",
    "project.commercial.prepare",
    "project.commercial.review",
    "document.read",
    "document.register",
    "document.review",
    "finance.read",
    "shared.finance.read",
  ]);
  await database().query(
    `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id)
    SELECT g.workspace_id,$2,g.company_id,g.capability,g.scope_type,g.scope_id,g.site_id FROM ppo.permission_grants g
    WHERE g.workspace_id=$1 AND g.user_id=$3 AND g.capability<>'project.commercial.prepare'
    AND NOT EXISTS(SELECT 1 FROM ppo.permission_grants r WHERE r.workspace_id=g.workspace_id AND r.user_id=$2 AND r.capability=g.capability AND r.scope_type=g.scope_type AND r.scope_id=g.scope_id)`,
    [owner.workspace_id, reviewer.actor_id, owner.actor_id],
  );
  const o = crmDiscovery();
  o.initial_action.due_at = "2031-10-01T00:00:00.000Z";
  o.initial_action.due_needed = false;
  await createOpportunity(owner, o);
  for (const [i, stage_id] of ["Scoping", "Quoting"].entries())
    await changeDealStage(owner, o.id, {
      ...crmBase(),
      expected_version: i + 1,
      stage_id,
      qualification_note: null,
      identification_activity_id: null,
    });
  const input = estimateInput(o.id);
  await createEstimate(owner, input);
  await reviewed(owner, reviewer, input.id);
  const estimate = await readEstimate(owner, input.id),
    draft = quoteCommand(estimate.saved);
  // Quote only the two Product units: 350.00, rather than the 720.00 estimate.
  draft.choices = draft.choices.map((x, i) => ({
    ...x,
    included: i === 0,
    print: i === 0,
  }));
  await prepareQuote(owner, input.id, draft);
  const f = { owner, reviewer, approver, issuer, o, input, estimate, draft },
    release = await prepared(f);
  await issued(f, release.id);
  await recordResponse(
    owner,
    release.id,
    response(await readResponse(owner, release.id)),
  );
  for (const [i, stage_id] of ["Negotiation", "Closing"].entries())
    await changeDealStage(owner, o.id, {
      ...crmBase(),
      expected_version: i + 3,
      stage_id,
      qualification_note: null,
      identification_activity_id: null,
    });
  const basis = await readOutcomeBasis(owner, o.id, {
    revision_id: release.id,
  });
  await recordOpportunityOutcome(owner, o.id, {
    ...crmBase(),
    expected_version: 5,
    close_outcome: "Won",
    lost_reason: null,
    acceptance_evidence: "SYN exact issued acceptance",
    commercial_source: basis.source,
  });
  const handover = randomUUID(),
    content = {
      ...emptyHandover(),
      problem: "SYN controller need",
      outcome: "SYN delivery",
      included_scope: "SYN quoted controller",
      exclusions: "SYN civil",
      assumptions: "SYN site access",
      unknowns: "SYN review interface",
      date_reason: "SYN date to agree",
      next_activity_id: o.initial_action.id,
      destination: "Projects",
      routing_basis: "SYN project coordination",
      delivery_items: "SYN controller",
      release_prerequisites: "SYN technical authority separate",
    };
  await createHandover(owner, {
    ...crmBase(),
    id: handover,
    opportunity_id: o.id,
    kind: "Won",
  });
  await commandHandover(owner, handover, {
    ...crmBase(),
    action: "Save",
    expected_version: 1,
    content,
    receiving_owner_id: owner.actor_id,
    note: "SYN saved",
  });
  await commandHandover(owner, handover, {
    ...crmBase(),
    action: "Submit",
    expected_version: 2,
    note: "SYN submitted",
  });
  await commandHandover(owner, handover, {
    ...crmBase(),
    action: "Accept",
    expected_version: 3,
    source_hash: (await readHandover(owner, handover)).record.source_hash,
    note: "SYN received",
  });
  const project = projectInput();
  await createProject(owner, project);
  const binding = await readDeliveryBinding(owner, handover, {
    destination_id: project.id,
  });
  await bindDelivery(owner, handover, {
    ...crmBase(),
    expected_version: binding.version,
    acceptance_event_id: binding.acceptance_event_id,
    source_hash: binding.source_hash,
    destination_kind: "Projects",
    destination_id: project.id,
    destination_site_id: binding.candidate!.site_id,
    expected_destination_version: binding.candidate!.version,
  });
  const document = libraryInput();
  await createDocument(owner, document);
  await reviewDocument(reviewer, document.id, {
    ...crmBase(),
    revision_id: document.revision_id,
    expected_version: 1,
    outcome: "Reviewed",
    purpose: "SYN commercial basis",
    rationale: "SYN exact fictional clauses reviewed",
  });
  const options = await readCommercialOptions(owner, project.id, {
    handover_id: handover,
    quote_revision_id: release.id,
    document_id: document.id,
  });
  const create = {
    ...commercialAction(randomUUID(), 0, "Create"),
    kind: "Basis",
    source: options.source.input,
    content: commercialContent(owner.actor_id),
  };
  return { ...f, release, project, handover, document, options, create };
}
export async function approvedBasis(
  f: Awaited<ReturnType<typeof commercialFixture>>,
) {
  const saved = await commandCommercial(f.owner, f.project.id, f.create);
  await commandCommercial(
    f.owner,
    f.project.id,
    commercialAction(f.create.id, 1, "Submit"),
  );
  const decision = {
    ...commercialAction(f.create.id, 2, "Decide"),
    outcome: "Approved",
  };
  const approved = await commandCommercial(f.reviewer, f.project.id, decision);
  return { saved, approved, decision };
}
export const variation = (
  f: Awaited<ReturnType<typeof commercialFixture>>,
  requested_amount: string | null,
  priced_amount: string | null,
) => ({
  ...commercialAction(randomUUID(), 0, "Create"),
  kind: "Variation",
  basis_id: f.create.id,
  content: {
    ...commercialContent(f.owner.actor_id),
    requested_amount,
    priced_amount,
    date_impact: null,
  },
});
