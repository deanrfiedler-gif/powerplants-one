import { transaction } from "../../platform/database";
import type { Principal } from "../../platform/identity";
import { AppError } from "../../platform/errors";
import {
  hasPermission,
  type Capability,
  type QueryClient,
} from "../../platform/permissions";
import { canonical } from "../../platform/operations";
import { digest } from "../../documents/store";
import { object, uuid } from "../../shared/validation";
import { projectRow } from "../service";
import { engineeringRow } from "../../engineering/service";
import { supplyRecord } from "../../supply/context";
import { factsFor, materialBasis } from "../../supply/reads";
import {
  authority as specialistAuthority,
  packageRow,
  history,
  inspect,
} from "../specialist/context";
import {
  materialState,
  readinessSummary,
  type Evidence,
  type SourceFamily,
  type SourceKind,
} from "./model";

const LIMIT = 50;
const stamp = (value: Date | string) => new Date(value).toISOString();
const unavailable = (error: unknown) =>
  error instanceof AppError && [403, 404].includes(error.status);

async function engineering(
  c: QueryClient,
  p: Principal,
  id: string,
): Promise<Evidence> {
  const row = await engineeringRow(c, p, id);
  const basis = {
    package_id: row.id,
    version: row.version,
    state: row.state,
    blocker: row.blocker,
    required_date: row.required_date,
    next_action: row.next_action,
    action_due: row.action_due,
    owner_id: row.owner_id,
  };
  return {
    kind: "EngineeringPackage",
    id,
    version: row.version,
    reference: row.display_number,
    title: row.title,
    owner_id: row.owner_id,
    source_state: row.state,
    source_status: "Current",
    state: row.blocker ? "Blocked" : "EvidenceNeeded",
    reason:
      row.blocker ??
      "Coordination status does not establish technical release; inspect the Engineering workflow.",
    observed_at: stamp(row.updated_at),
    source_hash: digest(canonical(basis)),
    href: `/engineering/${id}`,
    basis,
  };
}

async function materials(
  c: QueryClient,
  p: Principal,
  id: string,
  now: Date,
): Promise<Evidence> {
  const row = await supplyRecord(c, p, id);
  // Only Promise facts affect the native readiness rule. Credit, customer and
  // attachment/action details must not enter this new projection or its hash.
  const facts = (await factsFor(c, p, row)).filter(
    (fact) => fact.kind === "Promise",
  );
  const current = await materialBasis(c, p, row, facts, now);
  const basis = {
    demand_id: row.id,
    demand_version: row.version,
    quantity: row.quantity,
    unit: row.unit,
    demand_class: row.data.demand_class,
    required_on: row.data.required_on,
    timezone: row.data.timezone,
    completeness: row.completeness,
    observed_at: stamp(row.observed_at),
    readiness: current.readiness,
    usable: current.usable,
    sources: current.sources.map((source) => ({
      ...source,
      observed_at: stamp(source.observed_at),
    })),
    allocations: current.allocations.map((a) => ({
      id: a.id,
      version: a.version,
      supply_id: a.supply_id,
      quantity: a.quantity,
      unit: a.unit,
      basis: a.basis,
    })),
    promises: facts.map((fact) => ({
      id: fact.id,
      version: fact.version,
      predecessor_id: fact.predecessor_id,
      data: fact.data,
      observed_at: stamp(fact.observed_at),
      completeness: fact.completeness,
    })),
  };
  return {
    kind: "MaterialDemand",
    id,
    version: row.version,
    reference: row.reference,
    title: row.title,
    owner_id: row.owner_id,
    source_state: current.readiness.state,
    source_status: current.sources.some((source) => !source.valid)
      ? "Changed"
      : "Current",
    state: materialState(current.readiness.state),
    reason: `Supply assessment: ${current.readiness.state}. Applies only to this demand's stated material scope.`,
    observed_at: stamp(row.observed_at),
    source_hash: digest(canonical(basis)),
    href: `/supply/material-readiness?record=${id}`,
    basis,
  };
}

