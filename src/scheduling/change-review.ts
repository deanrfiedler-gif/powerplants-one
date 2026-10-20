import { uuid } from "../shared/validation";
import { transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { appointmentDetail, visibleAppointment } from "./planner";
import { packContext } from "../documents/context";
import { dispatchReadiness } from "../documents/packs";
import type { ChangeReview } from "./changes-model";

// One consistent, read-only projection. Pack evidence retains the pack's own
// permission/assignment boundary; a visible appointment never grants pack access.
export async function readChangeReview(p: Principal, id: string) {
  id = uuid(id, "id");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY");
    const a = await appointmentDetail(c, p, id);
    const people = (
      await c.query<{ id: string; display_name: string }>(
        "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND id=ANY($2::uuid[])",
        [
          p.workspace_id,
          [
            ...new Set(
              a.requests
                .flatMap((r) => [r.created_by, r.decision_by])
                .filter(Boolean),
            ),
          ],
        ],
      )
    ).rows;
    const names = new Map(people.map((u) => [u.id, u.display_name]));
    let consequences: ChangeReview["consequences"] = {
      state: "Unavailable",
      pack: null,
      dispatch_hold: null,
      reasons: [],
    };
    try {
      await visibleAppointment(c, p, id, "pack.read");
      const row = (
        await c.query(
          "SELECT id FROM ppo.packs WHERE workspace_id=$1 AND appointment_id=$2",
          [p.workspace_id, id],
        )
      ).rows[0];
      const pack = row ? (await packContext(c, p, row.id)).pack : null;
      const ready = await dispatchReadiness(c, p, id);
      const issue = pack?.current_issue_id
        ? (
            await c.query(
              "SELECT i.output_hash,i.schedule_version,i.assignment_version,r.revision FROM ppo.pack_issues i JOIN ppo.pack_revisions r ON (r.workspace_id,r.id)=(i.workspace_id,i.revision_id) WHERE i.workspace_id=$1 AND i.id=$2",
              [p.workspace_id, pack.current_issue_id],
            )
          ).rows[0]
        : null;
      const current =
        !!issue &&
        !pack.needs_review &&
        pack.status === "Issued" &&
        issue.schedule_version === a.schedule_version &&
        issue.assignment_version === a.assignment_version;
      consequences = {
        state: "Available",
        dispatch_hold: ready.dispatch_hold,
        reasons: ready.reasons,
        pack: pack
          ? {
              id: pack.id,
              reference: pack.display_number,
              revision: issue?.revision ?? null,
              current,
              recipients: ready.recipients.length,
              acknowledged: ready.recipients.filter(
                (r) =>
                  r.active &&
                  r.assignment_version === a.assignment_version &&
                  r.acknowledged_at &&
                  r.presented_hash === issue?.output_hash &&
                  (!r.return_id || r.return_answered_at),
              ).length,
            }
          : null,
      };
    } catch (error) {
      if (!(error instanceof AppError) || ![403, 404].includes(error.status))
        throw error;
    }
    return {
      ...a,
      requests: a.requests.map((r) => ({
        ...r,
        created_by_name: names.get(r.created_by) ?? "Person unavailable",
        decision_by_name: names.get(r.decision_by) ?? "Person unavailable",
      })),
      consequences,
      observed_at: new Date().toISOString(),
    };
  });
}
