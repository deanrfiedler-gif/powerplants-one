import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { AppError } from "../../platform/errors";
import {
  authoriseActivityInput,
  type ActivityInput,
} from "../../activities/activities";
import { relationshipContext, type OpportunityContext } from "../context";

// Shared by the native conversion and its read-only saved-context preview.
// This validates future targets without inserting a Deal or changing any links.
export async function carriedLeadActivity(
  c: QueryClient,
  p: Principal,
  activity: ActivityInput,
  context: OpportunityContext,
) {
  if (
    activity.site_id !== context.site_id ||
    activity.access_class !== "Internal"
  )
    throw new AppError(
      422,
      "LEAD_ACTIVITY_CONTEXT",
      "A linked activity has a different site or access context. Preserve its history and review the conversion context.",
    );
  await authoriseActivityInput(c, p, {
    ...activity,
    links: [
      ...activity.links,
      { object_type: "Organisation", object_id: context.organisation_id },
      ...(context.site_id
        ? [{ object_type: "Site" as const, object_id: context.site_id }]
        : []),
    ],
  });
  await relationshipContext(
    c,
    { ...p, actor_id: activity.owner_id },
    context,
    "crm.opportunity.read",
  );
}
