import { randomUUID } from "node:crypto";
import type { QueryClient } from "../platform/permissions";
import { transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { canonical, sharedOperation } from "../platform/operations";
import { common, commonKeys, invalid, object } from "../shared/validation";
import { visibleAppointment } from "./planner";
import { policyResolutionAuthority } from "./policy-authority";
import { originalPolicyActor } from "./policy-commands";
import { loadPolicyChain } from "./policy-persistence";
import { policyReference, selectPolicyForVisit } from "./policy-chain";
import {
  evaluatePolicyBooking,
  exclusion,
  observationTime,
  nextPolicyBoundary,
  policySources,
  rowReference,
} from "./policy-population";
import {
  digest,
  enumeration,
  equal,
  hashValue,
  id,
  nullable,
  positive,
  reference,
} from "./policy-values";

export async function freshPolicyImpactEvidence(
  c: QueryClient,
  p: Principal,
  appointmentId: string,
  replacementId: string | null,
  checkingDisposition = false,
) {
  const chain = await loadPolicyChain(c, p.workspace_id),
    sources = await policySources(c, p),
    at = await observationTime(c),
    a = sources.one("appointments", appointmentId);
  const applicable = async (recordId: string) => {
    await visibleAppointment(c, p, recordId);
    const row = sources.one("appointments", recordId);
    // Cross-window visits have no applicable single policy: they cannot receive a
    // VerifiedNoConflict disposition, but a controlled cancellation remains valid.
    let selected = null;
    try {
      selected = selectPolicyForVisit(
        chain,
        row.start_at.toISOString(),
        row.end_at.toISOString(),
      );
    } catch (e) {
      if (!(e instanceof AppError) || e.code !== "InvalidData") throw e;
    }
    const policy =
      chain.members.find((m) => m.policy.id === selected?.id)?.policy ??
      chain.members.at(-1)!.policy;
    const candidate = await evaluatePolicyBooking(
      c,
      p,
      sources,
      chain,
      row,
      policy,
      at,
      false,
    );
    return {
      appointment: rowReference(row),
      selected_policy: selected,
      // Reaching the scheduled start is not a later source change. New
      // resolutions still require a future booking; a saved disposition may
      // remain current at arrival if every dependency remains exact.
      excluded:
        checkingDisposition && exclusion(sources, row, at) === "NotFuture"
          ? null
          : exclusion(sources, row, at),
      candidate,
    };
  };
  const current = await applicable(a.id),
    replacement = replacementId ? await applicable(replacementId) : null;
  const cancellation = (
    await c.query(
      `SELECT r.id,r.operation_id,r.payload_hash,r.result FROM ppo.operation_receipts r JOIN ppo.audit_events a
     ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
     WHERE r.workspace_id=$1 AND r.record_id=$2 AND a.details->>'command'='CancelAppointment'
     AND r.result->>'state'='Cancelled' ORDER BY r.id`,
      [p.workspace_id, a.id],
    )
  ).rows;
  const controlled_changes = (
    await c.query(
      `SELECT r.id,r.operation_id,r.payload_hash,r.result,e.details
    FROM ppo.operation_receipts r JOIN ppo.audit_events e
    ON (e.workspace_id,e.actor_id,e.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
    WHERE r.workspace_id=$1 AND (r.record_id=$2 OR e.details->>'appointment_id'=$2::text)
    AND e.details->>'command' IN ('MoveAppointment','DecideScheduleChangeRequest:accept') ORDER BY r.id`,
      [p.workspace_id, a.id],
    )
  ).rows;
  const evidence = {
    schema_version: 1,
    head: chain.head,
    current,
    replacement,
    cancellation,
    controlled_changes,
  };
  return {
    recheck_before: nextPolicyBoundary(
      sources,
      at,
      checkingDisposition
        ? []
        : [
            a,
            ...(replacementId
              ? [sources.one("appointments", replacementId)]
              : []),
          ],
    ),
    evidence,
    dependency_fingerprint: digest(evidence),
    at,
    a,
    sources,
    chain,
  };
}
export async function readPolicyImpact(
  p: Principal,
  impactId: string,
  replacementId: string | null = null,
) {
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const { impact } = await policyResolutionAuthority(c, p, id(impactId));
    const fresh = await freshPolicyImpactEvidence(
      c,
      p,
      impact.appointment_id,
      replacementId === null ? null : id(replacementId),
    );
    const history = (
      await c.query(
        "SELECT * FROM ppo.scheduling_policy_resolutions WHERE workspace_id=$1 AND impact_id=$2 ORDER BY sequence",
        [p.workspace_id, impact.id],
      )
    ).rows;
    const latest = history.at(-1);
    // Activity state is deliberately absent from disposition evidence. Completing a
    // task creates no resolution; subsequent scheduling/source changes make it stale.
    const latestFresh = latest
      ? await freshPolicyImpactEvidence(
          c,
          p,
          impact.appointment_id,
          latest.replacement_id,
          true,
        )
      : fresh;
    return {
      impact,
      activity_ids: (
        await c.query(
          "SELECT activity_id FROM ppo.scheduling_policy_impact_activities WHERE workspace_id=$1 AND impact_id=$2",
          [p.workspace_id, impact.id],
        )
      ).rows.map((x) => x.activity_id),
      history,
      disposition: !latest
        ? "Unresolved"
        : latest.content.dependency_fingerprint ===
            latestFresh.dependency_fingerprint
          ? "Current"
          : "Stale",
      expected_resolution: latest
        ? {
            id: latest.id,
            version: latest.sequence,
            content_hash: latest.content_hash,
          }
        : null,
      appointment: fresh.evidence.current.appointment,
      replacement: fresh.evidence.replacement?.appointment ?? null,
      dependency_fingerprint: fresh.dependency_fingerprint,
      evaluation: fresh.evidence,
    };
  });
}
export async function resolveSchedulingPolicyImpact(
  p: Principal,
  impactId: string,
  input: unknown,
) {
  const raw = object(input, [
    ...commonKeys,
    "impact_hash",
    "expected_appointment_version",
    "expected_resolution",
    "dependency_fingerprint",
    "outcome",
    "replacement",
  ]);
  const cmd = {
    ...common(raw),
    impact_id: id(impactId),
    impact_hash: hashValue(raw.impact_hash),
    expected_appointment_version: positive(raw.expected_appointment_version),
    expected_resolution: nullable(reference)(raw.expected_resolution),
    dependency_fingerprint: hashValue(raw.dependency_fingerprint),
    outcome: enumeration([
      "VerifiedNoConflict",
      "Cancelled",
      "Replaced",
    ] as const)(raw.outcome),
    replacement: nullable(reference)(raw.replacement),
  };
  if ((cmd.outcome === "Replaced") !== (cmd.replacement !== null))
    invalid(
      "replacement",
      "Only a replacement disposition includes its exact booking reference.",
    );
  return sharedOperation(
    p,
    cmd,
    "ResolveSchedulingPolicyImpact",
    async (c) => {
      const context = await policyResolutionAuthority(c, p, cmd.impact_id);
      await originalPolicyActor(c, p, cmd.operation_id);
      return context;
    },
    async (c, { impact, a }) => {
      equal(cmd.impact_hash, impact.content_hash, "impact_hash");
      equal(a.version, cmd.expected_appointment_version, "appointment_version");
      const latest = (
        await c.query(
          "SELECT * FROM ppo.scheduling_policy_resolutions WHERE workspace_id=$1 AND impact_id=$2 ORDER BY sequence DESC LIMIT 1",
          [p.workspace_id, impact.id],
        )
      ).rows[0];
      equal(
        cmd.expected_resolution,
        latest
          ? {
              id: latest.id,
              version: latest.sequence,
              content_hash: latest.content_hash,
            }
          : null,
        "resolution_predecessor",
      );
      const fresh = await freshPolicyImpactEvidence(
        c,
        p,
        a.id,
        cmd.replacement?.id ?? null,
      );
      equal(
        fresh.dependency_fingerprint,
        cmd.dependency_fingerprint,
        "resolution_dependencies",
      );
      const current = fresh.evidence.current;
      if (cmd.outcome === "VerifiedNoConflict") {
        if (
          !fresh.evidence.controlled_changes.some(
            (x) =>
              Number(x.details.appointment_version ?? x.result.record_version) >
              impact.content.dependencies.booking.appointment.version,
          ) ||
          current.excluded ||
          !current.selected_policy ||
          current.candidate.evaluation.outcome !== "Compliant"
        )
          invalid(
            "outcome",
            "A fresh complete applicable evaluation must be compliant for a future unstarted confirmed visit.",
          );
      } else {
        const own = fresh.sources.rows.assignments
          .filter((x) => x.appointment_id === a.id)
          .map((x) => x.id);
        if (
          a.status !== "Cancelled" ||
          !fresh.a.cancelled_at ||
          !fresh.a.cancellation_reason ||
          a.actual_start_at ||
          a.actual_end_at ||
          current.candidate.dependencies.booking.attendance.length ||
          current.candidate.dependencies.booking.captures.length ||
          !fresh.evidence.cancellation.length ||
          fresh.sources.rows.resource_reservations.some(
            (x) => own.includes(x.assignment_id) && x.active,
          )
        )
          invalid(
            "outcome",
            "A controlled unstarted cancellation with released reservations is required.",
          );
        if (cmd.outcome === "Replaced") {
          const replacement = fresh.evidence.replacement!,
            replacementRow = fresh.sources.one(
              "appointments",
              cmd.replacement!.id,
            );
          equal(replacement.appointment, cmd.replacement, "replacement");
          if (
            replacementRow.id === a.id ||
            replacementRow.work_order_id !== a.work_order_id ||
            replacement.excluded ||
            replacement.candidate.evaluation.outcome !== "Compliant" ||
            !replacement.selected_policy ||
            replacementRow.scheduling_policy_id !==
              replacement.selected_policy.id
          )
            invalid(
              "replacement",
              "A distinct confirmed compliant booking against the applicable policy and same work order is required.",
            );
          equal(
            replacement.candidate.dependencies.booking.scheduling_policy,
            policyReference(
              fresh.chain.members.find(
                (m) => m.policy.id === replacement.selected_policy!.id,
              )!.policy,
            ),
            "replacement_pin",
          );
        }
      }
      await policyResolutionAuthority(c, p, impact.id);
      if (
        fresh.recheck_before &&
        (await observationTime(c)) >= fresh.recheck_before
      )
        invalid(
          "resolution",
          "Time eligibility changed; obtain a fresh applicable evaluation.",
        );
      const content = {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        impact_id: impact.id,
        impact_hash: impact.content_hash,
        sequence: (latest?.sequence ?? 0) + 1,
        predecessor_id: latest?.id ?? null,
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
        observed_at: fresh.at,
        appointment_id: a.id,
        appointment_version: a.version,
        replacement_id: cmd.replacement?.id ?? null,
        outcome: cmd.outcome,
        schema_version: 1,
        evaluator_version: 1,
        reason: cmd.reason,
        dependencies: current.candidate.dependencies,
        dependency_fingerprint: fresh.dependency_fingerprint,
        evaluation: fresh.evidence,
      };
      await c.query(
        `INSERT INTO ppo.scheduling_policy_resolutions(workspace_id,id,impact_id,sequence,predecessor_id,actor_id,operation_id,observed_at,
      appointment_id,appointment_version,replacement_id,outcome,schema_version,evaluator_version,content,canonical_content,content_hash)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1,1,$13,$14,$15)`,
        [
          p.workspace_id,
          content.id,
          impact.id,
          content.sequence,
          content.predecessor_id,
          p.actor_id,
          cmd.operation_id,
          fresh.at,
          a.id,
          a.version,
          content.replacement_id,
          cmd.outcome,
          content,
          canonical(content),
          digest(content),
        ],
      );
      return {
        id: content.id,
        version: content.sequence,
        state: cmd.outcome,
        updated_at: new Date(fresh.at),
        audit_details: {
          impact_id: impact.id,
          resolution_hash: digest(content),
          dependency_fingerprint: fresh.dependency_fingerprint,
          outcome: cmd.outcome,
        },
      };
    },
    "SchedulingPolicyResolution",
    "SchedulingPolicyImpactResolved",
  );
}
