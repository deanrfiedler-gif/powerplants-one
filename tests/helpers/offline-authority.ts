import { base, principal } from "./field";
import { id, content } from "./packs";
import {
  readAppointment,
  moveAppointment,
  cancelAppointment,
} from "../../src/scheduling/planner";
import {
  readPack,
  revisePack,
  withdrawPack,
  checkPack,
  requestIssue,
} from "../../src/documents/packs";
import { processRenderJob } from "../../src/documents/worker";
import {
  readWorkOrder,
  saveWorkScope,
  assessWorkReadiness,
  authoriseWorkOrder,
} from "../../src/service/work-orders";
import assert from "node:assert/strict";

export type AuthorityChange =
  "reassign" | "cancel" | "scope" | "pack" | "withdraw-started";
// Real coordinator commands against a fixture-owned work order. No shared
// seeded scope, historical authority or existing grant is rewritten here.
export async function changeAuthority(
  change: AuthorityChange,
  appointment: string,
  packId: string,
) {
  const co = await principal();
  const a = (await readAppointment(co, appointment)).items[0];
  let successor: Record<string, unknown> | null = null;
  if (change === "reassign") {
    await moveAppointment(co, appointment, {
      ...base(),
      expected_version: a.version,
      expected_work_order_version: a.work_order_version,
      expected_assignment_version: a.assignment_version,
      scope_revision_id: a.scope_revision_id,
      scope_version: a.scope_version,
      policy_version_id: a.policy_version_id,
      scheduling_policy_id: id("a0"),
      scheduling_policy_version: 1,
      scheduling_policy_hash:
        "130d586ec49c5e23dffd49916148babc6ddf329a442e054ecc1c29f9089cca44",
      publication_head_version: 1,
      selected_policy: {
        id: id("a0"),
        version: 1,
        content_hash:
          "130d586ec49c5e23dffd49916148babc6ddf329a442e054ecc1c29f9089cca44",
      },
      start_at: new Date(
        new Date(a.start_at).getTime() + 3600000,
      ).toISOString(),
      end_at: new Date(new Date(a.end_at).getTime() + 3600000).toISOString(),
      crew: [5, 9].map((n, i) => ({
        resource_id: id("a4", n),
        resource_version: 1,
        calendar_version: 1,
        crew_role: i ? "Technician" : "Lead",
        travel_before_minutes: 0,
        travel_after_minutes: 0,
        travel_reason:
          "SYN explicit zero travel for isolated PT-24 reassignment",
      })),
    });
  } else if (change === "cancel") {
    await cancelAppointment(co, appointment, {
      ...base(),
      expected_version: a.version,
      expected_work_order_version: a.work_order_version,
      expected_assignment_version: a.assignment_version,
    });
  } else if (change === "pack" || change === "withdraw-started") {
    const pack = (await readPack(co, packId)).items[0];
    if (change === "pack") {
      await revisePack(co, pack.id, {
        ...base(),
        expected_version: pack.version,
        content: content(),
      });
      let changed = (await readPack(co, pack.id)).items[0];
      await checkPack(co, pack.id, {
        ...base(),
        expected_version: changed.version,
        decision: "Checked",
      });
      changed = (await readPack(co, pack.id)).items[0];
      await requestIssue(co, pack.id, {
        ...base(),
        expected_version: changed.version,
      });
      changed = (await readPack(co, pack.id)).items[0];
      await processRenderJob(changed.jobs[0].id);
      changed = (await readPack(co, pack.id)).items[0];
      assert.ok(changed.current_issue_id);
      assert.notEqual(changed.current_issue_id, pack.current_issue_id);
      successor = {
        prior_issue_id: pack.current_issue_id,
        issued_successor_id: changed.current_issue_id,
        issued_successor_hash: changed.issues.find(
          (x: { id: string; output_hash: string }) => x.id === changed.current_issue_id,
        )!.output_hash,
      };
    } else
      await withdrawPack(co, pack.id, {
        ...base(),
        expected_version: pack.version,
      });
  } else {
    const w = (await readWorkOrder(co, a.work_order_id)).items[0];
    await saveWorkScope(
      co,
      w.id,
      {
        ...base(),
        expected_version: w.version,
        change_reason: "SYN PT-24 old cached authority needs separate review",
        scope: {
          summary: "SYN successor proposed scope",
          exclusions: "No intervention",
          diagnostic_limit: "External observation only",
          pending_account_plan: "SYN independent Finance review",
          authority_evidence: {
            title: "SYN draft scope authority",
            content_text: "SYN proposal requires independent review",
            source_reference: "SYN-PPO-PT24",
            source_version: "1",
          },
          coverage: {
            status: "Disputed",
            agreement_reference: null,
            source_version: null,
            effective_from: null,
            effective_to: null,
            assessment: "SYN review",
            reason: "SYN review",
            charging_route: "FinanceReview",
          },
          items: [
            {
              task_kind: "Inspection",
              task_description: "SYN proposed external observation",
              expected_outcome: "Record observations",
              completion_requirements: ["SYN stop before intervention"],
              required_skill_codes: ["SYN-VISUAL"],
              shutdown_condition: null,
              access_condition: null,
              assets: [
                {
                  asset_id: id("80"),
                  configuration_id: null,
                  identification_plan: null,
                },
              ],
            },
          ],
        },
      },
      true,
    );
    let changed = (await readWorkOrder(co, w.id)).items[0];
    const scope = changed.scopes.find(
      (x) => x.id === changed.scope_revision_id,
    )!;
    for (const criterion_code of [
      "SiteAccess",
      "SiteControls",
      "CompetencyPlan",
      "MandatoryIsolation",
      "ShutdownAuthority",
    ]) {
      changed = (await readWorkOrder(co, w.id)).items[0];
      await assessWorkReadiness(co, w.id, {
        ...base(),
        expected_version: changed.version,
        assessment: {
          scope_revision_id: scope.id,
          scope_version: scope.version,
          criterion_code,
          outcome: ["MandatoryIsolation", "ShutdownAuthority"].includes(
            criterion_code,
          )
            ? "NotApplicable"
            : "Pass",
          reason:
            "SYN reviewed successor external visual scope; no intervention",
          evidence: {
            title: "SYN successor authority",
            content_text:
              "SYN reviewed new scope and preparation independently of original cached attendance",
            source_reference: "SYN-PPO-PT24-SUCCESSOR",
            source_version: "2",
          },
          source_as_at: new Date().toISOString(),
          valid_until: "2032-01-02T00:00:00Z",
        },
      });
    }
    changed = (await readWorkOrder(co, w.id)).items[0];
    await authoriseWorkOrder(co, w.id, {
      ...base(),
      expected_version: changed.version,
      scope_revision_id: scope.id,
      scope_version: scope.version,
      policy_version_id: scope.policy_version_id,
    });
    changed = (await readWorkOrder(co, w.id)).items[0];
    assert.equal(changed.authorised_scope_revision_id, scope.id);
    assert.notEqual(changed.authorised_scope_revision_id, a.scope_revision_id);
    successor = {
      prior_scope_id: a.scope_revision_id,
      authorised_successor_id: scope.id,
      revision: scope.revision,
      hash: scope.content_hash,
    };
  }
  const current = (await readAppointment(co, appointment)).items[0];
  return {
    appointment_id: appointment,
    assignment_version: current.assignment_version,
    schedule_version: current.schedule_version,
    status: current.status,
    successor,
  };
}
