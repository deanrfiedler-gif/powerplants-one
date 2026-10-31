import { randomUUID } from "node:crypto";
import { database, transaction } from "../platform/database";
import type { QueryClient } from "../platform/permissions";
import { appointmentPreparation, preparationInstalled } from "./site-readiness";

async function canRead(
  c: QueryClient,
  workspace: string,
  actor: string,
  company: string,
  site: string,
  capability: string,
) {
  return !!(
    await c.query(
      `SELECT 1 FROM ppo.users u JOIN ppo.permission_grants g ON (g.workspace_id,g.user_id)=(u.workspace_id,u.id)
     WHERE u.workspace_id=$1 AND u.id=$2 AND u.active AND g.capability=$5
     AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
     AND (g.scope_type='Workspace' OR (g.company_id=$3 AND (g.scope_type='Company' OR (g.scope_type='Site' AND g.site_id=$4))))`,
      [workspace, actor, company, site, capability],
    )
  ).rowCount;
}

// One database transaction per visit, sharing the normal workspace command lock.
// Immutable follow-up mappings are original-operation recovery for this internal
// worker. It creates Activities only; it has no channel/provider dependency.
// Clock is an internal dependency for deterministic worker proofs; the entrypoint
// uses PostgreSQL time. No route or command accepts an as-of override.
export async function runPreparationDeadlines(
  clock: (c: QueryClient) => Promise<Date> = async (c) =>
    (await c.query("SELECT clock_timestamp() AS now")).rows[0].now,
) {
  const result = { examined: 0, created: 0, unavailable: 0 };
  if (!(await preparationInstalled(database()))) return result;
  let after = "00000000-0000-0000-0000-000000000000";
  for (;;) {
    const batch = (
      await database().query(
        `SELECT a.id,a.workspace_id FROM ppo.appointments a JOIN ppo.scheduling_preparation_policies p
       ON p.workspace_id=a.workspace_id AND p.readiness_policy_id=a.policy_version_id
       WHERE a.id>$1 AND a.status='Confirmed' AND a.actual_start_at IS NULL
       ORDER BY a.id LIMIT 100`,
        [after],
      )
    ).rows;
    if (!batch.length) break;
    for (const key of batch) {
      const one = await transaction(async (c) => {
        await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
          key.workspace_id,
        ]);
        const a = (
          await c.query(
            `SELECT a.*,w.service_owner_id,pk.current_issue_id,pk.current_revision_id,pk.needs_review,pk.status AS pack_status,
           r.created_by AS preparer_id,i.schedule_version AS issue_schedule_version,i.issued_at
           FROM ppo.appointments a JOIN ppo.work_orders w ON (w.workspace_id,w.id)=(a.workspace_id,a.work_order_id)
           LEFT JOIN ppo.packs pk ON (pk.workspace_id,pk.appointment_id)=(a.workspace_id,a.id)
           LEFT JOIN ppo.pack_revisions r ON (r.workspace_id,r.id)=(pk.workspace_id,pk.current_revision_id)
           LEFT JOIN ppo.pack_issues i ON (i.workspace_id,i.id)=(pk.workspace_id,pk.current_issue_id)
           WHERE a.workspace_id=$1 AND a.id=$2`,
            [key.workspace_id, key.id],
          )
        ).rows[0];
        if (!a || a.status !== "Confirmed" || a.actual_start_at)
          return { created: 0, unavailable: 0 };
        const view = await appointmentPreparation(c, a.workspace_id, a.id);
        if (!view) return { created: 0, unavailable: 0 };
        const now = await clock(c);
        const due: {
          kind: "SiteReadinessDue" | "PackIssueDue";
          owner: string;
          at: string;
          summary: string;
        }[] = [];
        if (
          Date.parse(view.confirmation_due_at) <= now.getTime() &&
          (view.outcome !== "Pass" || view.late)
        )
          due.push({
            kind: "SiteReadinessDue",
            owner: a.service_owner_id,
            at: view.confirmation_due_at,
            summary:
              "Record customer site readiness; the synthetic confirmation deadline has passed",
          });
        const issued =
          a.current_issue_id &&
          a.pack_status === "Issued" &&
          !a.needs_review &&
          a.issue_schedule_version === a.schedule_version;
        if (
          view.issue_due_at &&
          Date.parse(view.issue_due_at) <= now.getTime() &&
          (!issued || a.issued_at > new Date(view.issue_due_at))
        ) {
          const preparer =
            a.preparer_id &&
            (await canRead(
              c,
              a.workspace_id,
              a.preparer_id,
              a.company_id,
              a.site_id,
              "pack.read",
            ))
              ? a.preparer_id
              : a.service_owner_id;
          for (const owner of [
            ...new Set<string>([preparer, a.service_owner_id]),
          ])
            due.push({
              kind: "PackIssueDue",
              owner,
              at: view.issue_due_at,
              summary:
                "Review missed synthetic job-pack issue deadline. The booking is unchanged",
            });
        }
        let created = 0,
          unavailable = view.issue_due_at ? 0 : 1;
        for (const task of due) {
          const existing = await c.query(
            "SELECT 1 FROM ppo.preparation_deadline_follow_ups WHERE workspace_id=$1 AND appointment_id=$2 AND schedule_version=$3 AND kind=$4 AND owner_id=$5",
            [a.workspace_id, a.id, a.schedule_version, task.kind, task.owner],
          );
          if (existing.rowCount) continue;
          if (
            !(await canRead(
              c,
              a.workspace_id,
              task.owner,
              a.company_id,
              a.site_id,
              "activity.read",
            )) ||
            !(await canRead(
              c,
              a.workspace_id,
              task.owner,
              a.company_id,
              a.site_id,
              "shared.read",
            ))
          ) {
            unavailable++;
            continue;
          }
          const activity = randomUUID();
          await c.query(
            `INSERT INTO ppo.activities(id,workspace_id,company_id,site_id,created_by,updated_by,kind,owner_id,summary,due_at,due_needed,access_class)
             VALUES($1,$2,$3,$4,$5,$5,$6,$5,$7,$8,false,'RestrictedService')`,
            [
              activity,
              a.workspace_id,
              a.company_id,
              a.site_id,
              task.owner,
              task.kind === "SiteReadinessDue"
                ? "CustomerContact"
                : "TechnicalFollowUp",
              `${a.display_number} · ${task.summary} · Schedule v${a.schedule_version}. No message has been sent.`,
              task.at,
            ],
          );
          await c.query(
            "INSERT INTO ppo.activity_links(workspace_id,company_id,activity_id,object_type,object_id) VALUES($1,$2,$3,'Site',$4)",
            [a.workspace_id, a.company_id, activity, a.site_id],
          );
          await c.query(
            "INSERT INTO ppo.preparation_deadline_follow_ups(workspace_id,appointment_id,schedule_version,kind,owner_id,activity_id,policy_id,due_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
            [
              a.workspace_id,
              a.id,
              a.schedule_version,
              task.kind,
              task.owner,
              activity,
              view.policy.id,
              task.at,
            ],
          );
          created++;
        }
        return { created, unavailable };
      });
      result.examined++;
      result.created += one.created;
      result.unavailable += one.unavailable;
    }
    after = batch.at(-1)!.id;
  }
  return result;
}
