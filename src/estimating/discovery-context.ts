import { createHash } from "node:crypto";
import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import { canonical } from "../platform/operations";
import {
  visibleOpportunity,
  relationshipContext,
  eligibleActionOwner,
} from "../crm/context";
import { visible } from "../shared/reads";
import { compileDiscovery } from "./discovery";
import type { EstimateCap } from "./context";

// Internal receiving boundary for the E2 service. These reads neither acquire
// estimating ownership nor save a revision. The future command must supply its
// transaction, current group owner and group/version locks before accepting it.
async function targets(
  c: QueryClient,
  p: Principal,
  opportunityId: string,
  value: unknown,
  edit: boolean,
  readCapability: EstimateCap = "estimating.read",
) {
  const compiled = compileDiscovery(value);
  const opportunity = await visibleOpportunity(c, p, opportunityId);
  await relationshipContext(c, p, opportunity, readCapability);
  const scopeContext = {
    ...opportunity,
    site_id: compiled.input.scope.site_id,
  };
  await relationshipContext(c, p, scopeContext, readCapability);
  if (edit) {
    await relationshipContext(c, p, opportunity, "estimating.edit");
    await relationshipContext(c, p, scopeContext, "estimating.edit");
  }
  const organisation = await visible(
    c,
    p,
    "Organisation",
    opportunity.organisation_id,
  );
  const contact = opportunity.primary_person_id
    ? await visible(c, p, "Person", opportunity.primary_person_id)
    : null;
  const site = compiled.input.scope.site_id
    ? await visible(c, p, "Site", compiled.input.scope.site_id)
    : null;
  const facilities: { id: string; version: number; name: string }[] = [];
  const equipment: {
    id: string;
    version: number;
    display_number: string;
    description: string;
    identity_status: string;
    lifecycle_status: string;
  }[] = [];
  for (const id of compiled.input.scope.facility_ids) {
    const row = await visible(c, p, "Facility", id);
    if (row.company_id !== opportunity.company_id || row.site_id !== site?.id)
      throw unavailable();
    facilities.push(
      Object.freeze({ id: row.id, version: row.version, name: row.name }),
    );
  }
  for (const id of compiled.input.scope.equipment_ids) {
    const row = await visible(c, p, "Asset", id);
    if (row.company_id !== opportunity.company_id || row.site_id !== site?.id)
      throw unavailable();
    // Record uncertainty as uncertainty. Referencing an existing asset is not
    // technical verification, a lifecycle transition or implicit Facility scope.
    equipment.push(
      Object.freeze({
        id: row.id,
        version: row.version,
        display_number: row.display_number,
        description: row.description,
        identity_status: row.identity_status,
        lifecycle_status: row.lifecycle_status,
      }),
    );
  }
  if (edit) {
    for (const owner of new Set(
      compiled.open_items.map((item) => item.follow_up.owner_id),
    )) {
      // Follow-up is an independently eligible Activity owner. No Activity is
      // created/completed here, and no estimating grant is inferred for them.
      await eligibleActionOwner(c, p, scopeContext, owner);
    }
  }
  const references = Object.freeze({
    opportunity: Object.freeze({
      id: opportunity.id,
      version: opportunity.version,
      company_id: opportunity.company_id,
      site_id: opportunity.site_id,
    }),
    organisation: Object.freeze({
      id: organisation.id,
      version: organisation.version,
      display_name: organisation.display_name,
    }),
    contact: contact
      ? Object.freeze({
          id: contact.id,
          version: contact.version,
          display_name: contact.display_name,
        })
      : null,
    site: site
      ? Object.freeze({
          id: site.id,
          version: site.version,
          display_name: site.display_name,
        })
      : null,
    facilities: Object.freeze(facilities),
    equipment: Object.freeze(equipment),
  });
  const context_hash = createHash("sha256")
    .update(
      canonical({
        input_hash: compiled.content_hash,
        references,
      }),
    )
    .digest("hex");
  return Object.freeze({ compiled, references, context_hash });
}

// History callers pass the accepted original input, then return its captured
// labels only after this CURRENT access check. Do not replace old labels with
// these observations or accept a caller-provided historical snapshot as truth.
export async function readDiscoveryTargets(
  c: QueryClient,
  p: Principal,
  opportunityId: string,
  value: unknown,
  capability: EstimateCap = "estimating.read",
  retainedContactId?: string | null,
) {
  const current = await targets(c, p, opportunityId, value, false, capability);
  // CRM can change its primary contact after acceptance. Scope IDs are checked
  // from the original input above; the captured contact lives in the saved
  // references and must independently remain visible before returning history.
  // Current labels/versions do not replace or invalidate an authorised original.
  if (retainedContactId && retainedContactId !== current.references.contact?.id)
    await visible(c, p, "Person", retainedContactId);
  return current;
}

export function prepareDiscoveryTargets(
  c: QueryClient,
  p: Principal,
  opportunityId: string,
  value: unknown,
) {
  return targets(c, p, opportunityId, value, true);
}

export function expectDiscoveryContext(
  expectedHash: string,
  current: { context_hash: string },
) {
  if (
    !/^[a-f0-9]{64}$/.test(expectedHash) ||
    expectedHash !== current.context_hash
  )
    throw new AppError(
      409,
      "DiscoveryContextChanged",
      "The permitted scope context changed. Retain your proposal and compare it before saving.",
    );
}
