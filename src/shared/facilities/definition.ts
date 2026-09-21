// FAC-D01–03 / CS05-D02. Codes are retained in audit; labels are presentation.
export const structures = {
  greenhouse: "Greenhouse",
  polytunnel: "Polytunnel",
  shade_net_house: "Shade/net house",
  open_growing_area: "Open growing area",
  indoor_growing_room: "Indoor growing room",
  non_growing_facility: "Non-growing facility",
  other: "Other",
  unknown: "Unknown",
} as const;
export const uses = {
  propagation: "Propagation",
  production: "Production",
  trials: "Trials",
  mixed: "Mixed",
  non_growing: "Non-growing",
  unknown: "Unknown",
} as const;
export type FieldDefinition = {
  label: string;
  group: string;
  kind:
    | "text"
    | "note"
    | "choice"
    | "decimal"
    | "integer"
    | "date"
    | "source"
    | "id";
  max?: number;
  scale?: number;
  options?: Record<string, string>;
  structure?: string;
  otherOf?: string;
};
export const fields: Record<string, FieldDefinition> = {
  name: {
    label: "Facility / area name",
    group: "Identity & location",
    kind: "text",
    max: 200,
  },
  parent_facility_id: {
    label: "Parent facility",
    group: "Identity & location",
    kind: "id",
  },
  parent_relationship: {
    label: "Parent relationship",
    group: "Identity & location",
    kind: "choice",
    options: { grouping: "Grouping", physically_within: "Physically within" },
  },
  on_site_position: {
    label: "On-site position",
    group: "Identity & location",
    kind: "note",
    max: 1000,
  },
  location_source: {
    label: "Location source",
    group: "Identity & location",
    kind: "source",
  },
  structure_type: {
    label: "Structure type",
    group: "Structure",
    kind: "choice",
    options: structures,
  },
  type_description: {
    label: "Type description",
    group: "Structure",
    kind: "text",
    max: 200,
    otherOf: "structure_type",
  },
  type_unknown_reason: {
    label: "Type unknown reason",
    group: "Structure",
    kind: "note",
    max: 1000,
  },
  greenhouse_cladding: {
    label: "Cladding",
    group: "Structure",
    kind: "choice",
    structure: "greenhouse",
    options: {
      glass: "Glass",
      plastic_film: "Plastic film",
      rigid_plastic: "Rigid plastic",
      mixed: "Mixed",
      other: "Other",
      unknown: "Unknown",
    },
  },
  greenhouse_cladding_description: {
    label: "Other cladding description",
    group: "Structure",
    kind: "text",
    max: 200,
    otherOf: "greenhouse_cladding",
  },
  bay_count: {
    label: "Bay count",
    group: "Structure",
    kind: "integer",
    max: 10000,
    structure: "greenhouse",
  },
  polytunnel_cover: {
    label: "Tunnel cover",
    group: "Structure",
    kind: "choice",
    structure: "polytunnel",
    options: {
      plastic_film: "Plastic film",
      net: "Net",
      mixed: "Mixed",
      other: "Other",
      unknown: "Unknown",
    },
  },
  polytunnel_cover_description: {
    label: "Other tunnel cover description",
    group: "Structure",
    kind: "text",
    max: 200,
    otherOf: "polytunnel_cover",
  },
  tunnel_count: {
    label: "Tunnel count",
    group: "Structure",
    kind: "integer",
    max: 10000,
    structure: "polytunnel",
  },
  shade_house_cover: {
    label: "Shade/net house cover",
    group: "Structure",
    kind: "choice",
    structure: "shade_net_house",
    options: {
      shade_cloth: "Shade cloth",
      insect_net: "Insect net",
      mixed: "Mixed",
      other: "Other",
      unknown: "Unknown",
    },
  },
  shade_house_cover_description: {
    label: "Other shade/net cover description",
    group: "Structure",
    kind: "text",
    max: 200,
    otherOf: "shade_house_cover",
  },
  open_area_layout: {
    label: "Layout",
    group: "Structure",
    kind: "choice",
    structure: "open_growing_area",
    options: {
      beds: "Beds",
      rows: "Rows",
      benches: "Benches",
      containers: "Containers",
      mixed: "Mixed",
      other: "Other",
      unknown: "Unknown",
    },
  },
  open_area_layout_description: {
    label: "Other layout description",
    group: "Structure",
    kind: "text",
    max: 200,
    otherOf: "open_area_layout",
  },
  growing_levels: {
    label: "Growing levels",
    group: "Structure",
    kind: "integer",
    max: 100,
    structure: "indoor_growing_room",
  },
  facility_function: {
    label: "Function",
    group: "Structure",
    kind: "choice",
    structure: "non_growing_facility",
    options: {
      pump_equipment_room: "Pump/equipment room",
      storage: "Storage",
      packing: "Packing",
      other: "Other",
      unknown: "Unknown",
    },
  },
  facility_function_description: {
    label: "Other function description",
    group: "Structure",
    kind: "text",
    max: 200,
    otherOf: "facility_function",
  },
  use: {
    label: "Use",
    group: "Growing context",
    kind: "choice",
    options: uses,
  },
  crop: {
    label: "Crop / crop group",
    group: "Growing context",
    kind: "text",
    max: 200,
  },
  context_observed_on: {
    label: "Context observed on",
    group: "Growing context",
    kind: "date",
  },
  season_label: {
    label: "Season / context label",
    group: "Growing context",
    kind: "text",
    max: 100,
  },
  context_source: {
    label: "Context source",
    group: "Growing context",
    kind: "source",
  },
  footprint_m2: {
    label: "Footprint (m²)",
    group: "Measurements",
    kind: "decimal",
    scale: 2,
    max: 9999999999.99,
  },
  length_m: {
    label: "Approximate length (m)",
    group: "Measurements",
    kind: "decimal",
    scale: 3,
    max: 9999999.999,
  },
  width_m: {
    label: "Approximate width (m)",
    group: "Measurements",
    kind: "decimal",
    scale: 3,
    max: 9999999.999,
  },
  maximum_height_m: {
    label: "Approximate maximum height (m)",
    group: "Measurements",
    kind: "decimal",
    scale: 3,
    max: 9999999.999,
  },
  measurement_basis: {
    label: "Measurement basis",
    group: "Measurements",
    kind: "choice",
    options: {
      reported: "Reported",
      approximate: "Approximate",
      measured: "Measured",
    },
  },
  measurement_observed_on: {
    label: "Measurement observed on",
    group: "Measurements",
    kind: "date",
  },
  measurement_source: {
    label: "Measurement source",
    group: "Measurements",
    kind: "source",
  },
  detail_notes: {
    label: "Detail notes",
    group: "Source & notes",
    kind: "note",
    max: 2000,
  },
};
export type SourceInput =
  | {
      kind: "reported_note";
      title: string;
      note: string | null;
      source_date: string | null;
    }
  | { kind: "existing_source"; id: string; version: 1 };
