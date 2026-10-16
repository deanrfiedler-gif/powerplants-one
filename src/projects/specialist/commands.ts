import type { Principal } from "../../platform/identity";
import { sharedOperation } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import { scopedOwner } from "../../shared/authority";
import { commandInput, transition } from "./validation";
import {
  authority,
  packageRow,
  history,
  inspect,
  hashSource,
  type Event,
} from "./context";
export async function commandPackage(
  p: Principal,
  project: string,
  value: unknown,
) {
  const input = commandInput(project, value),
    receiving = ["Accept", "Return"].includes(input.action);
  return sharedOperation(
    p,
    input,
    `ProjectSpecialist:${input.action}`,
    async (c) => {
      const pr = await authority(
          c,
          p,
          input.project_id,
          receiving ? "receive" : "prepare",
        ),
        pkg = await packageRow(c, p, input.id);
      if (pkg && pkg.project_id !== pr.id) throw unavailable();
      if (!pkg && input.action !== "Create") throw unavailable();
      const prior = pkg ? (await history(c, p, pkg.id, undefined, 1))[0] : null;
      const original = pkg
        ? (
            await c.query<Event>(
              "SELECT * FROM ppo.project_specialist_events WHERE workspace_id=$1 AND package_id=$2 AND created_by=$3 AND operation_id=$4",
              [p.workspace_id, pkg.id, p.actor_id, input.operation_id],
            )
          ).rows[0]
        : null;
      const identity = pkg ?? {
        project_id: pr.id,
        basis_id: input.basis_id!,
        basis_version: input.basis_version!,
      };
      const content = original?.content ?? input.content ?? prior!.content;
      await inspect(
        c,
        p,
        identity,
        content,
        false,
        original?.source ?? (input.content ? undefined : prior?.source),
      );
      return { pr, pkg, prior, identity, content };
    },
    async (c, { pr, pkg, prior, identity, content }) => {
      if (pr.lifecycle !== "Active")
        throw new AppError(
          409,
          "ClosedProject",
          "Reopen the Project before changing package coordination.",
        );
      if ((prior?.version ?? 0) !== input.expected_version)
        throw new AppError(
          409,
          "VersionConflict",
          "Read the current package version.",
        );
      const state = transition(prior?.state, input.action);
      if (!pkg && p.actor_id !== pr.coordinator_id) throw unavailable();
      if (
        pkg &&
        !receiving &&
        p.actor_id !== pr.coordinator_id &&
        p.actor_id !== prior!.content.owner_id
      )
        throw unavailable();
      if (
        prior &&
        (content.owner_id !== prior.content.owner_id ||
          content.receiver_id !== prior.content.receiver_id)
      )
        throw new AppError(
          409,
          "OwnerRetained",
          "Owner and receiver transfers require a separate control.",
        );
      if (
        prior?.content.action_ids.some((id) => !content.action_ids.includes(id))
      )
        throw new AppError(
          409,
          "ActionsRetained",
          "Retain earlier Project Activity links.",
        );
      for (const [id, duty] of [
        [content.owner_id, "prepare"],
        [content.receiver_id, "receive"],
      ] as const) {
        const person = await scopedOwner(
          c,
          p,
          id,
          pr.company_id,
          pr.site_id,
          `project.specialist.${duty}`,
        );
        await authority(c, person, pr.id);
      }
      if (receiving) {
        if (p.actor_id !== content.receiver_id) throw unavailable();
        if (
          (
            await c.query(
              "SELECT 1 FROM ppo.project_specialist_events WHERE workspace_id=$1 AND package_id=$2 AND created_by=$3 AND command IN ('Create','Revise','Submit')",
              [p.workspace_id, input.id, p.actor_id],
            )
          ).rowCount
        )
          throw new AppError(
            409,
            "IndependentReceivingRequired",
            "The receiver must differ from package authors and submitters.",
          );
      }
      const source = await inspect(
        c,
        p,
        identity,
        content,
        !["Return", "Withdraw"].includes(input.action),
        input.content ? undefined : prior!.source,
      );
      if (!pkg) {
        if (input.predecessor_id) {
          const predecessor = await packageRow(c, p, input.predecessor_id);
          if (!predecessor || predecessor.project_id !== pr.id)
            throw unavailable();
          const event = (await history(c, p, predecessor.id, undefined, 1))[0];
          await inspect(c, p, predecessor, event.content, false, event.source);
          if (event.state !== "Accepted")
            throw new AppError(
              409,
              "AcceptedPredecessorRequired",
              "Correct an accepted package through a successor.",
            );
        }
        await c.query(
          "INSERT INTO ppo.project_specialist_packages(id,workspace_id,company_id,project_id,basis_id,basis_version,predecessor_id,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
          [
            input.id,
            p.workspace_id,
            pr.company_id,
            pr.id,
            input.basis_id,
            input.basis_version,
            input.predecessor_id,
            p.actor_id,
          ],
        );
      }
      const result = (
        await c.query(
          "INSERT INTO ppo.project_specialist_events(workspace_id,package_id,version,command,state,content,source,source_hash,note,reason,created_by,operation_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING package_id AS id,version,state,created_at AS updated_at",
          [
            p.workspace_id,
            input.id,
            input.expected_version + 1,
            input.action,
            state,
            content,
            source,
            hashSource(source),
            input.note,
            input.reason,
            p.actor_id,
            input.operation_id,
          ],
        )
      ).rows[0];
      return {
        ...result,
        audit_details: { project_id: pr.id, source_hash: hashSource(source) },
      };
    },
    "ProjectSpecialistPackage",
    "SharedRecordUpdated",
  );
}
