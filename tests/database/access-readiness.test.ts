import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, after, test } from "node:test";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import {
  csAction,
  createCs,
  readCs,
  saveCs,
  hash,
  readinessVisit,
} from "../../src/shared/cs/service";
import type { ReadinessContent } from "../../src/shared/cs/model";
import { CRM, crmBase } from "../helpers/crm";
import { confirmed } from "../helpers/packs";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const code = (name: string) => (error: unknown) =>
  (error as { code: string }).code === name;
const preparation = {
  facility_ids: [],
  person_ids: [],
  activity: "Inspection",
  starts_at: "2026-10-15T00:00:00Z",
  ends_at: "2026-10-15T01:00:00Z",
};
const requirement = () => ({
  id: randomUUID(),
  revision: 1,
  title: "SYN access approval",
  kind: "Site approval" as const,
  facility_id: null,
  activity: "Inspection",
  source: "SYN accepted source",
});
async function fixture(site = CRM.site) {
  const p = await principal(),
    reviewer = await principal("cs-reviewer"),
    id = randomUUID();
  await createCs(p, "Readiness", {
    ...crmBase(),
    id,
    context_id: site,
    name: "SYN CS06 publication",
    owner_id: p.actor_id,
  });
  const read = () => readCs(p, "Readiness", id);
  const action = async (
    actor: typeof p,
    action: string,
    fields: Record<string, unknown> = {},
  ) =>
    csAction(actor, "Readiness", id, {
      ...crmBase(),
      expected_version: (await read()).record.version,
      action,
      ...fields,
    });
  return { p, reviewer, id, read, action };
}
test("CS06 drafts are isolated, contributors cannot publish, latest independent publication is immutable and invalidates the old check", async () => {
  const f = await fixture(),
    req = requirement();
  await f.action(f.p, "prepare", { preparation });
  const check = (await f.read()).snapshots.find(
    (s) => s.kind === "Preparation",
  )!;
  await f.action(f.p, "draft_requirements", { requirements: [req] });
  let r = await f.read();
  const first = r.requirements_draft!;
  assert.deepEqual((r.record.content as ReadinessContent).requirements, []);
  assert.equal(
    r.snapshots.find((s) => s.id === check.id)!.recheck_required,
    false,
  );
  await assert.rejects(
    f.action(f.p, "publish_requirements", { snapshot_id: first.id }),
    code("IndependentReviewRequired"),
  );
  await assert.rejects(
    saveCs(f.p, "Readiness", f.id, {
      ...crmBase(),
      expected_version: r.record.version,
      name: r.record.name,
      owner_id: r.record.owner_id,
      content: { ...r.record.content, requirements: [req] },
    }),
    code("RequirementsReviewRequired"),
  );
  await f.action(f.p, "draft_requirements", {
    requirements: [{ ...req, title: "SYN revised source" }],
  });
  await assert.rejects(
    f.action(f.reviewer, "publish_requirements", { snapshot_id: first.id }),
    code("SourceChanged"),
  );
  r = await f.read();
  const command = {
    ...crmBase(),
    expected_version: r.record.version,
    action: "publish_requirements",
    snapshot_id: r.requirements_draft!.id,
  };
  await csAction(f.reviewer, "Readiness", f.id, command);
  await csAction(f.reviewer, "Readiness", f.id, command);
  r = await f.read();
  assert.equal(r.record.state, "Reviewed");
  assert.equal(r.requirements_draft!.state, "Reviewed");
  assert.equal(
    (r.record.content as ReadinessContent).requirements[0].title,
    "SYN revised source",
  );
  assert.equal(
    r.snapshots.find((s) => s.id === check.id)!.recheck_required,
    true,
  );
  assert.equal(
    hash(r.snapshots.find((s) => s.id === check.id)!.basis),
    hash(check.basis),
  );
  assert.equal(r.events.filter((e) => e.kind === "Reviewed").length, 1);
  await assert.rejects(
    f.action(f.p, "acknowledge", { snapshot_id: check.id }),
    code("SourceChanged"),
  );
  assert.equal(
    (await f.read()).events.filter((e) => e.kind === "Acknowledged").length,
    0,
  );
});
test("CS06 returned drafts retain contributor independence", async () => {
  const f = await fixture(),
    req = requirement();
  await f.action(f.p, "draft_requirements", { requirements: [req] });
  await f.action(f.reviewer, "return_requirements", {
    snapshot_id: (await f.read()).requirements_draft!.id,
  });
  await f.action(f.reviewer, "draft_requirements", { requirements: [req] });
  await assert.rejects(
    f.action(f.p, "publish_requirements", {
      snapshot_id: (await f.read()).requirements_draft!.id,
    }),
    code("IndependentReviewRequired"),
  );
});
test("CS06 retired IDs cannot resurrect reviewed evidence", async () => {
  const independent = await fixture(),
    req = requirement();
  await independent.action(independent.p, "draft_requirements", {
    requirements: [req],
  });
  await independent.action(independent.reviewer, "publish_requirements", {
    snapshot_id: (await independent.read()).requirements_draft!.id,
  });
  await independent.action(independent.p, "draft_requirements", {
    requirements: [],
  });
  await independent.action(independent.reviewer, "publish_requirements", {
    snapshot_id: (await independent.read()).requirements_draft!.id,
  });
  await assert.rejects(
    independent.action(independent.p, "draft_requirements", {
      requirements: [req],
    }),
    code("RetiredRequirement"),
  );
});
test("CS06 visit check uses server times, moving a visit refuses acknowledgement, and no authority is granted", async () => {
  const appointment = await confirmed();
  const a = (
    await database().query("SELECT site_id FROM ppo.appointments WHERE id=$1", [
      appointment.id,
    ])
  ).rows[0];
  const f = await fixture(a.site_id);
  await f.action(f.p, "prepare", {
    preparation,
    appointment_id: appointment.id,
  });
  let r = await f.read();
  const check = r.snapshots.find((s) => s.kind === "Preparation")!;
  assert.equal(
    check.basis.preparation.starts_at,
    r.visits.find((v) => v.id === appointment.id)!.starts_at,
  );
  await f.action(f.p, "acknowledge", { snapshot_id: check.id });
  assert.equal(
    (await f.read()).events.find((e) => e.kind === "Acknowledged")!.details
      .work_authority,
    "Not granted",
  );
  await database().query(
    "UPDATE ppo.appointments SET schedule_version=schedule_version+1,version=version+1 WHERE id=$1",
    [appointment.id],
  );
  r = await f.read();
  assert.equal(
    r.snapshots.find((s) => s.id === check.id)!.recheck_required,
    true,
  );
  await assert.rejects(
    f.action(f.p, "acknowledge", { snapshot_id: check.id }),
    code("SourceChanged"),
  );
  assert.equal(
    (await f.read()).events.filter((e) => e.kind === "Acknowledged").length,
    1,
  );
  await assert.rejects(
    readinessVisit(
      database(),
      f.p,
      { ...r.record, site_id: randomUUID() },
      appointment.id,
    ),
    code("RecordUnavailable"),
  );
});
