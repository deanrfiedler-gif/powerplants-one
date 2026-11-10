import { database, transaction } from "../../src/platform/database";
import { createProject } from "../../src/projects/service";
import { linkWorkOrderProject } from "../../src/service/project-field-work";
import { projectInput } from "./projects";
import { financeDraft, principal, base, readFinance } from "./finance";
import { id } from "./packs";
import {
  saveFinance,
  submitFinance,
  reviewFinance,
  beginFinanceProcessing,
  recordFinanceOutcome,
  reconcileFinance,
} from "../../src/finance/service";

export async function linkedFinanceDraft(projectId?: string) {
  const owner = await principal();
  const work = (
    await database().query(
      "SELECT w.* FROM ppo.work_orders w JOIN ppo.appointments a ON a.work_order_id=w.id WHERE a.id=$1",
      [id("a8", 9)],
    )
  ).rows[0];
  if (!projectId) {
    const input = {
      ...projectInput(),
      company_id: work.company_id,
      organisation_id: work.customer_id,
      site_id: work.site_id,
    };
    await createProject(owner, input);
    projectId = input.id;
  }
  const project = (
    await database().query("SELECT * FROM ppo.projects WHERE id=$1", [
      projectId,
    ])
  ).rows[0];
  // Real B1 link before any visit starts. Report/Finance originals follow normally.
  await linkWorkOrderProject(owner, work.id, {
    ...base(),
    expected_version: work.version,
    project_id: project.id,
    expected_project_version: project.version,
  });
  return { ...(await financeDraft("SyntheticApi")), project, work };
}
export type WorkFixture = Awaited<ReturnType<typeof linkedFinanceDraft>>;
export async function reviseWork(f: WorkFixture, lines = f.cmd.lines) {
  const r = await readFinance(f.p, f.id);
  const { id: ignored, ...cmd } = f.cmd;
  void ignored;
  return saveFinance(f.p, f.id, {
    ...cmd,
    ...base(),
    expected_version: r.handoff.version,
    lines,
  });
}
export const costLines = (f: WorkFixture): typeof f.cmd.lines =>
  f.cmd.lines.map((l) => ({
    ...l,
    disposition: "NonBillable",
    target_group: null,
    reason: "Included in project contract",
  }));
export async function submitWork(f: WorkFixture) {
  const r = await readFinance(f.p, f.id);
  return submitFinance(f.p, f.id, {
    ...base(),
    expected_version: r.handoff.version,
  });
}
export async function reviewWork(f: WorkFixture, decision = "Approved") {
  const r = await readFinance(f.p, f.id);
  return reviewFinance(f.reviewer, f.id, {
    ...base(),
    expected_version: r.handoff.version,
    revision_id: r.handoff.current_revision_id,
    source_hash: r.revisions[0].source_hash,
    decision,
  });
}
export async function beginWork(f: WorkFixture, scenario = "Accepted") {
  const r = await readFinance(f.processor, f.id);
  return beginFinanceProcessing(f.processor, f.id, {
    ...base(),
    expected_version: r.handoff.version,
    scenario,
  });
}
export async function recordWork(f: WorkFixture, action = "Dispatch") {
  const r = await readFinance(f.processor, f.id);
  return recordFinanceOutcome(f.processor, f.id, {
    ...base(),
    expected_version: r.handoff.version,
    attempt_id: r.handoff.active_attempt_id,
    action,
  });
}
export async function reconcileWork(f: WorkFixture) {
  const r = await readFinance(f.reconciler, f.id);
  return reconcileFinance(f.reconciler, f.id, {
    ...base(),
    expected_version: r.handoff.version,
    outcome_id: r.outcomes[0].id,
    basis:
      "SYN exact source and target/no-posting evidence independently compared",
  });
}
// Explicit test-only legacy/concurrent-history fixture. B1 correctly forbids link
// changes after attendance starts; bypass ONLY in this transaction to challenge
// Finance with a current link different from the one at its earlier boundary.
export async function historicalLink(f: WorkFixture, projectId: string | null) {
  await transaction(async (c) => {
    await c.query("SET LOCAL session_replication_role = replica");
    await c.query("UPDATE ppo.work_orders SET project_id=$2 WHERE id=$1", [
      f.work.id,
      projectId,
    ]);
  });
}
// Explicit pre-existing state fixture, never a production command or migration.
export async function historicalClosedProject(f: WorkFixture) {
  await transaction(async (c) => {
    await c.query("SET LOCAL session_replication_role = replica");
    await c.query(
      "UPDATE ppo.projects SET lifecycle='Closed', version=version+1 WHERE id=$1",
      [f.project.id],
    );
  });
}
export async function assertNoNewEffects(id: string) {
  return (
    await database().query(
      "SELECT (SELECT count(*) FROM ppo.finance_processing_attempts WHERE handoff_id=$1) AS attempts,(SELECT count(*) FROM ppo.finance_simulator_targets WHERE handoff_id=$1) AS targets",
      [id],
    )
  ).rows[0];
}
