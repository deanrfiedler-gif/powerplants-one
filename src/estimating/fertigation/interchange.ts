import { createHash } from "node:crypto";
import { AppError } from "../../platform/errors";
import { uuid } from "../../shared/validation";
import {
  blankScope,
  blankArea,
  blankCropGroup,
  blankValve,
  blankMaster,
  blankSource,
  blankGroup,
  blankScenario,
  blankCandidate,
  blankControl,
  baseRecord,
} from "./definition";
import { validateScope } from "./validation";
import { PORTABLE_BYTES } from "./portable-limits";
import { validateLegacyProject } from "./legacy-validation";
import { mapValveCsv } from "./valve-csv";
import type { Scope, Phase, Emitter, Control, Family } from "./types";

interface LegacyMetadata {
  app_version: string;
  updated_at: string;
  capture_stage: string;
  project_type: string;
  area_measurement_bases: Record<string, string>;
  evidence_declarations: Record<string, string>;
}
export interface ImportPreview {
  source_schema:
    | "native_export_r01"
    | "standalone_1"
    | "standalone_2"
    | "native_valves_csv_r01";
  source_hash: string;
  preview_hash: string;
  scope: Scope;
  identity_map: Record<string, string>;
  warnings: string[];
  losses: { path: string; reason: string }[];
  held: boolean;
  provenance: {
    original_project_id: string | null;
    original_revision: number | null;
    synthetic_origin: boolean | "unknown";
    historical_reviews: "none" | "unverified_source_only";
    original_history_retained_in_source: boolean;
    import_namespace: string;
    legacy_metadata?: LegacyMetadata;
    inherited_sources: {
      source_hash: string;
      source_schema: string;
      preview_hash: string;
      synthetic_origin: boolean | "unknown";
      legacy_metadata?: LegacyMetadata;
    }[];
  };
}
const hash = (value: string) =>
  createHash("sha256").update(value, "utf8").digest("hex");
const fail = (message: string): never => {
  throw new AppError(422, "InvalidFertigationImport", message);
};
type JsonObject = Record<string, unknown>;
function object(v: unknown, path: string): JsonObject {
  if (!v || typeof v !== "object" || Array.isArray(v))
    return fail(`${path}: expected an object.`);
  return v as JsonObject;
}

