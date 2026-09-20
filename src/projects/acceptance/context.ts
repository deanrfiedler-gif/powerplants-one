import { createHash } from "node:crypto";
import type { Principal } from "../../platform/identity";
import { AppError, unavailable } from "../../platform/errors";
import { canonical } from "../../platform/operations";
import { hasPermission, type QueryClient } from "../../platform/permissions";
import { projectRow } from "../service";
import {
  commissioningAccess,
  loadRecords,
  loadSources,
} from "../../engineering/commissioning/context";
import {
  capabilities,
  type Duty,
  type ProjectContext,
  type SourceDetails,
  type SourceFacts,
  type Stage,
  type Detail,
  type Requirement,
  type Unit,
  type Obligation,
  type Decision,
  type Manifest,
  type ResponseRecord,
} from "./model";
import { closeoutGates, requirementGates, requirementOutcome } from "./policy";
export const hash = (x: unknown) =>
  createHash("sha256").update(canonical(x)).digest("hex");
export const iso = (x: Date | string | null) =>
  x instanceof Date ? x.toISOString() : x;
export const fail = (
  message: string,
  code = "AcceptanceGate",
  status = 422,
): never => {
  throw new AppError(status, code, message);
};
export const versionCheck = (actual: number, expected: number) => {
  if (actual !== expected)
    fail(
      "The reviewed facts changed. Your entries are retained. Refresh and review the changes before making a new decision.",
      "VersionConflict",
      409,
    );
};
export async function access(
  c: QueryClient,
  p: Principal,
  projectId: string,
  duty?: Duty,
) {
  const project = (await projectRow(
    c,
    p,
    projectId,
  )) as unknown as ProjectContext;
  const held = new Set(
    (
      await c.query<{ capability: string }>(
        `SELECT DISTINCT g.capability FROM ppo.permission_grants g JOIN ppo.users u ON u.workspace_id=g.workspace_id AND u.id=g.user_id WHERE g.workspace_id=$1 AND g.user_id=$2 AND u.active AND g.capability=ANY($3::text[]) AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp()) AND (g.scope_type='Workspace' OR (g.company_id=$4 AND (g.scope_type='Company' OR (g.scope_type='Site' AND g.site_id=$5::uuid))))`,
        [
          p.workspace_id,
          p.actor_id,
          Object.values(capabilities),
          project.company_id,
          project.site_id,
        ],
      )
    ).rows.map((g) => g.capability),
  );
  const can = Object.fromEntries(
    Object.entries(capabilities).map(([k, v]) => [k, held.has(v)]),
  ) as Record<Duty, boolean>;
  if (duty && !can[duty]) throw unavailable();
  return { project, can };
}
export async function stageRow(c: QueryClient, p: Principal, id: string) {
  const r = (
    await c.query<Stage & { company_id: string }>(
      "SELECT s.*,s.due::text,u.display_name AS owner_name FROM ppo.acceptance_stages s JOIN ppo.users u ON (u.workspace_id,u.id)=(s.workspace_id,s.owner_id) WHERE s.workspace_id=$1 AND s.id=$2",
      [p.workspace_id, id],
    )
  ).rows[0];
  if (!r) throw unavailable();
  await projectRow(c, p, r.project_id);
  return { ...r, updated_at: iso(r.updated_at)! };
}
export async function member(
  c: QueryClient,
  p: Principal,
  projectId: string,
  userId: string,
  duty?: Duty,
) {
  const u = (
    await c.query<{ id: string; display_name: string }>(
      "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2 AND active",
      [p.workspace_id, userId],
    )
  ).rows[0];
  if (!u) throw unavailable();
  await access(
    c,
    { ...p, actor_id: u.id, display_name: u.display_name },
    projectId,
    duty,
  );
  return u;
}
export type SourceRow = {
  id: string;
  project_id: string;
  version: number;
  adapter: SourceFacts["adapter"];
  commissioning_id: string | null;
  scope_key: string | null;
  title: string;
  kind: string;
  outcome: SourceFacts["outcome"];
  availability: SourceFacts["availability"];
  details: SourceDetails;
  public_reference: string;
  source_version: string;
  updated_at: string;
};
export async function sourcesFor(
  c: QueryClient,
  p: Principal,
  project: ProjectContext,
): Promise<SourceFacts[]> {
  const rows = (
    await c.query<SourceRow>(
      "SELECT * FROM ppo.acceptance_sources WHERE workspace_id=$1 AND project_id=$2 ORDER BY id",
      [p.workspace_id, project.id],
    )
  ).rows;
  const finance = await hasPermission(
    c,
    p,
    "finance.read",
    project.company_id,
    project.site_id,
  );
  const loaded = new Map<string, Awaited<ReturnType<typeof loadRecords>>>();
  const result: SourceFacts[] = [];
  for (const s of rows) {
    let item: SourceFacts = {
      id: s.id,
      version: s.version,
      adapter: s.adapter,
      title: s.title,
      kind: s.kind,
      availability: s.availability,
      outcome: s.outcome,
      reference: s.public_reference,
      source_version: s.source_version,
      fingerprint: hash(s),
      href: null,
      explanation: s.details.evidence ?? "Source evidence is required.",
      tests_accepted: s.details.tests_accepted ?? null,
      tests_required: s.details.tests_required ?? null,
      release_id: null,
      release_hash: null,
      details: s.kind === "Commercial" && !finance ? {} : s.details,
    };
    if (s.kind === "Commercial" && !finance)
      item = {
        ...item,
        title: "Commercial source",
        explanation:
          "Commercial disposition is recorded independently by its authorised reviewer.",
      };
    if (s.availability === "Restricted")
      item = {
        ...item,
        title: "Restricted requirement source",
        reference: "",
        source_version: "",
        explanation:
          "Required source is restricted. Its owner must resolve access.",
        details: {},
        tests_accepted: null,
        tests_required: null,
      };
    if (s.adapter === "EN08" && s.commissioning_id) {
      try {
        const raw = (
          await c.query<{ package_id: string }>(
            "SELECT package_id FROM ppo.commissioning_packages WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, s.commissioning_id],
          )
        ).rows[0];
        if (!raw) throw unavailable();
        const a = await commissioningAccess(c, p, raw.package_id);
        if (a.pkg.context_kind !== "Project" || a.pkg.context_id !== project.id)
          throw unavailable();
        if (!loaded.has(raw.package_id))
          loaded.set(
            raw.package_id,
            await loadRecords(c, p, a, await loadSources(c, p, a)),
          );
        const r = loaded
          .get(raw.package_id)!
          .find((x) => x.row.id === s.commissioning_id);
        if (
          !r ||
          !s.scope_key ||
          !r.scope.items.some(
            (x) => x.key === s.scope_key && x.disposition === "Included",
          )
        )
          throw unavailable();
        const coverage = r.coverageFor(new Set([s.scope_key]));
        const hard =
          r.facts.holds_open > 0 ||
          r.facts.defects_open > 0 ||
          coverage.failed > 0;
        const released =
          r.release?.state === "Issued" &&
          r.release.included.includes(s.scope_key) &&
          r.facts.release_applicability === "Current" &&
          r.facts.redlines_to_incorporate === 0 &&
          r.facts.redlines_review === 0 &&
          r.facts.reconciliation === "Reconciled";
        const availability =
          r.condition.condition === "Current"
            ? "Current"
            : r.condition.condition === "Restricted"
              ? "Restricted"
              : r.condition.condition === "Unavailable"
                ? "Unavailable"
                : r.condition.condition === "NotCaptured"
                  ? "Not checked"
                  : "Changed";
        item = {
          ...item,
          availability,
          outcome: hard
            ? "Blocked"
            : released &&
                coverage.required > 0 &&
                coverage.accepted === coverage.required
              ? "Satisfied"
              : "Outstanding",
          tests_accepted: coverage.accepted,
          tests_required: coverage.required,
          explanation:
            r.redlines
              .filter((x) => x.state === "AcceptedForIncorporation")
              .map(
                (x) =>
                  `${s.details.evidence ?? s.title} EN-08 source ${x.reference}: incorporation and verification required.`,
              )
              .join("; ") || r.next.label,
          source_version: `${r.row.reference} scope ${r.scope.scope_number} · v${r.row.version}`,
          href: `/engineering/commissioning/configuration?package=${raw.package_id}&record=${r.row.id}`,
          release_id: released ? r.release!.id : null,
          release_hash: released ? r.release!.manifest_hash : null,
          fingerprint: hash({
            version: r.row.version,
            scope: r.scope.content_hash,
            condition: r.condition,
            coverage,
            release: r.release && {
              id: r.release.id,
              version: r.release.version,
              state: r.release.state,
              hash: r.release.manifest_hash,
            },
            redlines: r.redlines.map((x) => [x.id, x.version, x.state]),
            facts: r.facts,
          }),
          details: {},
        };
      } catch (e) {
        if (!(e instanceof AppError && [403, 404].includes(e.status))) throw e;
        item = {
          ...item,
          title: "Unavailable technical source",
          availability: "Restricted",
          outcome: "Cannot assess",
          reference: "",
          source_version: "",
          href: null,
          explanation:
            "The exact source or current source access is unavailable.",
          tests_accepted: null,
          tests_required: null,
          details: {},
        };
      }
    }
    result.push(item);
  }
  return result;
}
export async function projectUnits(
  c: QueryClient,
  p: Principal,
  projectId: string,
) {
  const units = (
    await c.query<Unit>(
      "SELECT * FROM ppo.acceptance_units WHERE workspace_id=$1 AND project_id=$2 ORDER BY reference,id",
      [p.workspace_id, projectId],
    )
  ).rows;
  const dispositions = (
    await c.query(
      "SELECT DISTINCT ON (unit_id) * FROM ppo.acceptance_unit_dispositions WHERE workspace_id=$1 AND project_id=$2 ORDER BY unit_id,created_at DESC,id DESC",
      [p.workspace_id, projectId],
    )
  ).rows;
  return units.map((u) => {
    const d = dispositions.find((d) => d.unit_id === u.id);
    return d
      ? {
          ...u,
          required: d.required,
          removal_reference: d.source_reference,
          removal_reason: d.reason,
        }
      : u;
  });
}
export async function decisionsFor(
  c: QueryClient,
  p: Principal,
  projectId: string,
) {
  const project = await projectRow(c, p, projectId);
  const finance = await hasPermission(
    c,
    p,
    "finance.read",
    project.company_id,
    project.site_id,
  );
  return (
    await c.query<Decision>(
      "SELECT d.*,u.display_name AS actor_name FROM ppo.acceptance_decisions d JOIN ppo.users u ON (u.workspace_id,u.id)=(d.workspace_id,d.actor_id) WHERE d.workspace_id=$1 AND d.project_id=$2 ORDER BY d.created_at DESC,d.id DESC",
      [p.workspace_id, projectId],
    )
  ).rows.map((d) => ({
    ...d,
    ...(d.kind === "Commercial" && !finance
      ? {
          reason: "Independent commercial disposition recorded.",
          snapshot: { source_fingerprint: d.snapshot.source_fingerprint },
        }
      : {}),
    created_at: iso(d.created_at)!,
  }));
}
export async function loadDetail(
  c: QueryClient,
  p: Principal,
  stage: Stage,
  sources: SourceFacts[],
): Promise<Detail> {
  const project = await projectRow(c, p, stage.project_id);
  const finance = await hasPermission(
    c,
    p,
    "finance.read",
    project.company_id,
    project.site_id,
  );
  const units = (
    await c.query<Unit>(
      "SELECT u.*,l.disposition,l.reason,l.relationship FROM ppo.acceptance_stage_units l JOIN ppo.acceptance_units u ON (u.workspace_id,u.id)=(l.workspace_id,l.unit_id) WHERE l.workspace_id=$1 AND l.stage_id=$2 AND l.revision=$3 ORDER BY u.reference,u.id",
      [p.workspace_id, stage.id, stage.revision],
    )
  ).rows;
  const ledger = await projectUnits(c, p, stage.project_id);
  for (const u of units) {
    const current = ledger.find((x) => x.id === u.id)!;
    Object.assign(u, {
      required: current.required,
      removal_reference: current.removal_reference,
      removal_reason: current.removal_reason,
    });
  }
  const included = units
    .filter((u) => u.disposition === "Included")
    .map((u) => u.id);
  const requirements = (
    await c.query<Omit<Requirement, "source" | "outcome">>(
      "SELECT r.*,r.due::text,u.display_name AS owner_name FROM ppo.acceptance_requirements r JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.owner_id) WHERE r.workspace_id=$1 AND r.project_id=$2 AND r.unit_id=ANY($3::uuid[]) ORDER BY r.gate,r.title,r.id",
      [p.workspace_id, stage.project_id, included],
    )
  ).rows.map((r) => {
    const source = sources.find((s) => s.id === r.source_id)!;
    return {
      ...r,
      ...(r.gate === "Commercial" && !finance
        ? { title: "Commercial disposition required" }
        : {}),
      source,
      outcome: requirementOutcome({ ...r, source }),
    };
  });
  const decisions = (await decisionsFor(c, p, stage.project_id)).filter(
    (d) => (d as Decision & { stage_id: string }).stage_id === stage.id,
  );
  const obligations = (
    await c.query<Obligation>(
      "SELECT o.*,o.due::text,u.display_name AS owner_name,r.display_name AS recipient_name FROM ppo.acceptance_obligations o JOIN ppo.users u ON (u.workspace_id,u.id)=(o.workspace_id,o.owner_id) JOIN ppo.users r ON (r.workspace_id,r.id)=(o.workspace_id,o.recipient_id) WHERE o.workspace_id=$1 AND o.stage_id=$2 ORDER BY o.created_at,o.id",
      [p.workspace_id, stage.id],
    )
  ).rows.map((o) => ({
    ...o,
    transfer_accepted: decisions.some(
      (d) =>
        d.kind === "Transfer" &&
        d.subject_id === o.id &&
        d.outcome === "Accepted" &&
        d.snapshot.obligation_version === o.version,
    ),
  }));
  const manifests = (
    await c.query<Manifest>(
      "SELECT m.*,i.id AS issue_id,i.issued_at,r.id AS request_id,r.sender_id,r.transport FROM ppo.acceptance_manifests m LEFT JOIN ppo.acceptance_issues i ON (i.workspace_id,i.manifest_id)=(m.workspace_id,m.id) LEFT JOIN ppo.acceptance_requests r ON (r.workspace_id,r.issue_id)=(i.workspace_id,i.id) WHERE m.workspace_id=$1 AND m.stage_id=$2 ORDER BY m.prepared_at DESC,m.id DESC",
      [p.workspace_id, stage.id],
    )
  ).rows.map((m) => ({
    ...m,
    prepared_at: iso(m.prepared_at)!,
    issued_at: iso(m.issued_at),
  }));
  const responses = (
    await c.query<ResponseRecord>(
      `SELECT r.*,m.audience,m.id AS manifest_id,m.revision,coalesce(pe.display_name,u.display_name,'Recorded respondent') AS respondent_name,
    coalesce((SELECT jsonb_agg(ru.unit_id ORDER BY ru.unit_id) FROM ppo.acceptance_response_units ru WHERE ru.workspace_id=r.workspace_id AND ru.response_id=r.id),'[]') AS units
    FROM ppo.acceptance_responses r JOIN ppo.acceptance_requests rq ON (rq.workspace_id,rq.id)=(r.workspace_id,r.request_id) JOIN ppo.acceptance_issues i ON (i.workspace_id,i.id)=(rq.workspace_id,rq.issue_id) JOIN ppo.acceptance_manifests m ON (m.workspace_id,m.id)=(i.workspace_id,i.manifest_id)
    LEFT JOIN ppo.people pe ON pe.workspace_id=r.workspace_id AND pe.id=r.respondent_id LEFT JOIN ppo.users u ON u.workspace_id=r.workspace_id AND u.id=r.respondent_id
    WHERE r.workspace_id=$1 AND m.stage_id=$2 ORDER BY r.recorded_at DESC,r.id DESC`,
      [p.workspace_id, stage.id],
    )
  ).rows.map((r) => ({
    ...r,
    recorded_at: iso(r.recorded_at)!,
    validated: decisions.some(
      (d) =>
        d.kind === "Customer" &&
        d.subject_id === r.id &&
        ["Accepted", "With conditions"].includes(d.outcome),
    ),
  }));
  const facts_hash = hash({
    revision: stage.revision,
    units: units.map((u) => ({
      id: u.id,
      disposition: u.disposition,
      configuration: u.configuration_version,
    })),
    requirements: requirements.map((r) => [
      r.id,
      r.mandatory,
      r.gate,
      r.applicability_reference,
      r.source.fingerprint,
    ]),
    obligations: obligations.map((o) => [
      o.id,
      o.version,
      o.state,
      o.transfer_accepted,
    ]),
  });
  const latest = (kind: string) =>
    decisions.find((d) => d.kind === kind && d.revision === stage.revision);
  const technical = latest("Technical");
  const source_state =
    (["Restricted", "Unavailable", "Changed", "Not checked"] as const).find(
      (s) => requirements.some((r) => r.source.availability === s),
    ) ?? "Current";
  const currentCustomer = manifests.find(
    (m) =>
      m.audience === "Customer" && m.revision === stage.revision && m.issue_id,
  );
  const currentService = manifests.find(
    (m) =>
      m.audience === "Service" && m.revision === stage.revision && m.issue_id,
  );
  const customer = latest("Customer"),
    service = latest("Service"),
    commercial = latest("Commercial");
  const technical_gates = requirementGates(requirements, ["Technical"]);
  for (const unit of included)
    if (!requirements.some((r) => r.unit_id === unit && r.gate === "Technical"))
      technical_gates.push(
        "A required unit has no technical requirement profile.",
      );
  const outcomes = {
    technical:
      technical?.facts_hash === facts_hash && !technical_gates.length
        ? "Accepted"
        : technical
          ? "Reassessment needed"
          : requirements.some(
                (r) => r.gate === "Technical" && r.outcome === "Blocked",
              )
            ? "Blocked"
            : source_state !== "Current"
              ? "Cannot assess"
              : technical_gates.length
                ? "Release pending"
                : "Not assessed",
    customer:
      customer &&
      responses.find(
        (r) =>
          r.id === customer.subject_id && r.manifest_id === currentCustomer?.id,
      )
        ? customer.outcome
        : responses.some(
              (r) => r.audience === "Customer" && r.revision === stage.revision,
            )
          ? "Validation needed"
          : currentCustomer?.request_id
            ? "Awaiting response"
            : "Not requested",
    service:
      service?.subject_id === currentService?.request_id &&
      currentService?.facts_hash === facts_hash
        ? (service?.outcome ?? "Not requested")
        : currentService?.request_id
          ? "Requested"
          : "Not requested",
    commercial:
      commercial?.facts_hash === facts_hash
        ? commercial.outcome
        : "Not assessed",
  };
  const handover_gates = [
    ...technical_gates,
    ...requirementGates(requirements, ["Handover"]),
  ];
  if (outcomes.technical !== "Accepted")
    handover_gates.push(
      "Confirm technical applicability against the current exact source evidence.",
    );
  if (stage.state !== "In review")
    handover_gates.push(
      "Submit the exact stage revision before preparing a pack.",
    );
  const checks = (
    await c.query<{ checked_at: string; facts_hash: string; result: string }>(
      "SELECT checked_at,facts_hash,result FROM ppo.acceptance_checks WHERE workspace_id=$1 AND stage_id=$2 ORDER BY checked_at DESC LIMIT 1",
      [p.workspace_id, stage.id],
    )
  ).rows[0];
  const revisions = (
    await c.query(
      "SELECT id,revision,predecessor_id,content_hash,submitted_at,snapshot FROM ppo.acceptance_revisions WHERE workspace_id=$1 AND stage_id=$2 ORDER BY revision DESC",
      [p.workspace_id, stage.id],
    )
  ).rows.map((r) => ({ ...r, submitted_at: iso(r.submitted_at)! }));
  const source_history = (
    await c.query(
      "SELECT v.source_id,v.version,v.recorded_at,v.snapshot->>'public_reference' AS reference,v.snapshot->>'outcome' AS outcome,v.snapshot->>'availability' AS availability FROM ppo.acceptance_source_versions v WHERE v.workspace_id=$1 AND v.source_id=ANY($2::uuid[]) ORDER BY v.recorded_at DESC LIMIT 200",
      [p.workspace_id, [...new Set(requirements.map((r) => r.source_id))]],
    )
  ).rows
    .filter(
      (v) =>
        sources.find((s) => s.id === v.source_id)?.availability !==
        "Restricted",
    )
    .map((v) => ({ ...v, recorded_at: iso(v.recorded_at)! }));
  const history = (
    await c.query<Detail["history"][number]>(
      "SELECT e.*,u.display_name AS actor_name FROM ppo.acceptance_events e JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.actor_id) WHERE e.workspace_id=$1 AND e.stage_id=$2 ORDER BY e.created_at DESC,e.id DESC LIMIT 100",
      [p.workspace_id, stage.id],
    )
  ).rows.map((e) => ({
    ...e,
    ...(e.kind === "commercial" && !finance
      ? { reason: "Independent commercial disposition recorded." }
      : {}),
    created_at: iso(e.created_at)!,
  }));
  const nextRequirement = requirements.find(
    (r) => !["Satisfied", "Not required"].includes(r.outcome),
  );
  const next = nextRequirement
    ? {
        label: "Resolve requirement",
        explanation: nextRequirement.source.explanation,
        href:
          nextRequirement.source.href ??
          `/projects/acceptance/readiness?project=${stage.project_id}&stage=${stage.id}`,
        owner: nextRequirement.owner_name,
        due: nextRequirement.due,
      }
    : {
        label:
          outcomes.customer === "Awaiting response"
            ? "Record response"
            : handover_gates.length
              ? "Review readiness"
              : manifests.length
                ? "Review closeout"
                : "Prepare handover",
        explanation:
          handover_gates[0] ??
          "Review the exact stage and independent decisions.",
        href: null,
        owner: stage.owner_name,
        due: stage.due,
      };
  const detail: Detail = {
    stage: {
      ...stage,
      reassessment:
        stage.reassessment ||
        (!!technical && technical.facts_hash !== facts_hash),
    },
    units,
    requirements,
    obligations,
    decisions,
    manifests,
    responses,
    outcomes,
    facts_hash,
    source_state,
    checked_at:
      checks?.facts_hash === facts_hash && checks.result === "Current"
        ? iso(checks.checked_at)
        : null,
    technical_gates,
    handover_gates,
    closeout_gates: [],
    next,
    history,
    revisions,
    source_history,
  };
  detail.closeout_gates = closeoutGates(detail);
  return detail;
}
