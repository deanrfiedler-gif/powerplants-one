import type { Principal } from "../../../platform/identity";
import { transaction } from "../../../platform/database";
import { sharedOperation } from "../../../platform/operations";
import { AppError, unavailable } from "../../../platform/errors";
import { scopedOwner } from "../../../shared/authority";
import { object, uuid } from "../../../shared/validation";
import { page } from "../../../shared/reads";
import { workingCompanyFor } from "../../../platform/working-company";
import { sha256 } from "../../../engineering/materials/context";
import { commandInput } from "./validation";
import {
  workAuthority,
  inspect,
  row,
  retained,
  events,
  type RecordRow,
} from "./context";

export async function commandWork(
  p: Principal,
  project: string,
  value: unknown,
) {
  const input = commandInput(project, value),
    reviewing = ["Accept", "Return"].includes(input.action);
  return sharedOperation(
    p,
    input,
    `ProjectSpecialistWork:${input.action}`,
    async (c) => {
      const pr = await workAuthority(
          c,
          p,
          input.project_id,
          reviewing ? "review" : "prepare",
        ),
        existing = await row(c, p, input.id);
      if (
        (existing && existing.project_id !== pr.id) ||
        (!existing && !input.submission)
      )
        throw unavailable();
      // Original authority precedes receipt recovery; current applicability is checked only for a new positive command.
      const source = existing
        ? await retained(c, p, existing)
        : await inspect(c, p, pr.id, input.submission!, false);
      return { pr, existing, source };
    },
    async (c, { pr, existing, source }) => {
      if (pr.lifecycle !== "Active")
        throw new AppError(
          409,
          "ClosedProject",
          "Reopen the Project before making a new work-evidence decision.",
        );
      const prior = existing
        ? (await events(c, p, input.id)).at(-1)
        : undefined;
      if ((prior?.version ?? 0) !== input.expected_version)
        throw new AppError(
          409,
          "VersionConflict",
          "Read the exact current work-evidence version.",
        );
      if (prior && prior.state !== "Submitted")
        throw new AppError(
          409,
          "AlreadyDecided",
          "Recover the original decision or submit an explicit successor.",
        );
      if (
        !reviewing &&
        p.actor_id !== pr.coordinator_id &&
        p.actor_id !== source.brief.content.owner_id
      )
        throw unavailable();
      const submission = existing ?? input.submission!;
      if (reviewing && p.actor_id !== submission.reviewer_id)
        throw unavailable();
      if (input.action === "Submit" || input.action === "Accept") {
        if (existing) await retained(c, p, existing, true, true);
        else await inspect(c, p, pr.id, submission, true, true);
      }
      if (!existing) {
        const reviewer = await scopedOwner(
          c,
          p,
          submission.reviewer_id,
          pr.company_id,
          pr.site_id ?? undefined,
          "project.specialist.work.review",
        );
        await workAuthority(c, reviewer, pr.id, "review");
        await inspect(c, reviewer, pr.id, submission, false);
        if (
          [
            p.actor_id,
            source.source.document.revision_author_id,
            source.source.document.source_author_id,
          ].includes(reviewer.actor_id)
        )
          throw new AppError(
            409,
            "IndependentWorkReviewRequired",
            "The reviewer must differ from the submitter and exact evidence authors.",
          );
        if (submission.predecessor_id) {
          const previous = await row(c, p, submission.predecessor_id);
          if (!previous || previous.project_id !== pr.id) throw unavailable();
          const old = await retained(c, p, previous),
            state = (await events(c, p, previous.id)).at(-1)?.state;
          if (
            state === "Submitted" ||
            !state ||
            old.brief.id !== source.brief.id
          )
            throw new AppError(
              409,
              "TerminalPredecessorRequired",
              "A correction follows terminal evidence for the same specialist brief.",
            );
        }
        await c.query(
          `INSERT INTO ppo.project_specialist_work(id,workspace_id,company_id,project_id,handover_id,document_id,revision_id,reviewer_id,scope,limitations,predecessor_id,source,source_hash,created_by)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [
            input.id,
            p.workspace_id,
            pr.company_id,
            pr.id,
            submission.handover_id,
            submission.document_id,
            submission.revision_id,
            submission.reviewer_id,
            submission.scope,
            submission.limitations,
            submission.predecessor_id,
            source.source,
            sha256(source.source),
            p.actor_id,
          ],
        );
      }
      const state = {
        Submit: "Submitted",
        Accept: "Accepted",
        Return: "Returned",
        Withdraw: "Withdrawn",
      }[input.action];
      const result = (
        await c.query(
          `INSERT INTO ppo.project_specialist_work_events(workspace_id,work_id,version,command,state,note,reason,created_by,operation_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING work_id AS id,version,state,created_at AS updated_at`,
          [
            p.workspace_id,
            input.id,
            input.expected_version + 1,
            input.action,
            state,
            input.note,
            input.reason,
            p.actor_id,
            input.operation_id,
          ],
        )
      ).rows[0];
      return {
        ...result,
        audit_details: {
          project_id: pr.id,
          source_hash: sha256(source.source),
        },
      };
    },
    "ProjectSpecialistWorkEvidence",
    "SharedRecordUpdated",
  );
}
export async function readWork(
  p: Principal,
  project: string,
  value: Record<string, string> = {},
) {
  const q = object(value, ["id", "limit", "cursor"]);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const pr = await workAuthority(c, p, project);
    const present = async (r: RecordRow) => {
      await retained(c, p, r);
      let source_status: "Current" | "Changed" = "Current";
      try {
        await retained(c, p, r, true);
      } catch (e) {
        if (e instanceof AppError && e.code === "WorkEvidenceSourceChanged")
          source_status = "Changed";
        else throw e;
      }
      const history = await events(c, p, r.id),
        last = history.at(-1)!;
      let predecessor_id = r.predecessor_id;
      if (predecessor_id) {
        const previous = await row(c, p, predecessor_id);
        try {
          if (!previous) throw unavailable();
          await retained(c, p, previous);
        } catch (e) {
          if (e instanceof AppError && [403, 404].includes(e.status))
            predecessor_id = null;
          else throw e;
        }
      }
      return {
        id: r.id,
        predecessor_id,
        version: last.version,
        state: last.state,
        reviewer_id: r.reviewer_id,
        scope: r.scope,
        limitations: r.limitations,
        source: r.source,
        source_hash: r.source_hash,
        source_status,
        submitted_by: r.created_by,
        submitted_at: r.created_at.toISOString(),
        history: history.map((e) => ({
          ...e,
          created_at: e.created_at.toISOString(),
        })),
      };
    };
    if (q.id !== undefined) {
      object(q, ["id"]);
      const r = await row(c, p, uuid(q.id, "id"));
      if (!r || r.project_id !== pr.id) throw unavailable();
      return { current: await present(r), synthetic: true };
    }
    const pg = page(
      { limit: q.limit, cursor: q.cursor },
      {
        workspace: p.workspace_id,
        actor: p.actor_id,
        company: workingCompanyFor(p.actor_id),
        project: pr.id,
        kind: "SpecialistWorkEvidence",
      },
    );
    const items: Awaited<ReturnType<typeof present>>[] = [];
    let after = pg.after;
    for (;;) {
      const rows = (
        await c.query<RecordRow>(
          "SELECT * FROM ppo.project_specialist_work WHERE workspace_id=$1 AND project_id=$2 AND ($3::uuid IS NULL OR id>$3) ORDER BY id LIMIT 100",
          [p.workspace_id, pr.id, after],
        )
      ).rows;
      for (const r of rows) {
        try {
          items.push(await present(r));
        } catch (e) {
          if (!(e instanceof AppError && [403, 404].includes(e.status)))
            throw e;
        }
        if (items.length > pg.limit) break;
      }
      if (items.length > pg.limit || rows.length < 100) break;
      after = rows.at(-1)!.id;
    }
    const selected = items.slice(0, pg.limit);
    return {
      items: selected,
      next_cursor:
        items.length > pg.limit ? pg.cursor(selected.at(-1)!.id) : null,
      synthetic: true,
    };
  });
}