/** Reject duplicate JSON keys before parse; JSON.parse's last-wins behaviour is unsafe for preview. */
export function parseImportJson(text: string): unknown {
  if (Buffer.byteLength(text, "utf8") > PORTABLE_BYTES)
    fail(
      "Import exceeds the bounded 8 MiB portable-file contract; the editable scope remains limited to 2 MiB and embedded attachments require a separate evidence migration.",
    );
  let i = 0,
    nodes = 0;
  const space = () => {
    while (/[\t\r\n ]/.test(text[i] ?? "x")) i++;
  };
  const string = (): string => {
    const start = i++;
    while (i < text.length) {
      const c = text[i++];
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === '"') {
        try {
          return JSON.parse(text.slice(start, i));
        } catch {
          return fail("Malformed JSON string.");
        }
      }
    }
    return fail("Unterminated JSON string.");
  };
  const value = (depth: number): unknown => {
    space();
    if (++nodes > 150000 || depth > 16)
      fail("Import exceeds bounded nesting or item count.");
    if (text[i] === '"') return string();
    if (text[i] === "{") {
      i++;
      space();
      const result: JsonObject = Object.create(null),
        keys = new Set<string>();
      if (text[i] === "}") {
        i++;
        return result;
      }
      while (true) {
        space();
        if (text[i] !== '"') fail("Object keys must be JSON strings.");
        const key = string();
        if (keys.has(key)) fail(`Duplicate JSON key: ${key}.`);
        if (["__proto__", "constructor", "prototype"].includes(key))
          fail("Unsupported JSON key.");
        keys.add(key);
        space();
        if (text[i++] !== ":") fail("Malformed JSON object.");
        result[key] = value(depth + 1);
        space();
        const end = text[i++];
        if (end === "}") return result;
        if (end !== ",") fail("Malformed JSON object.");
      }
    }
    if (text[i] === "[") {
      i++;
      space();
      const values: unknown[] = [];
      if (text[i] === "]") {
        i++;
        return values;
      }
      while (true) {
        values.push(value(depth + 1));
        space();
        const end = text[i++];
        if (end === "]") return values;
        if (end !== ",") fail("Malformed JSON array.");
      }
    }
    for (const [token, parsed] of [
      ["true", true],
      ["false", false],
      ["null", null],
    ] as const)
      if (text.startsWith(token, i)) {
        i += token.length;
        return parsed;
      }
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(
      text.slice(i),
    );
    if (!match) fail("Invalid JSON value.");
    i += match![0].length;
    const n = Number(match![0]);
    if (!Number.isFinite(n)) fail("JSON numbers must be finite.");
    return n;
  };
  const parsed = value(0);
  space();
  if (i !== text.length) fail("Unexpected content after the JSON value.");
  return parsed;
}
function remapper(namespace: string, sourceHash: string) {
  const mapping: Record<string, string> = Object.create(null);
  const allocate = (old: string) => {
    if (!Object.hasOwn(mapping, old)) {
      const hex = hash(`${namespace}\n${sourceHash}\n${old}`);
      mapping[old] =
        `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
    }
    return mapping[old];
  };
  return { mapping, allocate };
}

export function previewImport(
  rawJson: string,
  importNamespace: string,
): ImportPreview {
  uuid(importNamespace, "import_namespace");
  const csv = !rawJson.trimStart().startsWith("{");
  let source = csv
    ? {}
    : object(parseImportJson(rawJson.replace(/^\uFEFF/, "")), "import");
  const sourceHash = hash(rawJson);
  const { mapping, allocate } = remapper(importNamespace, sourceHash);
  const warnings = [
    "Import creates a new native draft. Original source bytes/hash and historical results are not rewritten.",
    "Canonical customer, site, Facility and Asset mappings require an explicit authorised source selection.",
    "Local acknowledgements are not authenticated native approvals. Calculations are recomputed under the native edition.",
  ];
  const losses: ImportPreview["losses"] = [];
  const inherited: ImportPreview["provenance"]["inherited_sources"] = [];
  let scope: Scope, sourceSchema: ImportPreview["source_schema"];
  let originalProject: string | null = null,
    originalRevision: number | null = null,
    synthetic: boolean | "unknown" = "unknown",
    reviews: ImportPreview["provenance"]["historical_reviews"] = "none",
    history = false;
  let legacyMetadata: LegacyMetadata | undefined;
  if (csv) {
    const mapped = mapValveCsv(rawJson, allocate);
    sourceSchema = "native_valves_csv_r01";
    scope = mapped.scope;
    warnings.push(...mapped.warnings);
  } else if (source.format === "PPO-FERT-NATIVE-EXPORT-r01") {
    const required = [
        "format",
        "audience",
        "basis",
        "scope",
        "calculation",
        "exclusions",
        "reimport",
      ],
      allowed = [...required, "import_provenance", "synthetic"];
    if (
      Object.keys(source).some((k) => !allowed.includes(k)) ||
      required.some((k) => !Object.hasOwn(source, k)) ||
      source.audience !== "internal"
    )
      fail(
        "Only the complete declared internal native export contract may be imported.",
      );
    if (source.synthetic !== undefined) {
      if (typeof source.synthetic !== "boolean")
        fail(
          "Native synthetic provenance must be an explicit boolean declaration.",
        );
      synthetic = source.synthetic as boolean;
    }
    if (synthetic !== true)
      warnings.push(
        "The source's synthetic=false or absent declaration is unverified external provenance; it does not establish operational data.",
      );
    if (source.import_provenance !== undefined) {
      if (
        !Array.isArray(source.import_provenance) ||
        source.import_provenance.length > 100
      )
        fail("Import provenance must be a bounded ledger projection.");
      const fingerprint = (v: unknown): string => {
        if (typeof v !== "string" || !/^[a-f0-9]{64}$/.test(v))
          return fail("Import lineage requires exact SHA-256 fingerprints.");
        return v;
      };
      const origin = (v: unknown): boolean | "unknown" => {
        if (v !== true && v !== false && v !== "unknown")
          return fail("Import lineage requires explicit synthetic provenance.");
        return v;
      };
      const metadata = (value: unknown): LegacyMetadata => {
        const r = object(value, "legacy_metadata"),
          keys = [
            "app_version",
            "updated_at",
            "capture_stage",
            "project_type",
            "area_measurement_bases",
            "evidence_declarations",
          ];
        if (Object.keys(r).sort().join() !== [...keys].sort().join())
          fail("Unsupported legacy metadata fields.");
        for (const key of keys.slice(0, 4))
          if (typeof r[key] !== "string" || (r[key] as string).length > 20000)
            fail("Invalid legacy metadata text.");
        for (const key of ["area_measurement_bases", "evidence_declarations"]) {
          const rows = object(r[key], key);
          if (
            Object.keys(rows).length > 10000 ||
            Object.entries(rows).some(
              ([id, value]) =>
                !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(id) ||
                typeof value !== "string" ||
                value.length > 20000,
            )
          )
            fail("Invalid legacy metadata declarations.");
        }
        return r as unknown as LegacyMetadata;
      };
      const lineage = (v: unknown) => {
        const r = object(v, "lineage");
        const requiredLineage = [
          "source_hash",
          "source_schema",
          "preview_hash",
          "synthetic_origin",
        ];
        if (
          requiredLineage.some((k) => !Object.hasOwn(r, k)) ||
          Object.keys(r).some(
            (k) => ![...requiredLineage, "legacy_metadata"].includes(k),
          ) ||
          ![
            "native_export_r01",
            "standalone_1",
            "standalone_2",
            "native_valves_csv_r01",
          ].includes(String(r.source_schema))
        )
          fail("Unsupported inherited source lineage.");
        return {
          source_hash: fingerprint(r.source_hash),
          source_schema: String(r.source_schema),
          preview_hash: fingerprint(r.preview_hash),
          synthetic_origin: origin(r.synthetic_origin),
          ...(r.legacy_metadata === undefined
            ? {}
            : { legacy_metadata: metadata(r.legacy_metadata) }),
        };
      };
      for (const value of source.import_provenance as unknown[]) {
        const r = object(value, "import_provenance"),
          requiredLedgerKeys = [
            "source_hash",
            "source_schema",
            "preview_hash",
            "provenance",
            "identity_map",
          ];
        if (
          requiredLedgerKeys.some((k) => !Object.hasOwn(r, k)) ||
          Object.keys(r).some(
            (k) => ![...requiredLedgerKeys, "revision_id"].includes(k),
          )
        )
          fail("Unsupported import provenance fields.");
        if (r.revision_id !== undefined)
          uuid(r.revision_id, "source_import_revision_id");
        const provenance = object(r.provenance, "provenance"),
          allowedProvenance = [
            "original_project_id",
            "original_revision",
            "synthetic_origin",
            "historical_reviews",
            "original_history_retained_in_source",
            "import_namespace",
            "inherited_sources",
            "legacy_metadata",
          ];
        if (Object.keys(provenance).some((k) => !allowedProvenance.includes(k)))
          fail("Unsupported provenance declaration fields.");
        inherited.push(
          lineage({
            source_hash: r.source_hash,
            source_schema: r.source_schema,
            preview_hash: r.preview_hash,
            synthetic_origin: provenance.synthetic_origin,
            ...(provenance.legacy_metadata === undefined
              ? {}
              : { legacy_metadata: provenance.legacy_metadata }),
          }),
        );
        const identityMap = object(r.identity_map, "identity_map");
        if (Object.keys(identityMap).length > 10000)
          fail("Import identity mapping is too large.");
        for (const v of Object.values(identityMap)) uuid(v, "mapped_identity");
        if (provenance.inherited_sources !== undefined) {
          if (
            !Array.isArray(provenance.inherited_sources) ||
            provenance.inherited_sources.length > 100
          )
            fail("Inherited source lineage exceeds the bounded contract.");
          inherited.push(
            ...(provenance.inherited_sources as unknown[]).map(lineage),
          );
        }
      }
      if (inherited.length > 100)
        fail("Flattened import lineage exceeds 100 sources.");
      if (inherited.some((r) => r.synthetic_origin === true)) synthetic = true;
      else if (
        synthetic !== true &&
        inherited.length &&
        inherited.every((r) => r.synthetic_origin === false)
      )
        synthetic = false;
      warnings.push(
        "Inherited synthetic=false/unknown declarations remain unverified external provenance and do not establish operational data or approval; synthetic=true is retained.",
      );
    }
    sourceSchema = "native_export_r01";
    scope = validateScope(source.scope);
    const basis = object(source.basis, "basis");
    originalProject =
      typeof basis.scope_id === "string" ? basis.scope_id : null;
    originalRevision =
      typeof basis.revision_number === "number" ? basis.revision_number : null;
    // Only declared identities and relationships are remapped; text that happens to contain a UUID is preserved.
    for (const rows of Object.values(scope))
      if (Array.isArray(rows))
        for (const row of rows)
          if (row && typeof row === "object" && "id" in row)
            allocate(String(row.id));
    for (const valve of scope.valves)
      for (const allocation of valve.allocations) allocate(allocation.id);
    const rewrite = (v: unknown, key = ""): unknown => {
      if (
        typeof v === "string" &&
        (key === "id" || key.endsWith("_id")) &&
        mapping[v]
      )
        return mapping[v];
      if (Array.isArray(v))
        return v.map((x) =>
          typeof x === "string" && key.endsWith("_ids") && mapping[x]
            ? mapping[x]
            : rewrite(x),
        );
      if (v && typeof v === "object")
        return Object.fromEntries(
          Object.entries(v).map(([k, x]) => [k, rewrite(x, k)]),
        );
      return v;
    };
    scope = rewrite(scope) as Scope;
    for (const area of scope.areas) {
      if (area.facility_id)
        warnings.push(
          `Facility mapping cleared for represented area ${area.id}; select an authorised exact version.`,
        );
      area.facility_id = null;
      area.facility_version = null;
    }
    for (const device of [...scope.valves, ...scope.controllers]) {
      if (device.asset_id)
        warnings.push(
          `Installed-Asset mapping cleared for design record ${device.id}.`,
        );
      device.asset_id = null;
    }
    if (scope.evidence.some((e) => e.kind === "document_reference"))
      warnings.push(
        "Document references retain attributed source/hash; original attachment bytes and access are not conveyed by this export.",
      );
    for (const evidence of scope.evidence)
      if (evidence.reference.startsWith("ppo-file:"))
        losses.push({
          path: `evidence.${evidence.id}.reference`,
          reason:
            "This native attachment reference belongs to the original scope and its bytes are excluded from portable JSON. Reattach the authorised original bytes and bind their exact hash before confirming the new draft.",
        });
    history = true;
    reviews = "unverified_source_only";
  } else {
    if (source.schema_version !== 1 && source.schema_version !== 2)
      fail("Use standalone schema 1/2 or the explicit native export format.");
    sourceSchema =
      source.schema_version === 1 ? "standalone_1" : "standalone_2";
    source = validateLegacyProject(source);
    if (
      typeof source.project_id !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(source.project_id)
    )
      fail("Legacy project identity is invalid.");
    if (
      !Number.isSafeInteger(source.revision) ||
      Number(source.revision) < 1 ||
      typeof source.synthetic !== "boolean"
    )
      fail("Legacy revision and synthetic provenance must be explicit.");
    originalProject = String(source.project_id);
    originalRevision = Number(source.revision);
    synthetic = source.synthetic as boolean;
    scope = blankScope();
    const populated = (value: unknown): boolean =>
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== false &&
      value !== "Unknown" &&
      value !== "Not verified" &&
      !(Array.isArray(value) && value.length === 0);
    const unused = (row: JsonObject, used: string[], path: string) => {
      for (const [key, value] of Object.entries(row))
        if (!used.includes(key) && populated(value))
          losses.push({
            path: `${path}.${key}`,
            reason:
              "Populated legacy field has no verified native mapping; import is held, not silently truncated.",
          });
    };
    const usedCore = ["id", "name", "phase", "notes", "evidence_status"];
    const txt = (row: JsonObject, key: string): string => {
      const v = row[key];
      if (v === undefined || v === null) return "";
      if (typeof v !== "string") return fail(`${key}: expected legacy text.`);
      return v;
    };
    const num = (row: JsonObject, key: string): number | null => {
      const v = row[key];
      if (v === undefined || v === null) return null;
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0)
        return fail(`${key}: expected a finite non-negative legacy number.`);
      return v;
    };
    const seen = new Set<string>();
    const rows = new Map<string, JsonObject[]>();
    const collections = [
      "blocks",
      "cohorts",
      "mainlines",
      "valves",
      "sources",
      "water_samples",
      "pipes",
      "filters",
      "recipes",
      "stocks",
      "controllers",
      "io",
      "sensors",
      "strategies",
      "groups",
      "scenarios",
      "profiles",
      "alarms",
      "evidence",
      "responsibilities",
      "commissioning",
      "issues",
    ];
    for (const kind of collections) {
      if (!Array.isArray(source[kind]))
        fail(`${kind}: required legacy register is missing.`);
      const values = source[kind] as unknown[];
      if (values.length > 5000) fail(`${kind}: too many legacy records.`);
      const parsed = values.map((v, i) => {
        const r = object(v, `${kind}[${i}]`);
        const old = txt(r, "id");
        if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(old) || seen.has(old))
          fail(`${kind}: invalid or duplicate legacy identity.`);
        seen.add(old);
        allocate(old);
        return r;
      });
      rows.set(kind, parsed);
    }
    const list = (kind: string) => rows.get(kind)!;
    const expectedFamilies = [
      "NutriOne",
      "NutriFit",
      "NutriJet Inline",
      "NutriJet Bypass",
      "NutriFlex",
    ];
    if (
      list("profiles").length !== 5 ||
      expectedFamilies.some(
        (name) => !list("profiles").some((r) => r.name === name),
      )
    )
      fail("The five named legacy Priva family profiles must be retained.");
    const ref = (row: JsonObject, key: string, kind: string): string | null => {
      const old = txt(row, key);
      if (!old) return null;
      if (!list(kind).some((r) => r.id === old))
        return fail(`${key}: broken legacy relationship.`);
      return allocate(old);
    };
    const refs = (row: JsonObject, key: string, kind: string): string[] => {
      const values = row[key];
      if (
        !Array.isArray(values) ||
        values.some((v) => typeof v !== "string") ||
        new Set(values).size !== values.length
      )
        return fail(`${key}: invalid or duplicate legacy memberships.`);
      return values.map((v) => ref({ [key]: v }, key, kind)!);
    };
    const phase = (row: JsonObject): Phase =>
      (({
        Existing: "existing",
        Proposed: "proposed",
        Future: "future",
        Excluded: "excluded",
      })[txt(row, "phase")] as Phase | undefined) ?? "unknown";
    const base = (row: JsonObject) => ({
      ...baseRecord(
        allocate(txt(row, "id")),
        txt(row, "name") || "Imported unnamed record",
      ),
      phase: phase(row),
      notes: txt(row, "notes"),
    });
    const date = (r: JsonObject, key: string): string | null =>
      txt(r, key) || null;
    const signed = (r: JsonObject, key: string): number | null => {
      const v = r[key];
      if (v === null || v === undefined) return null;
      if (typeof v !== "number" || !Number.isFinite(v))
        return fail(`${key}: expected a finite signed value.`);
      return v;
    };
    const signal = (r: JsonObject, key: string): Control["signal"] => {
      const raw = txt(r, key),
        mapping: Record<string, Control["signal"]> = {
          "Digital input": "digital_input",
          "Digital output": "digital_output",
          "Pulse input": "pulse",
          "Bus interface": "bus",
          "Universal — assigned DI": "digital_input",
          "Universal — assigned DO": "digital_output",
          "Universal — assigned AI": "analogue_input",
        };
      if (raw.startsWith("Analogue ")) {
        const warning =
          "Exact legacy analogue ranges are retained in bank notes and device control basis. Native signal remains unknown because its generic analogue category cannot distinguish 4–20 mA from 0–10 V; physical compatibility and spare capacity require an explicit native assessment.";
        if (!warnings.includes(warning)) warnings.push(warning);
        return "unknown";
      }
      if (raw && raw !== "Unknown" && !mapping[raw])
        losses.push({
          path: `${r.id}.${key}`,
          reason:
            "Unassigned/unrepresented legacy signal remains unknown; physical channel compatibility is not inferred.",
        });
      return mapping[raw] ?? "unknown";
    };
    const control = (r: JsonObject, isSensor = false): Control => {
      const controller_id = ref(r, "controller_id", "controllers"),
        bank_id = ref(r, "io_bank_id", "io"),
        bank = list("io").find((b) => b.id === r.io_bank_id);
      const additional = num(r, "channel_demand");
      return {
        ...blankControl(),
        owner: controller_id ? "ppo_controller" : "unknown",
        controller_id,
        bank_id,
        channel: txt(r, "control_address"),
        signal: signal(r, isSensor ? "signal_type" : "io_signal_type"),
        voltage: bank ? txt(bank, "voltage") : "",
        additional_channels: additional,
        basis: [
          additional === 0
            ? "Explicit legacy zero additional-channel declaration; applicability requires native review."
            : "Imported physical channel demand; source conditions remain unverified.",
          `Original legacy signal declaration (unverified): ${txt(r, isSensor ? "signal_type" : "io_signal_type") || "not declared"}.`,
        ].join(" "),
      };
    };
    const project = object(source.project, "project");
    legacyMetadata = {
      app_version: txt(source, "app_version"),
      updated_at: txt(source, "updated_at"),
      capture_stage: txt(project, "stage"),
      project_type: txt(project, "project_type"),
      area_measurement_bases: Object.fromEntries(
        list("blocks").map((r) => [txt(r, "id"), txt(r, "area_basis")]),
      ),
      evidence_declarations: Object.fromEntries(
        collections.flatMap((kind) =>
          list(kind)
            .filter((r) => Object.hasOwn(r, "evidence_status"))
            .map((r) => [txt(r, "id"), txt(r, "evidence_status")]),
        ),
      ),
    };
    scope.name = txt(project, "name") || scope.name;
    unused(project, ["name", "stage", "project_type"], "project");
    scope.areas = list("blocks").map((r) => {
      unused(r, [...usedCore, "area_ha", "area_basis"], `blocks.${r.id}`);
      const ha = num(r, "area_ha");
      return {
        ...blankArea(allocate(txt(r, "id"))),
        ...base(r),
        area_m2: ha === null ? null : ha * 10000,
        entered_area_unit: "ha",
        // The issued r02 quantity is explicitly labelled "Planted area (ha)".
        // Its separate area_basis field records measurement provenance only.
        area_basis: "planted",
      };
    });
    scope.crop_groups = list("cohorts").map((r) => {
      const emitterFields = [
        "flow_method",
        "emitters_per_container",
        "emitter_lph",
        "containers_per_emitter",
        "outlets_per_emitter",
        "container_lph",
      ];
      if (
        emitterFields.some((k) => populated(r[k])) &&
        !list("valves").some((v) =>
          (v.allocations as JsonObject[]).some((a) => a.cohort_id === r.id),
        )
      )
        losses.push({
          path: `cohorts.${r.id}.emitter`,
          reason:
            "Emitter details belong to an unallocated crop group; the native valve emitter cannot preserve them until an explicit valve allocation is supplied.",
        });
      unused(
        r,
        [
          ...usedCore,
          "block_id",
          "crop",
          "cohort_area_ha",
          "actual_containers",
          "density_ha",
          "plants_per_container",
          "actual_plants",
          "missing_plants",
          "daily_l_container",
          "water_basis",
          "drain_fraction",
          "drain_basis_confirmed",
          "water_author",
          "flow_method",
          "emitters_per_container",
          "emitter_lph",
          "containers_per_emitter",
          "outlets_per_emitter",
          "container_lph",
        ],
        `cohorts.${r.id}`,
      );
      const area = num(r, "cohort_area_ha");
      return {
        ...blankCropGroup(allocate(txt(r, "id"))),
        ...base(r),
        area_id: ref(r, "block_id", "blocks"),
        crop_description: txt(r, "crop"),
        represented_area_m2: area === null ? null : area * 10000,
        container_count: num(r, "actual_containers"),
        containers_per_ha: num(r, "density_ha"),
        plants_per_container: num(r, "plants_per_container"),
        plant_count: num(r, "actual_plants"),
        missing_plants: num(r, "missing_plants"),
        daily_l_per_container: num(r, "daily_l_container"),
        demand_basis:
          txt(r, "water_basis") === "Gross applied"
            ? "gross"
            : txt(r, "water_basis") === "Net crop requirement"
              ? "net"
              : "unknown",
        drain_fraction: num(r, "drain_fraction"),
        drain_definition_confirmed: txt(r, "drain_basis_confirmed") === "Yes",
        agronomic_author: txt(r, "water_author"),
      };
    });
    scope.sources = list("sources").map((r) => {
      unused(
        r,
        [
          ...usedCore,
          "type",
          "reliable_flow_m3h",
          "pressure_bar",
          "nominal_storage_m3",
          "usable_storage_m3",
        ],
        `sources.${r.id}`,
      );
      return {
        ...blankSource(allocate(txt(r, "id"))),
        ...base(r),
        type: txt(r, "type"),
        reliable_flow_m3h: num(r, "reliable_flow_m3h"),
        pressure_bar: num(r, "pressure_bar"),
        nominal_storage_m3: num(r, "nominal_storage_m3"),
        usable_storage_m3: num(r, "usable_storage_m3"),
      };
    });
    scope.masters = list("mainlines").map((r) => {
      unused(
        r,
        [
          ...usedCore,
          "source_id",
          "circuit",
          "location",
          "model",
          "operating_pressure_bar",
        ],
        `mainlines.${r.id}`,
      );
      return {
        ...blankMaster(allocate(txt(r, "id"))),
        ...base(r),
        source_id: ref(r, "source_id", "sources"),
        circuit: txt(r, "circuit"),
        location: txt(r, "location"),
        model: txt(r, "model"),
        pressure_bar: num(r, "operating_pressure_bar"),
      };
    });
    const legacyEmitter = (r: JsonObject): Emitter => ({
      method:
        txt(r, "flow_method") === "Independent drippers"
          ? "independent"
          : txt(r, "flow_method") === "Verified flow per container"
            ? "verified_per_container"
            : "unknown",
      count: num(r, "emitters_per_container"),
      flow_lph: num(r, "emitter_lph"),
      containers_per_emitter: num(r, "containers_per_emitter"),
      outlets_per_hub: num(r, "outlets_per_emitter"),
      verified_container_lph: num(r, "container_lph"),
    });
    scope.valves = list("valves").map((r) => {
      unused(
        r,
        [
          ...usedCore,
          "mainline_id",
          "location",
          "model",
          "pressure_bar",
          "flow_basis",
          "measured_flow_m3h",
          "design_flow_m3h",
          "allocations",
          "inrush_va",
          "holding_va",
          "feedback",
        ],
        `valves.${r.id}`,
      );
      if (!Array.isArray(r.allocations))
        fail("Legacy valve allocations must be an array.");
      const cohorts: JsonObject[] = [];
      const allocations = (r.allocations as unknown[]).map((value, i) => {
        const a = object(value, "allocation");
        if (
          Object.keys(a).some((k) => !["cohort_id", "containers"].includes(k))
        )
          fail("Unsupported legacy allocation fields.");
        const cropId = ref(a, "cohort_id", "cohorts");
        if (!cropId) fail("Legacy allocation needs a crop group.");
        const crop = list("cohorts").find((c) => c.id === a.cohort_id)!;
        cohorts.push(crop);
        return {
          id: allocate(`allocation:${r.id}:${i}`),
          area_id: ref(crop, "block_id", "blocks"),
          crop_group_id: cropId,
          container_count: num(a, "containers"),
          served_area_m2: null,
          flow_share_fraction: null,
        };
      });
      const emitters = cohorts.map(legacyEmitter);
      if (new Set(emitters.map((e) => JSON.stringify(e))).size > 1)
        losses.push({
          path: `valves.${r.id}.allocations`,
          reason:
            "Mixed cohort emitters need per-allocation emitter mapping; import is held.",
        });
      return {
        ...blankValve(allocate(txt(r, "id"))),
        ...base(r),
        master_id: ref(r, "mainline_id", "mainlines"),
        location: txt(r, "location"),
        model: txt(r, "model"),
        pressure_bar: num(r, "pressure_bar"),
        flow_basis:
          txt(r, "flow_basis") === "Emitter inventory"
            ? "emitter_inventory"
            : txt(r, "flow_basis") === "Measured"
              ? "measured"
              : txt(r, "flow_basis") === "Design allowance"
                ? "design_allowance"
                : "unknown",
        measured_flow_m3h: num(r, "measured_flow_m3h"),
        design_flow_m3h: num(r, "design_flow_m3h"),
        allocations,
        emitter: emitters.length
          ? emitters[0]
          : blankValve(allocate(txt(r, "id"))).emitter,
        inrush_va: num(r, "inrush_va"),
        holding_va: num(r, "holding_va"),
        feedback: txt(r, "feedback"),
      };
    });
    scope.groups = list("groups").map((r) => {
      unused(
        r,
        [
          ...usedCore,
          "valve_ids",
          "recipe_id",
          "delivery_seconds",
          "prepare_seconds",
          "flush_seconds",
          "flush_crop",
          "other_pump_flow_m3h",
          "other_unit_flow_m3h",
          "other_path",
          "maximum_dry_min",
          "minimum_rest_min",
          "maximum_start_interval_min",
        ],
        `groups.${r.id}`,
      );
      const pump = num(r, "other_pump_flow_m3h"),
        unit = num(r, "other_unit_flow_m3h");
      if (populated(r.other_path))
        losses.push({
          path: `groups.${r.id}.other_path`,
          reason:
            "The legacy free-text water path needs an explicit native pump/unit path mapping before confirmation.",
        });
      return {
        ...blankGroup(allocate(txt(r, "id"))),
        ...base(r),
        valve_ids: refs(r, "valve_ids", "valves"),
        recipe_id: ref(r, "recipe_id", "recipes"),
        delivery_seconds: num(r, "delivery_seconds"),
        prepare_seconds: num(r, "prepare_seconds"),
        flush_seconds: num(r, "flush_seconds"),
        flush_to_crop:
          txt(r, "flush_crop") === "Yes"
            ? "yes"
            : txt(r, "flush_crop") === "No"
              ? "no"
              : "unknown",
        other_pump_flow_m3h: pump,
        other_unit_flow_m3h: unit,
        other_path: pump === 0 && unit === 0 ? "none" : "unknown",
        maximum_dry_min: num(r, "maximum_dry_min"),
        minimum_rest_min: num(r, "minimum_rest_min"),
        maximum_start_interval_min: num(r, "maximum_start_interval_min"),
      };
    });
    const minutes = (r: JsonObject, key: string): number | null => {
      const s = txt(r, key);
      if (!s) return null;
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(s))
        return fail(`${key}: invalid legacy time.`);
      return Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
    };
    scope.scenarios = list("scenarios").map((r) => {
      unused(
        r,
        [
          ...usedCore,
          "group_ids",
          "include_future",
          "cycles",
          "start_time",
          "end_time",
          "cycle_spacing_min",
          "source_id",
          "initial_storage_m3",
          "refill_m3h",
          "reserve_m3",
        ],
        `scenarios.${r.id}`,
      );
      return {
        ...blankScenario(allocate(txt(r, "id"))),
        ...base(r),
        group_ids: refs(r, "group_ids", "groups"),
        include_future: txt(r, "include_future") === "Yes",
        cycles: num(r, "cycles"),
        start_minute: minutes(r, "start_time"),
        end_minute: minutes(r, "end_time"),
        spacing_min: num(r, "cycle_spacing_min"),
        spacing_basis: "start_to_start",
        source_id: ref(r, "source_id", "sources"),
        initial_storage_m3: num(r, "initial_storage_m3"),
        refill_m3h: num(r, "refill_m3h"),
        reserve_m3: num(r, "reserve_m3"),
      };
    });
    scope.selected_scenario_id = ref(
      source,
      "selected_scenario_id",
      "scenarios",
    );
    scope.water_samples = list("water_samples").map((r) => {
      unused(
        r,
        [
          ...usedCore,
          "source_id",
          "sample_date",
          "laboratory",
          "ph",
          "ec_mscm",
          "alkalinity",
          "alkalinity_unit",
        ],
        `water_samples.${r.id}`,
      );
      return {
        ...base(r),
        source_id: ref(r, "source_id", "sources"),
        sample_date: date(r, "sample_date"),
        laboratory: txt(r, "laboratory"),
        ph: num(r, "ph"),
        ec_mscm: num(r, "ec_mscm"),
        alkalinity: txt(r, "alkalinity"),
        analytical_units: txt(r, "alkalinity_unit"),
      };
    });
    scope.pipes = list("pipes").map((r) => {
      unused(
        r,
        [
          ...usedCore,
          "from",
          "to",
          "length_m",
          "internal_diameter_mm",
          "design_flow_m3h",
          "loss_basis",
        ],
        `pipes.${r.id}`,
      );
      return {
        ...base(r),
        from: txt(r, "from"),
        to: txt(r, "to"),
        length_m: num(r, "length_m"),
        internal_diameter_mm: num(r, "internal_diameter_mm"),
        design_flow_m3h: num(r, "design_flow_m3h"),
        loss_basis: txt(r, "loss_basis"),
      };
    });
    scope.filters = list("filters").map((r) => {
      unused(
        r,
        [
          ...usedCore,
          "type",
          "flow_path",
          "capacity_m3h",
          "dirty_loss_m",
          "backwash_m3h",
          "discharge",
        ],
        `filters.${r.id}`,
      );
      return {
        ...base(r),
        process: txt(r, "type"),
        path:
          txt(r, "flow_path") === "Pump discharge"
            ? "pump"
            : txt(r, "flow_path") === "Unit delivered flow"
              ? "unit"
              : txt(r, "flow_path") === "Crop delivery flow"
                ? "crop"
                : "unknown",
        capacity_m3h: num(r, "capacity_m3h"),
        dirty_loss_m: num(r, "dirty_loss_m"),
        backwash_m3h: num(r, "backwash_m3h"),
        discharge: txt(r, "discharge"),
      };
    });
    scope.recipes = list("recipes").map((r) => {
      unused(
        r,
        [
          ...usedCore,
          "author",
          "revision",
          "ec_target_mscm",
          "ph_target",
          "ec_basis",
          "composition",
          "changeover",
        ],
        `recipes.${r.id}`,
      );
      return {
        ...base(r),
        author: txt(r, "author"),
        revision: txt(r, "revision"),
        ec_target_mscm: num(r, "ec_target_mscm"),
        ph_target: num(r, "ph_target"),
        ec_basis:
          txt(r, "ec_basis") === "Final delivered EC"
            ? "final"
            : txt(r, "ec_basis") === "Increment above source EC"
              ? "increment"
              : "unknown",
        composition: txt(r, "composition"),
        changeover: txt(r, "changeover"),
      };
    });
    scope.stocks = list("stocks").map((r) => {
      unused(
        r,
        [
          ...usedCore,
          "recipe_id",
          "function",
          "dose_l_m3",
          "tank_usable_l",
          "concentration",
          "capacity_conditions",
        ],
        `stocks.${r.id}`,
      );
      const fn = txt(r, "function");
      if (!["Nutrient", "Acid", "Alkali", "Treatment", "Spare"].includes(fn))
        losses.push({
          path: `stocks.${r.id}.function`,
          reason:
            "Legacy stock function has no exact native counterpart; confirm its explicit role.",
        });
      return {
        ...base(r),
        recipe_id: ref(r, "recipe_id", "recipes"),
        function:
          fn === "Acid"
            ? "acid"
            : fn === "Alkali"
              ? "alkali"
              : fn === "Treatment"
                ? "treatment"
                : fn === "Spare"
                  ? "spare"
                  : "nutrient",
        dose_l_m3: num(r, "dose_l_m3"),
        usable_l: num(r, "tank_usable_l"),
        concentration: txt(r, "concentration"),
        conditions: txt(r, "capacity_conditions"),
      };
    });
    // A legacy global stock limit is not silently cloned into every candidate.
    if (
      list("stocks").some(
        (r) => populated(r.minimum_lph) || populated(r.maximum_lph),
      )
    )
      warnings.push(
        "Legacy stock injection limits remain held until their exact configured candidate/channel binding is resolved.",
      );
    scope.controllers = list("controllers").map((r) => {
      unused(
        r,
        [...usedCore, "family", "model", "serial", "software", "licences"],
        `controllers.${r.id}`,
      );
      const family = txt(r, "family");
      return {
        ...base(r),
        family:
          family === "Compass"
            ? "Compass"
            : family === "Compact CC"
              ? "Compact CC"
              : family === "Connext"
                ? "Connext"
                : family && family !== "Unknown"
                  ? "other"
                  : "unknown",
        asset_id: null,
        model: txt(r, "model"),
        serial: txt(r, "serial"),
        software: txt(r, "software"),
        licences: txt(r, "licences"),
      };
    });
    scope.banks = list("io").map((r) => {
      unused(
        r,
        [
          ...usedCore,
          "controller_id",
          "bank_id",
          "signal_type",
          "voltage",
          "installed",
          "used",
          "reserved",
          "faulty",
          "required",
        ],
        `io.${r.id}`,
      );
      return {
        ...base(r),
        controller_id: ref(r, "controller_id", "controllers"),
        physical_bank: txt(r, "bank_id"),
        signal: signal(r, "signal_type"),
        notes: [
          txt(r, "notes"),
          `Original legacy signal declaration (unverified): ${txt(r, "signal_type") || "not declared"}.`,
        ]
          .filter(Boolean)
          .join("\n"),
        voltage: txt(r, "voltage"),
        installed: num(r, "installed"),
        used: num(r, "used"),
        reserved: num(r, "reserved"),
        faulty: num(r, "faulty"),
        manual_required: num(r, "required"),
      };
    });
    const mappedControlFields = [
      "controller_id",
      "io_bank_id",
      "io_signal_type",
      "channel_demand",
      "control_address",
    ];
    for (const [legacyName, native] of [
      ["valves", scope.valves],
      ["mainlines", scope.masters],
    ] as const)
      for (const r of list(legacyName)) {
        const target = native.find((v) => v.id === allocate(txt(r, "id")))!;
        target.control = control(r);
        for (let i = losses.length - 1; i >= 0; i--)
          if (
            mappedControlFields.some(
              (key) => losses[i].path === `${legacyName}.${r.id}.${key}`,
            )
          )
            losses.splice(i, 1);
      }
    scope.sensors = list("sensors").map((r) => {
      unused(
        r,
        [
          ...usedCore,
          "type",
          "cohort_ids",
          "controller_id",
          "io_bank_id",
          "signal_type",
          "channel_demand",
          "sampling",
        ],
        `sensors.${r.id}`,
      );
      const represented =
        r.cohort_ids === undefined ? [] : refs(r, "cohort_ids", "cohorts");
      if (represented.length > 1)
        losses.push({
          path: `sensors.${r.id}.cohort_ids`,
          reason:
            "This sensor represents multiple cohorts; the current single-crop reference cannot preserve that coverage as a confirmed mapping.",
        });
      return {
        ...base(r),
        measurement: txt(r, "type"),
        crop_group_id: represented.length === 1 ? represented[0] : null,
        control: control(r, true),
        representative_basis: txt(r, "sampling"),
      };
    });
    scope.strategies = list("strategies").map((r) => {
      unused(
        r,
        [
          ...usedCore,
          "trigger",
          "sensor_id",
          "group_ids",
          "reset_period",
          "fallback",
        ],
        `strategies.${r.id}`,
      );
      return {
        ...base(r),
        trigger: txt(r, "trigger"),
        sensor_id: ref(r, "sensor_id", "sensors"),
        group_ids: refs(r, "group_ids", "groups"),
        reset_basis: txt(r, "reset_period"),
        fallback: txt(r, "fallback"),
        capability_evidence_id: null,
      };
    });
    scope.candidates = list("profiles").map((r) => {
      unused(
        r,
        [
          ...usedCore,
          "configuration",
          "controller_id",
          "minimum_m3h",
          "maximum_m3h",
          "minimum_pressure_bar",
          "maximum_pressure_bar",
          "inlet_pressure_bar",
          "source_revision",
          "delivery_arrangement",
        ],
        `profiles.${r.id}`,
      );
      return {
        ...blankCandidate(allocate(txt(r, "id")), txt(r, "name") as Family),
        ...base(r),
        family: txt(r, "name") as Family,
        variant: txt(r, "configuration"),
        controller_id: ref(r, "controller_id", "controllers"),
        minimum_m3h: num(r, "minimum_m3h"),
        maximum_m3h: num(r, "maximum_m3h"),
        minimum_pressure_bar: num(r, "minimum_pressure_bar"),
        maximum_pressure_bar: num(r, "maximum_pressure_bar"),
        proposed_pressure_bar: num(r, "inlet_pressure_bar"),
        pressure_boundary: "unit_inlet",
        source_revision: txt(r, "source_revision"),
        arrangement: txt(r, "delivery_arrangement"),
        shortlisted: source.selected_profile_id === r.id,
      };
    });
    if (source.selected_profile_id)
      ref(source, "selected_profile_id", "profiles");
    scope.evidence = list("evidence").map((r) => {
      unused(
        r,
        [
          "id",
          "name",
          "reference",
          "date",
          "author",
          "related",
          "notes",
          "evidence_status",
        ],
        `evidence.${r.id}`,
      );
      return {
        id: allocate(txt(r, "id")),
        label: txt(r, "name") || "Imported evidence reference",
        kind: "observation",
        reference: txt(r, "reference"),
        source_revision: "",
        sha256: null,
        captured_date: date(r, "date"),
        attribution: txt(r, "author"),
        applicability: txt(r, "related"),
        notes: txt(r, "notes"),
      };
    });
    scope.actions = ["responsibilities", "commissioning", "issues"].flatMap(
      (kind) =>
        list(kind).map((r) => {
          const keys =
            kind === "responsibilities"
              ? ["party", "due_date"]
              : kind === "commissioning"
                ? ["responsible"]
                : ["owner", "due_date"];
          unused(r, [...usedCore, ...keys], `${kind}.${r.id}`);
          return {
            ...base(r),
            owner: txt(
              r,
              kind === "responsibilities"
                ? "party"
                : kind === "commissioning"
                  ? "responsible"
                  : "owner",
            ),
            due_date: kind === "commissioning" ? null : date(r, "due_date"),
            purpose:
              kind === "responsibilities"
                ? ("responsibility" as const)
                : kind === "commissioning"
                  ? ("commissioning_criterion" as const)
                  : ("question" as const),
            status: "open" as const,
          };
        }),
    );
    if (list("alarms").length)
      losses.push({
        path: "alarms",
        reason:
          "The detailed alarm cause/effect register needs its own lossless native mapping; legacy controls must not become operational instructions.",
      });
    const hydraulic = object(source.hydraulics, "hydraulics");
    unused(
      hydraulic,
      [
        "pump_model",
        "speed_rpm",
        "outlet_pressure_bar",
        "static_head_m",
        "pipe_loss_m",
        "filter_loss_m",
        "unit_loss_m",
        "other_loss_m",
        "head_basis_flow_m3h",
        "notes",
        "evidence_status",
      ],
      "hydraulics",
    );
    scope.hydraulics = {
      ...scope.hydraulics,
      pump_model: txt(hydraulic, "pump_model"),
      speed_rpm: num(hydraulic, "speed_rpm"),
      outlet_pressure_bar: num(hydraulic, "outlet_pressure_bar"),
      static_head_m: signed(hydraulic, "static_head_m"),
      pipe_loss_m: num(hydraulic, "pipe_loss_m"),
      filter_loss_m: num(hydraulic, "filter_loss_m"),
      unit_loss_m: num(hydraulic, "unit_loss_m"),
      other_loss_m: num(hydraulic, "other_loss_m"),
      head_basis_flow_m3h: num(hydraulic, "head_basis_flow_m3h"),
      notes: txt(hydraulic, "notes"),
    };
    const site = object(source.site, "site");
    unused(site, ["shed_location", "communications", "lifting"], "site");
    scope.services = {
      shed: txt(site, "shed_location"),
      power: "",
      communications: txt(site, "communications"),
      access: txt(site, "lifting"),
    };
    for (const key of [
      "snapshots",
      "activity",
      "review_history",
      "curve_points",
      "system_curve_points",
    ])
      if (!Array.isArray(source[key]))
        fail(`${key}: required legacy array is missing.`);
    history =
      (source.snapshots as unknown[]).length > 0 ||
      (source.activity as unknown[]).length > 0;
    reviews =
      source.review || (source.review_history as unknown[]).length
        ? "unverified_source_only"
        : "none";
    if (history || reviews !== "none")
      losses.push({
        path: "history",
        reason:
          "Legacy history and local acknowledgements remain unverified source records; exact-byte migration is required before confirm.",
      });
    scope.hydraulics.curve_points = (source.curve_points as unknown[]).map(
      (v, i) => {
        const r = object(v, `curve_points[${i}]`);
        if (
          Object.keys(r).some(
            (k) => !["q", "h", "efficiency", "power"].includes(k),
          )
        )
          fail("Unsupported legacy curve point fields.");
        const q = num(r, "q"),
          h = num(r, "h");
        if (q === null || h === null)
          fail("Legacy curve points require flow and head.");
        return {
          flow_m3h: q!,
          head_m: h!,
          efficiency_percent: num(r, "efficiency"),
          power_kw: num(r, "power"),
        };
      },
    );
    if ((source.curve_points as unknown[]).length)
      losses.push({
        path: "hydraulics.curve_evidence_id",
        reason:
          "Legacy pump points are mapped but exact curve-document provenance still requires explicit evidence binding.",
      });
    if ((source.system_curve_points as unknown[]).length)
      losses.push({
        path: "system_curve_points",
        reason:
          "Legacy system-curve boundary and points require a separate native model; retained in original source.",
      });
    const topKeys = [
      "schema_version",
      "app_version",
      "project_id",
      "revision",
      "updated_at",
      "synthetic",
      "selected_scenario_id",
      "selected_profile_id",
      "project",
      "hydraulics",
      "site",
      "curve_points",
      "system_curve_points",
      "snapshots",
      "activity",
      "review_history",
      "review",
      ...collections,
    ];
    unused(source, topKeys, "source");
    warnings.push(
      "Legacy context absent from the source remains unknown. No berries, hydroponic system, drip or single-pass arrangement is inferred.",
      "Legacy crop/group phases require explicit review; source totals are not silently reissued as native calculations.",
    );
  }
  scope = validateScope(scope);
  const preview = {
    source_schema: sourceSchema,
    source_hash: sourceHash,
    scope,
    identity_map: mapping,
    warnings,
    losses,
    held: losses.length > 0,
    provenance: {
      original_project_id: originalProject,
      original_revision: originalRevision,
      synthetic_origin: synthetic,
      historical_reviews: reviews,
      original_history_retained_in_source: history,
      import_namespace: importNamespace,
      inherited_sources: inherited,
      ...(legacyMetadata ? { legacy_metadata: legacyMetadata } : {}),
    },
  };
  return { ...preview, preview_hash: hash(JSON.stringify(preview)) };
}

export function requireConfirmableImport(
  preview: ImportPreview,
  expectedSourceHash: string,
  expectedPreviewHash: string,
): Scope {
  if (
    preview.source_hash !== expectedSourceHash ||
    preview.preview_hash !== expectedPreviewHash
  )
    throw new AppError(
      409,
      "StaleFertigationImport",
      "Regenerate the exact import preview before confirming.",
    );
  const { preview_hash, ...content } = preview;
  if (hash(JSON.stringify(content)) !== preview_hash)
    throw new AppError(
      409,
      "ChangedFertigationImport",
      "The import preview has changed; regenerate it from the original source.",
    );
  if (preview.held)
    throw new AppError(
      422,
      "HeldFertigationImport",
      "This import has unmapped data. Resolve every listed mapping before creating a native revision.",
    );
  return validateScope(preview.scope);
}
