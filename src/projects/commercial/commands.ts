import { sharedOperation } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import type { Principal } from "../../platform/identity";
import { scopedOwner } from "../../shared/authority";
import { commandInput } from "./validation";
import { transition } from "./model";
import { authority, entryRow, history, actions } from "./context";
import { inspectSource, savedSource } from "./sources";

const conflict = (code: string, message: string): never => {
  throw new AppError(409, code, message);
};
export async function commandCommercial(
  p: Principal,
  projectId: string,
  value: unknown,
) {
  const input = commandInput(projectId, value);
  return sharedOperation(
    p,
    input,
    `Commercial:${input.action}`,
    async (c) => {
      const project = await authority(
        c,
        p,
        input.project_id,
        input.action === "Decide" ? "review" : "prepare",
      );
      const entry = await entryRow(c, p, input.id);
      if (entry && entry.project_id !== project.id) throw unavailable();
      if (!entry && input.action !== "Create") throw unavailable();
      const prior = entry
        ? (await history(c, p, entry.id, undefined, 1))[0]
        : null;
      // Replay uses its original source/actions. Current applicability is checked only for new effects.
      const original = entry
        ? (
            await c.query<{ content: typeof input.content }>(
              "SELECT content FROM ppo.project_commercial_events WHERE workspace_id=$1 AND entry_id=$2 AND created_by=$3 AND operation_id=$4",
              [p.workspace_id, entry.id, p.actor_id, input.operation_id],
            )
          ).rows[0]
        : null;
      const basisId = entry ? (entry.basis_id ?? entry.id) : input.basis_id;
      const source = basisId
        ? await savedSource(c, p, basisId)
        : await inspectSource(c, p, project.id, input.source!, false);
      await inspectSource(c, p, project.id, source.input, false, source);
      const content = original?.content ?? input.content ?? prior!.content;
      await actions(c, p, project.id, content.action_ids);
      return { project, entry, prior, source, content };
    },
    async (c, { project, entry, prior, source, content }) => {
      if (project.lifecycle !== "Active")
        conflict(
          "ClosedProject",
          "Reopen the Project before changing commercial controls.",
        );
      if ((prior?.version ?? 0) !== input.expected_version)
        conflict(
          "VersionConflict",
          "Read the exact current commercial version.",
        );
      if (input.action === "Create" && entry)
        conflict("VersionConflict", "This record already exists.");
      if (entry && input.kind && input.kind !== entry.kind)
        conflict("KindRetained", "The commercial record kind is permanent.");
      const kind = entry?.kind ?? input.kind!,
        owner = prior?.content.owner_id ?? content!.owner_id;
      // Creating a basis needs the coordinator; dependent records may also be
      // created by the existing basis owner. Proposed ownership grants no authority.
      const recordedOwner =
        prior?.content.owner_id ??
        (input.basis_id
          ? (await history(c, p, input.basis_id, undefined, 1))[0]?.content
              .owner_id
          : undefined);
      if (
        input.action !== "Decide" &&
        p.actor_id !== project.coordinator_id &&
        p.actor_id !== recordedOwner
      )
        throw unavailable();
      if (prior && content!.owner_id !== owner)
        conflict(
          "OwnerRetained",
          "Commercial owner transfer requires a separate control.",
        );
      const ownerPrincipal = await scopedOwner(
        c,
        p,
        owner,
        project.company_id,
        project.site_id,
        "project.commercial.prepare",
      );
      await authority(c, ownerPrincipal, project.id);
      if (
        prior?.content.action_ids.some(
          (id) => !content!.action_ids.includes(id),
        )
      )
        conflict(
          "ActionsRetained",
          "Keep existing Activity links and resolve them through their own workflow.",
        );
      const state = transition(
        kind,
        prior?.state,
        input.action,
        input.outcome,
        content!,
      );
      if (
        input.action === "Decide" &&
        (
          await c.query(
            "SELECT 1 FROM ppo.project_commercial_events WHERE workspace_id=$1 AND entry_id=$2 AND created_by=$3 AND command IN ('Create','Revise','Submit')",
            [p.workspace_id, input.id, p.actor_id],
          )
        ).rowCount
      )
        conflict(
          "IndependentReviewRequired",
          "A reviewer must differ from every proposal author and submitter.",
        );
      // Withdrawals and recorded evidence remain possible after drift; new use and decisions hold.
      if (
        ["Create", "Revise", "Submit", "Decide"].includes(input.action) &&
        !(kind === "Notice" && input.action === "Create")
      )
        await inspectSource(c, p, project.id, source.input, true, source);
      if (kind !== "Basis") {
        const basis = await entryRow(c, p, entry?.basis_id ?? input.basis_id!);
        if (
          !basis ||
          basis.kind !== "Basis" ||
          basis.project_id !== project.id ||
          (await history(c, p, basis.id, undefined, 1))[0]?.state !== "Approved"
        )
          conflict(
            "ApprovedBasisRequired",
            "Use this Project's independently approved original basis.",
          );
      }
      const predecessor = entry?.predecessor_id ?? input.predecessor_id;
      if (predecessor) {
        const target = await entryRow(c, p, predecessor);
        if (
          !target ||
          target.project_id !== project.id ||
          target.kind !== kind ||
          target.basis_id !== (entry?.basis_id ?? input.basis_id) ||
          (await history(c, p, target.id, undefined, 1))[0]?.state !==
            (kind === "Variation" ? "Approved" : "RecordedEvidence")
        )
          throw unavailable();
        if (
          kind === "Notice" &&
          !entry &&
          (
            await c.query(
              "SELECT 1 FROM ppo.project_commercial_entries WHERE workspace_id=$1 AND predecessor_id=$2",
              [p.workspace_id, predecessor],
            )
          ).rowCount
        )
          conflict(
            "CorrectionExists",
            "Correct the latest notice evidence in this chain.",
          );
      }
      if (
        kind === "Basis" &&
        state === "Approved" &&
        (
          await c.query(
            "SELECT 1 FROM ppo.project_commercial_entries e JOIN ppo.project_commercial_events v ON (v.workspace_id,v.entry_id)=(e.workspace_id,e.id) WHERE e.workspace_id=$1 AND e.project_id=$2 AND e.kind='Basis' AND v.state='Approved'",
            [p.workspace_id, project.id],
          )
        ).rowCount
      )
        conflict(
          "OriginalBasisRetained",
          "This Project already has an approved original basis.",
        );
      if (kind === "Notice" && Date.parse(content!.occurred_at!) > Date.now())
        conflict(
          "FutureNotice",
          "Record future intentions as Activities; this is reported occurrence evidence.",
        );
      if (state === "Satisfied" && !content!.evidence)
        conflict(
          "EvidenceRequired",
          "Record satisfaction evidence before completing the obligation.",
        );
      const snapshot = await actions(c, p, project.id, content!.action_ids);
      if (
        ["Satisfied", "Waived"].includes(state) &&
        snapshot.some((a) => !["Completed", "Cancelled"].includes(a.state))
      )
        conflict(
          "OpenActions",
          "Complete or cancel linked Activities before satisfying or waiving the obligation.",
        );
      if (!entry) {
        await c.query(
          "INSERT INTO ppo.project_commercial_entries(id,workspace_id,company_id,project_id,kind,basis_id,predecessor_id,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
          [
            input.id,
            p.workspace_id,
            project.company_id,
            project.id,
            kind,
            input.basis_id,
            input.predecessor_id,
            p.actor_id,
          ],
        );
        if (kind === "Basis") {
          const s = source.input;
          await c.query(
            "INSERT INTO ppo.project_commercial_sources(workspace_id,basis_id,handover_id,acceptance_event_id,quote_revision_id,issue_id,response_event_id,document_id,document_revision_id,document_review_id,amount,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
            [
              p.workspace_id,
              input.id,
              s.handover_id,
              s.acceptance_event_id,
              s.quotation.revision_id,
              s.quotation.issue_id,
              s.quotation.response_event_id,
              s.document_id,
              s.document_revision_id,
              s.document_review_id,
              source.amount,
              source,
            ],
          );
        }
      }
      const disputed =
        kind === "Variation" &&
        (state === "Disputed" ||
          (!!prior?.disputed &&
            !["Approved", "Rejected", "Withdrawn"].includes(state)));
      const event = (
        await c.query(
          "INSERT INTO ppo.project_commercial_events(workspace_id,entry_id,version,command,state,content,note,disputed,action_snapshot,reason,created_by,operation_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING entry_id AS id,version,state,created_at AS updated_at",
          [
            p.workspace_id,
            input.id,
            input.expected_version + 1,
            input.action,
            state,
            content,
            input.note,
            disputed,
            JSON.stringify(snapshot),
            input.reason,
            p.actor_id,
            input.operation_id,
          ],
        )
      ).rows[0];
      return {
        ...event,
        audit_details: {
          project_id: project.id,
          kind,
          source_hash: source.hash,
        },
      };
    },
    "ProjectCommercialRecord",
    "SharedRecordUpdated",
  );
}