export type Source = {
  id: string;
  version: 1;
  kind: "reported_note";
  title: string;
  note: string | null;
  source_date: string | null;
  recorded_by: string;
  recorded_at: string;
  replaces_source_id: string | null;
};
export type Details = Record<string, string | number | Source | null>;
export type Patch = Record<string, string | number | SourceInput | null>;
export type Pin = {
  latitude: string;
  longitude: string;
  state: "proposed" | "confirmed";
  checked_on: string | null;
  source: Source | null;
};
export type PathEntry = {
  id: string;
  name: string;
  version: number;
  parent_relationship: string | null;
};
export type Facility = {
  id: string;
  version: number;
  site_id: string;
  company_id: string;
  site_name: string;
  timezone: string;
  reference: string | null;
  path: PathEntry[];
  details: Details;
  pin: Pin | null;
  updated_at: string;
  updated_by: string;
  can_edit: boolean;
};
export type ChangeRow = {
  field: string;
  label: string;
  before: unknown;
  after: unknown;
};
export type Review = {
  target_id: string;
  version: number;
  proposal_hash: string;
  dependency_hash: string;
  acknowledgements: string[];
};
export type Preview = Review & {
  rows: ChangeRow[];
  clearing: ChangeRow[];
  proposed: Details | Pin | null;
  equipment_review: boolean;
  dependencies?: {
    parent_before: { id: string; name: string }[];
    parent_after: { id: string; name: string }[];
    equipment: {
      id: string;
      description: string;
      display_number: string;
      installed: boolean;
      serves: boolean;
    }[];
    equipment_more: boolean;
  };
};
export function applicable(
  key: string,
  values: Record<string, unknown>,
): boolean {
  const f = fields[key];
  if (f.structure && values.structure_type !== f.structure) return false;
  if (
    f.otherOf &&
    (values[f.otherOf] !== "other" || !applicable(f.otherOf, values))
  )
    return false;
  if (key === "type_unknown_reason") return values.structure_type === "unknown";
  if (key === "crop") return !!values.use && values.use !== "non_growing";
  if (key === "parent_relationship") return !!values.parent_facility_id;
  return true;
}
export function displayValue(value: unknown, field?: string): string {
  if (value === null || value === undefined || value === "")
    return "Not recorded";
  if (typeof value === "object") {
    const s = value as Source;
    return s.title
      ? `Reported note: ${s.title}${s.source_date ? ` · ${s.source_date}` : ""}${s.note ? `\n${s.note}` : ""}${s.id ? `\nSource ${s.id} · version ${s.version}\nRecorded by ${s.recorded_by} at ${s.recorded_at}${s.replaces_source_id ? `\nReplaces source ${s.replaces_source_id}` : ""}` : ""}`
      : JSON.stringify(value);
  }
  return fields[field ?? ""]?.options?.[String(value)] ?? String(value);
}
export function mapUrl(
  pin: Pick<Pin, "latitude" | "longitude">,
): string | null {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", `${pin.latitude},${pin.longitude}`);
  return url.href.length <= 2048 ? url.href : null;
}
