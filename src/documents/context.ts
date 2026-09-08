import type { Principal } from "../platform/identity";
import {
  type Capability,
  type QueryClient,
  hasPermission,
  requireCapability,
} from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import { visibleAppointment } from "../scheduling/planner";
import { scopeDetail, blockers, readiness } from "../service/work-orders";
import { visible } from "../shared/reads";
import { canonical } from "../platform/operations";
import { documentStore, digest } from "./store";
import { type PackSnapshot, rendererVersion } from "./render";
import {
  completionInstructions,
  supportedTemplateDefinition,
} from "./p11-template";
import type { PackInput } from "./validation";
export const fail = (message: string, code = "PackNotReady"): never => {
  throw new AppError(422, code, message);
};
export async function packContext(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: Capability = "pack.read",
) {
  await requireCapability(c, p, cap);
  const pack = (
    await c.query("SELECT * FROM ppo.packs WHERE workspace_id=$1 AND id=$2", [
      p.workspace_id,
      id,
    ])
  ).rows[0];
  if (!pack) throw unavailable();
  const { a, w } = await visibleAppointment(c, p, pack.appointment_id, cap);
  if (
    !(await hasPermission(c, p, "pack.prepare", a.company_id, a.site_id)) &&
    !(await hasPermission(c, p, "pack.issue", a.company_id, a.site_id)) &&
    !(await hasPermission(c, p, "pack.check", a.company_id, a.site_id))
  ) {
    const assigned = await c.query(
      "SELECT 1 FROM ppo.assignments x JOIN ppo.resources r ON (r.workspace_id,r.id)=(x.workspace_id,x.resource_id) WHERE x.workspace_id=$1 AND x.appointment_id=$2 AND x.active AND x.assignment_version=$3 AND r.user_id=$4 AND r.active",
      [p.workspace_id, a.id, a.assignment_version, p.actor_id],
    );
    if (!assigned.rowCount) throw unavailable();
  }
  return { pack, a, w };
}
export async function issueContext(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: Capability = "pack.read",
) {
  await requireCapability(c, p, cap);
  const issue = (
    await c.query(
      "SELECT * FROM ppo.pack_issues WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, id],
    )
  ).rows[0];
  if (!issue) throw unavailable();
  const ctx = await packContext(c, p, issue.pack_id, cap);
  if (
    !(await hasPermission(
      c,
      p,
      "pack.issue",
      ctx.a.company_id,
      ctx.a.site_id,
    )) &&
    !(await hasPermission(
      c,
      p,
      "pack.prepare",
      ctx.a.company_id,
      ctx.a.site_id,
    )) &&
    !(await hasPermission(c, p, "pack.check", ctx.a.company_id, ctx.a.site_id))
  ) {
    if (
      !(
        await c.query(
          "SELECT 1 FROM ppo.pack_recipients pr JOIN ppo.assignments x ON x.id=pr.assignment_id WHERE pr.workspace_id=$1 AND pr.issue_id=$2 AND pr.user_id=$3 AND x.active AND x.assignment_version=$4",
          [p.workspace_id, id, p.actor_id, ctx.a.assignment_version],
        )
      ).rowCount
    )
      throw unavailable();
  }
  return { ...ctx, issue };
}
export async function availableSources(
  c: QueryClient,
  p: Principal,
  company: string,
  site: string,
) {
  return (
    await c.query(
      "SELECT s.id,s.title,s.version_id,s.content_hash,s.byte_count,l.display_name,l.available FROM ppo.pack_sources s JOIN ppo.pack_source_locations l ON (l.workspace_id,l.source_id)=(s.workspace_id,s.id) WHERE s.workspace_id=$1 AND s.company_id=$2 AND s.site_id=$3 AND s.access_class='RestrictedService' ORDER BY s.title,s.id",
      [p.workspace_id, company, site],
    )
  ).rows;
}
export async function authority(
  c: QueryClient,
  p: Principal,
  appointmentId: string,
  allowStarted = false,
) {
  const { a, w } = await visibleAppointment(c, p, appointmentId),
    r = await scopeDetail(c, p, w, a.scope_revision_id);
  if (
    (!allowStarted && (a.status !== "Confirmed" || a.actual_start_at)) ||
    (allowStarted && !["Confirmed", "InProgress"].includes(a.status)) ||
    a.actual_end_at
  )
    fail("A confirmed, unstarted appointment is required.");
  if (
    w.status !== "Authorised" ||
    w.scope_revision_id !== w.authorised_scope_revision_id ||
    a.scope_revision_id !== w.authorised_scope_revision_id ||
    !r.approved_at ||
    a.scope_version !== r.version
  )
    fail(
      "Review the current authorised scope. A successor Draft gives no extra-work authority.",
      "ScopeReviewRequired",
    );
  const b = await blockers(c, p, w, r);
  if (b.length)
    throw new AppError(
      422,
      "PackNotReady",
      "Mandatory authority requires review.",
      b,
    );
  const site = await visible(c, p, "Site", a.site_id);
  if (r.approved_snapshot?.site?.version !== site.version)
    fail("Site source changed since authority review.", "StaleSource");
  const controls = [
    ...(await readiness(c, p, r)),
    ...(await readiness(c, p, r, a.id)),
  ];
  for (const x of controls.filter(
    (x) =>
      x.blocking_stage === "Authorisation" ||
      x.criterion_code === "ToolPreparation",
  )) {
    if (
      !["Pass", "NotApplicable", "PermittedException"].includes(x.outcome) ||
      (x.valid_until && x.valid_until < a.end_at)
    )
      fail(`${x.label}: current evidence through visit end is required.`);
  }
  const members = (
    await c.query(
      `SELECT x.*,r.name,r.user_id,r.active AS resource_active,r.effective_from,r.effective_to,u.active AS user_active FROM ppo.assignments x JOIN ppo.resources r ON (r.workspace_id,r.id)=(x.workspace_id,x.resource_id) LEFT JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.user_id) WHERE x.workspace_id=$1 AND x.appointment_id=$2 AND x.active ORDER BY x.resource_id`,
      [p.workspace_id, a.id],
    )
  ).rows;
  if (
    !members.length ||
    members.filter((x) => x.crew_role === "Lead").length !== 1
  )
    fail("The complete current crew is required.");
  const required: string[] = [
    ...new Set<string>(
      r.items.flatMap(
        (i: { required_skill_codes: string[] }) => i.required_skill_codes,
      ),
    ),
  ];
  for (const x of members) {
    if (
      !x.user_id ||
      !x.user_active ||
      !x.resource_active ||
      x.effective_to < a.end_at ||
      x.assignment_version !== a.assignment_version
    )
      fail(
        "Every crew member requires a current individual recipient identity and assignment.",
      );
    const recipient = { ...p, actor_id: x.user_id };
    for (const cap of [
      "pack.read",
      "pack.acknowledge",
      "schedule.read",
      "service.work_order.read",
      "service.ticket.read",
      "shared.read",
    ] as const)
      if (!(await hasPermission(c, recipient, cap, a.company_id, a.site_id)))
        fail(
          "A required crew recipient no longer has current access.",
          "RecipientUnavailable",
        );
    const skills = (
      await c.query(
        "SELECT skill_code FROM ppo.skill_evidence WHERE workspace_id=$1 AND resource_id=$2 AND active AND status='Verified' AND valid_from<=$3 AND valid_to>=$4",
        [p.workspace_id, x.resource_id, a.start_at, a.end_at],
      )
    ).rows;
    for (const skill of required)
      if (!skills.some((s) => s.skill_code === skill))
        fail("Every crew member requires current competency evidence.");
  }
  const policy = (
    await c.query(
      "SELECT * FROM ppo.scheduling_policies WHERE workspace_id=$1 AND id=$2 AND effective_from<=clock_timestamp() AND effective_to>=greatest(clock_timestamp(),$3)",
      [p.workspace_id, a.scheduling_policy_id, a.end_at],
    )
  ).rows[0];
  if (!policy)
    fail("The scheduling policy is unavailable.", "PolicyUnavailable");
  return { a, w, r, site, controls, members };
}
export async function snapshot(
  c: QueryClient,
  p: Principal,
  appointmentId: string,
  reference: string,
  revision: number,
  input: PackInput,
): Promise<PackSnapshot> {
  const { a, w, r, site, controls, members } = await authority(
      c,
      p,
      appointmentId,
    ),
    customer = await visible(c, p, "Organisation", w.customer_id);
  const template = (
    await c.query(
      "SELECT t.*,p.version AS policy_version FROM ppo.pack_templates t JOIN ppo.pack_policy p ON (p.workspace_id,p.template_id)=(t.workspace_id,t.id) WHERE t.workspace_id=$1",
      [p.workspace_id],
    )
  ).rows[0];
  if (
    !template ||
    template.renderer_version !== rendererVersion ||
    template.definition !==
      (await supportedTemplateDefinition("OUT-09", template.version)) ||
    template.content_hash !== digest(template.definition)
  )
    fail("The exact supported template is unavailable.", "TemplateUnavailable");
  const sources: PackSnapshot["sources"] = [];
  for (const id of input.source_ids) {
    const s = (
      await c.query(
        "SELECT s.*,l.version AS location_version,l.available FROM ppo.pack_sources s JOIN ppo.pack_source_locations l ON (l.workspace_id,l.source_id)=(s.workspace_id,s.id) WHERE s.workspace_id=$1 AND s.id=$2 AND s.company_id=$3 AND s.site_id=$4 AND s.access_class='RestrictedService'",
        [p.workspace_id, id, a.company_id, a.site_id],
      )
    ).rows[0];
    if (!s) throw unavailable();
    if (!s.available)
      fail(
        "An exact selected technical source is unavailable. Restore it or prepare a reviewed successor.",
        "StaleSource",
      );
    const bytes = await documentStore().read(
      { ...p, operation_id: s.item_id },
      {
        provider: "Synthetic",
        tenant_id: null,
        site_id: null,
        drive_id: null,
        item_id: s.item_id,
        version_id: s.version_id,
        sha256: s.content_hash,
      },
    );
    if (bytes.byteLength !== s.byte_count)
      fail("Technical source byte count changed.", "StaleSource");
    sources.push({
      id: s.id,
      title: s.title,
      item_id: s.item_id,
      version_id: s.version_id,
      hash: s.content_hash,
      byte_count: s.byte_count,
      text: Buffer.from(bytes).toString("utf8"),
      location_version: s.location_version,
    });
  }
  if (!sources.length) fail("Select at least one exact technical source.");
  const history: {
    id: string;
    kind: string;
    summary: string;
    confidence: string;
    occurred_at: Date;
  }[] = [];
  for (const id of input.history_ids) {
    const h = (
      await c.query(
        "SELECT id,kind,summary,confidence,occurred_at FROM ppo.history_records WHERE workspace_id=$1 AND id=$2 AND company_id=$3 AND site_id=$4 AND access_class IN ('RestrictedService','CustomerApproved')",
        [p.workspace_id, id, a.company_id, a.site_id],
      )
    ).rows[0];
    if (!h) throw unavailable();
    history.push(h);
  }
  const contact = site.primary_contact_id
    ? await visible(c, p, "Person", site.primary_contact_id)
    : null;
  const items = r.items as {
    id: string;
    sequence: number;
    task_description: string;
    task_kind: string;
    completion_requirements: string;
    shutdown_condition: string;
    assets: {
      asset_id: string;
      display_number: string;
      description: string;
      identity_status: string;
      serial: string;
      configuration_description: string;
      method: string;
      limits: string;
    }[];
  }[];
  const text = (v: unknown) => String(v ?? "Not recorded");
  const equipment = items
    .flatMap((i) => i.assets)
    .map(
      (x) =>
        `${x.display_number}: ${x.description}\nIdentity: ${x.identity_status}; serial: ${text(x.serial)}\nConfiguration: ${text(x.configuration_description)}${x.method ? `\nIdentification only: ${x.method}; limits: ${x.limits}` : ""}`,
    )
    .join("\n\n");
  const controlText = controls
    .filter(
      (x) =>
        x.blocking_stage === "Authorisation" ||
        x.criterion_code === "ToolPreparation",
    )
    .map(
      (x) =>
        `${x.label}: ${x.outcome}. ${x.reason ?? ""}\nEvidence: ${x.evidence_title ?? "Not recorded"}; ${x.evidence_hash ?? ""}`,
    )
    .join("\n\n");
  const body: Record<string, string> = {
    identification: `${w.display_number} · ${a.display_number}\n${customer.display_name}\n${site.display_name}\n${new Date(a.start_at).toISOString()} to ${new Date(a.end_at).toISOString()} (UTC); site timezone ${a.site_timezone}\nCrew: ${members.map((x) => `${x.name} (${x.crew_role})`).join(", ")}`,
    customer_arrangements: `Location: ${site.location_description}\nContact: ${contact ? `${contact.display_name}; ${text(contact.phone)}; ${text(contact.email)}` : "Not recorded"}\nAccess: ${text(site.access_instructions)}\nDate agreement: ${a.customer_commitment}. This is not pack acknowledgement.`,
    scope: `Approved scope r${String(r.revision).padStart(2, "0")}: ${r.summary}\nExclusions: ${r.exclusions}\nDiagnostic limits: ${text(r.diagnostic_limit)}\n\n${items.map((i) => `${i.sequence}. ${i.task_kind}: ${i.task_description}\nCompletion: ${i.completion_requirements}\nShutdown condition: ${text(i.shutdown_condition)}`).join("\n\n")}`,
    equipment,
    history: history.length
      ? history
          .map((h) => `${h.kind} (${h.confidence}): ${h.summary}`)
          .join("\n\n")
      : "No service-audience history selected. The preparation notes must explain the review or relevant absence.",
    technical_information: sources
      .map(
        (s) =>
          `${s.title}\nVersion ${s.version_id}; SHA-256 ${s.hash}\n${s.text}`,
      )
      .join("\n\n"),
    readiness: controlText,
    site_controls: `Access: ${text(site.access_instructions)}\nBiosecurity: ${text(site.biosecurity_notes)}\n${controlText}\nStop if site access, isolation, shutdown authority or competency cannot be confirmed. Tool-preparation exceptions do not waive these controls.`,
    completion: `${items.map((i) => `${i.sequence}. ${i.completion_requirements}`).join("\n")}\nRecord unresolved work and escalate to the preparation owner. This pack does not grant authority outside the approved scope. ${template.version === 1 ? "Use My Jobs for online capture. Completion remains a draft; offline, reviewed reports and Finance remain incomplete." : completionInstructions}`,
  };
  const evidence = controls
    .filter((x) => x.evidence_ref)
    .map((x) => ({
      id: x.evidence_ref as string,
      hash: x.evidence_hash as string,
    }));
  if (r.authority)
    evidence.push({ id: r.authority.id, hash: r.authority.content_hash });
  return {
    schema_version: 1,
    synthetic: true,
    pack_reference: reference,
    revision,
    appointment: {
      id: a.id,
      reference: a.display_number,
      version: a.version,
      schedule_version: a.schedule_version,
      assignment_version: a.assignment_version,
      start_at: a.start_at.toISOString(),
      end_at: a.end_at.toISOString(),
      timezone: a.site_timezone,
      booking_hash: (a as typeof a & { booking_hash: string }).booking_hash,
    },
    work: {
      id: w.id,
      reference: w.display_number,
      version: w.version,
      scope_id: r.id,
      scope_version: r.version,
      scope_hash: r.content_hash,
    },
    site: { id: site.id, version: site.version, name: site.display_name },
    customer: {
      id: customer.id,
      version: customer.version,
      name: customer.display_name,
    },
    template: {
      id: template.id,
      version: template.version,
      hash: template.content_hash,
      policy_version: template.policy_version,
      renderer_version: template.renderer_version,
    },
    recipients: members.map((x) => ({
      assignment_id: x.id,
      assignment_version: x.assignment_version,
      resource_id: x.resource_id,
      user_id: x.user_id,
      name: x.name,
      role: x.crew_role,
    })),
    sources,
    history: history.map((h) => ({ id: h.id, hash: digest(canonical(h)) })),
    evidence,
    sections: Object.fromEntries(
      Object.keys(body).map((k) => [
        k,
        {
          text: body[k],
          notes: input.sections[k as keyof PackInput["sections"]],
          source_ids:
            k === "technical_information"
              ? sources.map((s) => s.id)
              : k === "history"
                ? history.map((h) => h.id)
                : [r.id],
        },
      ]),
    ) as PackSnapshot["sections"],
  };
}
