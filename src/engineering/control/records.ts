import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { unavailable } from "../../platform/errors";
import { canonical } from "../../platform/operations";
import { optionalId, label, uuid } from "../../shared/validation";
import { visible } from "../../shared/reads";
import {
  sourceIds,
  type ControlKind,
  type ControlRecord,
  type ContentByKind,
  type BasisContent,
  type Purpose,
} from "./model";
import {
  hash,
  person,
  row,
  requireSources,
  tables,
  type Access,
  refuse,
} from "./context";

export async function insert<K extends ControlKind>(
  c: PoolClient,
  p: Principal,
  a: Access,
  kind: K,
  data: {
    id: string;
    reference: string;
    title: string;
    owner_id: string;
    due_date: string | null;
    content: ContentByKind[K];
    predecessor_id?: string | null;
    revision?: number;
    state: string;
  },
) {
  return (
    await c.query<ControlRecord<K>>(
      `INSERT INTO ppo.${tables[kind]}(id,workspace_id,company_id,package_id,reference,title,owner_id,due_date,content,predecessor_id,revision,state,created_by,updated_by)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13) RETURNING *,due_date::text`,
      [
        data.id,
        p.workspace_id,
        a.pkg.company_id,
        a.pkg.id,
        data.reference,
        data.title,
        data.owner_id,
        data.due_date,
        data.content,
        data.predecessor_id ?? null,
        data.revision ?? 1,
        data.state,
        p.actor_id,
      ],
    )
  ).rows[0];
}
export async function state(
  c: PoolClient,
  p: Principal,
  kind: ControlKind,
  id: string,
  next: string,
) {
  return (
    await c.query<ControlRecord>(
      `UPDATE ppo.${tables[kind]} SET state=$3,version=version+1,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *,due_date::text`,
      [p.workspace_id, id, next, p.actor_id],
    )
  ).rows[0];
}
export async function validateLinks(
  c: QueryClient,
  p: Principal,
  a: Access,
  kind: ControlKind,
  content: ContentByKind[ControlKind],
) {
  await requireSources(c, p, a, sourceIds(content));
  if (kind === "basis") {
    const b = content as BasisContent;
    for (const id of b.facility_ids) {
      const facility = await visible(c, p, "Facility", id);
      if (facility.site_id !== a.pkg.site_id) throw unavailable();
    }
    for (const item of [...b.requirements, ...b.inputs]) {
      await person(c, p, a, item.owner_id);
      for (const id of item.deliverable_ids)
        await row(c, p, a, "deliverable", id);
    }
    for (const item of b.interfaces) {
      await person(c, p, a, item.provider_id);
      await person(c, p, a, item.receiver_id);
    }
  } else if (kind === "query") {
    const q = content as ContentByKind["query"];
    for (const id of q.deliverable_ids) await row(c, p, a, "deliverable", id);
    await changeLink(c, p, a, q.change_id);
  } else if (kind === "submittal")
    await person(
      c,
      p,
      a,
      (content as ContentByKind["submittal"]).reviewer_id,
      "review",
    );
  else if (kind === "deliverable") {
    const id = (content as ContentByKind["deliverable"]).document_id;
    if (id) await row(c, p, a, "document", id);
  }
}
export async function changeLink(
  c: QueryClient,
  p: Principal,
  a: Access,
  id: string | null,
) {
  if (
    id &&
    !(
      await c.query(
        "SELECT 1 FROM ppo.engineering_changes WHERE workspace_id=$1 AND package_id=$2 AND id=$3",
        [p.workspace_id, a.pkg.id, id],
      )
    ).rowCount
  )
    throw unavailable();
}
export async function confirmations(
  c: QueryClient,
  p: Principal,
  basis: ControlRecord<"basis">,
) {
  const events = (
    await c.query<{
      recorded_by: string;
      content: {
        interface_id: string;
        interface_hash: string;
        basis_revision: number;
      };
    }>(
      "SELECT recorded_by,content FROM ppo.engineering_control_events WHERE workspace_id=$1 AND subject_id=$2 AND action='confirm_interface'",
      [p.workspace_id, basis.id],
    )
  ).rows;
  const confirmed = new Set<string>();
  for (const e of events) {
    const item = basis.content.interfaces.find(
      (i) => i.id === e.content.interface_id,
    );
    if (
      item &&
      e.content.basis_revision === basis.revision &&
      e.content.interface_hash ===
        hash({ item, sources: sourceIds(basis.content) })
    )
      confirmed.add(`${item.id}:${e.recorded_by}`);
  }
  return confirmed;
}
export async function publishSource(
  c: PoolClient,
  p: Principal,
  a: Access,
  command: { operation_id: string; reason: string },
  data: {
    kind: "DesignBasis" | "DrawingIssue";
    reference: string;
    title: string;
    revision: string;
    file_version: string;
    purpose: Purpose;
    content: unknown;
    predecessor_id?: string | null;
    basis_id?: string;
    document_revision_id?: string;
    issue_id?: string;
    restricted?: boolean;
    dependencies?: string[];
  },
) {
  const id = randomUUID(),
    content = canonical(data.content);
  if (content.length > 20000)
    throw refuse(
      "SourceTooLarge",
      "This source manifest exceeds the current retained-source adapter's 20,000 character boundary. Split the reviewed scope.",
    );
  await c.query(
    `INSERT INTO ppo.material_sources(id,workspace_id,company_id,package_id,created_by,kind,reference,title,revision,file_version,permitted_purpose,completeness,content,content_hash,restricted,observed_at,predecessor_id,adapter)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Complete',$12,$13,$14,clock_timestamp(),$15,'SyntheticUpstreamFixture')`,
    [
      id,
      p.workspace_id,
      a.pkg.company_id,
      a.pkg.id,
      p.actor_id,
      data.kind,
      data.reference,
      data.title,
      data.revision,
      data.file_version,
      data.purpose === "TechnicalReleaseForProcurement"
        ? "Procurement"
        : data.purpose === "DesignPreparation"
          ? "DesignCoordination"
          : "InformationOnly",
      content,
      hash(content),
      data.restricted ?? false,
      data.predecessor_id ?? null,
    ],
  );
  for (const dependency of [...new Set(data.dependencies ?? [])])
    await c.query(
      "INSERT INTO ppo.engineering_source_dependencies(workspace_id,package_id,source_id,dependency_id) VALUES($1,$2,$3,$4)",
      [p.workspace_id, a.pkg.id, id, dependency],
    );
  // Exact lineage distinguishes native records from older labelled fixtures while preserving the adapter contract.
  if (data.basis_id || data.document_revision_id || data.issue_id)
    await c.query(
      "INSERT INTO ppo.engineering_source_lineage(workspace_id,package_id,source_id,basis_id,document_revision_id,issue_id) VALUES($1,$2,$3,$4,$5,$6)",
      [
        p.workspace_id,
        a.pkg.id,
        id,
        data.basis_id ?? null,
        data.document_revision_id ?? null,
        data.issue_id ?? null,
      ],
    );
  if (data.predecessor_id)
    await c.query(
      "INSERT INTO ppo.material_source_changes(workspace_id,company_id,source_id,change,successor_id,reason,operation_id,created_by) VALUES($1,$2,$3,'Superseded',$4,$5,$6,$7) ON CONFLICT(workspace_id,source_id) DO NOTHING",
      [
        p.workspace_id,
        a.pkg.company_id,
        data.predecessor_id,
        id,
        command.reason,
        command.operation_id,
        p.actor_id,
      ],
    );
  return id;
}
export type DocumentRevision = {
  discipline: string;
  document_reference: string;
  document_title: string;
  id: string;
  document_id: string;
  source_id: string;
  engineering_revision: string;
  native_system: string;
  native_reference: string;
  native_version: string;
  configuration: string | null;
  outputs: { reference: string; version: string; content_hash: string }[];
  basis_id: string | null;
  predecessor_id: string | null;
  created_by: string;
};
export async function documentRevision(
  c: QueryClient,
  p: Principal,
  a: Access,
  id: string,
) {
  const result = (
    await c.query<DocumentRevision>(
      "SELECT * FROM ppo.engineering_document_revisions WHERE workspace_id=$1 AND package_id=$2 AND id=$3",
      [p.workspace_id, a.pkg.id, id],
    )
  ).rows[0];
  if (!result) throw unavailable();
  await row(c, p, a, "document", result.document_id);
  await requireSources(c, p, a, [result.source_id]);
  return result;
}
export const commonRecord = (r: Record<string, unknown>) => ({
  reference: label(r.reference, "reference", 80),
  title: label(r.title, "title", 200),
  owner_id: uuid(r.owner_id, "owner_id"),
  predecessor_id: optionalId(r.predecessor_id, "predecessor_id"),
});

export async function nativeSourceIds(
  c: QueryClient,
  p: Principal,
  a: Access,
  kind: "basis" | "issue",
  id: string,
  current = true,
) {
  const found = (
    await c.query<{ source_id: string }>(
      `SELECT source_id FROM ppo.engineering_source_lineage WHERE workspace_id=$1 AND package_id=$2 AND ${kind}_id=$3`,
      [p.workspace_id, a.pkg.id, id],
    )
  ).rows.map((r) => r.source_id);
  await requireSources(c, p, a, found, current);
  return found;
}