async function specialist(
  c: QueryClient,
  p: Principal,
  project: string,
  id: string,
): Promise<Evidence> {
  await specialistAuthority(c, p, project);
  const pkg = (await packageRow(c, p, id))!;
  const event = (await history(c, p, id, undefined, 1))[0];
  // Historical native authority is required before exposing any retained fact.
  await inspect(c, p, pkg, event.content, false, event.source);
  let changed = false;
  try {
    await inspect(c, p, pkg, event.content, true, event.source);
  } catch (error) {
    if (!(
      error instanceof AppError && error.code === "SpecialistSourceChanged"
    ))
      throw error;
    changed = true;
  }
  const basis = {
    package_id: id,
    version: event.version,
    state: event.state,
    source_hash: event.source_hash,
    source: event.source,
    owner_id: event.content.owner_id,
    receiver_id: event.content.receiver_id,
    due_date: event.content.due_date,
  };
  return {
    kind: "SpecialistPackage",
    id,
    version: event.version,
    reference: null,
    title: event.content.title,
    owner_id: event.content.owner_id,
    source_state: event.state,
    source_status: changed ? "Changed" : "Current",
    state: changed || event.state === "Returned" ? "Blocked" : "EvidenceNeeded",
    reason: changed
      ? "The retained package basis changed; reconcile in the specialist source workflow."
      : event.state === "Returned"
        ? "The receiving owner returned this package."
        : "Brief acceptance does not establish supplier competence, work acceptance or project release.",
    observed_at: stamp(event.created_at),
    source_hash: digest(canonical(basis)),
    href: `/api/v1/projects/${project}/specialist-packages?id=${id}`,
    basis,
  };
}

export async function readProjectReadiness(
  p: Principal,
  projectId: string,
  input: unknown = {},
) {
  const id = uuid(projectId, "project_id");
  object(input, []);
  return transaction(async (c) => {
    // Every source, permission and date-sensitive rule uses one database snapshot.
    // Database faults fail the request; they cannot become an empty/ready result.
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const project = await projectRow(c, p, id);
    const now = (
      await c.query<{ now: Date }>("SELECT transaction_timestamp() AS now")
    ).rows[0].now;
    const specs: {
      kind: SourceKind;
      capability: Capability;
      sql: string;
      read: (id: string) => Promise<Evidence>;
    }[] = [
      {
        kind: "EngineeringPackage",
        capability: "engineering.read",
        sql: "SELECT id FROM ppo.engineering_packages WHERE workspace_id=$1 AND project_id=$2 ORDER BY id LIMIT $3",
        read: (source) => engineering(c, p, source),
      },
      {
        kind: "MaterialDemand",
        capability: "supply.read",
        sql: "SELECT id FROM ppo.supply_records WHERE workspace_id=$1 AND kind='Demand' AND data->>'origin_kind'='Project' AND data->>'origin_id'=$2 ORDER BY id LIMIT $3",
        read: (source) => materials(c, p, source, now),
      },
      {
        kind: "SpecialistPackage",
        capability: "project.specialist.read",
        sql: "SELECT id FROM ppo.project_specialist_packages WHERE workspace_id=$1 AND project_id=$2 ORDER BY id LIMIT $3",
        read: (source) => specialist(c, p, id, source),
      },
    ];
    const sources: SourceFamily[] = [];
    for (const spec of specs) {
      const source: SourceFamily = {
        kind: spec.kind,
        coverage: "Unavailable",
        evidence: "Unavailable",
        items: [],
        count: null,
        count_scope: "PermittedCandidateWindow",
        limit: LIMIT,
      };
      sources.push(source);
      if (
        !(await hasPermission(
          c,
          p,
          spec.capability,
          project.company_id,
          project.site_id,
        ))
      )
        continue;
      const candidates = (
        await c.query<{ id: string }>(spec.sql, [p.workspace_id, id, LIMIT + 1])
      ).rows;
      source.coverage = candidates.length > LIMIT ? "Partial" : "Complete";
      for (const candidate of candidates.slice(0, LIMIT)) {
        try {
          const evidence = await spec.read(candidate.id);
          source.items.push(evidence);
          if (
            evidence.kind === "MaterialDemand" &&
            evidence.state === "EvidenceNeeded"
          )
            source.coverage = "Partial";
        } catch (error) {
          if (
            !unavailable(error) &&
            !(
              error instanceof AppError &&
              error.code === "SpecialistSourceChanged"
            )
          )
            throw error;
          // Never publish a hidden source identity, owner, hash, state or count.
          source.coverage = "Partial";
        }
      }
      source.count = source.items.length;
      source.evidence = source.items.length
        ? "Available"
        : source.coverage === "Complete"
          ? "Missing"
          : "Unavailable";
    }
    return {
      schema_version: 1,
      synthetic: true,
      as_of: now.toISOString(),
      project: {
        id,
        version: project.version,
        reference: project.display_number,
        lifecycle: project.lifecycle,
      },
      assessment_scope: "LinkedNativeSources",
      summary: readinessSummary(sources),
      sources,
      unassessed: [
        "CompleteProjectPrerequisiteScope",
        "TechnicalRelease",
        "SiteAndCustomer",
        "CrewAndAttendance",
        "WorkPreparation",
        "CommercialRelease",
      ],
    };
  });
}
