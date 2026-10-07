import { randomUUID } from "node:crypto";
import type { Principal } from "../../platform/identity";
import { unavailable } from "../../platform/errors";
import {
  sharedOperation,
  recordOperation,
  type OperationReceipt,
} from "../../platform/operations";
import { supplyRecord } from "../../supply/context";
import { factCommand } from "../../supply/validation";
import { recordFactInTransaction } from "../../supply/commands";
import { saveTaskInTransaction } from "../../projects/service";
import { parseTask } from "../../projects/validation";
import { conversionAuthority, conversionContext } from "../conversion/context";
import { conversionReadClient } from "../conversion/source-authority";
import { dispositionHash } from "../disposition/context";
import { releaseHash } from "../release/context";
import { draftBytes } from "../worker";
import { expected } from "../service";
import { followupContext, followupOwner } from "./context";
import { followupConflict } from "./authority";
import { currentEvidenceChecked } from "./receipt-context";
import { materialInput } from "./material-input";
import {
  materialDependencies,
  materialOwner,
  materialCommandAuthority,
  materialOriginalAuthority,
  materialHolds,
  type MaterialEvent,
} from "./material-context";

export async function executeMaterial(
  p: Principal,
  id: string,
  action: Parameters<typeof materialInput>[1],
  value: unknown,
) {
  const input = materialInput(id, action, value);
  return sharedOperation(
    p,
    input,
    "QuoteSupply:" + action,
    async (c) => {
      const source = await conversionAuthority(
        c,
        p,
        id,
        action !== "MaterialReceive",
      );
      await supplyRecord(
        c,
        p,
        input.target_id,
        action === "MaterialReceive" ? "supply.read" : "supply.coordinate",
      );
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.quote_material_events WHERE workspace_id=$1 AND created_by=$2 AND operation_id=$3",
            [p.workspace_id, p.actor_id, input.operation_id],
          )
        ).rowCount
      )
        await materialOriginalAuthority(c, p, id, input.operation_id);
      return source;
    },
    async (c, source) => {
      const read = await conversionReadClient(c, p);
      const context = await conversionContext(read, p, id, source);
      const t = await followupContext(read, p, id, input.target_id, {
        context,
      });
      const s = t.material_resolution,
        checked = currentEvidenceChecked(t.basis);
      expected(t.sequence, input.expected_sequence);
      expected(s.sequence, input.expected_material_sequence);
      if (
        input.execution_id !== t.execution_id ||
        input.basis_hash !== t.basis_hash
      )
        followupConflict(
          "Compare exact current quotation, allocation and downstream evidence.",
        );
      if (
        releaseHash((await draftBytes(p, id)).manifest) !==
        t.basis.conversion.output_hash
      )
        followupConflict("Original issued output is unavailable or changed.");
      if (
        !t.referral ||
        t.referral.id !== input.referral_id ||
        t.receiving?.decision !== "Accepted"
      )
        followupConflict(
          "The current exact Supply referral must be accepted for review.",
        );
      const eventId = randomUUID();
      let proposalId: string = eventId,
        reviewId: string | null = null,
        role: MaterialEvent["role"] = null;
      let decision: MaterialEvent["decision"] = "Proposed",
        reviewHash: string | null = null;
      let deps: MaterialEvent["dependencies"],
        projectCommand: MaterialEvent["project_command"],
        diamondCommands: MaterialEvent["diamond_commands"] = null,
        mergeSuccessorCommand: MaterialEvent["merge_successor_command"] = null,
        branchSuccessorCommand: MaterialEvent["branch_successor_command"] =
          null,
        chainEndCommand: MaterialEvent["chain_end_command"] = null,
        successorCommand: MaterialEvent["successor_command"] = null,
        impactCommand: MaterialEvent["impact_command"],
        proposalHash: string;
      let receivingIds: string[] = [];
      let after: MaterialEvent["after"] = null;
      const nativeReceipts: OperationReceipt[] = [];
      if (action === "MaterialPropose") {
        if (t.referral.owner_id !== p.actor_id) throw unavailable();
        await followupOwner(c, p, p.actor_id, t.basis, { context, checked });
        if (input.predecessor_id !== (s.proposal?.id ?? null))
          followupConflict(
            "Retain the latest material proposal as predecessor.",
          );
        const candidate = s.candidates.find(
          (x) =>
            x.outcome.id === input.allocation_outcome_id &&
            x.demand.id === input.demand_id &&
            x.impact.id === input.impact_id,
        );
        if (!candidate)
          followupConflict(
            "Select a current exact Requested Impact retained by an applied allocation reduction on a Project-origin Demand.",
          );
        const competing = (
          await c.query(
            `SELECT 1 FROM ppo.quote_material_events p WHERE p.workspace_id=$1 AND p.target_id<>$2 AND p.action='MaterialPropose'
         AND (p.impact_id=$3 OR p.task_id=ANY($4::uuid[]) OR (p.dependencies->'project'->'successor'->>'id')::uuid=ANY($4::uuid[]) OR (p.dependencies->'project'->'chainEnd'->>'id')::uuid=ANY($4::uuid[]) OR (p.dependencies->'project'->'branchSuccessor'->>'id')::uuid=ANY($4::uuid[]) OR (p.dependencies->'project'->'mergePredecessor'->>'id')::uuid=ANY($4::uuid[]) OR (p.dependencies->'project'->'mergeSuccessor'->>'id')::uuid=ANY($4::uuid[]) OR EXISTS(SELECT 1 FROM jsonb_each(coalesce(nullif(to_jsonb(p)->'diamond_commands','null'::jsonb),'{}'::jsonb)) dc WHERE (dc.value->>'id')::uuid=ANY($4::uuid[])))
         AND p.id=(SELECT id FROM ppo.quote_material_events WHERE workspace_id=p.workspace_id AND target_id=p.target_id AND action='MaterialPropose' ORDER BY sequence DESC LIMIT 1)
         AND p.referral_id=(SELECT id FROM ppo.quote_supply_events WHERE workspace_id=p.workspace_id AND target_id=p.target_id AND action='Refer' ORDER BY sequence DESC LIMIT 1)
         AND 'Accepted'=(SELECT decision FROM ppo.quote_supply_events WHERE workspace_id=p.workspace_id AND referral_id=p.referral_id AND action='Receive' ORDER BY sequence DESC LIMIT 1)
         AND NOT EXISTS(SELECT 1 FROM ppo.quote_material_events WHERE workspace_id=p.workspace_id AND proposal_id=p.id AND action='MaterialApply')`,
            [
              p.workspace_id,
              input.target_id,
              input.impact_id,
              [
                input.task_id,
                ...(input.diamond_b_task_id
                  ? [
                      input.diamond_b_task_id,
                      input.diamond_c_task_id!,
                      input.diamond_d_task_id!,
                    ]
                  : []),
                ...(input.merge_predecessor_task_id
                  ? [
                      input.merge_predecessor_task_id,
                      input.merge_successor_task_id!,
                    ]
                  : []),
                ...(input.successor_task_id ? [input.successor_task_id] : []),
                ...(input.chain_end_task_id ? [input.chain_end_task_id] : []),
                ...(input.branch_successor_task_id
                  ? [input.branch_successor_task_id]
                  : []),
              ],
            ],
          )
        ).rowCount;
        if (competing)
          followupConflict(
            "Another accepted referral owns this Impact or Project task. Recover or return that original before replacement.",
          );
        deps = await materialDependencies(
          c,
          p,
          t.basis,
          candidate.outcome,
          candidate.demand.id,
          candidate.impact.id,
          input.task_id!,
          p.actor_id,
          input.successor_task_id,
          input.chain_end_task_id,
          input.branch_successor_task_id,
          input.merge_predecessor_task_id,
          input.merge_successor_task_id,
          input.diamond_b_task_id
            ? {
                b: input.diamond_b_task_id,
                c: input.diamond_c_task_id!,
                d: input.diamond_d_task_id!,
              }
            : undefined,
        );
        const task = deps.project.task;
        projectCommand = parseTask(deps.project.project.id, {
          operation_id: randomUUID(),
          schema_version: 1,
          reason: input.reason,
          id: task.id,
          expected_version: deps.project.project.version,
          title: task.title,
          phase: task.phase,
          status: task.status,
          milestone: task.milestone,
          start_date: null,
          finish_date: null,
          progress: task.progress,
          note: task.note,
          owner_id: task.owner_id,
          external_owner_id: task.external_owner_id,
          dependencies: task.dependencies,
        });
        if (deps.project.diamond) {
          const commands = (["b", "c", "d"] as const).map((key, index) => {
            const next = deps.project.diamond![key];
            const { project_id, ...first } = projectCommand;
            return [
              key,
              parseTask(project_id, {
                ...first,
                operation_id: randomUUID(),
                expected_version: deps.project.project.version + index + 1,
                id: next.id,
                title: next.title,
                phase: next.phase,
                status: next.status,
                milestone: next.milestone,
                progress: next.progress,
                note: next.note,
                owner_id: next.owner_id,
                external_owner_id: next.external_owner_id,
                dependencies: next.dependencies,
              }),
            ];
          });
          diamondCommands = Object.fromEntries(commands) as NonNullable<
            MaterialEvent["diamond_commands"]
          >;
        }
        if (deps.project.successor) {
          const next = deps.project.successor;
          const { project_id: nativeProject, ...firstTask } = projectCommand;
          successorCommand = parseTask(nativeProject, {
            ...firstTask,
            operation_id: randomUUID(),
            expected_version: deps.project.project.version + 1,
            id: next.id,
            title: next.title,
            phase: next.phase,
            status: next.status,
            milestone: next.milestone,
            progress: next.progress,
            note: next.note,
            owner_id: next.owner_id,
            external_owner_id: next.external_owner_id,
            dependencies: next.dependencies,
          });
        }
        if (deps.project.mergeSuccessor) {
          const next = deps.project.mergeSuccessor;
          const { project_id: nativeProject, ...firstTask } = projectCommand;
          mergeSuccessorCommand = parseTask(nativeProject, {
            ...firstTask,
            operation_id: randomUUID(),
            expected_version: deps.project.project.version + 1,
            id: next.id,
            title: next.title,
            phase: next.phase,
            status: next.status,
            milestone: next.milestone,
            progress: next.progress,
            note: next.note,
            owner_id: next.owner_id,
            external_owner_id: next.external_owner_id,
            dependencies: next.dependencies,
          });
        }
        if (deps.project.chainEnd) {
          const next = deps.project.chainEnd;
          const { project_id: nativeProject, ...firstTask } = projectCommand;
          chainEndCommand = parseTask(nativeProject, {
            ...firstTask,
            operation_id: randomUUID(),
            expected_version: deps.project.project.version + 2,
            id: next.id,
            title: next.title,
            phase: next.phase,
            status: next.status,
            milestone: next.milestone,
            progress: next.progress,
            note: next.note,
            owner_id: next.owner_id,
            external_owner_id: next.external_owner_id,
            dependencies: next.dependencies,
          });
        }
        if (deps.project.branchSuccessor) {
          const next = deps.project.branchSuccessor;
          const { project_id: nativeProject, ...firstTask } = projectCommand;
          branchSuccessorCommand = parseTask(nativeProject, {
            ...firstTask,
            operation_id: randomUUID(),
            expected_version: deps.project.project.version + 2,
            id: next.id,
            title: next.title,
            phase: next.phase,
            status: next.status,
            milestone: next.milestone,
            progress: next.progress,
            note: next.note,
            owner_id: next.owner_id,
            external_owner_id: next.external_owner_id,
            dependencies: next.dependencies,
          });
        }
        impactCommand = {
          ...factCommand({
            operation_id: randomUUID(),
            schema_version: 1,
            reason: input.reason,
            id: randomUUID(),
            expected_version: deps.demand.version,
            kind: "Impact",
            predecessor_id: deps.impact.id,
            data: {
              ...deps.impact.data,
              state: "Reviewed",
              review_reference:
                (diamondCommands
                  ? "SYN-ES07-12 diamond A to B, A to C, B to D and C to D; four forecast withdrawals; D once; SaveProjectTask original operation "
                  : mergeSuccessorCommand
                    ? "SYN-ES07-11 merge A to C and B to C; retain B exact; forecast withdrawal SaveProjectTask original operation "
                    : branchSuccessorCommand
                      ? "SYN-ES07-10 three-task branch A to B and A to C forecast withdrawal; SaveProjectTask original operation "
                      : chainEndCommand
                        ? "SYN-ES07-09 three-task chain forecast withdrawal; SaveProjectTask original operation "
                        : successorCommand
                          ? "SYN-ES07-08 dependency forecast withdrawal; SaveProjectTask original operation "
                          : "SYN-ES07-07 forecast withdrawal; SaveProjectTask original operation ") +
                projectCommand.operation_id +
                (diamondCommands
                  ? "; diamond B/C/D operations " +
                    [diamondCommands.b, diamondCommands.c, diamondCommands.d]
                      .map((cmd) => cmd.operation_id)
                      .join(", ")
                  : "") +
                (mergeSuccessorCommand
                  ? "; merge C SaveProjectTask original operation " +
                    mergeSuccessorCommand.operation_id
                  : "") +
                (successorCommand
                  ? "; successor SaveProjectTask original operation " +
                    successorCommand.operation_id
                  : "") +
                (chainEndCommand
                  ? "; third SaveProjectTask original operation " +
                    chainEndCommand.operation_id
                  : "") +
                (branchSuccessorCommand
                  ? "; branch C SaveProjectTask original operation " +
                    branchSuccessorCommand.operation_id
                  : "") +
                ". Material readiness and independent impacts remain separate.",
            },
            evidence: input.evidence,
            observed_at: new Date().toISOString(),
            completeness: "Complete",
            attachment_id: deps.impact.attachment_id,
          }),
          record_id: deps.demand.id,
        };
        proposalHash = dispositionHash({
          basis: t.basis,
          dependencies: deps,
          project_command: projectCommand,
          ...(diamondCommands ? { diamond_commands: diamondCommands } : {}),
          ...(mergeSuccessorCommand
            ? { merge_successor_command: mergeSuccessorCommand }
            : {}),
          ...(successorCommand ? { successor_command: successorCommand } : {}),
          ...(chainEndCommand ? { chain_end_command: chainEndCommand } : {}),
          ...(branchSuccessorCommand
            ? { branch_successor_command: branchSuccessorCommand }
            : {}),
          impact_command: impactCommand,
          referral_id: t.referral.id,
          receiving_id: t.receiving.id,
          reason: input.reason,
          evidence: input.evidence,
        });
      } else {
        const prop = s.proposal;
        if (!prop || s.applied)
          followupConflict(
            "Use a current unapplied material proposal; completed evidence is retained.",
          );
        if (s.holds.length) followupConflict(s.holds.join(" "));
        deps = s.dependencies!;
        proposalId = prop.id;
        projectCommand = prop.project_command;
        diamondCommands = prop.diamond_commands;
        mergeSuccessorCommand = prop.merge_successor_command;
        successorCommand = prop.successor_command;
        chainEndCommand = prop.chain_end_command;
        branchSuccessorCommand = prop.branch_successor_command;
        impactCommand = prop.impact_command;
        proposalHash = prop.proposal_hash;
        if (
          action !== "MaterialApply" &&
          (input.proposal_id !== prop.id ||
            input.proposal_hash !== prop.proposal_hash)
        )
          followupConflict("Use the exact latest material proposal.");
        if (action === "MaterialReceive") {
          role = input.role!;
          decision = input.decision as MaterialEvent["decision"];
          const previous = s.required.find((x) => x.role === role)?.decision;
          if (input.predecessor_id !== (previous?.id ?? null))
            followupConflict(
              "Name the previous receiving decision when correcting it.",
            );
          const owner = await materialOwner(c, p, prop, role, checked);
          if (owner.actor_id !== p.actor_id) throw unavailable();
        } else {
          if (t.referral.owner_id !== p.actor_id) throw unavailable();
          await followupOwner(c, p, p.actor_id, t.basis, {
            context,
            checked,
          });
          await materialCommandAuthority(c, p, prop, checked);
          receivingIds = s.required
            .filter((x) => x.decision)
            .map((x) => x.decision!.id);
          if (action === "MaterialReview") {
            if (input.predecessor_id !== (s.review?.id ?? null))
              followupConflict(
                "Name the latest material review as predecessor.",
              );
            decision = input.decision as MaterialEvent["decision"];
            if (decision === "WithdrawForecast") {
              const holds = [
                ...s.required.flatMap((x) => x.holds),
                ...materialHolds(deps),
              ];
              if (holds.length) followupConflict(holds.join(" "));
            }
            reviewHash = dispositionHash({
              proposal_id: prop.id,
              proposal_hash: proposalHash,
              decision,
              effect_receiving_ids: receivingIds,
              reason: input.reason,
              evidence: input.evidence,
            });
          } else {
            const review = s.review;
            if (
              !review ||
              input.review_id !== review.id ||
              input.review_hash !== review.review_hash ||
              !s.can_apply
            )
              followupConflict(
                s.review_holds.join(" ") ||
                  "Apply only the current exact immutable material review.",
              );
            reviewId = review.id;
            reviewHash = review.review_hash;
            decision = review.decision;
            receivingIds = review.effect_receiving_ids;
            if (decision === "WithdrawForecast") {
              for (const native of [
                projectCommand,
                ...(diamondCommands
                  ? [diamondCommands.b, diamondCommands.c, diamondCommands.d]
                  : []),
                ...(mergeSuccessorCommand ? [mergeSuccessorCommand] : []),
                ...(successorCommand ? [successorCommand] : []),
                ...(chainEndCommand ? [chainEndCommand] : []),
                ...(branchSuccessorCommand ? [branchSuccessorCommand] : []),
              ]) {
                const { project_id, ...task } = native;
                const saved = await saveTaskInTransaction(
                  c,
                  p,
                  project_id,
                  task,
                );
                nativeReceipts.push(
                  await recordOperation(
                    c,
                    p,
                    native,
                    saved,
                    "Project",
                    "ProjectTaskSaved",
                    releaseHash({
                      command: "SaveProjectTask",
                      ...native,
                    }),
                    {
                      command: "SaveProjectTask",
                      record_version: saved.version,
                      task_id: task.id,
                      material_outcome_id: eventId,
                      material_review_id: review.id,
                    },
                  ),
                );
              }
              const { record_id, ...fact } = impactCommand;
              const reviewed = await recordFactInTransaction(
                c,
                p,
                record_id,
                fact,
              );
              nativeReceipts.push(
                await recordOperation(
                  c,
                  p,
                  impactCommand,
                  {
                    id: reviewed.id,
                    version: reviewed.version,
                    state: "Recorded",
                    updated_at: new Date(reviewed.updated_at),
                  },
                  "SupplyRecord",
                  "SupplyRecorded",
                  releaseHash({
                    command: "Supply:Fact:Impact",
                    ...impactCommand,
                  }),
                  {
                    command: "Supply:Fact:Impact",
                    record_version: reviewed.version,
                    fact_id: fact.id,
                    predecessor_id: fact.predecessor_id,
                    material_outcome_id: eventId,
                    material_review_id: review.id,
                  },
                ),
              );
            }
            after = await materialDependencies(
              c,
              p,
              t.basis,
              deps.allocation_outcome,
              deps.demand.id,
              deps.impact.id,
              deps.project.task.id,
              p.actor_id,
              deps.project.successor?.id,
              deps.project.chainEnd?.id,
              deps.project.branchSuccessor?.id,
              deps.project.mergePredecessor?.id,
              deps.project.mergeSuccessor?.id,
              deps.project.diamond
                ? {
                    b: deps.project.diamond.b.id,
                    c: deps.project.diamond.c.id,
                    d: deps.project.diamond.d.id,
                  }
                : undefined,
            );
          }
        }
      }
      const e = {
        id: eventId,
        workspace_id: p.workspace_id,
        revision_id: id,
        target_id: input.target_id,
        execution_id: t.execution_id,
        sequence: s.sequence + 1,
        action,
        referral_id: t.referral.id,
        receiving_id: t.receiving.id,
        proposal_id: proposalId,
        predecessor_id: input.predecessor_id,
        review_id: reviewId,
        allocation_outcome_id: deps.allocation_outcome.id,
        demand_id: deps.demand.id,
        impact_id: deps.impact.id,
        task_id: deps.project.task.id,
        role,
        decision,
        basis: t.basis,
        basis_hash: t.basis_hash,
        dependencies: deps,
        dependency_hash: dispositionHash(deps),
        proposal_hash: proposalHash,
        review_hash: reviewHash,
        effect_receiving_ids: receivingIds,
        project_command: projectCommand,
        ...(diamondCommands ? { diamond_commands: diamondCommands } : {}),
        ...(mergeSuccessorCommand
          ? { merge_successor_command: mergeSuccessorCommand }
          : {}),
        ...(successorCommand ? { successor_command: successorCommand } : {}),
        ...(chainEndCommand ? { chain_end_command: chainEndCommand } : {}),
        ...(branchSuccessorCommand
          ? { branch_successor_command: branchSuccessorCommand }
          : {}),
        impact_command: impactCommand,
        reason: input.reason,
        evidence: input.evidence,
        created_by: p.actor_id,
        operation_id: input.operation_id,
        native_receipts: nativeReceipts,
        after,
      };
      if (action === "MaterialPropose")
        await materialCommandAuthority(c, p, e as MaterialEvent, checked);
      const entries = Object.entries(e);
      const saved = (
        await c.query<{ created_at: Date }>(
          `INSERT INTO ppo.quote_material_events (${entries.map(([k]) => k).join(",")}) VALUES (${entries.map((_, i) => "$" + (i + 1)).join(",")}) RETURNING created_at`,
          entries.map(([k, v]) =>
            ["effect_receiving_ids", "native_receipts"].includes(k)
              ? JSON.stringify(v)
              : v,
          ),
        )
      ).rows[0];
      return {
        id,
        version: e.sequence,
        state:
          action === "MaterialApply"
            ? decision === "WithdrawForecast"
              ? "ForecastWithdrawn"
              : decision === "Hold"
                ? "MaterialHeld"
                : "MaterialRetained"
            : action === "MaterialPropose"
              ? "MaterialResolutionProposed"
              : decision,
        updated_at: saved.created_at,
        audit_details: {
          material_event_id: eventId,
          target_id: input.target_id,
          proposal_id: proposalId,
          referral_id: t.referral.id,
          synthetic_only: true,
        },
      };
    },
    "DraftQuoteRevision",
    "QuotationSupplyRecorded",
  );
}
