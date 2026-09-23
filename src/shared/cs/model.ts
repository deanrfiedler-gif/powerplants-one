import {
  choice,
  dateOnly,
  invalid,
  label,
  narrative,
  object,
  optionalId,
  optionalNarrative,
  optionalText,
  uuid,
} from "../validation";
export const kinds = ["Readiness", "Survey", "AccountPlan"] as const;
export type CsKind = (typeof kinds)[number];
export const tables = {
  Readiness: "site_readiness",
  Survey: "site_surveys",
  AccountPlan: "customer_plans",
} as const;
export const types = {
  Readiness: "SiteReadiness",
  Survey: "SiteSurvey",
  AccountPlan: "AccountPlan",
} as const;
export const evidenceKinds = [
  "Site approval",
  "Movement plan",
  "Induction",
  "Clean-down",
  "Shutdown approval",
  "Tool check",
] as const;
export type Requirement = {
  id: string;
  revision: number;
  title: string;
  kind: (typeof evidenceKinds)[number];
  facility_id: string | null;
  activity: string;
  source: string;
};
export type Evidence = {
  id: string;
  requirement_id: string;
  requirement_revision: number;
  facility_id: string | null;
  activity: string;
  person_id: string | null;
  captured_on: string;
  expires_on: string;
  source: string;
};
export type WorkWindow = {
  id: string;
  facility_id: string | null;
  activity: string;
  from_date: string;
  to_date: string;
  season_from: string;
  season_to: string;
  start_time: string;
  end_time: string;
  source: string;
};
export type ReadinessContent = {
  schema_version: 1;
  requirements: Requirement[];
  evidence: Evidence[];
  windows: WorkWindow[];
};
export type Observation = {
  id: string;
  title: string;
  kind:
    "Measured" | "Observed" | "Customer statement" | "Assumption" | "Unknown";
  facility_id: string | null;
  asset_id: string | null;
  value: string | null;
  unit: string | null;
  detail: string;
  observer: string;
  captured_on: string;
  method_source: string;
  significant: boolean;
  insignificant_reason: string | null;
  activity_id: string | null;
};
export type SurveyContent = {
  schema_version: 1;
  purpose: string;
  facility_ids: string[];
  asset_ids: string[];
  observations: Observation[];
};
export type PlannedVisit = {
  id: string;
  site_id: string | null;
  purpose: string;
  planned_on: string | null;
  activity_id: string | null;
};
export type PlanContent = {
  schema_version: 1;
  sector: string | null;
  territory: string | null;
  horticultural_context: string | null;
  objectives: string;
  review_on: string | null;
  visits: PlannedVisit[];
  activity_ids: string[];
};
export type CsContent = ReadinessContent | SurveyContent | PlanContent;
export type CsRow = {
  id: string;
  workspace_id: string;
  company_id: string;
  site_id: string | null;
  organisation_id: string | null;
  name: string;
  owner_id: string;
  version: number;
  revision: number;
  state: "Draft" | "Submitted" | "Returned" | "Reviewed";
  content: CsContent;
  created_by: string;
  updated_by: string;
  updated_at: Date;
};
export type PreparationBasis = {
  facility_ids: string[];
  activity: string;
  starts_at: string;
  ends_at: string;
  person_ids: string[];
};
export function ids(value: unknown, field: string, max = 50): string[] {
  const xs = list(value, field, max).map((x) => uuid(x, field));
  if (new Set(xs).size !== xs.length)
    invalid(field, "Choose each record once.");
  return xs;
}
function list(value: unknown, field: string, max = 40): unknown[] {
  if (!Array.isArray(value) || value.length > max)
    invalid(field, `Use at most ${max} entries.`);
  return value as unknown[];
}
function entries<T extends { id: string }>(
  value: unknown,
  field: string,
  parse: (x: unknown) => T,
): T[] {
  const xs = list(value, field).map(parse);
  if (new Set(xs.map((x) => x.id)).size !== xs.length)
    invalid(field, "Each entry must have a distinct identity.");
  return xs;
}
const date = (x: unknown, f: string) =>
  x === null || x === undefined ? null : dateOnly(x, f);
