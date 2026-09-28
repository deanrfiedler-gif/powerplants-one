// Trusted complete server population. No caller-supplied candidates, site filter or
// preview digest enters this loader. All reads run inside the shared graph boundary.
import type { PoolClient, QueryResultRow } from "pg";
import type { Principal } from "../platform/identity";
import { AppError } from "../platform/errors";
import { canonical } from "../platform/operations";
import {
  blockers,
  readiness,
  scopeDetail,
  visibleWorkOrder,
} from "../service/work-orders";
import { visible } from "../shared/reads";
import { invalid } from "../shared/validation";
import {
  fitsWorkingInterval,
  matchesConfirmedContact,
  visitFitsPolicy,
} from "./booking-rules";
import {
  type PolicyChain,
  policyReference,
  type PolicyContent,
} from "./policy-chain";
import {
  evaluationDimensions,
  policyDependencies,
  type PolicyCandidate,
} from "./policy-dependencies";
import { ownerEvidence, sourceHash, sourceJSON } from "./policy-authority";
import type { PolicyProposal } from "./policy-publication-contracts";
import { digest } from "./policy-values";

type Row = QueryResultRow;
const sourceTables = [
  "appointments",
  "work_orders",
  "work_order_tickets",
  "tickets",
  "companies",
  "organisations",
  "sites",
  "people",
  "site_parties",
  "person_company_contexts",
  "scope_revisions",
  "scope_items",
  "scope_assets",
  "assets",
  "asset_configurations",
  "identification_plans",
  "coverage_assessments",
  "document_references",
  "policy_versions",
  "policy_criteria",
  "readiness_assessments",
  "assignments",
  "resource_reservations",
  "resources",
  "resource_sites",
  "working_calendars",
  "calendar_intervals",
  "calendar_exceptions",
  "availability_blocks",
  "skill_evidence",
  "resource_evidence",
  "users",
  "permission_grants",
  "contact_outcomes",
  "schedule_follow_ups",
  "activities",
  "packs",
  "pack_revisions",
  "pack_checks",
  "pack_issues",
  "pack_acknowledgements",
  "pack_issue_events",
  "pack_recipients",
  "pack_distribution_events",
  "pack_follow_ups",
  "field_attendances",
  "field_entries",
  "field_attachments",
  "field_timers",
] as const;
type Table = (typeof sourceTables)[number];
export async function policySources(c: PoolClient, p: Principal) {
  const rows = {} as Record<Table, Row[]>;
  // Single-client sequential statements retain transaction/lock ordering. Full sets
  // avoid LIMIT/pagination silently turning absence into unread evidence.
  for (const table of sourceTables)
    rows[table] = (
      await c.query(`SELECT * FROM ppo.${table} WHERE workspace_id=$1`, [
        p.workspace_id,
      ])
    ).rows;
  const keys = (
    await c.query(
      `SELECT t.relname AS name,array_agg(a.attname::text ORDER BY k.ordinality) AS keys
     FROM pg_index i JOIN pg_class t ON t.oid=i.indrelid JOIN pg_namespace n ON n.oid=t.relnamespace
     CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY k(attnum,ordinality)
     JOIN pg_attribute a ON (a.attrelid,a.attnum)=(t.oid,k.attnum)
     WHERE i.indisprimary AND n.nspname='ppo' AND t.relname=ANY($1::text[]) GROUP BY t.relname`,
      [sourceTables],
    )
  ).rows;
  const pk: Record<string, string[]> = Object.fromEntries(
    keys.map((r) => [r.name, r.keys as string[]]),
  );
  for (const table of sourceTables)
    rows[table].sort((a, b) =>
      canonical(pk[table].map((k) => a[k])).localeCompare(
        canonical(pk[table].map((k) => b[k])),
      ),
    );
  const evidence = (table: Table, selected: Row[]) =>
    selected
      .map((row) => ({
        key: canonical({
          table,
          key: Object.fromEntries(pk[table].map((k) => [k, row[k]])),
        }),
        version:
          row.version ??
          (table === "assignments" ? row.assignment_version : null),
        content_hash: sourceHash(row),
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  const by = (table: Table, key: string, value: unknown) =>
    rows[table].filter((r) => r[key] === value);
  const one = (table: Table, id: string): Row => {
    const row = by(table, "id", id)[0];
    if (!row)
      invalid("source", "A complete supported source graph is required.");
    return row;
  };
  return { rows, evidence, by, one };
}
type Sources = Awaited<ReturnType<typeof policySources>>;
export const rowReference = (row: Row, projection: unknown = row) => ({
  id: row.id as string,
  version: row.version as number,
  content_hash: sourceHash(projection),
});
export async function observationTime(c: PoolClient): Promise<string> {
  return (
    await c.query("SELECT clock_timestamp() AS at")
  ).rows[0].at.toISOString();
}
function captureRows(s: Sources, appointment: string) {
  return ["field_entries", "field_attachments", "field_timers"].flatMap((t) =>
    s.evidence(t as Table, s.by(t as Table, "appointment_id", appointment)),
  );
}
export function exclusion(s: Sources, a: Row, at: string): string | null {
  if (["Completed", "CompletedPendingReview"].includes(a.status))
    return "Completed";
  if (a.status === "Cancelled") return "Cancelled";
  if (
    a.actual_start_at ||
    a.actual_end_at ||
    a.status === "InProgress" ||
    s.by("field_attendances", "appointment_id", a.id).length ||
    captureRows(s, a.id).length
  )
    return "Started";
  if (a.status !== "Confirmed") return "NotConfirmed";
  if (a.start_at.toISOString() <= at) return "NotFuture";
  return null;
}
function overlaps(a: Row, start: Date, end: Date) {
  return a.start_at < end && a.end_at > start;
}
async function bookingBase(c: PoolClient, p: Principal, a: Row) {
  const w = await visibleWorkOrder(c, p, a.work_order_id),
    r = await scopeDetail(c, p, w, a.scope_revision_id),
    site = await visible(c, p, "Site", a.site_id),
    issues = await blockers(c, p, w, r),
    auth = await readiness(c, p, r),
    owner = await ownerEvidence(
      c,
      p,
      w.service_owner_id,
      a.company_id,
      a.site_id,
      w.id,
    );
  return { w, r, site, issues, auth, owner };
}
type EvaluationCache = Map<string, ReturnType<typeof bookingBase>>;
export async function evaluatePolicyBooking(
  c: PoolClient,
  p: Principal,
  s: Sources,
  chain: PolicyChain,
  a: Row,
  policy: Pick<
    PolicyContent,
    "max_visit_minutes" | "effective_from" | "effective_to"
  >,
  at: string,
  requireImpactOwner = true,
  cache: EvaluationCache = new Map(),
): Promise<PolicyCandidate> {
  // Reuse shared source reads only within THIS locked evaluation. Each appointment
  // still has its own complete dependencies, readiness, crew and evaluation.
  const key = `${a.work_order_id}:${a.scope_revision_id}:${a.company_id}:${a.site_id}`;
  if (!cache.has(key)) cache.set(key, bookingBase(c, p, a));
  const {
    w,
    r,
    site,
    issues: authorityIssues,
    auth,
    owner,
  } = await cache.get(key)!;
  const pin = chain.members.find((m) => m.policy.id === a.scheduling_policy_id);
  if (!pin) invalid("policy", "Unsupported or unknown booking policy pin.");
  const reasons = Object.fromEntries(
    evaluationDimensions.map((d) => [d, [] as string[]]),
  ) as Record<(typeof evaluationDimensions)[number], string[]>;
  const add = (d: keyof typeof reasons, code: string, failed: unknown) => {
    if (failed) reasons[d].push(code);
  };
  const start = a.start_at as Date,
    end = a.end_at as Date,
    observed = new Date(at);
  const fits = visitFitsPolicy(start, end, {
    ...policy,
    effective_from: new Date(policy.effective_from),
    effective_to: new Date(policy.effective_to),
  });
  if (!fits) {
    add(
      "DurationWindow",
      "CrossesEffectiveDate",
      start.toISOString() < policy.effective_from,
    );
    add(
      "DurationWindow",
      "CrossesExpiry",
      end.toISOString() > policy.effective_to,
    );
    add(
      "DurationWindow",
      "DurationLimitExceeded",
      end.getTime() - start.getTime() > policy.max_visit_minutes * 60000,
    );
  }
  add(
    "ScopeReadiness",
    "AuthorisedScopeChanged",
    w.status !== "Authorised" ||
      w.scope_revision_id !== w.authorised_scope_revision_id ||
      a.scope_revision_id !== w.authorised_scope_revision_id ||
      a.scope_version !== r.version ||
      !r.approved_at ||
      a.policy_version_id !== r.policy_version_id,
  );
  add(
    "ScopeReadiness",
    "SiteContextChanged",
    site.company_id !== a.company_id ||
      site.timezone !== a.site_timezone ||
      (r.approved_snapshot?.site &&
        r.approved_snapshot.site.version !== site.version),
  );
  add(
    "ScopeReadiness",
    "CustomerWindowExceeded",
    a.requested_window_start &&
      (start < a.requested_window_start || end > a.requested_window_end),
  );
  for (const b of authorityIssues)
    add("ScopeReadiness", `Authority:${b.field}`, true);
  const booking = await readiness(c, p, r, a.id);
  for (const x of auth)
    add(
      "ScopeReadiness",
      `AuthorityExpired:${x.criterion_code}`,
      x.valid_until && x.valid_until < end,
    );
  for (const x of booking) {
    if (x.criterion_code === "CrewCompetency")
      add("Crew", "CrewControlBlocked", x.outcome === "Blocked");
    else if (x.blocking_stage === "Booking")
      add(
        "ScopeReadiness",
        `Booking:${x.criterion_code}`,
        !["Pass", "PermittedException", "NotApplicable"].includes(x.outcome) ||
          (x.valid_until && x.valid_until < end) ||
          (x.outcome === "PermittedException" && !x.exception_allowed),
      );
  }
  const scopes = s.by("scope_revisions", "work_order_id", w.id),
    scopeIds = new Set(scopes.map((x) => x.id));
  const scopeAssets = s.rows.scope_assets.filter((x) =>
    scopeIds.has(x.scope_revision_id),
  );
  const assetIds = new Set(scopeAssets.map((x) => x.asset_id)),
    configurationIds = new Set(scopeAssets.map((x) => x.configuration_id));
  const assets = s.rows.assets.filter((x) => assetIds.has(x.id)),
    configurations = s.rows.asset_configurations.filter((x) =>
      configurationIds.has(x.id),
    );
  const approvedAssets = (r.approved_snapshot?.items ?? []).flatMap(
    (i: Row) => i.assets ?? [],
  ) as Row[];
  for (const link of scopeAssets.filter((x) => x.scope_revision_id === r.id)) {
    const asset = s.one("assets", link.asset_id),
      snapshot = approvedAssets.find((x) => x.asset_id === asset.id);
    add(
      "ScopeReadiness",
      "AssetContextChanged",
      snapshot && snapshot.asset_version !== asset.version,
    );
    add(
      "ScopeReadiness",
      "ConfigurationUnverified",
      link.configuration_id &&
        s.one("asset_configurations", link.configuration_id)
          .verification_status !== "Verified",
    );
  }
  const required = [
    ...new Set<string>(r.items.flatMap((i: Row) => i.required_skill_codes)),
  ].sort();
  const assignments = s.by("assignments", "appointment_id", a.id),
    crew = assignments
      .filter((x) => x.active)
      .sort((x, y) => x.resource_id.localeCompare(y.resource_id));
  add(
    "Crew",
    "ExplicitCrewRequired",
    !crew.length ||
      crew.length > 6 ||
      crew.filter((x) => x.crew_role === "Lead").length !== 1 ||
      new Set(crew.map((x) => x.resource_id)).size !== crew.length,
  );
  const own = s.rows.resource_reservations.filter((x) =>
    assignments.some((v) => v.id === x.assignment_id),
  );
  const competing: Row[] = [],
    resources = [];
  for (const member of crew) {
    const resource = s.one("resources", member.resource_id),
      calendar = s.one("working_calendars", resource.calendar_id);
    const before = new Date(
        start.getTime() - member.travel_before_minutes * 60000,
      ),
      after = new Date(end.getTime() + member.travel_after_minutes * 60000);
    const memberships = s.by("resource_sites", "resource_id", resource.id),
      intervals = s.by("calendar_intervals", "calendar_id", calendar.id),
      exceptions = s.by("calendar_exceptions", "calendar_id", calendar.id),
      blocks = s.by("availability_blocks", "resource_id", resource.id),
      skills = s.by("skill_evidence", "resource_id", resource.id),
      proofs = s.by("resource_evidence", "resource_id", resource.id);
    add(
      "ResourceCalendarSkills",
      "ResourceUnavailable",
      resource.company_id !== a.company_id ||
        !resource.active ||
        resource.status !== "Published" ||
        before < resource.effective_from ||
        after > resource.effective_to ||
        !memberships.some((x) => x.site_id === a.site_id) ||
        member.resource_version !== resource.version,
    );
    add(
      "ResourceCalendarSkills",
      "CalendarUnavailable",
      calendar.status !== "Published" ||
        before < calendar.effective_from ||
        after > calendar.effective_to ||
        member.calendar_version !== calendar.version ||
        !(await fitsWorkingInterval(
          c,
          p.workspace_id,
          calendar as { id: string; timezone: string },
          before,
          after,
        )),
    );
    add(
      "ResourceCalendarSkills",
      "UnavailableInterval",
      exceptions.some((x) => overlaps(x, before, after)) ||
        blocks.some((x) => x.active && overlaps(x, before, after)),
    );
    const validSkills = skills.filter(
      (x) =>
        x.active &&
        x.status === "Verified" &&
        x.valid_from <= start &&
        x.valid_to >= end &&
        x.source_as_at <= observed &&
        proofs.some(
          (e) => e.id === x.evidence_ref && e.reviewed_at <= observed,
        ),
    );
    for (const code of required)
      add(
        "ResourceCalendarSkills",
        `Skill:${code}`,
        !validSkills.some((x) => x.skill_code === code),
      );
    const linked = resource.user_id ? s.one("users", resource.user_id) : null;
    add(
      "ResourceCalendarSkills",
      "LinkedIdentityInactive",
      linked && !linked.active,
    );
    add(
      "ReservationsTravel",
      "TravelEvidenceRequired",
      !member.travel_reason?.trim() ||
        !Number.isInteger(member.travel_before_minutes) ||
        !Number.isInteger(member.travel_after_minutes),
    );
    const reservations = own.filter(
      (x) => x.assignment_id === member.id && x.active,
    );
    add(
      "ReservationsTravel",
      "ReservationChanged",
      reservations.length !== 1 ||
        reservations.some(
          (x) =>
            x.resource_id !== resource.id ||
            +x.start_at !== +before ||
            +x.end_at !== +after,
        ),
    );
    const conflicts = s.rows.resource_reservations.filter(
      (x) =>
        x.active &&
        x.resource_id === resource.id &&
        !assignments.some((v) => v.id === x.assignment_id) &&
        overlaps(x, before, after),
    );
    competing.push(...conflicts);
    add("ReservationsTravel", "ResourceConflict", conflicts.length);
    const grants = linked
      ? s.by("permission_grants", "user_id", linked.id).map((g) => ({
          ...g,
          currently_valid:
            g.valid_from <= observed && (!g.valid_to || g.valid_to > observed),
        }))
      : [];
    resources.push({
      resource: rowReference(resource),
      linked_identity: linked
        ? {
            user: {
              id: linked.id,
              version: null,
              content_hash: sourceHash(linked),
            },
            active: linked.active,
            grants: s.evidence("permission_grants", grants),
            eligible: !!linked.active,
          }
        : null,
      site_memberships: s.evidence("resource_sites", memberships),
      calendar: rowReference(calendar),
      calendar_intervals: s.evidence("calendar_intervals", intervals),
      calendar_exceptions: s.evidence("calendar_exceptions", exceptions),
      availability_blocks: s.evidence("availability_blocks", blocks),
      skill_evidence: s.evidence(
        "skill_evidence",
        skills.map((x) => ({
          ...x,
          currently_observed: x.source_as_at <= observed,
        })),
      ),
      resource_evidence: s.evidence(
        "resource_evidence",
        proofs.map((x) => ({
          ...x,
          currently_reviewed: x.reviewed_at <= observed,
        })),
      ),
    });
  }
  const followUps = s.by("schedule_follow_ups", "appointment_id", a.id);
  const changedContactPlan =
    a.booking_snapshot?.customer_review_required === true &&
    a.customer_commitment === "Changed" &&
    a.dispatch_hold &&
    a.pack_requirement === "ReviewRequired" &&
    owner.eligible &&
    followUps.some((x) => {
      const activity = s.one("activities", x.activity_id);
      return (
        x.schedule_version === a.schedule_version &&
        x.consequence === "ChangedSchedule" &&
        activity.owner_id === w.service_owner_id &&
        ["Open", "InProgress"].includes(activity.status)
      );
    });
  const contacts = s.by("contact_outcomes", "appointment_id", a.id);
  // Initial confirmation increments schedule_version and retains the exact contact
  // it accepted in booking_snapshot. A controlled move explicitly sets review=true
  // and must never reuse that initial agreement for its new dates.
  const latest =
    contacts
      .filter((x) => x.schedule_version === a.schedule_version)
      .sort(
        (x, y) => +y.created_at - +x.created_at || y.id.localeCompare(x.id),
      )[0] ??
    (a.booking_snapshot?.customer_review_required === false
      ? contacts.find((x) => x.id === a.booking_snapshot.contact_outcome_id)
      : undefined);
  const contact = site.primary_contact_id
    ? await visible(c, p, "Person", site.primary_contact_id)
    : null;
  add(
    "ContactPreparation",
    "PreparationRequired",
    a.preparation_status !== "Preparing",
  );
  add(
    "ContactPreparation",
    "CustomerContactRequired",
    !changedContactPlan &&
      (!contact ||
        !contact.active ||
        !matchesConfirmedContact(
          latest as Parameters<typeof matchesConfirmedContact>[0],
          start,
          end,
          site.primary_contact_id,
          a.customer_commitment,
        )),
  );
  // A dispatch hold is expected while a confirmed visit awaits preparation/issue.
  // It is recorded evidence, not a booking-rule failure or Step 4 impact hold.
  add("Ownership", "OwnerAuthorityRequired", !owner.eligible);
  const affected = Object.values(reasons).some((x) => x.length);
  if (requireImpactOwner && affected && !owner.eligible)
    throw new AppError(
      422,
      "ImpactOwnerRequired",
      "Every impact needs a currently eligible service owner.",
    );
  const readinessPolicy = s.one("policy_versions", a.policy_version_id),
    scopeRow = s.one("scope_revisions", r.id);
  const assessments = s.rows.readiness_assessments.filter(
    (x) =>
      scopeIds.has(x.scope_revision_id) &&
      (!x.appointment_id || x.appointment_id === a.id),
  );
  const docs = s.by("document_references", "work_order_id", w.id),
    criteria = s.by("policy_criteria", "policy_version_id", readinessPolicy.id);
  const linkedTickets = s.by("work_order_tickets", "work_order_id", w.id);
  const orderProjection = {
    ...s.one("work_orders", w.id),
    company: s.one("companies", a.company_id),
    customer: s.one("organisations", w.customer_id),
    site_parties: s.by("site_parties", "site_id", a.site_id).map((x) => ({
      ...x,
      currently_valid:
        x.valid_from <= observed && (!x.valid_to || x.valid_to > observed),
    })),
    tickets: linkedTickets
      .map((l) => ({ ...l, ticket: s.one("tickets", l.ticket_id) }))
      .sort((x, y) => x.ticket.id.localeCompare(y.ticket.id)),
  };
  const packs = s.by("packs", "appointment_id", a.id),
    packIds = new Set(packs.map((x) => x.id));
  const issues = s.rows.pack_issues.filter((x) => packIds.has(x.pack_id)),
    issueIds = new Set(issues.map((x) => x.id));
  const issueEvents = s.rows.pack_issue_events.filter((x) =>
      issueIds.has(x.issue_id),
    ),
    eventIds = new Set(issueEvents.map((x) => x.id));
  const recipients = s.rows.pack_recipients.filter((x) =>
      issueIds.has(x.issue_id),
    ),
    recipientIds = new Set(recipients.map((x) => x.id));
  const prep = [
    ...s.evidence("packs", packs),
    ...["pack_revisions", "pack_checks", "pack_issues"].flatMap((t) =>
      s.evidence(
        t as Table,
        s.rows[t as Table].filter((x) => packIds.has(x.pack_id)),
      ),
    ),
    ...s.evidence("pack_issue_events", issueEvents),
    ...s.evidence("pack_recipients", recipients),
    ...s.evidence(
      "pack_acknowledgements",
      s.rows.pack_acknowledgements.filter((x) =>
        recipientIds.has(x.recipient_id),
      ),
    ),
    ...s.evidence(
      "pack_distribution_events",
      s.rows.pack_distribution_events.filter((x) =>
        recipientIds.has(x.recipient_id),
      ),
    ),
    ...s.evidence(
      "pack_follow_ups",
      s.rows.pack_follow_ups.filter((x) => eventIds.has(x.issue_event_id)),
    ),
  ];
  const d = policyDependencies(
    sourceJSON({
      schema_version: 1,
      workspace_id: p.workspace_id,
      family: chain.family,
      root_policy_id: chain.root_policy_id,
      booking: {
        appointment: rowReference(a),
        company_id: a.company_id,
        site_id: a.site_id,
        work_order_id: a.work_order_id,
        schedule_version: a.schedule_version,
        assignment_version: a.assignment_version,
        status: a.status,
        start_at: start,
        end_at: end,
        site_timezone: a.site_timezone,
        requested_window_start: a.requested_window_start,
        requested_window_end: a.requested_window_end,
        scheduling_policy: policyReference(pin.policy),
        scope_revision: rowReference(scopeRow),
        readiness_policy: rowReference(readinessPolicy, {
          ...readinessPolicy,
          criteria,
        }),
        actual_start_at: a.actual_start_at,
        actual_end_at: a.actual_end_at,
        attendance: s.evidence(
          "field_attendances",
          s.by("field_attendances", "appointment_id", a.id),
        ),
        captures: captureRows(s, a.id),
      },
      ownership: {
        work_order: rowReference(s.one("work_orders", w.id), orderProjection),
        service_owner: owner,
        proposed_impact_owner: affected ? owner : null,
      },
      scope_readiness: {
        current_scope: rowReference(
          s.one("scope_revisions", w.scope_revision_id!),
          {
            scopes: scopes.sort((x, y) => x.id.localeCompare(y.id)),
            plans: s.rows.identification_plans
              .filter((x) => scopeIds.has(x.scope_revision_id))
              .sort((x, y) => x.id.localeCompare(y.id)),
            coverage: s
              .by("coverage_assessments", "work_order_id", w.id)
              .sort((x, y) => x.id.localeCompare(y.id)),
          },
        ),
        authorised_scope: w.authorised_scope_revision_id
          ? rowReference(
              s.one("scope_revisions", w.authorised_scope_revision_id),
            )
          : null,
        approved_snapshot_hash: sourceHash(r.approved_snapshot),
        site: rowReference(site),
        assets: s.evidence("assets", assets),
        configurations: s.evidence("asset_configurations", configurations),
        scope_items: s.evidence(
          "scope_items",
          s.rows.scope_items.filter((x) => scopeIds.has(x.scope_revision_id)),
        ),
        scope_assets: s.evidence("scope_assets", scopeAssets),
        required_skill_codes: required,
        readiness_policy: rowReference(readinessPolicy, {
          ...readinessPolicy,
          criteria,
        }),
        authorisation_controls: [
          ...s.evidence(
            "readiness_assessments",
            assessments.filter((x) => !x.appointment_id),
          ),
          ...s.evidence("document_references", docs),
          ...s.evidence("policy_criteria", auth),
        ],
        booking_controls: [
          ...s.evidence(
            "readiness_assessments",
            assessments.filter((x) => x.appointment_id),
          ),
          ...s.evidence("policy_criteria", booking),
        ],
      },
      crew: crew.map((m) => ({
        assignment: {
          id: m.id,
          version: m.assignment_version,
          content_hash: sourceHash(m),
        },
        resource_id: m.resource_id,
        active: m.active,
        crew_role: m.crew_role,
        travel_before_minutes: m.travel_before_minutes,
        travel_after_minutes: m.travel_after_minutes,
        travel_reason: m.travel_reason,
      })),
      reservations: {
        own: s.evidence("resource_reservations", own),
        competing: s.evidence("resource_reservations", [
          ...new Map(competing.map((x) => [x.id, x])).values(),
        ]),
      },
      resources,
      contact_preparation: {
        primary_contact: contact
          ? rowReference(contact, {
              ...contact,
              company_contexts: s.by(
                "person_company_contexts",
                "person_id",
                contact.id,
              ),
            })
          : null,
        contact_outcomes: contacts.map((x) => rowReference(x)),
        latest_contact_id: latest?.id ?? null,
        customer_commitment: a.customer_commitment,
        preparation_status: a.preparation_status,
        dispatch_hold: a.dispatch_hold,
        pack_requirement: a.pack_requirement,
        preparation_evidence: prep,
        follow_ups: [
          ...s.evidence("schedule_follow_ups", followUps),
          ...s.evidence(
            "activities",
            followUps.map((x) => s.one("activities", x.activity_id)),
          ),
        ],
      },
    }),
  );
  const checks = evaluationDimensions
    .map((dimension) => ({
      dimension,
      outcome: reasons[dimension].length
        ? ("Blocked" as const)
        : ("Pass" as const),
      reasons: [...new Set(reasons[dimension])].sort(),
    }))
    .sort((x, y) => x.dimension.localeCompare(y.dimension));
  return {
    dependencies: d,
    evaluation: { outcome: affected ? "ImpactRequired" : "Compliant", checks },
    impact_owner_id: affected ? owner.user.id : null,
    impact_reason: affected
      ? checks.flatMap((x) => x.reasons).join("; ")
      : null,
  };
}

// A time-only transition is a source change even when no row version changes.
export function nextPolicyBoundary(
  s: Sources,
  at: string,
  appointments: Row[],
) {
  const timed = [
    "valid_from",
    "valid_to",
    "valid_until",
    "source_as_at",
    "reviewed_at",
    "effective_from",
    "effective_to",
  ];
  return [
    ...appointments.map((a) => a.start_at.toISOString()),
    ...sourceTables.flatMap((t) =>
      s.rows[t].flatMap((row) =>
        timed.map((key) =>
          row[key] instanceof Date ? row[key].toISOString() : null,
        ),
      ),
    ),
  ]
    .filter((value): value is string => typeof value === "string" && value > at)
    .sort()[0];
}

export async function loadPolicyPopulation(
  c: PoolClient,
  p: Principal,
  chain: PolicyChain,
  proposal: PolicyProposal,
) {
  const at = await observationTime(c),
    s = await policySources(c, p),
    exclusions = [],
    candidates: Row[] = [];
  for (const a of s.rows.appointments.sort(
    (x, y) => +x.start_at - +y.start_at || x.id.localeCompare(y.id),
  )) {
    if (
      a.end_at.toISOString() <= proposal.effective_from ||
      a.start_at.toISOString() >= proposal.fixed_terms.effective_to
    )
      continue;
    const reason = exclusion(s, a, at);
    if (reason)
      exclusions.push({
        appointment: rowReference(a),
        reason,
        attendance: s.evidence(
          "field_attendances",
          s.by("field_attendances", "appointment_id", a.id),
        ),
        captures: captureRows(s, a.id),
      });
    else candidates.push(a);
  }
  if (candidates.length > 200)
    invalid(
      "population",
      "The complete population exceeds the supported limit; no review was created.",
    );
  // Same sorted resource-lock order as confirm/move after the shared workspace lock.
  const ids = new Set(candidates.map((a) => a.id));
  for (const resource of [
    ...new Set<string>(
      s.rows.assignments
        .filter((x) => ids.has(x.appointment_id) && x.active)
        .map((x) => x.resource_id),
    ),
  ].sort())
    await c.query(
      "SELECT id FROM ppo.resources WHERE workspace_id=$1 AND id=$2 FOR UPDATE",
      [p.workspace_id, resource],
    );
  const population = [],
    cache: EvaluationCache = new Map();
  for (const a of candidates)
    population.push(
      await evaluatePolicyBooking(
        c,
        p,
        s,
        chain,
        a,
        {
          max_visit_minutes: proposal.max_visit_minutes,
          effective_from: proposal.effective_from,
          effective_to: proposal.fixed_terms.effective_to,
        },
        at,
        true,
        cache,
      ),
    );
  // A clock transition during a long evaluation cannot be accepted using the
  // earlier observation. Include both activation and expiry instants of relevant
  // evidence; ordinary mutations are already serialised by the graph lock.
  const scopes = new Set(candidates.map((a) => a.scope_revision_id));
  const resources = new Set(
    population.flatMap((x) => x.dependencies.crew.map((m) => m.resource_id)),
  );
  const instants = [
    proposal.effective_from,
    nextPolicyBoundary(s, at, candidates),
    ...candidates.map((a) => a.start_at.toISOString()),
    ...s.rows.readiness_assessments
      .filter(
        (x) =>
          scopes.has(x.scope_revision_id) &&
          (!x.appointment_id || ids.has(x.appointment_id)),
      )
      .flatMap((x) => [x.valid_until?.toISOString()]),
    ...s.rows.skill_evidence
      .filter((x) => resources.has(x.resource_id))
      .map((x) => x.source_as_at.toISOString()),
    ...s.rows.resource_evidence
      .filter((x) => resources.has(x.resource_id))
      .map((x) => x.reviewed_at.toISOString()),
  ]
    .filter((value): value is string => typeof value === "string" && value > at)
    .sort();
  return {
    observed_at: at,
    population,
    exclusions,
    exclusions_hash: digest(exclusions),
    recheck_before: instants[0],
  };
}
