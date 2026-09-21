import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { transaction } from "../../platform/database";
import type { Principal } from "../../platform/identity";
import { AppError, unavailable } from "../../platform/errors";
import { canonical, sharedOperation } from "../../platform/operations";
import { companyContext } from "../authority";
import { visible, visibility } from "../reads";
import {
  common,
  commonKeys,
  invalid,
  object,
  uuid,
  version,
} from "../validation";
import {
  fields,
  type Details,
  type Patch,
  type Pin,
  type Preview,
  type Review,
  type Source,
  type SourceInput,
} from "./definition";
import {
  decimal,
  mergeDetails,
  observed,
  parsePatch,
  siteToday,
  sourceInput,
} from "./validation";
import { pathFor, projectFacility, sourceProjection, type Row } from "./reads";

const hash = (v: unknown) =>
  createHash("sha256").update(canonical(v)).digest("hex");
const same = (a: unknown, b: unknown) => canonical(a) === canonical(b);
async function editable(
  c: PoolClient,
  p: Principal,
  id: string,
  kind: "Facility" | "Asset" = "Facility",
) {
  const row = (await visible(c, p, kind, id)) as Row;
  await companyContext(c, p, row.company_id, row.site_id, "shared.edit");
  return row;
}
async function locked(
  c: PoolClient,
  p: Principal,
  id: string,
  expected: number,
  kind = "facilities",
) {
  const row = (
    await c.query(
      `SELECT * FROM ppo.${kind} WHERE workspace_id=$1 AND id=$2 FOR UPDATE`,
      [p.workspace_id, id],
    )
  ).rows[0] as Row;
  if (row.version !== expected)
    throw new AppError(
      409,
      "VersionConflict",
      "The saved record changed. Keep your proposal and compare the latest details.",
    );
  return row;
}
const sourceBody = (s: Source | SourceInput | null) =>
  s && s.kind === "reported_note"
    ? { kind: s.kind, title: s.title, note: s.note, source_date: s.source_date }
    : s;
