import { transaction } from "../../platform/database";
import type { Principal } from "../../platform/identity";
import { AppError, unavailable } from "../../platform/errors";
import { object, optionalId } from "../../shared/validation";
import { visibility } from "../../shared/reads";
import { listEngineering } from "../service";
import { access, sources, tables, person } from "./context";
import { confirmations, type DocumentRevision } from "./records";
import {
  basisBlockers,
  controlKinds,
  sourceIds,
  sourceBlockers,
  type ControlKind,
  type ControlRecord,
} from "./model";

export async function controlRead(
  p: Principal,
  packageId: string,
  query: unknown = {},
) {
  const q = object(query, ["record_id"]),
    requested = optionalId(q.record_id, "record_id");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const a = await access(c, p, packageId),
      exactSources = await sources(c, p, a),
      visibleSourceIds = new Set(exactSources.map((s) => s.id));
    const records = {} as { [K in ControlKind]: ControlRecord<K>[] };
    for (const kind of controlKinds) {
      const found = (
        await c.query<ControlRecord>(
          `SELECT *,due_date::text FROM ppo.${tables[kind]} WHERE workspace_id=$1 AND package_id=$2 ORDER BY created_at,id LIMIT 501`,
          [p.workspace_id, a.pkg.id],
        )
      ).rows;
      if (found.length > 500)
        throw new AppError(
          422,
          "ScopeTooLarge",
          "This package exceeds the current 500-record workspace boundary. Use a bounded Engineering package.",
        );
      (records[kind] as ControlRecord[]) = found.filter((r) =>
        sourceIds(r.content).every((id) => visibleSourceIds.has(id)),
      );
    }
    if (
      requested &&
      !Object.values(records)
        .flat()
        .some((r) => r.id === requested)
    )
      throw unavailable();
    const revisions = (
      await c.query<DocumentRevision>(
        "SELECT * FROM ppo.engineering_document_revisions WHERE workspace_id=$1 AND package_id=$2 ORDER BY created_at,id",
        [p.workspace_id, a.pkg.id],
      )
    ).rows.filter(
      (r) =>
        visibleSourceIds.has(r.source_id) &&
        records.document.some((d) => d.id === r.document_id),
    );
    const reviewIds = records.review.map((r) => r.id),
      issueIds = records.issue.map((r) => r.id);
    const findings = (
      await c.query<{
        id: string;
        review_id: string;
        owner_id: string;
        due_date: string | null;
        finding: string;
        response: string | null;
        state: string;
        version: number;
      }>(
        "SELECT id,review_id,owner_id,due_date::text,finding,response,state,version FROM ppo.engineering_findings WHERE workspace_id=$1 AND review_id=ANY($2::uuid[]) ORDER BY created_at,id",
        [p.workspace_id, reviewIds],
      )
    ).rows;
    const transmittals = (
      await c.query<{
        id: string;
        issue_id: string;
        recipient_id: string;
        created_at: string;
        events: {
          kind: string;
          evidence: string;
          recorded_at: string;
          issue_hash: string;
        }[];
      }>(
        `SELECT t.id,t.issue_id,t.recipient_id,t.created_at,
     coalesce((SELECT jsonb_agg(jsonb_build_object('kind',e.kind,'evidence',e.evidence,'recorded_at',e.recorded_at,'issue_hash',e.issue_hash) ORDER BY e.recorded_at) FROM ppo.engineering_distribution_evidence e WHERE (e.workspace_id,e.transmittal_id)=(t.workspace_id,t.id)),'[]') AS events
     FROM ppo.engineering_transmittals t WHERE t.workspace_id=$1 AND t.issue_id=ANY($2::uuid[]) AND ($3 OR t.recipient_id=$4) ORDER BY t.created_at,t.id`,
        [
          p.workspace_id,
          issueIds,
          a.can.issue || a.can.distribute || a.can.review,
          p.actor_id,
        ],
      )
    ).rows;
    const history = (
      await c.query<{
        id: string;
        subject_id: string;
        subject_kind: ControlKind;
        action: string;
        version: number;
        recorded_by: string;
        recorded_at: string;
        reason: string;
        content_hash: string;
        content: {
          source_ids: string[];
          record: ControlRecord;
          rationale?: string;
          outcome?: string;
        };
      }>(
        "SELECT * FROM ppo.engineering_control_events WHERE workspace_id=$1 AND package_id=$2 ORDER BY recorded_at DESC,id LIMIT 500",
        [p.workspace_id, a.pkg.id],
      )
    ).rows.filter((e) =>
      e.content.source_ids.every((id) => visibleSourceIds.has(id)),
    );
    const users = (
      await c.query<{ id: string; display_name: string }>(
        "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND active ORDER BY display_name",
        [p.workspace_id],
      )
    ).rows;
    const people: {
      id: string;
      display_name: string;
      author: boolean;
      review: boolean;
    }[] = [];
    for (const user of users) {
      try {
        await person(c, p, a, user.id);
        const candidate = await access(
          c,
          { ...p, actor_id: user.id, display_name: user.display_name },
          a.pkg.id,
        );
        people.push({
          ...user,
          author: candidate.can.author,
          review: candidate.can.review,
        });
      } catch (e) {
        if (!(e instanceof AppError && [403, 404].includes(e.status))) throw e;
      }
    }
    const facilities = a.pkg.site_id
      ? (
          await c.query<{ id: string; display_name: string }>(
            `SELECT r.id,r.name AS display_name FROM ppo.facilities r WHERE r.workspace_id=$1 AND r.site_id=$3 AND ${visibility("Facility")} ORDER BY r.name`,
            [p.workspace_id, p.actor_id, a.pkg.site_id],
          )
        ).rows
      : [];
    const basisReadiness: Record<
      string,
      { blockers: string[]; confirmed: string[] }
    > = {};
    for (const basis of records.basis) {
      const agreed = await confirmations(c, p, basis);
      basisReadiness[basis.id] = {
        blockers: [
          ...basisBlockers(basis.content, agreed),
          ...sourceBlockers(sourceIds(basis.content), exactSources),
        ],
        confirmed: [...agreed],
      };
    }
    const nativeSources = (
      await c.query<{
        source_id: string;
        basis_id: string | null;
        document_revision_id: string | null;
        issue_id: string | null;
      }>(
        "SELECT source_id,basis_id,document_revision_id,issue_id FROM ppo.engineering_source_lineage WHERE workspace_id=$1 AND package_id=$2",
        [p.workspace_id, a.pkg.id],
      )
    ).rows.filter((r) => visibleSourceIds.has(r.source_id));
    const site = a.pkg.site_id
      ? (
          await c.query<{ display_name: string }>(
            "SELECT display_name FROM ppo.sites WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, a.pkg.site_id],
          )
        ).rows[0]
      : null;
    return {
      package: a.pkg,
      actor_id: p.actor_id,
      can: a.can,
      policy: a.policy
        ? {
            configured: true,
            version: a.policy.policy_version,
            label: "Synthetic Engineering authority policy",
          }
        : {
            configured: false,
            version: null,
            label: "Authority not configured — cannot review or issue",
          },
      records,
      sources: exactSources,
      native_sources: nativeSources,
      site_name: site?.display_name ?? null,
      document_revisions: revisions,
      findings,
      transmittals,
      history,
      people,
      facilities,
      basis_readiness: basisReadiness,
      observed_at: new Date().toISOString(),
      completeness: "Complete" as const,
    };
  });
}
export type ControlRead = Awaited<ReturnType<typeof controlRead>>;
export const controlEntry = (p: Principal, query: unknown) =>
  listEngineering(p, query);
