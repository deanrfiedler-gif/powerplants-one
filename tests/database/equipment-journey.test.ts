import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { createAsset, createFacility } from "../../src/shared/commands";
import {
  createCs,
  saveCs,
  readCs,
  csAction,
} from "../../src/shared/cs/service";
import { createProject } from "../../src/projects/service";
import { createEngineeringRequest } from "../../src/engineering/service";
import {
  packageCommand,
  basisCommand,
  inspectionCommand,
} from "../../src/engineering/commissioning/commands";
import { readView } from "../../src/engineering/commissioning/reads";
import { sourceCommand } from "../../src/engineering/materials/commands";
import { equipmentLookup } from "../../src/equipment/reads";
import { equipmentTimeline } from "../../src/equipment/timeline";
import {
  recordCalibration,
  equipmentInstruments,
} from "../../src/equipment/evidence";
import { CRM, crmBase as base } from "../helpers/crm";
import { projectInput } from "../helpers/projects";
import { engineeringInput } from "../helpers/engineering";
import {
  COMMISSIONING,
  numeric,
  qualitative,
} from "../helpers/engineering-commissioning";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const rows = async (sql: string, args: unknown[] = []) =>
  (await database().query(sql, args)).rows;
test("F01 -> F08 -> F02 exact Equipment context, owned defect/retest and retained calibration at use", async () => {
  const p = await principal(),
    engineer = await principal(COMMISSIONING.engineer.profile),
    reviewer = await principal(COMMISSIONING.reviewer.profile),
    performer = await principal(COMMISSIONING.performer.profile);
  const facility = randomUUID(),
    asset = randomUUID();
  await createFacility(p, {
    ...base(),
    id: facility,
    company_id: CRM.company,
    site_id: CRM.site,
    name: "SYN journey pump shed",
    parent_facility_id: null,
  });
  await createAsset(p, {
    ...base(),
    id: asset,
    company_id: CRM.company,
    site_id: CRM.site,
    facility_id: facility,
    description: "SYN journey pump",
    identity_status: "Verified",
    serial: "SYN-JOURNEY-" + asset,
    effective_at: "2026-09-01T00:00:00Z",
    configuration: "SYN H1 / F1",
  });
  const beforeLookup = await rows("SELECT * FROM ppo.assets WHERE id=$1", [
      asset,
    ]),
    lookup = await equipmentLookup(p, { q: `/equipment/${asset}` });
  assert.equal(lookup.outcome, "Exact");
  assert.equal(lookup.items[0].facility_id, facility);
  assert.deepEqual(
    await rows("SELECT * FROM ppo.assets WHERE id=$1", [asset]),
    beforeLookup,
  );
  // The owning CS readiness record is prepared for this exact physical Facility and Inspection window.
  const readiness = randomUUID(),
    requirement = randomUUID(),
    evidence = randomUUID();
  await createCs(p, "Readiness", {
    ...base(),
    id: readiness,
    context_id: lookup.items[0].site_id,
    name: "SYN journey readiness",
    owner_id: p.actor_id,
  });
  await saveCs(p, "Readiness", readiness, {
    ...base(),
    expected_version: 1,
    name: "SYN journey readiness",
    owner_id: p.actor_id,
    content: {
      schema_version: 1,
      requirements: [
        {
          id: requirement,
          revision: 1,
          title: "SYN physical area induction",
          kind: "Induction",
          facility_id: facility,
          activity: "Inspection",
          source: "SYN site rule r01",
        },
      ],
      evidence: [
        {
          id: evidence,
          requirement_id: requirement,
          requirement_revision: 1,
          facility_id: facility,
          activity: "Inspection",
          person_id: CRM.person,
          captured_on: "2026-09-01",
          expires_on: "2026-12-01",
          source: "SYN signed induction",
        },
      ],
      windows: [
        {
          id: randomUUID(),
          facility_id: facility,
          activity: "Inspection",
          from_date: "2026-01-01",
          to_date: "2026-12-31",
          season_from: "01-01",
          season_to: "12-31",
          start_time: "08:00",
          end_time: "17:00",
          source: "SYN exact pump shed access window",
        },
      ],
    },
  });
  const readyAction = async (
    actor: typeof p,
    action: string,
    extra: Record<string, unknown> = {},
  ) =>
    csAction(actor, "Readiness", readiness, {
      ...base(),
      expected_version: (await readCs(actor, "Readiness", readiness)).record
        .version,
      action,
      ...extra,
    });
  const preparation = {
    facility_ids: [facility],
    person_ids: [CRM.person],
    activity: "Inspection",
    starts_at: "2026-09-08T00:00:00Z",
    ends_at: "2026-09-08T01:00:00Z",
  };
  await readyAction(p, "prepare", { preparation });
  assert.equal(
    (await readCs(p, "Readiness", readiness)).snapshots[0].basis.assessment
      .status,
    "Recheck required",
  );
  await readyAction(await principal("cs-reviewer"), "review_evidence", {
    evidence_id: evidence,
  });
  await readyAction(p, "prepare", { preparation });
  const ready = (await readCs(p, "Readiness", readiness)).snapshots[0];
  assert.equal(ready.basis.assessment.blockers.length, 0);
  await readyAction(p, "acknowledge", { snapshot_id: ready.id });
  // Native Engineering owns approval, instrument selection, attempt review and defects.
  const project = projectInput();
  await createProject(p, project);
  const eng = engineeringInput(project.id);
  await createEngineeringRequest(p, eng);
  const record = randomUUID(),
    scope = randomUUID(),
    basis = randomUUID(),
    procedure = randomUUID();
  await sourceCommand(p, eng.id, {
    ...base(),
    action: "publish",
    id: procedure,
    kind: "TestProcedure",
    reference: "SYN-EQ-JOURNEY",
    title: "SYN fictional pump checks",
    revision: "r01",
    file_version: "1.0",
    permitted_purpose: "InformationOnly",
    content: "SYNTHETIC test procedure; all limits fictional.",
  });
  await packageCommand(engineer, eng.id, {
    ...base(),
    action: "create",
    id: record,
    scope_id: scope,
    title: "SYN Equipment journey",
    system_name: "SYN pump",
    area: "SYN pump shed",
    owner_id: engineer.actor_id,
  });
  await packageCommand(engineer, eng.id, {
    ...base(),
    action: "scope",
    record_id: record,
    scope_id: scope,
    expected_version: 1,
    statement: "SYN exact physical Asset inspected",
    items: [
      {
        key: "pump",
        kind: "Asset",
        asset_id: asset,
        reference: lookup.items[0].display_number,
        title: "SYN journey pump",
        installed_location: "SYN journey pump shed",
        served_areas: [],
        critical: true,
      },
    ],
    interfaces: [],
  });
  const detail = async (actor = engineer) =>
    (await readView(actor, eng.id, { record }, "results")).selected!;
  await basisCommand(engineer, eng.id, {
    ...base(),
    action: "create",
    record_id: record,
    id: basis,
    expected_version: (await detail()).record.version,
    reference: "SYN-EQ-BASIS",
    revision: "r01",
  });
  const checks = [
    numeric("pressure", "SYN fictional pressure", "180.0", "260.0", "kPa", {
      scope_key: "pump",
      instrument_required: true,
    }),
    qualitative("guard", "SYN unrelated guard finding", { scope_key: "pump" }),
  ];
  await basisCommand(engineer, eng.id, {
    ...base(),
    action: "save",
    record_id: record,
    basis_id: basis,
    expected_version: 1,
    reference: "SYN-EQ-BASIS",
    revision: "r01",
    procedure_source_id: procedure,
    checks,
    prerequisites: [],
  });
  await basisCommand(engineer, eng.id, {
    ...base(),
    action: "submit",
    record_id: record,
    basis_id: basis,
    expected_version: 2,
  });
  await basisCommand(reviewer, eng.id, {
    ...base(),
    action: "approve",
    record_id: record,
    basis_id: basis,
    expected_version: 3,
    decision_reason: "SYN independent exact scope and criteria review",
  });
  const instrument = randomUUID(),
    calibration = {
      ...base(),
      id: randomUUID(),
      company_id: CRM.company,
      instrument_id: instrument,
      reference: `SYN-JOURNEY-${asset}`,
      description: "SYN pressure gauge",
      calibration_reference: `SYN-CERT-${asset}`,
      calibration_version: "r01",
      valid_from: "2026-01-01",
      valid_to: "2026-09-10",
      measurement_type: "Pressure",
      measurement_range: "0-300",
      measurement_unit: "kPa",
      certificate_reference: "SYN retained certificate",
      certificate_revision: "r01",
    };
  await recordCalibration(p, calibration);
  const attempt = async (
    predecessor: string | null,
    keys: string[],
    value: string,
    occurred: string,
    instruments: string[],
    unit = "kPa",
  ) => {
    const id = randomUUID();
    await inspectionCommand(performer, eng.id, {
      ...base(),
      action: "open",
      id,
      record_id: record,
      expected_version: (await detail(performer)).record.version,
      predecessor_id: predecessor,
      check_keys: keys,
    });
    await inspectionCommand(performer, eng.id, {
      ...base(),
      action: "save",
      record_id: record,
      attempt_id: id,
      expected_version: 1,
      configuration_reference: "SYN H1 / F1",
      occurred_at: occurred,
      timezone: "Australia/Brisbane",
      prerequisites: [],
      findings: "SYN exact readings",
      readings: keys.map((key) =>
        key === "pressure"
          ? { check_key: key, state: "Recorded", value, unit }
          : {
              check_key: key,
              state: "Recorded",
              choice: "Does not operate as specified",
            },
      ),
      instrument_ids: instruments,
    });
    return id;
  };
  const submit = async (id: string) =>
    inspectionCommand(performer, eng.id, {
      ...base(),
      action: "submit",
      record_id: record,
      attempt_id: id,
      expected_version: (await detail(performer)).attempts.find(
        (a) => a.id === id,
      )!.version,
      owner_id: engineer.actor_id,
      due: "2026-10-01",
      severity: "Major",
    });
  const first = await attempt(
    null,
    ["pressure", "guard"],
    "120.0",
    "2026-09-08T00:30:00Z",
    [instrument],
  );
  const submittedVersion = (await detail(performer)).attempts.find(
    (a) => a.id === first,
  )!.version;
  const original = await submit(first);
  assert.deepEqual(
    (
      await inspectionCommand(performer, eng.id, {
        ...base(),
        operation_id: original.receipt.operation_id,
        action: "submit",
        record_id: record,
        attempt_id: first,
        expected_version: submittedVersion,
        owner_id: engineer.actor_id,
        due: "2026-10-01",
        severity: "Major",
      })
    ).receipt,
    original.receipt,
  );
  await inspectionCommand(reviewer, eng.id, {
    ...base(),
    action: "review",
    id: randomUUID(),
    record_id: record,
    attempt_id: first,
    decision: "Returned",
    decision_reason: "SYN two failed findings require correction",
    owner_id: engineer.actor_id,
    due: "2026-10-01",
  });
  const failed = (await detail()).defects;
  assert.equal(failed.length, 2);
  assert.ok(failed.every((d) => d.activity_id));
  const pressure = failed.find((d) => d.check_key === "pressure")!;
  await inspectionCommand(engineer, eng.id, {
    ...base(),
    action: "correct",
    record_id: record,
    defect_id: pressure.id,
    expected_version: pressure.version,
    note: "SYN pressure regulator reseated",
  });
  const retest = await attempt(
    first,
    ["pressure"],
    "215.0",
    "2026-09-09T00:30:00Z",
    [instrument],
  );
  await submit(retest);
  await inspectionCommand(reviewer, eng.id, {
    ...base(),
    action: "review",
    id: randomUUID(),
    record_id: record,
    attempt_id: retest,
    decision: "Accepted",
    decision_reason: "SYN independent review of exact fresh pressure retest",
  });
  const after = (await detail()).defects;
  assert.equal(after.length, 2);
  assert.equal(after.find((d) => d.check_key === "guard")!.state, "Open");
  assert.notEqual(after.find((d) => d.check_key === "pressure")!.state, "Open");
  const useBefore = await rows(
    "SELECT snapshot FROM ppo.inspection_instrument_uses WHERE attempt_id=$1",
    [first],
  );
  assert.equal(useBefore[0].snapshot.certificate_revision, "r01");
  let gauge = (await equipmentInstruments(engineer)).items.find(
    (i) => i.id === instrument,
  )!;
  assert.equal(gauge.current.assessment, "InvalidAtUse");
  assert.equal(
    gauge.uses.find((u) => u.attempt_id === first)!.at_use.assessment,
    "ValidAtUse",
  );
  const invalid = await attempt(
    null,
    ["pressure"],
    "215.0",
    "2026-09-12T00:30:00Z",
    [instrument],
  );
  await assert.rejects(submit(invalid));
  const renewed = randomUUID();
  await recordCalibration(p, {
    ...calibration,
    ...base(),
    id: randomUUID(),
    instrument_id: renewed,
    predecessor_id: instrument,
    expected_version: 1,
    calibration_version: "r02",
    certificate_revision: "r02",
    valid_from: "2026-09-11",
    valid_to: "2027-09-10",
  });
  await assert.rejects(submit(invalid)); // Renewal cannot repair the old attempt's selected certificate.
  await inspectionCommand(performer, eng.id, {
    ...base(),
    action: "save",
    record_id: record,
    attempt_id: invalid,
    expected_version: (await detail(performer)).attempts.find(
      (a) => a.id === invalid,
    )!.version,
    configuration_reference: "SYN H1 / F1",
    occurred_at: "2026-09-12T00:30:00Z",
    timezone: "Australia/Brisbane",
    prerequisites: [],
    readings: [
      {
        check_key: "pressure",
        state: "Recorded",
        value: "215.0",
        unit: "degrees",
      },
    ],
    instrument_ids: [renewed],
  });
  await submit(invalid);
  const unsupportedUnit = await rows(
    "SELECT evaluation,evaluation_reason FROM ppo.inspection_results WHERE attempt_id=$1 AND check_key='pressure'",
    [invalid],
  );
  assert.equal(unsupportedUnit[0].evaluation, "UnableToAssess");
  assert.match(unsupportedUnit[0].evaluation_reason, /no approved conversion/);
  assert.equal(
    (await detail()).defects.find((d) => d.check_key === "guard")!.state,
    "Open",
  );
  await recordCalibration(p, {
    ...base(),
    id: randomUUID(),
    company_id: CRM.company,
    instrument_id: instrument,
    expected_version: 1,
    withdrawn_effective_from: "2026-09-01",
  });
  gauge = (await equipmentInstruments(engineer)).items.find(
    (i) => i.id === instrument,
  )!;
  assert.equal(
    gauge.uses.find((u) => u.attempt_id === first)!.at_use.assessment,
    "ValidAtUse",
  );
  assert.equal(
    gauge.uses.find((u) => u.attempt_id === first)!.current_assessment_of_use
      .assessment,
    "WithdrawnForUse",
  );
  assert.deepEqual(
    await rows(
      "SELECT snapshot FROM ppo.inspection_instrument_uses WHERE attempt_id=$1",
      [first],
    ),
    useBefore,
  );
  assert.equal(
    (await equipmentInstruments(await principal("site-observer"))).items.find(
      (i) => i.id === instrument,
    )?.uses.length ?? 0,
    0,
  );
  const timeline = await equipmentTimeline(engineer, asset);
  assert.ok(timeline.items.some((i) => i.key.includes(first)));
  assert.ok(timeline.items.some((i) => i.key.includes(retest)));
});