async function resolveSource(
  c: PoolClient,
  p: Principal,
  facilityId: string,
  input: SourceInput | null,
  previous: Source | null,
  today: string,
): Promise<Source | SourceInput | null> {
  if (!input) return null;
  if (input.kind === "existing_source") {
    const s = (
      await c.query(
        "SELECT *,source_date::text FROM ppo.facility_sources WHERE workspace_id=$1 AND facility_id=$2 AND id=$3 AND version=$4",
        [p.workspace_id, facilityId, input.id, input.version],
      )
    ).rows[0];
    if (!s) throw unavailable();
    return sourceProjection(s);
  }
  if (input.source_date) observed(input.source_date, "source_date", today);
  return previous && same(sourceBody(input), sourceBody(previous))
    ? previous
    : input;
}
async function resolvePatch(
  c: PoolClient,
  p: Principal,
  id: string,
  patch: Patch,
  before: Details,
  today: string,
) {
  const result = { ...patch };
  for (const [k, f] of Object.entries(fields))
    if (f.kind === "source" && Object.hasOwn(patch, k))
      result[k] = (await resolveSource(
        c,
        p,
        id,
        patch[k] as SourceInput | null,
        before[k] as Source | null,
        today,
      )) as SourceInput;
  return result;
}
async function persistSource(
  c: PoolClient,
  p: Principal,
  row: Row,
  value: Source | SourceInput | null,
  previous: Source | null,
): Promise<string | null> {
  if (!value) return null;
  if ("id" in value) return value.id;
  const id = randomUUID();
  await c.query(
    `INSERT INTO ppo.facility_sources(id,workspace_id,company_id,site_id,facility_id,kind,title,note,source_date,recorded_by,replaces_source_id)
    VALUES($1,$2,$3,$4,$5,'reported_note',$6,$7,$8,$9,$10)`,
    [
      id,
      p.workspace_id,
      row.company_id,
      row.site_id,
      row.id,
      value.title,
      value.note,
      value.source_date,
      p.actor_id,
      previous?.id ?? null,
    ],
  );
  return id;
}
async function checkParent(
  c: PoolClient,
  p: Principal,
  row: Pick<Row, "id" | "company_id" | "site_id">,
  details: Details,
) {
  const parent = details.parent_facility_id as string | null;
  const path = await pathFor(c, p, parent);
  if (parent) {
    const par = await visible(c, p, "Facility", parent);
    if (par.site_id !== row.site_id || par.company_id !== row.company_id)
      throw unavailable();
    if (parent === row.id || path.some((a) => a.id === row.id))
      invalid(
        "parent_facility_id",
        "A facility cannot be grouped under itself or its descendants.",
      );
  }
  return path.map(({ id, name, parent_relationship }) => ({
    id,
    name,
    parent_relationship,
  }));
}
function readReview(raw: unknown): Review | null {
  if (raw === undefined) return null;
  const r = object(raw, [
    "target_id",
    "version",
    "proposal_hash",
    "dependency_hash",
    "acknowledgements",
  ]);
  if (
    ![r.proposal_hash, r.dependency_hash].every(
      (v) => typeof v === "string" && /^[a-f0-9]{64}$/.test(v),
    )
  )
    invalid("review", "Use the exact server comparison.");
  if (
    !Array.isArray(r.acknowledgements) ||
    r.acknowledgements.length > 5 ||
    r.acknowledgements.some((v) => typeof v !== "string") ||
    new Set(r.acknowledgements).size !== r.acknowledgements.length
  )
    invalid("review", "Accept the exact listed acknowledgements.");
  return {
    target_id: uuid(r.target_id, "review"),
    version: version(r.version),
    proposal_hash: r.proposal_hash as string,
    dependency_hash: r.dependency_hash as string,
    acknowledgements: [...r.acknowledgements].sort(),
  };
}
function confirm(preview: Preview, review: Review | null) {
  if (!review && !preview.acknowledgements.length) return;
  const expected = {
    target_id: preview.target_id,
    version: preview.version,
    proposal_hash: preview.proposal_hash,
    dependency_hash: preview.dependency_hash,
    acknowledgements: preview.acknowledgements,
  };
  if (!review || !same(expected, review))
    throw new AppError(
      409,
      "FacilityReviewChanged",
      "Review the current comparison and confirm its exact changes.",
    );
}
async function derive(
  c: PoolClient,
  p: Principal,
  row: Row,
  patch: Patch,
): Promise<Preview> {
  const before = await projectFacility(c, p, row),
    today = siteToday(before.timezone);
  const resolved = await resolvePatch(
    c,
    p,
    row.id,
    patch,
    before.details,
    today,
  );
  const { next, clearing, contextChanged } = mergeDetails(
    before.details,
    resolved,
    today,
  );
  const parent = await checkParent(c, p, row, next);
  const oldPath = before.path.map(({ id, name, parent_relationship }) => ({
    id,
    name,
    parent_relationship,
  }));
  const rows = Object.keys(fields)
    .filter((k) => !same(before.details[k], next[k]))
    .map((k) => ({
      field: k,
      label: fields[k].label,
      before: before.details[k],
      after: next[k],
    }));
  if (!rows.length) invalid("changes", "There are no changes to save.");
  const equipmentReview =
    before.details.structure_type !== next.structure_type ||
    before.details.use !== next.use;
  const equipment = equipmentReview
    ? (
        await c.query(
          `WITH related AS (SELECT a.id,a.description,a.display_number,(a.facility_id=$3) AS installed,
    EXISTS(SELECT 1 FROM ppo.asset_served_facilities l WHERE l.workspace_id=a.workspace_id AND l.asset_id=a.id AND l.facility_id=$3 AND l.ended_at IS NULL) AS serves
    FROM ppo.assets a WHERE a.workspace_id=$1 AND ${visibility("Asset", "a")} AND
    (a.facility_id=$3 OR EXISTS(SELECT 1 FROM ppo.asset_served_facilities l WHERE l.workspace_id=a.workspace_id AND l.asset_id=a.id AND l.facility_id=$3 AND l.ended_at IS NULL))) SELECT r.*, (SELECT md5(coalesce(string_agg(to_jsonb(all_related)::text,'' ORDER BY all_related.id),'')) FROM related all_related) AS review_basis FROM related r ORDER BY r.id LIMIT 51`,
          [p.workspace_id, p.actor_id, row.id],
        )
      ).rows
    : [];
  const dependencies = {
    parent_before: oldPath,
    parent_after: parent,
    equipment: equipment
      .slice(0, 50)
      .map(({ review_basis: _basis, ...item }) => {
        void _basis;
        return item;
      }),
    equipment_more: equipment.length > 50,
  };
  const a: string[] = [];
  if (clearing.length) a.push("clear_inapplicable");
  if (equipment.length) a.push("equipment_applicability");
  if (
    !same(parent, oldPath) ||
    before.details.parent_relationship !== next.parent_relationship
  )
    a.push("parent_relationship");
  if (
    contextChanged &&
    before.details.context_observed_on &&
    String(next.context_observed_on) <
      String(before.details.context_observed_on)
  )
    a.push("adopt_older_observation");
  return {
    target_id: row.id,
    version: row.version,
    proposal_hash: hash({ before: before.details, proposed: next }),
    dependency_hash: hash({
      ...dependencies,
      equipment_basis: equipment[0]?.review_basis ?? null,
    }),
    dependencies,
    acknowledgements: a.sort(),
    rows,
    clearing: rows.filter((r) => clearing.includes(r.field)),
    proposed: next,
    equipment_review: equipmentReview,
  };
}
export async function previewChange(p: Principal, id: string, input: unknown) {
  id = uuid(id, "id");
  const raw = object(input, ["expected_version", "changes"]),
    expected = version(raw.expected_version),
    patch = parsePatch(raw.changes);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    await editable(c, p, id);
    return derive(c, p, await locked(c, p, id, expected), patch);
  });
}
async function writeDetails(
  c: PoolClient,
  p: Principal,
  row: Row,
  next: Details,
  before: Details,
  bump: boolean,
) {
  const values: Record<string, unknown> = {};
  for (const [k, f] of Object.entries(fields))
    values[f.kind === "source" ? `${k}_id` : k] =
      f.kind === "source"
        ? await persistSource(
            c,
            p,
            row,
            next[k] as Source | SourceInput | null,
            before[k] as Source | null,
          )
        : next[k];
  const entries = Object.entries(values);
  return (
    await c.query(
      `UPDATE ppo.facilities SET ${entries.map(([k], i) => `"${k}"=$${i + 3}`).join(",")}${bump ? ",version=version+1,updated_at=clock_timestamp()" : ""},updated_by=$${entries.length + 3} WHERE workspace_id=$1 AND id=$2 RETURNING *`,
      [p.workspace_id, row.id, ...entries.map(([, v]) => v), p.actor_id],
    )
  ).rows[0] as Row;
}
export async function createFacilityDetails(p: Principal, input: unknown) {
  const raw = object(input, [
    ...commonKeys,
    "id",
    "company_id",
    "site_id",
    "details",
  ]);
  const cmd = {
    ...common(raw),
    id: uuid(raw.id, "id"),
    company_id: uuid(raw.company_id, "company_id"),
    site_id: uuid(raw.site_id, "site_id"),
    details: parsePatch(raw.details, true),
  };
  return sharedOperation(
    p,
    cmd,
    "CreateFacilityDetails",
    async (c) => {
      await companyContext(c, p, cmd.company_id, cmd.site_id, "shared.create");
      await checkParent(c, p, cmd, cmd.details as Details);
    },
    async (c) => {
      const site = await visible(c, p, "Site", cmd.site_id),
        today = siteToday(site.timezone);
      const patch = await resolvePatch(c, p, cmd.id, cmd.details, {}, today);
      const next = mergeDetails({}, patch, today).next;
      const parent = await checkParent(c, p, cmd, next);
      // Insert the identity and scalar details together, then attach immutable source rows in this same transaction.
      const scalars = Object.entries(fields)
        .filter(([, f]) => f.kind !== "source")
        .map(([k]) => [k, next[k]] as const);
      const row = (
        await c.query(
          `INSERT INTO ppo.facilities(id,workspace_id,company_id,site_id,created_by,updated_by,${scalars.map(([k]) => `"${k}"`).join(",")}) VALUES($1,$2,$3,$4,$5,$5,${scalars.map((_, i) => `$${i + 6}`).join(",")}) RETURNING *`,
          [
            cmd.id,
            p.workspace_id,
            cmd.company_id,
            cmd.site_id,
            p.actor_id,
            ...scalars.map(([, v]) => v),
          ],
        )
      ).rows[0] as Row;
      const saved = await writeDetails(c, p, row, next, {}, false),
        after = await projectFacility(c, p, saved);
      return {
        ...saved,
        state: "Recorded",
        audit_details: {
          before: null,
          after: after.details,
          parent_path: parent,
          context_observation: !!after.details.context_observed_on,
        },
      };
    },
    "Facility",
    "SharedRecordCreated",
  );
}
export async function reviseFacilityDetails(
  p: Principal,
  id: string,
  input: unknown,
) {
  id = uuid(id, "id");
  const raw = object(input, [
    ...commonKeys,
    "expected_version",
    "changes",
    "review",
  ]);
  const cmd = {
    ...common(raw),
    id,
    expected_version: version(raw.expected_version),
    changes: parsePatch(raw.changes),
    review: readReview(raw.review),
  };
  return sharedOperation(
    p,
    cmd,
    "ReviseFacilityDetails",
    (c) => editable(c, p, id),
    async (c) => {
      const row = await locked(c, p, id, cmd.expected_version),
        before = await projectFacility(c, p, row),
        preview = await derive(c, p, row, cmd.changes);
      confirm(preview, cmd.review);
      const saved = await writeDetails(
          c,
          p,
          row,
          preview.proposed as Details,
          before.details,
          true,
        ),
        after = await projectFacility(c, p, saved);
      return {
        ...saved,
        state: "Recorded",
        audit_details: {
          before: before.details,
          after: after.details,
          changes: preview.rows,
          clearing: preview.clearing,
          parent_path: after.path,
          reviewed_dependencies: preview.dependencies,
          context_observation: preview.rows.some((r) =>
            [
              "use",
              "crop",
              "season_label",
              "context_source",
              "context_observed_on",
            ].includes(r.field),
          ),
        },
      };
    },
    "Facility",
    "SharedRecordUpdated",
  );
}
type PinInput = {
  latitude: string;
  longitude: string;
  state: "proposed" | "confirmed";
  checked_on: string | null;
  source: SourceInput | null;
};
function parsePin(input: unknown): PinInput {
  const r = object(input, [
    "latitude",
    "longitude",
    "state",
    "checked_on",
    "source",
  ]);
  if (!["proposed", "confirmed"].includes(String(r.state)))
    invalid("state", "Choose Proposed or Confirmed.");
  return {
    latitude: decimal(r.latitude, "latitude", 7, -90, 90),
    longitude: decimal(r.longitude, "longitude", 7, -180, 180),
    state: r.state as PinInput["state"],
    checked_on:
      r.checked_on === undefined ? null : (r.checked_on as string | null),
    source: r.source === undefined ? null : sourceInput(r.source, "source"),
  };
}
async function derivePin(
  c: PoolClient,
  p: Principal,
  row: Row,
  input: PinInput | null,
): Promise<Preview> {
  const saved = await projectFacility(c, p, row),
    before = saved.pin,
    today = siteToday(saved.timezone);
  let next: Pin | null = null;
  if (input) {
    const source = await resolveSource(
      c,
      p,
      row.id,
      input.source,
      before?.source ?? null,
      today,
    );
    const date = observed(input.checked_on, "checked_on", today);
    if (input.state === "confirmed" && (!source || !date))
      invalid("source", "Confirmation requires a source and checked date.");
    if (input.state === "proposed" && date)
      invalid("checked_on", "A proposed pin has no confirmation date.");
    next = { ...input, checked_on: date, source: source as Source | null };
  }
  if (same(before, next)) invalid("pin", "There are no changes to save.");
  const a =
    next?.state === "confirmed"
      ? ["confirm_exact_pin"]
      : !next
        ? ["remove_exact_pin"]
        : [];
  return {
    target_id: row.id,
    version: row.version,
    proposal_hash: hash({ before, proposed: next }),
    dependency_hash: hash({ site_id: row.site_id }),
    acknowledgements: a,
    rows: [{ field: "pin", label: "Facility pin", before, after: next }],
    clearing: [],
    proposed: next,
    equipment_review: false,
  };
}
export async function previewPin(p: Principal, id: string, input: unknown) {
  id = uuid(id, "id");
  const raw = object(input, ["expected_version", "pin"]),
    expected = version(raw.expected_version),
    pin = raw.pin === null ? null : parsePin(raw.pin);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    await editable(c, p, id);
    return derivePin(c, p, await locked(c, p, id, expected), pin);
  });
}
export async function setFacilityPin(
  p: Principal,
  id: string,
  input: unknown,
  remove = false,
) {
  id = uuid(id, "id");
  const raw = object(input, [
    ...commonKeys,
    "expected_version",
    "review",
    ...(remove ? [] : ["pin"]),
  ]);
  const cmd = {
    ...common(raw),
    id,
    expected_version: version(raw.expected_version),
    pin: remove ? null : parsePin(raw.pin),
    review: readReview(raw.review),
  };
  return sharedOperation(
    p,
    cmd,
    remove ? "RemoveFacilityPin" : "SetFacilityPin",
    (c) => editable(c, p, id),
    async (c) => {
      const row = await locked(c, p, id, cmd.expected_version),
        before = await projectFacility(c, p, row),
        preview = await derivePin(c, p, row, cmd.pin);
      confirm(preview, cmd.review);
      const pin = preview.proposed as Pin | null,
        sourceId = await persistSource(
          c,
          p,
          row,
          pin?.source ?? null,
          before.pin?.source ?? null,
        );
      const saved = (
        await c.query(
          `UPDATE ppo.facilities SET pin_latitude=$3,pin_longitude=$4,pin_state=$5,pin_checked_on=$6,pin_source_id=$7,version=version+1,updated_by=$8,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *`,
          [
            p.workspace_id,
            id,
            pin?.latitude ?? null,
            pin?.longitude ?? null,
            pin?.state ?? null,
            pin?.checked_on ?? null,
            sourceId,
            p.actor_id,
          ],
        )
      ).rows[0] as Row;
      return {
        ...saved,
        state: "Recorded",
        audit_details: {
          before: before.pin,
          after: (await projectFacility(c, p, saved)).pin,
          changes: preview.rows,
        },
      };
    },
    "Facility",
    "SharedRecordUpdated",
  );
}
export async function addAssetServedFacility(
  p: Principal,
  id: string,
  input: unknown,
) {
  id = uuid(id, "id");
  const raw = object(input, [
    ...commonKeys,
    "expected_version",
    "facility_id",
    "source",
  ]);
  const source = sourceInput(raw.source, "source");
  if (!source)
    invalid("source", "Record the basis of this service relationship.");
  const cmd = {
    ...common(raw),
    id,
    expected_version: version(raw.expected_version),
    facility_id: uuid(raw.facility_id, "facility_id"),
    source,
  };
  return sharedOperation(
    p,
    cmd,
    "AddAssetServedFacility",
    async (c) => {
      const asset = await editable(c, p, id, "Asset"),
        f = (await visible(c, p, "Facility", cmd.facility_id)) as Row;
      if (asset.site_id !== f.site_id || asset.company_id !== f.company_id)
        throw unavailable();
      return f;
    },
    async (c, f) => {
      await locked(c, p, id, cmd.expected_version, "assets");
      const site = await visible(c, p, "Site", f.site_id);
      const resolved = await resolveSource(
        c,
        p,
        f.id,
        source,
        null,
        siteToday(site.timezone),
      );
      const sid = await persistSource(c, p, f, resolved, null),
        linkId = randomUUID();
      await c.query(
        "INSERT INTO ppo.asset_served_facilities(id,workspace_id,company_id,site_id,asset_id,facility_id,source_id,recorded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          linkId,
          p.workspace_id,
          f.company_id,
          f.site_id,
          id,
          f.id,
          sid,
          p.actor_id,
        ],
      );
      const asset = (
        await c.query(
          "UPDATE ppo.assets SET version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, id, p.actor_id],
        )
      ).rows[0];
      return {
        ...asset,
        state: asset.identity_status,
        audit_details: {
          link_id: linkId,
          facility_id: f.id,
          source_id: sid,
          relationship: "Serves",
          action: "Added",
        },
      };
    },
    "Asset",
    "SharedRecordUpdated",
  );
}
export async function endAssetServedFacility(
  p: Principal,
  id: string,
  linkId: string,
  input: unknown,
) {
  id = uuid(id, "id");
  linkId = uuid(linkId, "link_id");
  const raw = object(input, [...commonKeys, "expected_version"]);
  const cmd = {
    ...common(raw),
    id,
    link_id: linkId,
    expected_version: version(raw.expected_version),
  };
  return sharedOperation(
    p,
    cmd,
    "EndAssetServedFacility",
    async (c) => {
      await editable(c, p, id, "Asset");
      const link = (
        await c.query(
          "SELECT * FROM ppo.asset_served_facilities WHERE workspace_id=$1 AND asset_id=$2 AND id=$3",
          [p.workspace_id, id, linkId],
        )
      ).rows[0];
      if (!link) throw unavailable();
      await visible(c, p, "Facility", link.facility_id);
      return link;
    },
    async (c, link) => {
      await locked(c, p, id, cmd.expected_version, "assets");
      if (link.ended_at)
        invalid("link_id", "This relationship has already ended.");
      await c.query(
        "UPDATE ppo.asset_served_facilities SET ended_at=clock_timestamp(),ended_by=$3,end_reason=$4 WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, linkId, p.actor_id, cmd.reason],
      );
      const asset = (
        await c.query(
          "UPDATE ppo.assets SET version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, id, p.actor_id],
        )
      ).rows[0];
      return {
        ...asset,
        state: asset.identity_status,
        audit_details: {
          link_id: linkId,
          facility_id: link.facility_id,
          source_id: link.source_id,
          relationship: "Serves",
          action: "Ended",
        },
      };
    },
    "Asset",
    "SharedRecordUpdated",
  );
}
