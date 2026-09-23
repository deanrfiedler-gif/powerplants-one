import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, test } from "node:test";
import { reset, seed, migrate } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import {
  createCs,
  saveCs,
  csAction,
  readCs,
  listCs,
  hash,
} from "../../src/shared/cs/service";
import { csOptions } from "../../src/shared/cs/options";
import {
  addSurveyPhoto,
  correctSurveyCaption,
  surveyPhotoBytes,
} from "../../src/shared/cs/photos";
import { readOperation } from "../../src/shared/receipts";
import { customer360 } from "../../src/shared/customer-360";
import { createOpportunity } from "../../src/crm/opportunities";
import { createActivity } from "../../src/activities/activities";
import {
  applicationSearch,
  searchPreview,
} from "../../src/shell/search-service";
import { reviewInbox } from "../../src/reviews/service";
import { readSavedViews, saveSavedViews } from "../../src/platform/saved-views";
import { notificationInbox } from "../../src/notifications/service";
import { createFacility } from "../../src/shared/commands";
import { CRM, crmCreate, crmBase as base } from "../helpers/crm";
import { png } from "../helpers/field";
import type {
  CsKind,
  CsContent,
  ReadinessContent,
  SurveyContent,
  PlanContent,
} from "../../src/shared/cs/model";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
const rows = async (sql: string, values: unknown[] = []) =>
  (await database().query(sql, values)).rows;
