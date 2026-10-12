import type { Principal } from "../../platform/identity";
import { AppError } from "../../platform/errors";
import { hasPermission, type QueryClient } from "../../platform/permissions";
import {
  activityLinks,
  authoriseActivityInput,
  visibleActivity,
} from "../../activities/activities";
import { eligibleOpportunityOwner, relationshipContext } from "../context";
import { ACTIVE_PIPELINE_ID } from "../stages";
import { leadAuthority, type Lead } from "./context";
import { carriedLeadActivity } from "./conversion-context";
import {
  currentResolution,
  visibleCustomerContext,
} from "./resolution-context";

type CheckState =
  | "Complete"
  | "Missing"
  | "AskedOnConversion"
  | "ReviewRequired"
  | "Unavailable";
type Check = { key: string; state: CheckState; message: string };
async function available(check: () => Promise<unknown>) {
  try {
    await check();
    return true;
  } catch (e) {
    if (e instanceof AppError && [403, 404].includes(e.status)) return false;
    throw e;
  }
}

// A saved-context preview, never a substitute for the conversion command's
// payload, expected version, activity comparison or transactional revalidation.
export async function leadConversionReadiness(
  c: QueryClient,
  p: Principal,
  lead: Lead,
) {
  const lifecycle =
    lead.status === "Converted"
      ? "Converted"
      : lead.is_archived
        ? "Archived"
        : lead.status === "Disqualified"
          ? "Disqualified"
          : "Active";
  if (lifecycle !== "Active")
    return {
      state: "NotApplicable" as const,
      lifecycle,
      authority: "NotApplicable" as const,
      context_source: null,
      checks: [] as Check[],
    };

  const resolution = await currentResolution(c, p, lead.id);
  const context = resolution ?? lead;
  const contextVisible =
    !resolution ||
    (await available(() => visibleCustomerContext(c, p, resolution)));
  const checks: Check[] = [];
  for (const [key, value, message] of [
    ["organisation", context.organisation_id, "Select an organisation."],
    [
      "site",
      context.site_id,
      "Select a site or explain why it is unknown during conversion.",
    ],
    [
      "contact",
      context.primary_person_id,
      "Select a contact or provide an unknown reason and an owned contact-identification action during conversion.",
    ],
  ] as const)
    checks.push({
      key,
      state: !contextVisible ? "Unavailable" : value ? "Complete" : "Missing",
      message: !contextVisible
        ? "Customer context is unavailable."
        : value
          ? "Saved customer context selected; relationship checks are reported separately."
          : message,
    });
  checks.push({
    key: "requirement",
    state: lead.need_summary?.trim() ? "Complete" : "Missing",
    message: lead.need_summary?.trim()
      ? "A saved requirement is present."
      : "Describe the requirement before or during conversion.",
  });
  checks.push({
    key: "qualification_note",
    state: "AskedOnConversion",
    message: "Provide the qualification note when converting.",
  });

  let authority = await available(() =>
    leadAuthority(c, p, lead.id, "crm.lead.convert"),
  );
  authority =
    authority &&
    contextVisible &&
    (await hasPermission(
      c,
      p,
      "crm.opportunity.create",
      context.company_id,
      context.site_id ?? undefined,
    ));
  const target =
    contextVisible && context.organisation_id
      ? {
          ...context,
          organisation_id: context.organisation_id,
          owner_id: lead.owner_id,
          pipeline_definition_id: ACTIVE_PIPELINE_ID,
        }
      : null;
  const customerValid =
    target &&
    (await available(async () => {
      await relationshipContext(c, p, target, "crm.opportunity.create");
      await eligibleOpportunityOwner(c, p, target);
    }));
  checks.push({
    key: "customer_context",
    state: !contextVisible
      ? "Unavailable"
      : !target
        ? "Missing"
        : customerValid
          ? "Complete"
          : "Unavailable",
    message: customerValid
      ? "Current customer relationships and Deal owner eligibility pass."
      : "Review current customer relationships, access and Deal owner eligibility.",
  });

  // All original links matter to conversion, including completed activities.
  // Hidden IDs, counts and source details never enter this projection.
  const originals = (
    await c.query<{ activity_id: string }>(
      "SELECT activity_id FROM ppo.activity_links WHERE workspace_id=$1 AND lead_id=$2 ORDER BY activity_id",
      [p.workspace_id, lead.id],
    )
  ).rows;
  let sourceState: CheckState = "Complete";
  const next: { state: CheckState } = {
    state: lead.next_activity_id ? "Unavailable" : "Missing",
  };
  for (const { activity_id } of originals) {
    const readable = await available(async () => {
      const a = await visibleActivity(c, p, activity_id);
      const links = await activityLinks(c, p, activity_id);
      if (a.id === lead.next_activity_id)
        next.state = !["Open", "InProgress"].includes(a.status)
          ? "Missing"
          : a.company_id !== lead.company_id || a.site_id !== lead.site_id
            ? "ReviewRequired"
            : "Complete";
      await authoriseActivityInput(c, p, { ...a, links });
      if (!target) {
        if (sourceState !== "Unavailable") sourceState = "ReviewRequired";
      } else if (
        a.site_id !== target.site_id ||
        a.access_class !== "Internal"
      ) {
        if (sourceState !== "Unavailable") sourceState = "ReviewRequired";
      } else await carriedLeadActivity(c, p, { ...a, links }, target);
    });
    if (!readable) {
      sourceState = "Unavailable";
      if (activity_id === lead.next_activity_id) next.state = "Unavailable";
    }
  }
  checks.push({
    key: "next_activity",
    state: next.state,
    message:
      next.state === "Complete"
        ? "An active saved next activity is available; an undated action is allowed by the native conversion rules."
        : next.state === "Unavailable"
          ? "The next activity or its authority is unavailable."
          : "Choose an active next activity or create one during conversion.",
  });
  checks.push({
    key: "source_activities",
    state: sourceState,
    message:
      sourceState === "Complete"
        ? "The current linked activities can be carried to this customer context."
        : sourceState === "Unavailable"
          ? "Linked activity authority is unavailable; refresh access before reviewing conversion."
          : "Review source activities against the conversion context; retaining differently scoped history may require a new dated review action.",
  });
  return {
    state:
      !authority || checks.some((c) => c.state === "Unavailable")
        ? ("Unavailable" as const)
        : checks.some((c) => ["Missing", "ReviewRequired"].includes(c.state))
          ? ("NeedsAttention" as const)
          : ("ReadyForReview" as const),
    lifecycle,
    authority: authority ? ("Allowed" as const) : ("Unavailable" as const),
    context_source: resolution ? ("Resolved" as const) : ("Captured" as const),
    checks,
  };
}

type SummaryActivity = {
  id: string;
  version: number;
  summary: string;
  status: string;
  updated_at: string;
};
export function leadRecordSummary(
  lead: {
    created_at: string;
    updated_at: string;
    version: number;
    actions: SummaryActivity[];
    next_action_state: string;
  },
  observedAt: number,
) {
  const last = [...lead.actions].sort(
    (a, b) =>
      Date.parse(b.updated_at) - Date.parse(a.updated_at) ||
      a.id.localeCompare(b.id),
  )[0];
  return {
    observed_at: new Date(observedAt).toISOString(),
    lead_version: lead.version,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
    age_days: Math.max(
      0,
      Math.floor((observedAt - Date.parse(lead.created_at)) / 86_400_000),
    ),
    age_basis: "Elapsed24HourDaysSinceCapture" as const,
    activity_scope: "VisibleLinkedActivities" as const,
    last_activity_basis: "LatestActivityUpdate" as const,
    last_activity: last
      ? {
          id: last.id,
          version: last.version,
          summary: last.summary,
          status: last.status,
          updated_at: last.updated_at,
        }
      : null,
    next_action_state: lead.next_action_state,
  };
}