const revision = (x: unknown) => {
  if (!Number.isSafeInteger(x) || Number(x) < 1)
    invalid(
      "requirement_revision",
      "Choose an exact positive source revision.",
    );
  return Number(x);
};
const time = (x: unknown, f: string) => {
  if (typeof x !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(x))
    invalid(f, "Enter HH:mm in the Site time zone.");
  return x as string;
};
const season = (x: unknown, f: string) => {
  const s = label(x, f, 5);
  dateOnly(`2000-${s}`, f);
  return s;
};
export function parseContent(
  kind: CsKind,
  value: unknown,
  old?: CsContent,
): CsContent {
  if (kind === "Readiness") {
    const r = object(value, [
      "schema_version",
      "requirements",
      "evidence",
      "windows",
    ]);
    if (r.schema_version !== 1) invalid("schema_version", "Use schema 1.");
    const requirements = entries(r.requirements, "requirements", (x) => {
      const v = object(x, [
        "id",
        "revision",
        "title",
        "kind",
        "facility_id",
        "activity",
        "source",
      ]);
      const item = {
        id: uuid(v.id, "requirement_id"),
        title: label(v.title, "title", 200),
        kind: choice(v.kind, "kind", evidenceKinds),
        facility_id: optionalId(v.facility_id, "facility_id"),
        activity: label(v.activity, "activity", 100),
        source: narrative(v.source, "source", 2000),
      };
      const previous = (
        old as ReadinessContent | undefined
      )?.requirements?.find((y) => y.id === item.id);
      const { revision: priorRevision, ...prior } = previous ?? { revision: 0 };
      return {
        ...item,
        revision:
          previous &&
          Object.entries(item).every(
            ([key, value]) => (prior as Record<string, unknown>)[key] === value,
          )
            ? priorRevision
            : priorRevision + 1,
      };
    });
    const evidence = entries(r.evidence, "evidence", (x) => {
      const v = object(x, [
        "id",
        "requirement_id",
        "requirement_revision",
        "facility_id",
        "activity",
        "person_id",
        "captured_on",
        "expires_on",
        "source",
      ]);
      const item = {
        id: uuid(v.id, "evidence_id"),
        requirement_id: uuid(v.requirement_id, "requirement_id"),
        requirement_revision: revision(v.requirement_revision),
        facility_id: optionalId(v.facility_id, "facility_id"),
        activity: label(v.activity, "activity", 100),
        person_id: optionalId(v.person_id, "person_id"),
        captured_on: dateOnly(v.captured_on, "captured_on"),
        expires_on: dateOnly(v.expires_on, "expires_on"),
        source: narrative(v.source, "source", 2000),
      };
      if (item.expires_on < item.captured_on)
        invalid("expires_on", "Expiry must not precede capture.");
      if (!requirements.some((r) => r.id === item.requirement_id))
        invalid(
          "requirement_id",
          "Retain the exact source requirement for this evidence.",
        );
      return item;
    });
    const windows = entries(r.windows, "windows", (x) => {
      const v = object(x, [
        "id",
        "facility_id",
        "activity",
        "from_date",
        "to_date",
        "season_from",
        "season_to",
        "start_time",
        "end_time",
        "source",
      ]);
      const item = {
        id: uuid(v.id, "window_id"),
        facility_id: optionalId(v.facility_id, "facility_id"),
        activity: label(v.activity, "activity", 100),
        from_date: dateOnly(v.from_date, "from_date"),
        to_date: dateOnly(v.to_date, "to_date"),
        season_from: season(v.season_from, "season_from"),
        season_to: season(v.season_to, "season_to"),
        start_time: time(v.start_time, "start_time"),
        end_time: time(v.end_time, "end_time"),
        source: narrative(v.source, "source", 2000),
      };
      if (item.to_date < item.from_date || item.start_time === item.end_time)
        invalid(
          "work_window",
          "Use a valid dated interval and distinct start/end times.",
        );
      return item;
    });
    return { schema_version: 1, requirements, evidence, windows };
  }
  if (kind === "Survey") {
    const r = object(value, [
      "schema_version",
      "purpose",
      "facility_ids",
      "asset_ids",
      "observations",
    ]);
    if (r.schema_version !== 1) invalid("schema_version", "Use schema 1.");
    const observations = entries(r.observations, "observations", (x) => {
      const v = object(x, [
        "id",
        "title",
        "kind",
        "facility_id",
        "asset_id",
        "value",
        "unit",
        "detail",
        "observer",
        "captured_on",
        "method_source",
        "significant",
        "insignificant_reason",
        "activity_id",
      ]);
      const kind = choice(v.kind, "kind", [
        "Measured",
        "Observed",
        "Customer statement",
        "Assumption",
        "Unknown",
      ] as const);
      const amount = optionalText(v.value, "value", 40),
        unit = optionalText(v.unit, "unit", 40);
      if (
        kind === "Measured" &&
        (!amount ||
          !/^[-+]?(\d+(\.\d+)?|\.\d+)$/.test(amount) ||
          !Number.isFinite(Number(amount)) ||
          !unit)
      )
        invalid(
          "value",
          "Measurements require a finite numeric value and an explicit unit.",
        );
      if (kind !== "Measured" && (amount !== null || unit !== null))
        invalid(
          "value",
          "Only Measured observations carry a numeric measurement. Unknown remains unknown.",
        );
      if (typeof v.significant !== "boolean")
        invalid(
          "significant",
          "State whether this information affects the handover.",
        );
      const insignificant_reason = optionalText(
        v.insignificant_reason,
        "insignificant_reason",
        1000,
      );
      if (
        !v.significant &&
        ["Unknown", "Assumption"].includes(kind) &&
        !insignificant_reason
      )
        invalid(
          "insignificant_reason",
          "Explain why this gap does not affect the handover.",
        );
      return {
        id: uuid(v.id, "observation_id"),
        title: label(v.title, "title", 200),
        kind,
        facility_id: optionalId(v.facility_id, "facility_id"),
        asset_id: optionalId(v.asset_id, "asset_id"),
        value: amount,
        unit,
        detail: narrative(v.detail, "detail", 2000),
        observer: label(v.observer, "observer", 200),
        captured_on: dateOnly(v.captured_on, "captured_on"),
        method_source: narrative(v.method_source, "method_source", 2000),
        significant: v.significant as boolean,
        insignificant_reason,
        activity_id: optionalId(v.activity_id, "activity_id"),
      };
    });
    return {
      schema_version: 1,
      purpose: narrative(r.purpose, "purpose", 4000),
      facility_ids: ids(r.facility_ids, "facility_ids"),
      asset_ids: ids(r.asset_ids, "asset_ids"),
      observations,
    };
  }
  const r = object(value, [
    "schema_version",
    "sector",
    "territory",
    "horticultural_context",
    "objectives",
    "review_on",
    "visits",
    "activity_ids",
  ]);
  if (r.schema_version !== 1) invalid("schema_version", "Use schema 1.");
  return {
    schema_version: 1,
    sector: optionalText(r.sector, "sector"),
    territory: optionalText(r.territory, "territory"),
    horticultural_context: optionalNarrative(
      r.horticultural_context,
      "horticultural_context",
      2000,
    ),
    objectives: narrative(r.objectives, "objectives", 4000),
    review_on: date(r.review_on, "review_on"),
    activity_ids: ids(r.activity_ids, "activity_ids"),
    visits: entries(r.visits, "visits", (x) => {
      const v = object(x, [
        "id",
        "site_id",
        "purpose",
        "planned_on",
        "activity_id",
      ]);
      return {
        id: uuid(v.id, "visit_id"),
        site_id: optionalId(v.site_id, "site_id"),
        purpose: narrative(v.purpose, "purpose", 2000),
        planned_on: date(v.planned_on, "planned_on"),
        activity_id: optionalId(v.activity_id, "activity_id"),
      };
    }),
  };
}

export function emptyContent(kind: CsKind): CsContent {
  return kind === "Readiness"
    ? { schema_version: 1, requirements: [], evidence: [], windows: [] }
    : kind === "Survey"
      ? {
          schema_version: 1,
          purpose: "Record the survey scope before submission.",
          facility_ids: [],
          asset_ids: [],
          observations: [],
        }
      : {
          schema_version: 1,
          sector: null,
          territory: null,
          horticultural_context: null,
          objectives: "Record relationship objectives and owned next actions.",
          review_on: null,
          visits: [],
          activity_ids: [],
        };
}
