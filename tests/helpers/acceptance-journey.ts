import { database } from "../../src/platform/database";
import { readWorkspace } from "../../src/projects/acceptance/reads";
import { principalOf } from "./engineering-materials-direct";
import {
  act,
  PJ,
  stable,
  handover,
  contextFixture,
  seedStage,
} from "./acceptance";
export async function detail(project: string, stage: string) {
  return (
    await readWorkspace(await principalOf("coordinator"), { project, stage })
  ).selected!;
}
export async function finishStage(
  project: string,
  stage: string,
  conditions = "",
) {
  let d = await detail(project, stage);
  if (d.stage.closeout === "Closed") return d;
  const c = await handover(project, stage, "Customer", "complete-customer"),
    s = await handover(project, stage, "Service", "complete-service");
  d = await detail(project, stage);
  if (
    !d.decisions.some(
      (x) =>
        x.kind === "Service" &&
        x.subject_id === s.request_id &&
        x.outcome === "Received",
    )
  )
    await act("changes-service", project, stage, "receive", {
      request_id: s.request_id!,
      outcome: "Received",
      evidence: "SYN exact immutable pack received",
    });
  if (
    !d.decisions.some(
      (x) =>
        x.kind === "Service" &&
        x.subject_id === s.request_id &&
        x.outcome === "Accepted",
    )
  )
    await act("changes-service", project, stage, "receive", {
      request_id: s.request_id!,
      outcome: "Accepted",
      evidence:
        "SYN independent receiver accepts the exact stage pack and continuing scope",
    });
  const response = stable(stage + ":complete-response");
  d = await detail(project, stage);
  if (!d.responses.some((r) => r.id === response))
    await act("coordinator", project, stage, "response", {
      id: response,
      request_id: c.request_id!,
      respondent_id: PJ.person,
      authority_basis: "SYN AP-01 scope-specific contract appointment",
      method: "Recorded from evidence",
      evidence: "SYN retained actual party response to this exact issue",
      outcome: conditions ? "With conditions" : "Accepted",
      conditions: conditions || undefined,
      response_time: "2026-09-21",
      time_precision: "Date",
      unit_ids: d.units
        .filter((u) => u.disposition === "Included")
        .map((u) => u.id),
    });
  if (!d.responses.some((r) => r.id === response && r.validated))
    await act("materials-reviewer", project, stage, "validate", {
      id: response,
      authority_basis:
        "SYN independent AP-01 appointment verified for this respondent, purpose, exact issue and units",
    });
  d = await detail(project, stage);
  if (d.outcomes.commercial !== "Complete")
    await act("finance-reviewer", project, stage, "commercial", {
      source_id: d.requirements.find((r) => r.gate === "Commercial")!.source.id,
      outcome: "Complete",
      evidence: "SYN independent complete commercial source assessment",
    });
  await act("coordinator", project, stage, "closeStage");
  return detail(project, stage);
}
export async function extendedCases() {
  const project = PJ.project,
    S = (k: string) => stable(`${project}:${k}:stage`),
    U = (k: string) => stable(`${project}:${k}:unit`);
  // A: a frozen successor records the explicit exclusion while keeping D in the required whole-project ledger.
  const a = await detail(project, S("A"));
  if (a.stage.revision === 1) {
    await act("coordinator", project, a.stage.id, "successor");
    await act("coordinator", project, a.stage.id, "scope", {
      units: [
        {
          unit_id: U("A"),
          disposition: "Included",
          reason: "Greenhouse 01 irrigation; exact commissioning source scope",
          relationship: null,
        },
        {
          unit_id: U("D"),
          disposition: "Excluded",
          reason:
            "Greenhouse 02 retained in its separate required acceptance stage",
          relationship: null,
        },
      ],
    });
    await act("coordinator", project, a.stage.id, "submit");
    await act("coordinator", project, a.stage.id, "check");
  }
  const condition =
    "SYN confirm valve labels at the next scheduled support visit";
  let c = await detail(project, S("C"));
  const oid = stable("condition:C");
  if (!c.obligations.some((o) => o.id === oid))
    await act("coordinator", project, c.stage.id, "obligation", {
      id: oid,
      unit_id: U("C"),
      title: "Confirm valve labels",
      owner_id: PJ.sam,
      recipient_id: PJ.receiver,
      due: null,
      due_basis: "Agreed visit date needed; review weekly",
      conditions: condition,
      required_evidence: "SYN dated label verification evidence",
      control_reference: "SYN nonblocking clerical condition policy CP-01",
      eligible: true,
      review_rule:
        "Sam reviews weekly; escalate if support visit remains unagreed",
    });
  c = await detail(project, S("C"));
  if (!c.obligations.find((o) => o.id === oid)!.transfer_accepted)
    await act("changes-service", project, c.stage.id, "transfer", { id: oid });
  c = await detail(project, S("C"));
  if (c.outcomes.technical !== "Accepted") {
    if (c.stage.state !== "Draft")
      await act("coordinator", project, c.stage.id, "successor");
    await act("coordinator", project, c.stage.id, "submit");
    await act("materials-reviewer", project, c.stage.id, "technical");
  }
  await finishStage(project, S("C"), condition);
  console.log(
    "Case C: closed with independently accepted continuing obligation",
  );
  // Shared pump installed elsewhere still blocks every linked served unit. H retains its separate unavailable source.
  const rid = stable("shared:D:H");
  if (
    !(
      await database().query(
        "SELECT 1 FROM ppo.acceptance_requirements WHERE id=$1",
        [rid],
      )
    ).rowCount
  ) {
    await act("coordinator", project, S("H"), "successor");
    await act("coordinator", project, S("H"), "requirement", {
      id: rid,
      unit_id: U("H"),
      source_id: stable(`${project}:D:source`),
      title: "Shared alarm serving Greenhouse 02 and pump station",
      gate: "Technical",
      mandatory: true,
      owner_id: PJ.alex,
      due: null,
      due_basis: "Retest and release before acceptance",
    });
    await act("coordinator", project, S("H"), "submit");
  }
  if (
    !(await detail(project, S("F"))).decisions.some(
      (d) => d.kind === "Commercial" && d.outcome === "Disputed",
    )
  )
    await act(
      "finance-reviewer",
      project,
      S("F"),
      "commercial",
      {
        source_id: stable(S("F") + ":Commercial"),
        outcome: "Disputed",
        evidence:
          "SYN variation remains disputed; no financial transaction is made",
      },
      stable("F:disputed"),
    );
  // G: two units, exact partial incoming response preserved without qualifying the whole stage.
  const g = await detail(project, S("G"));
  const second = stable("G:second-unit");
  if (!g.units.some((u) => u.id === second)) {
    if (
      !(
        await database().query(
          "SELECT 1 FROM ppo.acceptance_units WHERE id=$1",
          [second],
        )
      ).rowCount
    )
      await act("coordinator", project, null, "unit", {
        id: second,
        reference: "SYN-UNIT-G2",
        title: "Second compartment",
        system_name: "Irrigation",
        function_name: "Independent compartment",
        installed_at: "Propagation compartment 2",
        served_areas: ["Propagation compartment 2"],
        configuration_version: "SYN-G2-r01",
        required: true,
      });
    if (g.stage.state !== "Draft")
      await act("coordinator", project, g.stage.id, "successor");
    await act("coordinator", project, g.stage.id, "scope", {
      units: [U("G"), second].map((unit_id) => ({
        unit_id,
        disposition: "Included",
        reason: "Exact two-compartment staged delivery",
        relationship: null,
      })),
    });
    await act("coordinator", project, g.stage.id, "requirement", {
      id: stable("G2:technical"),
      unit_id: second,
      source_id: stable(`${project}:G:source`),
      title: "Second compartment release",
      gate: "Technical",
      mandatory: true,
      owner_id: PJ.sam,
      due: null,
      due_basis: "Required before acceptance",
    });
    await act("coordinator", project, g.stage.id, "submit");
    await act("materials-reviewer", project, g.stage.id, "technical");
  }
  const gm = await handover(project, S("G"), "Customer", "partial");
  const gr = stable("G:partial-response");
  if (
    !(
      await database().query(
        "SELECT 1 FROM ppo.acceptance_responses WHERE id=$1",
        [gr],
      )
    ).rowCount
  )
    await act("coordinator", project, S("G"), "response", {
      id: gr,
      request_id: gm.request_id!,
      respondent_id: PJ.person,
      authority_basis: "SYN AP-01; response limited to compartment one",
      method: "Recorded from evidence",
      evidence: "SYN partial response retaining compartment two reservation",
      outcome: "Accepted",
      response_time: null,
      time_precision: "Unknown",
      unit_ids: [U("G")],
    });
  await handover(project, S("I"), "Service", "pending-review");
  // K: preserve closeout, then flag material current-source reassessment without an authorised reopening.
  let k = await detail(project, S("K"));
  if (k.stage.closeout !== "Closed") await finishStage(project, k.stage.id);
  k = await detail(project, S("K"));
  const ks = k.requirements.find((r) => r.gate === "Technical")!.source;
  if (ks.version === 1)
    await act("coordinator", project, null, "source", {
      id: ks.id,
      title: ks.title,
      kind: "Technical",
      outcome: "Blocked",
      availability: "Changed",
      details: {
        evidence:
          "SYN later shared-interface failure requires scoped reassessment",
        tests_required: 12,
        tests_accepted: 11,
        release: "SYN superseded release",
      },
      public_reference: ks.reference,
      source_version: "r02",
      source_expected_version: 1,
    });
  const lp = stable("complete-project");
  await contextFixture(lp, "SYN-PPO-PRJ-000702");
  const l = await seedStage(lp, "L", "Completed nursery stage");
  await finishStage(lp, l.stage);
  const ld = await detail(lp, l.stage),
    workspace = await readWorkspace(await principalOf("coordinator"), {
      project: lp,
    });
  if (workspace.project.lifecycle !== "Closed") {
    await act("finance-reviewer", lp, null, "commercial", {
      source_id: ld.requirements.find((r) => r.gate === "Commercial")!.source
        .id,
      outcome: "Complete",
      evidence:
        "SYN whole-project commercial assessment; complete source scope",
    });
    await act("coordinator", lp, null, "closeProject");
  }
  console.log(
    "Cases A–L retained, with separate closed whole-project fixture 000702",
  );
}