async function create(kind: CsKind) {
  const p = await principal(),
    id = randomUUID();
  await createCs(p, kind, {
    ...base(),
    id,
    context_id: kind === "AccountPlan" ? CRM.org : CRM.site,
    name: "SYN " + kind,
    owner_id: p.actor_id,
  });
  return { p, id };
}
async function save(
  p: Awaited<ReturnType<typeof principal>>,
  kind: CsKind,
  id: string,
  content: CsContent,
) {
  const { record } = await readCs(p, kind, id);
  return saveCs(p, kind, id, {
    ...base(),
    expected_version: record.version,
    name: record.name,
    owner_id: record.owner_id,
    content,
  });
}
async function action(
  p: Awaited<ReturnType<typeof principal>>,
  kind: CsKind,
  id: string,
  action: string,
  extra: Record<string, unknown> = {},
) {
  const { record } = await readCs(p, kind, id);
  return csAction(p, kind, id, {
    ...base(),
    expected_version: record.version,
    action,
    ...extra,
  });
}
const observation = () => ({
  id: randomUUID(),
  title: "SYN measured span",
  kind: "Measured" as const,
  facility_id: null,
  asset_id: null,
  value: "0",
  unit: "m",
  detail: "SYN zero explicitly measured",
  observer: "SYN observer",
  captured_on: "2026-09-20",
  method_source: "SYN tape measurement",
  significant: true,
  insignificant_reason: null,
  activity_id: null,
});
const survey = (): SurveyContent => ({
  schema_version: 1,
  purpose: "SYN bounded Site inspection",
  facility_ids: [],
  asset_ids: [],
  observations: [observation()],
});
test("CS01 source reconciliation uses exact links, hides restricted populations and keeps unavailable orders distinct from zero", async () => {
  const p = await principal(),
    o = crmCreate();
  await createOpportunity(p, o);
  const r = await customer360(p, CRM.org);
  assert.equal(r.context.id, CRM.org);
  assert.ok(
    r.sections.deals.items.some(
      (x) => x.id === o.id && x.href === "/sales/opportunities/" + o.id,
    ),
  );
  for (const [key, section] of Object.entries(r.sections)) {
    assert.notEqual(
      section.state,
      "Unavailable",
      key + " unexpectedly unavailable",
    );
    assert.ok(!("total" in section));
  }
  assert.equal(r.sections.orders.state, "Not configured");
  assert.equal(r.sections.orders.items.length, 0);
  assert.ok(!("grand_total" in r));
  const limited = await customer360(await principal("site-observer"), CRM.org);
  for (const key of ["deals", "quotations", "projects", "accounts"] as const) {
    assert.equal(limited.sections[key].state, "Restricted");
    assert.deepEqual(limited.sections[key].items, []);
  }
  await assert.rejects(
    customer360(await principal("other-workspace"), CRM.org),
  );
});
test("CS08 draft integrity, source permissions, exact retries and stale versions", async () => {
  const { p, id } = await create("Survey"),
    r = await readCs(p, "Survey", id),
    content = survey();
  await assert.rejects(
    action(p, "Survey", id, "submit"),
    (error: unknown) =>
      (error as { field_errors?: { field: string }[] }).field_errors?.some(
        (e) => e.field === "purpose",
      ) === true,
  );
  const command = {
    ...base(),
    expected_version: r.record.version,
    name: r.record.name,
    owner_id: p.actor_id,
    content,
  };
  const saved = await saveCs(p, "Survey", id, command);
  assert.equal((await saveCs(p, "Survey", id, command)).replayed, true);
  assert.deepEqual(await readOperation(p, command.operation_id), saved.receipt);
  await assert.rejects(
    saveCs(p, "Survey", id, { ...command, name: "Changed original" }),
    code("OperationConflict"),
  );
  await assert.rejects(
    saveCs(p, "Survey", id, { ...command, ...base() }),
    code("VersionConflict"),
  );
  await assert.rejects(
    readCs(await principal("second-company"), "Survey", id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readCs(await principal("other-workspace"), "Survey", id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    saveCs(await principal("site-observer"), "Survey", id, {
      ...command,
      ...base(),
    }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    save(p, "Survey", id, {
      ...content,
      observations: [{ ...observation(), unit: null }],
    }),
    code("InvalidData"),
  );
  await assert.rejects(
    save(p, "Survey", id, {
      ...content,
      observations: [
        { ...observation(), kind: "Unknown", value: "0", unit: null },
      ],
    }),
    code("InvalidData"),
  );
  const foreign = (
    await rows("SELECT id FROM ppo.facilities WHERE site_id<>$1 LIMIT 1", [
      CRM.site,
    ])
  )[0];
  assert.ok(
    foreign,
    "Seed must include an exact cross-Site Facility for the refusal proof",
  );
  await assert.rejects(
    save(p, "Survey", id, { ...content, facility_ids: [foreign.id] }),
    code("RecordUnavailable"),
  );
  assert.ok((await listCs(p, "Survey", {})).items.some((x) => x.id === id));
  assert.ok(
    !(await listCs(await principal("second-company"), "Survey", {})).items.some(
      (x) => x.id === id,
    ),
  );
  const choices = await csOptions(p, "Survey", CRM.site);
  assert.equal(choices.context.id, CRM.site);
  assert.ok(choices.owners.edit.length >= 2);
});
test("CS08 original PNG bytes/hash are immutable; caption successors survive review and revision", async () => {
  const { p, id } = await create("Survey");
  await save(p, "Survey", id, survey());
  const bytes = png(),
    photoId = randomUUID(),
    command = {
      ...base(),
      id: photoId,
      expected_version: 2,
      facility_id: null,
      asset_id: null,
      observer: "SYN photographer",
      captured_on: "2026-09-20",
      method_source: "SYN camera fixture",
      caption: "Original caption",
      png_base64: bytes.toString("base64"),
    };
  await addSurveyPhoto(p, id, command);
  assert.equal((await addSurveyPhoto(p, id, command)).replayed, true);
  assert.deepEqual(Buffer.from(await surveyPhotoBytes(p, id, photoId)), bytes);
  await assert.rejects(
    addSurveyPhoto(p, id, {
      ...command,
      png_base64: png(8, 8).toString("base64"),
    }),
    code("OperationConflict"),
  );
  await assert.rejects(
    addSurveyPhoto(p, id, {
      ...command,
      ...base(),
      id: randomUUID(),
      expected_version: 3,
      png_base64: Buffer.from("not a PNG").toString("base64"),
    }),
  );
  let r = await readCs(p, "Survey", id);
  const original = structuredClone(r.photos[0]);
  await correctSurveyCaption(p, id, photoId, {
    ...base(),
    expected_version: r.record.version,
    previous_caption_id: original.caption.id,
    caption: "Corrected description",
    reason: "SYN caption correction",
  });
  r = await readCs(p, "Survey", id);
  assert.equal(r.photos[0].content_hash, original.content_hash);
  assert.equal(r.photos[0].caption.caption, "Corrected description");
  assert.deepEqual(Buffer.from(await surveyPhotoBytes(p, id, photoId)), bytes);
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.cs_photo_captions WHERE photo_id=$1",
        [photoId],
      )
    )[0].n,
    2,
  );
  await assert.rejects(
    rows("UPDATE ppo.cs_survey_photos SET content_hash=$2 WHERE id=$1", [
      photoId,
      "a".repeat(64),
    ]),
    code("55000"),
  );
  await action(p, "Survey", id, "submit");
  r = await readCs(p, "Survey", id);
  const snapshot = r.snapshots[0];
  await assert.rejects(
    action(p, "Survey", id, "review", { snapshot_id: snapshot.id }),
    code("IndependentReviewRequired"),
  );
  const reviewer = await principal("cs-reviewer");
  await action(reviewer, "Survey", id, "review", { snapshot_id: snapshot.id });
  await action(p, "Survey", id, "handover", {
    snapshot_id: snapshot.id,
    destination: "Estimating",
    receiving_owner_id: p.actor_id,
  });
  const accepted = await readCs(p, "Survey", id);
  assert.equal(accepted.events.filter((e) => e.kind === "Handover").length, 1);
  await action(p, "Survey", id, "revise");
  r = await readCs(p, "Survey", id);
  assert.equal(r.record.revision, 2);
  assert.deepEqual(r.snapshots[0].basis, snapshot.basis);
  assert.equal(r.photos[0].content_hash, original.content_hash);
  await assert.rejects(
    rows("DELETE FROM ppo.cs_snapshots WHERE id=$1", [snapshot.id]),
    code("55000"),
  );
});
test("CS08 meaningful Unknown needs canonical owned Activity; stale source is returned then resubmitted", async () => {
  const { p, id } = await create("Survey"),
    content = survey();
  content.observations = [
    {
      ...observation(),
      kind: "Unknown",
      value: null,
      unit: null,
      detail: "SYN water supply capacity not measured",
    },
  ];
  await save(p, "Survey", id, content);
  await assert.rejects(action(p, "Survey", id, "submit"), code("InvalidData"));
  const activityId = randomUUID();
  await createActivity(p, {
    ...base(),
    id: activityId,
    company_id: CRM.company,
    site_id: CRM.site,
    kind: "TechnicalFollowUp",
    owner_id: p.actor_id,
    summary: "SYN measure supply",
    due_at: "2026-10-01T00:00:00Z",
    due_needed: false,
    access_class: "Internal",
    links: [{ object_type: "Site", object_id: CRM.site }],
  });
  content.observations[0].activity_id = activityId;
  await save(p, "Survey", id, content);
  await action(p, "Survey", id, "submit");
  let r = await readCs(p, "Survey", id);
  const first = r.snapshots[0];
  const reviewer = await principal("cs-reviewer");
  const found = await applicationSearch(p, { q: "SYN", kind: "Site survey" });
  assert.ok(found.items.some((x) => x.href === `/surveys/${id}`));
  assert.equal(
    (await searchPreview(p, { kind: "Site survey", id })).href,
    `/surveys/${id}`,
  );
  assert.ok(
    !(
      await applicationSearch(await principal("second-company"), {
        q: "SYN",
        kind: "Site survey",
      })
    ).items.some((x) => x.href === `/surveys/${id}`),
  );
  assert.ok(
    (
      await reviewInbox(reviewer, { view: "mine", module: "Customers & sites" })
    ).items.some(
      (x) => x.record_id === id && x.href === `/surveys/${id}?view=review`,
    ),
  );
  assert.ok(
    !(
      await reviewInbox(p, { view: "mine", module: "Customers & sites" })
    ).items.some((x) => x.record_id === id),
  );
  assert.ok(
    (await notificationInbox(p)).items.some((n) => n.source_id === activityId),
  );
  const views = await readSavedViews(p);
  await saveSavedViews(p, {
    expected_version: views.version,
    views: [
      ...views.settings.views,
      {
        id: randomUUID(),
        name: "SYN Site surveys",
        target: "surveys",
        schema_version: 1,
        scope: "personal",
        pinned: false,
        criteria: { site_id: CRM.site },
      },
    ],
  });
  assert.ok(
    (await readSavedViews(p)).settings.views.some(
      (v) => v.target === "surveys" && v.criteria.site_id === CRM.site,
    ),
  );
  await rows("UPDATE ppo.sites SET version=version+1 WHERE id=$1", [CRM.site]);
  await assert.rejects(
    action(reviewer, "Survey", id, "review", { snapshot_id: first.id }),
    code("SourceChanged"),
  );
  await action(reviewer, "Survey", id, "return", { snapshot_id: first.id });
  await action(p, "Survey", id, "revise");
  await action(p, "Survey", id, "submit");
  r = await readCs(p, "Survey", id);
  assert.equal(r.snapshots.length, 2);
  assert.equal(r.record.revision, 2);
  assert.ok(r.snapshots.some((s) => s.id === first.id && s.recheck_required));
});
test("CS06 exact Facility evidence, independent review and retained preparation recheck grant no authority", async () => {
  const { p, id } = await create("Readiness"),
    f = randomUUID();
  await createFacility(p, {
    ...base(),
    id: f,
    company_id: CRM.company,
    site_id: CRM.site,
    name: "SYN exact area",
    parent_facility_id: null,
  });
  const requirementId = randomUUID(),
    evidenceId = randomUUID();
  const content: ReadinessContent = {
    schema_version: 1,
    requirements: [
      {
        id: requirementId,
        revision: 1,
        title: "SYN individual induction",
        kind: "Induction",
        facility_id: f,
        activity: "Inspection",
        source: "SYN requirement r1",
      },
    ],
    evidence: [
      {
        id: evidenceId,
        requirement_id: requirementId,
        requirement_revision: 1,
        facility_id: f,
        activity: "Inspection",
        person_id: CRM.person,
        captured_on: "2026-09-01",
        expires_on: "2026-12-01",
        source: "SYN signed individual induction",
      },
    ],
    windows: [
      {
        id: randomUUID(),
        facility_id: f,
        activity: "Inspection",
        from_date: "2026-01-01",
        to_date: "2026-12-31",
        season_from: "01-01",
        season_to: "12-31",
        start_time: "08:00",
        end_time: "17:00",
        source: "SYN access hours",
      },
    ],
  };
  await save(p, "Readiness", id, content);
  const preparation = {
    facility_ids: [f],
    person_ids: [CRM.person],
    activity: "Inspection",
    starts_at: "2026-10-01T00:00:00Z",
    ends_at: "2026-10-01T01:00:00Z",
  };
  await action(p, "Readiness", id, "prepare", { preparation });
  let r = await readCs(p, "Readiness", id);
  assert.equal(r.snapshots[0].basis.assessment.status, "Recheck required");
  await assert.rejects(
    action(p, "Readiness", id, "review_evidence", { evidence_id: evidenceId }),
    code("IndependentReviewRequired"),
  );
  await action(
    await principal("cs-reviewer"),
    "Readiness",
    id,
    "review_evidence",
    { evidence_id: evidenceId },
  );
  await action(p, "Readiness", id, "prepare", { preparation });
  r = await readCs(p, "Readiness", id);
  const prepared = r.snapshots[0];
  assert.equal(prepared.basis.assessment.blockers.length, 0);
  await action(p, "Readiness", id, "acknowledge", { snapshot_id: prepared.id });
  const before = hash(prepared.basis);
  content.requirements[0].source = "SYN requirement r2";
  await save(p, "Readiness", id, content);
  await assert.rejects(
    action(p, "Readiness", id, "acknowledge", { snapshot_id: prepared.id }),
    code("SourceChanged"),
  );
  r = await readCs(p, "Readiness", id);
  assert.equal(
    (r.record.content as ReadinessContent).requirements[0].revision,
    2,
  );
  assert.equal(
    hash(r.snapshots.find((s) => s.id === prepared.id)!.basis),
    before,
  );
  assert.equal(
    r.events.find((e) => e.kind === "Acknowledged")!.details.work_authority,
    "Not granted",
  );
});
test("CS07 plan revisions preserve Unknown segmentation and never create bookings, opportunities or duplicate task masters", async () => {
  const { p, id } = await create("AccountPlan"),
    before = await rows(
      "SELECT (SELECT count(*) FROM ppo.appointments) appointments,(SELECT count(*) FROM ppo.opportunities) opportunities,(SELECT count(*) FROM ppo.activities) activities",
    );
  const content: PlanContent = {
    schema_version: 1,
    sector: null,
    territory: null,
    horticultural_context: null,
    objectives: "SYN understand future growing requirements",
    review_on: null,
    visits: [
      {
        id: randomUUID(),
        site_id: CRM.site,
        purpose: "SYN relationship review",
        planned_on: null,
        activity_id: null,
      },
    ],
    activity_ids: [],
  };
  await save(p, "AccountPlan", id, content);
  await action(p, "AccountPlan", id, "review_plan");
  const r = await readCs(p, "AccountPlan", id);
  assert.equal((r.record.content as PlanContent).sector, null);
  assert.equal(r.snapshots[0].kind, "PlanReview");
  await assert.rejects(
    saveCs(p, "AccountPlan", id, {
      ...base(),
      expected_version: 1,
      name: r.record.name,
      owner_id: p.actor_id,
      content,
    }),
    code("VersionConflict"),
  );
  assert.deepEqual(
    await rows(
      "SELECT (SELECT count(*) FROM ppo.appointments) appointments,(SELECT count(*) FROM ppo.opportunities) opportunities,(SELECT count(*) FROM ppo.activities) activities",
    ),
    before,
  );
  await assert.rejects(
    readCs(await principal("site-observer"), "AccountPlan", id),
    code("RecordUnavailable"),
  );
  assert.ok(
    !(
      await listCs(await principal("site-observer"), "AccountPlan", {})
    ).items.some((x) => x.id === id),
  );
  const beforeSeed = await rows(
    "SELECT id,version FROM ppo.customer_plans ORDER BY id",
  );
  await migrate();
  await seed();
  await seed();
  assert.deepEqual(
    await rows("SELECT id,version FROM ppo.customer_plans ORDER BY id"),
    beforeSeed,
  );
});
