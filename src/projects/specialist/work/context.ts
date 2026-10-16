import type { Principal } from "../../../platform/identity";
import type { QueryClient } from "../../../platform/permissions";
import { AppError, unavailable } from "../../../platform/errors";
import { canonical } from "../../../platform/operations";
import { companyContext } from "../../../shared/authority";
import { authority } from "../context";
import { specialistHandoverSource } from "../handover";
import {
  materialsAccess,
  loadSources,
  loadLines,
  sha256,
} from "../../../engineering/materials/context";
import {
  presentRelease,
  type ReleaseRecord,
} from "../../../engineering/materials/reads";
import {
  documentContext,
  revisionContext,
  targetContext,
} from "../../../library/context";
import { sourceAuthority, exactBytes } from "../../../library/sources";
import type { Submission } from "./validation";

export const changed = () =>
  new AppError(
    409,
    "WorkEvidenceSourceChanged",
    "Compare current source revisions before submitting or accepting work evidence.",
  );
export async function workAuthority(
  c: QueryClient,
  p: Principal,
  project: string,
  duty: "read" | "prepare" | "review" = "read",
) {
  const pr = await authority(
    c,
    p,
    project,
    duty === "prepare" ? "prepare" : "read",
  );
  if (duty === "review")
    await companyContext(
      c,
      p,
      pr.company_id,
      pr.site_id,
      "project.specialist.work.review",
    );
  return pr;
}
export async function inspect(
  c: QueryClient,
  p: Principal,
  project: string,
  input: Submission,
  current: boolean,
  bytes = false,
) {
  const pr = await workAuthority(c, p, project);
  const h = (
    await c.query<{
      id: string;
      version: number;
      package_id: string;
      state: string;
      payload: unknown;
      payload_hash: string;
      outcome_operation_id: string;
      specialist_package_id: string;
      specialist_version: number;
      release_id: string;
      set_id: string;
      demand_source_id: string;
    }>(
      `SELECT h.*,s.package_id FROM ppo.material_handovers h JOIN ppo.material_sets s ON (s.workspace_id,s.id)=(h.workspace_id,h.set_id) WHERE h.workspace_id=$1 AND h.id=$2`,
      [p.workspace_id, input.handover_id],
    )
  ).rows[0];
  if (!h || h.state !== "Accepted" || !h.specialist_package_id)
    throw unavailable();
  const access = await materialsAccess(c, p, h.package_id);
  if (
    access.pkg.project_id !== pr.id ||
    access.pkg.company_id !== pr.company_id ||
    access.pkg.site_id !== pr.site_id
  )
    throw unavailable();
  let brief;
  try {
    brief = await specialistHandoverSource(
      c,
      p,
      h.package_id,
      { id: h.specialist_package_id, version: h.specialist_version },
      current,
    );
  } catch (e) {
    if (
      e instanceof AppError &&
      ["SpecialistSourceChanged", "ProjectNotActive"].includes(e.code)
    )
      throw changed();
    throw e;
  }
  if (sha256(h.payload) !== h.payload_hash) throw changed();
  if (current) {
    const sources = await loadSources(c, p, access),
      lines = await loadLines(c, p, h.set_id, sources);
    const release = (
      await c.query<ReleaseRecord>(
        "SELECT * FROM ppo.material_releases WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, h.release_id],
      )
    ).rows[0];
    const demand = sources.find((s) => s.id === h.demand_source_id);
    if (
      !release ||
      presentRelease(release, lines, sources).current_use !==
        "EligibleForPurpose" ||
      demand?.use !== "Current" ||
      demand.permitted_purpose !== "Procurement"
    )
      throw changed();
  }
  const { d } = await documentContext(c, p, input.document_id);
  await targetContext(c, p, "Project", pr.id, d);
  if (d.site_id !== pr.site_id) throw unavailable();
  const revision = await revisionContext(c, p, d, input.revision_id);
  if (
    current &&
    (d.state !== "Current" ||
      d.current_revision_id !== revision.id ||
      !(await sourceAuthority(c, p, revision.source)).current)
  )
    throw changed();
  if (bytes) await exactBytes(c, p, d.id, revision.id, revision.source);
  const source = {
    handover: {
      id: h.id,
      version: h.version,
      payload_hash: h.payload_hash,
      accept_operation_id: h.outcome_operation_id,
      specialist_id: brief.id,
      specialist_version: brief.version,
    },
    document: {
      id: d.id,
      revision_id: revision.id,
      title: revision.title,
      content_hash: revision.source.content_hash,
      byte_count: revision.source.byte_count,
      revision_author_id: revision.created_by,
      source_author_id: revision.source.author_id,
    },
  };
  return { pr, brief, source };
}
export type Source = Awaited<ReturnType<typeof inspect>>["source"];
export type RecordRow = Submission & {
  id: string;
  project_id: string;
  created_by: string;
  created_at: Date;
  source: Source;
  source_hash: string;
};
export type Event = {
  version: number;
  command: "Submit" | "Accept" | "Return" | "Withdraw";
  state: "Submitted" | "Accepted" | "Returned" | "Withdrawn";
  note: string;
  reason: string;
  created_by: string;
  created_at: Date;
  operation_id: string;
};
export async function row(c: QueryClient, p: Principal, id: string) {
  return (
    await c.query<RecordRow>(
      "SELECT * FROM ppo.project_specialist_work WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, id],
    )
  ).rows[0];
}
export async function events(c: QueryClient, p: Principal, id: string) {
  return (
    await c.query<Event>(
      "SELECT * FROM ppo.project_specialist_work_events WHERE workspace_id=$1 AND work_id=$2 ORDER BY version",
      [p.workspace_id, id],
    )
  ).rows;
}
export async function retained(
  c: QueryClient,
  p: Principal,
  r: RecordRow,
  current = false,
  bytes = false,
) {
  const result = await inspect(c, p, r.project_id, r, current, bytes);
  if (
    canonical(result.source) !== canonical(r.source) ||
    sha256(r.source) !== r.source_hash
  )
    throw unavailable();
  return result;
}
export async function receiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  const r = await row(c, p, id);
  if (!r) throw unavailable();
  const e = (await events(c, p, id)).find(
    (e) => e.created_by === p.actor_id && e.operation_id === operation,
  );
  if (!e) throw unavailable();
  await workAuthority(
    c,
    p,
    r.project_id,
    ["Accept", "Return"].includes(e.command) ? "review" : "prepare",
  );
  await retained(c, p, r);
}
