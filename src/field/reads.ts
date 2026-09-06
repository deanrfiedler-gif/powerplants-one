import { crmAvailable } from "../crm/context";
import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { requireCapability } from "../platform/permissions";
import { AppError } from "../platform/errors";
import { envelope, page, visible } from "../shared/reads";
import { object, uuid } from "../shared/validation";
import { dispatchReadiness } from "../documents/packs";
import { fieldContext } from "./context";
import { attachmentMetadata } from "./attachments";
import { checkPolicy } from "./validation";
import { activityVisibility } from "../activities/activities";
export async function listMyJobs(p: Principal, input: unknown = {}) {
  const r = object(input, ["limit", "cursor"]);
  const pg = page(r, {
    workspace: p.workspace_id,
    actor: p.actor_id,
    resource: "MyJobs",
  });
  return transaction(async (c) => {
    await requireCapability(c, p, "field.read.own");
    const candidates = (
      await c.query(
        "SELECT DISTINCT a.id FROM ppo.appointments a JOIN ppo.assignments x ON x.appointment_id=a.id JOIN ppo.resources r ON r.id=x.resource_id WHERE a.workspace_id=$1 AND r.user_id=$2 AND r.active AND x.active AND x.assignment_version=a.assignment_version AND ($3::uuid IS NULL OR a.id>$3) ORDER BY a.id",
        [p.workspace_id, p.actor_id, pg.after],
      )
    ).rows;
    const results = [];
    for (const candidate of candidates) {
      try {
        const { a, w } = await fieldContext(c, p, candidate.id);
        const site = await visible(c, p, "Site", a.site_id),
          mine = (
            await c.query(
              "SELECT received_at FROM ppo.field_attendances WHERE workspace_id=$1 AND appointment_id=$2 AND actor_id=$3",
              [p.workspace_id, a.id, p.actor_id],
            )
          ).rows[0];
        results.push({
          id: a.id,
          reference: a.display_number,
          work_order_reference: w.display_number,
          site_name: site.display_name,
          site_timezone: a.site_timezone,
          start_at: a.start_at,
          end_at: a.end_at,
          status: a.status,
          version: a.version,
          my_started_at: mine?.received_at ?? null,
          dispatch_hold: a.dispatch_hold,
        });
        if (results.length > pg.limit) break;
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
    }
    return envelope(
      results.slice(0, pg.limit),
      results.length > pg.limit ? pg.cursor(results[pg.limit - 1].id) : null,
    );
  });
}
export async function readFieldJob(p: Principal, id: string) {
  return transaction(async (c) => {
    const { a, w, r, assignment } = await fieldContext(
        c,
        p,
        uuid(id, "appointment_id"),
      ),
      site = await visible(c, p, "Site", a.site_id),
      customer = await visible(c, p, "Organisation", w.customer_id);
    const pack =
      (
        await c.query(
          "SELECT k.id,k.status,k.needs_review,k.current_issue_id,i.output_hash,i.issued_at,v.revision FROM ppo.packs k LEFT JOIN ppo.pack_issues i ON i.id=k.current_issue_id LEFT JOIN ppo.pack_revisions v ON v.id=i.revision_id WHERE k.workspace_id=$1 AND k.appointment_id=$2",
          [p.workspace_id, id],
        )
      ).rows[0] ?? null;
    const attendance =
      (
        await c.query(
          "SELECT id,actor_id,assignment_id,assignment_version,schedule_version,scope_revision_id,scope_version,scope_hash,issue_id,issue_hash,captured_at,received_at,authority_hash,reason FROM ppo.field_attendances WHERE workspace_id=$1 AND appointment_id=$2 AND actor_id=$3",
          [p.workspace_id, id, p.actor_id],
        )
      ).rows[0] ?? null;
    const entries = (
      await c.query(
        "SELECT e.id,e.version,e.root_id,e.actor_id,u.display_name AS actor_name,e.attendance_id,e.kind,e.scope_item_id,e.asset_id,e.captured_at,e.received_at,e.review_status,e.authority_state,e.payload,e.supersedes_entry_id,e.correction_reason,e.issue_id,e.issue_hash,e.scope_revision_id,e.scope_version,e.scope_hash,e.assignment_id,e.assignment_version,EXISTS(SELECT 1 FROM ppo.field_entries n WHERE n.workspace_id=e.workspace_id AND n.supersedes_entry_id=e.id) AS superseded FROM ppo.field_entries e JOIN ppo.users u ON u.id=e.actor_id WHERE e.workspace_id=$1 AND e.appointment_id=$2 ORDER BY e.received_at,e.id",
        [p.workspace_id, id],
      )
    ).rows;
    const attachments = [];
    for (const file of (
      await c.query(
        "SELECT id FROM ppo.field_attachments WHERE workspace_id=$1 AND appointment_id=$2 AND access_class='RestrictedService' ORDER BY received_at,id",
        [p.workspace_id, id],
      )
    ).rows)
      attachments.push(await attachmentMetadata(p, file.id));
    const draft =
      (
        await c.query(
          "SELECT id,version,updated_at FROM ppo.completion_drafts WHERE workspace_id=$1 AND appointment_id=$2 AND actor_id=$3",
          [p.workspace_id, id, p.actor_id],
        )
      ).rows[0] ?? null;
    const drafts = [];
    if (draft)
      for (const v of (
        await c.query(
          "SELECT id,version,scope_outcome,work_performed,exclusions,remaining_work,time_declaration,material_declaration,declaration_reason,task_outcomes,required_attachments,blockers,follow_up_activity_id,received_at FROM ppo.completion_draft_revisions WHERE workspace_id=$1 AND draft_id=$2 ORDER BY version DESC",
          [p.workspace_id, draft.id],
        )
      ).rows) {
        const refs = (
          await c.query(
            "SELECT x.entry_id AS id,x.entry_version AS version,EXISTS(SELECT 1 FROM ppo.field_entries n WHERE n.workspace_id=x.workspace_id AND n.supersedes_entry_id=x.entry_id) AS superseded FROM ppo.completion_entry_refs x WHERE workspace_id=$1 AND revision_id=$2 ORDER BY entry_id",
            [p.workspace_id, v.id],
          )
        ).rows;
        drafts.push({
          ...v,
          entries: refs,
          evidence_changed: refs.some((e) => e.superseded),
        });
      }
    const follow_ups = (
      await c.query(
        `SELECT f.entry_id,a.id,a.summary,a.status,a.owner_id,u.display_name AS owner_name,a.due_at,a.due_needed FROM ppo.field_follow_ups f JOIN ppo.activities a ON a.id=f.activity_id JOIN ppo.users u ON u.id=a.owner_id WHERE f.workspace_id=$1 AND f.appointment_id=$3 AND ${activityVisibility("a", await crmAvailable(c))} ORDER BY a.created_at`,
        [p.workspace_id, p.actor_id, id],
      )
    ).rows;
    const readiness = await dispatchReadiness(c, p, id, true);
    const contact = site.primary_contact_id
      ? await visible(c, p, "Person", site.primary_contact_id)
      : null;
    const report = (
      await c.query("SELECT to_regclass('ppo.service_reports') AS relation")
    ).rows[0].relation
      ? ((
          await c.query(
            "SELECT id,version,revision,status,current_revision_id FROM ppo.service_reports WHERE workspace_id=$1 AND attendance_id=$2",
            [p.workspace_id, attendance?.id ?? null],
          )
        ).rows[0] ?? null)
      : null;
    const accepted_end_at = report
      ? ((
          await c.query(
            "SELECT accepted_end_at FROM ppo.attendance_acceptances WHERE workspace_id=$1 AND attendance_id=$2",
            [p.workspace_id, attendance?.id],
          )
        ).rows[0]?.accepted_end_at ?? null)
      : null;
    return envelope(
      [
        {
          report,
          accepted_end_at,
          id: a.id,
          reference: a.display_number,
          version: a.version,
          status: a.status,
          schedule_version: a.schedule_version,
          assignment_version: a.assignment_version,
          scope_revision_id: a.scope_revision_id,
          scope_version: a.scope_version,
          scheduled_start_at: a.start_at,
          scheduled_end_at: a.end_at,
          actual_start_at: a.actual_start_at,
          site_timezone: a.site_timezone,
          customer_commitment: a.customer_commitment,
          work_order: {
            id: w.id,
            reference: w.display_number,
            status: w.status,
            service_owner_id: w.service_owner_id,
          },
          customer_name: customer.display_name,
          site: {
            id: site.id,
            name: site.display_name,
            location: site.location_description,
            access: site.access_instructions,
            biosecurity: site.biosecurity_notes,
          },
          contact: contact
            ? {
                name: contact.display_name,
                phone: contact.phone,
                email: contact.email,
              }
            : null,
          scope: {
            id: r.id,
            revision: r.revision,
            version: r.version,
            hash: r.content_hash,
            summary: r.summary,
            exclusions: r.exclusions,
            items: r.items.map(
              (i: {
                id: string;
                sequence: number;
                task_description: string;
                task_kind: string;
                completion_requirements: string[];
                assets: {
                  asset_id: string;
                  display_number: string;
                  description: string;
                  identity_status: string;
                  serial: string | null;
                }[];
              }) => ({
                id: i.id,
                sequence: i.sequence,
                description: i.task_description,
                kind: i.task_kind,
                completion_requirements: i.completion_requirements,
                assets: i.assets.map((x) => ({
                  id: x.asset_id,
                  reference: x.display_number,
                  description: x.description,
                  identity_status: x.identity_status,
                  serial: x.serial,
                })),
              }),
            ),
          },
          assignment,
          pack,
          readiness,
          attendance,
          entries,
          attachments,
          draft,
          draft_revisions: drafts,
          follow_ups,
          check_policy: checkPolicy,
          online_only: true,
        },
      ],
      null,
    );
  });
}
