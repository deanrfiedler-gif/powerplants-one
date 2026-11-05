import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset, migrate, seed } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  createCase,
  commandCase,
  recordSupportRoute,
} from "../../src/service/escalations/commands";
import {
  readCase,
  listCases,
  retainedFile,
} from "../../src/service/escalations/reads";
import { readFinding } from "../../src/service/findings/reads";
import { hashBytes, hashValue } from "../../src/service/escalations/model";
import { caseContext } from "../../src/service/escalations/context";
import { technicalEvidence } from "../../src/service/escalations/pack-source";
import {
  previewEquipmentChange,
  proposeEquipmentChange,
  reviewEquipmentChange,
} from "../../src/equipment/changes";
import { png } from "../helpers/field";
import {
  readActivity,
  listActivities,
  activityCommand,
} from "../../src/activities/activities";
import { readOperation } from "../../src/shared/receipts";
import {
  escalationFixture,
  preparedEscalation,
  sentEscalation,
  act,
  principal,
  base,
  nativeLedger,
} from "../helpers/service-escalations";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const denied = (e: unknown) =>
  [403, 404].includes((e as { status: number }).status);
const rejected = (e: unknown) =>
  [409, 422].includes((e as { status: number }).status);
test("SV08 native identity, capability, scope, replay, stale version and withdrawal preserve source finding", async () => {
  const f = await escalationFixture(),
    d = await readCase(f.p, f.id);
  assert.match(d.record.display_number, /^SYN-ESC-\d{6,}$/);
  assert.equal(d.record.finding_key, f.finding.id);
  assert.equal(d.record.state, "Diagnosing");
  assert.equal((await listCases(f.p)).items.length, 1);
  const before = await nativeLedger();
  assert.deepEqual(await createCase(f.p, f.command), {
    ...f.receipt,
    replayed: true,
  });
  assert.deepEqual(await nativeLedger(), before);
  for (const profile of ["observer", "other-workspace"]) {
    const p = await principal(profile);
    await assert.rejects(readCase(p, f.id), denied);
    await assert.rejects(
      createCase(p, { ...f.command, ...base(), id: randomUUID() }),
      denied,
    );
  }
  await assert.rejects(
    commandCase(f.p, f.id, {
      ...base(),
      action: "withdraw",
      expected_version: 999,
      outcome: "SYN withdrawn",
    }),
    rejected,
  );
  await assert.rejects(
    commandCase(f.p, f.id, {
      ...base(),
      action: "record_reply",
      expected_version: d.record.version,
      received_at: new Date().toISOString(),
      reply: "SYN reply",
      advice: "SYN verify",
      settings_change: false,
      attachments: [],
    }),
    rejected,
  );
  const source = await readFinding(f.p, f.finding.id),
    result = await act(f, "withdraw", {
      outcome: "SYN investigation withdrawn; source remains owned",
    });
  assert.equal((await readCase(f.p, f.id)).record.state, "Withdrawn");
  assert.deepEqual((await readFinding(f.p, f.finding.id)).item, source.item);
  assert.deepEqual(await commandCase(f.p, f.id, result.cmd), {
    ...result.receipt,
    replayed: true,
  });
  await assert.rejects(
    act(f, "diagnose", {
      attempted_at: new Date().toISOString(),
      diagnostic: "SYN attempt",
      result: "SYN unchanged",
      source_reference: "SYN observation",
    }),
    rejected,
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='service_escalation.record'",
    [f.p.actor_id],
  );
  await assert.rejects(readOperation(f.p, result.cmd.operation_id), denied);
  const grants = (
    await database().query("SELECT * FROM ppo.permission_grants ORDER BY id")
  ).rows;
  await migrate();
  await seed();
  await seed();
  assert.deepEqual(
    (await database().query("SELECT * FROM ppo.permission_grants ORDER BY id"))
      .rows,
    grants,
  );
});
test("SV08 retained HTML/PDF hashes, explicit exclusions and changed evidence invalidate review", async () => {
  const f = await preparedEscalation(),
    d = await readCase(f.p, f.id),
    pack = d.packs[0];
  for (const format of ["html", "pdf"]) {
    const file = await retainedFile(f.p, f.id, {
      kind: "pack",
      file_id: pack.id,
      format,
    });
    assert.equal(hashBytes(file.bytes), file.hash);
    if (format === "pdf")
      assert.equal(file.bytes.subarray(0, 5).toString(), "%PDF-");
    else {
      const html = file.bytes.toString();
      assert.ok(html.includes(f.command.fault));
      assert.ok(!html.includes("synthetic-support@example.invalid"));
      assert.ok(!html.includes("unit_price"));
      assert.ok(
        html.includes(`data:image/png;base64,${png().toString("base64")}`),
      );
    }
  }
  await assert.rejects(
    retainedFile(await principal("observer"), f.id, {
      kind: "pack",
      file_id: pack.id,
      format: "pdf",
    }),
    denied,
  );
  await act(f, "diagnose", {
    attempted_at: new Date().toISOString(),
    diagnostic: "SYN second observation",
    result: "No settings changed",
    source_reference: "SYN technical note",
  });
  assert.equal((await readCase(f.p, f.id)).record.reviewed_pack_id, null);
  await assert.rejects(
    act(f, "review_pack", {
      pack_id: pack.id,
      html_sha256: pack.html_sha256,
      pdf_sha256: pack.pdf_sha256,
      confirmed_exclusions: true,
    }),
    rejected,
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.service_escalation_packs SET html='changed' WHERE id=$1",
      [pack.id],
    ),
  );
});
test("SV08 sent fact creates one owned chase, reply retires it, and advice becomes native owned work without closing source", async () => {
  const f = await sentEscalation();
  const waiting = await readCase(f.p, f.id),
    reminder = await readActivity(f.p, waiting.record.chase_activity_id!);
  assert.equal(reminder.status, "Open");
  assert.equal(reminder.can_edit, false);
  assert.equal(reminder.escalation_source?.id, f.id);
  const upcoming = await listActivities(f.p, {
    owner_id: f.p.actor_id,
    status: "Active",
    due: "Upcoming",
    q: waiting.record.display_number,
  });
  assert.ok(upcoming.items.some((a) => a.id === reminder.id));
  await assert.rejects(
    activityCommand(
      f.p,
      reminder.id,
      {
        ...base(),
        expected_version: reminder.version,
        owner_id: f.p.actor_id,
        summary: "SYN changed",
        due_at: reminder.due_at,
        due_needed: false,
      },
      "update",
    ),
    rejected,
  );
  const photo = png();
  await act(f, "record_reply", {
    received_at: new Date().toISOString(),
    reply: "SYN manufacturer recommends checking the sensor input",
    advice: "Record a new reading",
    settings_change: true,
    attachments: [
      {
        media_type: "image/png",
        content_base64: photo.toString("base64"),
        sha256: hashBytes(photo),
      },
    ],
  });
  const d = await readCase(f.p, f.id);
  const attachment = d.files.find((file) => file.kind === "ReplyAttachment")!;
  assert.deepEqual(
    (
      await retainedFile(f.p, f.id, {
        kind: "attachment",
        file_id: attachment.id,
      })
    ).bytes,
    photo,
  );
  assert.equal(d.record.state, "ReplyToActOn");
  const chase = await readActivity(f.p, d.record.chase_activity_id!);
  assert.equal(chase.owner_id, f.p.actor_id);
  assert.equal(chase.status, "Cancelled");
  assert.equal(chase.can_edit, false);
  const sent = d.events.find((e) => e.kind === "Sent")!;
  assert.equal(
    chase.due_at,
    new Date(sent.details.reply_expected_at).toISOString(),
  );
  assert.equal((await listCases(f.p, { view: "reply" })).count, 1);
  await assert.rejects(act(f, "close", { outcome: "SYN premature" }), rejected);
  const next = {
    source_token: d.source_token,
    expected_finding_version: d.expected_finding_version,
    owner_id: f.p.actor_id,
    due_at: new Date(Date.now() + 172800000).toISOString(),
    instruction: "SYN capture another sensor reading",
    required_evidence: "SYN calibrated reading",
    grower_approval_required: false,
  };
  await assert.rejects(act(f, "next_action", next), rejected);
  const accepted = await act(f, "next_action", {
    ...next,
    grower_approval_required: true,
  });
  assert.equal(
    (await readOperation(f.p, accepted.cmd.operation_id)).record_id,
    f.id,
  );
  const current = await readCase(f.p, f.id),
    owned = await readActivity(f.p, current.record.next_action_id!);
  assert.match(owned.summary, /Obtain grower approval/);
  assert.equal(owned.owner_id, f.p.actor_id);
  const source = (await readFinding(f.p, f.finding.id)).item;
  await act(f, "close", {
    outcome: "SYN advice recorded as owned work; controller remains unchanged",
  });
  assert.equal((await readCase(f.p, f.id)).record.state, "Closed");
  assert.deepEqual((await readFinding(f.p, f.finding.id)).item, source);
  const ledger = await nativeLedger();
  await migrate();
  await seed();
  assert.deepEqual(await nativeLedger(), ledger);
});

// Retained synthetic bytes isolate command authority and timestamps from Chrome.
// The rendering/hashes integration tests above still exercise the real renderer.
async function reviewedCommandFixture() {
  const f = await escalationFixture();
  await act(f, "diagnose", {
    attempted_at: new Date().toISOString(),
    diagnostic: "SYN read status",
    result: "SYN unchanged",
    source_reference: "SYN observation",
  });
  await act(f, "capture_configuration");
  const packId = randomUUID(),
    html = "<p>SYN command fixture</p>",
    pdf = Buffer.from("%PDF-SYN command fixture; not rendered");
  await transaction(async (c) => {
    const ctx = await caseContext(c, f.p, f.id),
      evidence = await technicalEvidence(c, f.p, ctx);
    await c.query(
      `INSERT INTO ppo.service_escalation_packs
      (id,workspace_id,case_id,revision,content_version,evidence,evidence_sha256,html,html_sha256,pdf,pdf_sha256,renderer_version,created_by)
      VALUES($1,$2,$3,1,$4,$5,$6,$7,$8,$9,$10,'SYN command fixture; no renderer',$11)`,
      [
        packId,
        f.p.workspace_id,
        f.id,
        ctx.row.content_version,
        evidence,
        hashValue(evidence),
        html,
        hashBytes(html),
        pdf,
        hashBytes(pdf),
        f.p.actor_id,
      ],
    );
    await c.query(
      "UPDATE ppo.service_escalation_cases SET latest_pack_id=$2,version=version+1 WHERE id=$1",
      [f.id, packId],
    );
  });
  await act(f, "review_pack", {
    pack_id: packId,
    html_sha256: hashBytes(html),
    pdf_sha256: hashBytes(pdf),
    confirmed_exclusions: true,
  });
  const d = await readCase(f.p, f.id);
  await recordSupportRoute(f.p, f.asset.id, {
    ...base(),
    expected_version: d.equipment.version,
    method: "Email",
    recipient: "synthetic-support@example.invalid",
  });
  return f;
}
async function waitingCommandFixture() {
  const f = await reviewedCommandFixture(),
    d = await readCase(f.p, f.id);
  await act(f, "record_sent", {
    pack_id: d.record.reviewed_pack_id,
    sent_at: new Date().toISOString(),
    sent_by: f.p.actor_id,
    method: "Email",
    recipient: "synthetic-support@example.invalid",
    manufacturer_reference: "SYN regression",
    reply_expected_at: new Date(Date.now() + 86400000).toISOString(),
  });
  return f;
}
const replyFields = () => ({
  received_at: new Date().toISOString(),
  reply: "SYN reply",
  advice: "SYN inspect input",
  settings_change: false,
  attachments: [],
});

test("SV08 regression 1: case next action requires Findings edit duty, including replay", async () => {
  const f = await waitingCommandFixture();
  await act(f, "record_reply", replyFields());
  const d = await readCase(f.p, f.id),
    cmd = {
      ...base(),
      action: "next_action",
      expected_version: d.record.version,
      source_token: d.source_token,
      expected_finding_version: d.expected_finding_version,
      owner_id: f.p.actor_id,
      due_at: new Date(Date.now() + 86400000).toISOString(),
      instruction: "SYN check reading",
      required_evidence: "SYN reading",
      grower_approval_required: false,
    };
  const grants = (
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='service.work_order.edit' RETURNING *",
      [f.p.actor_id],
    )
  ).rows;
  const before = await nativeLedger();
  await assert.rejects(commandCase(f.p, f.id, cmd), denied);
  assert.deepEqual(await nativeLedger(), before);
  for (const g of grants)
    await database().query(
      "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_record(NULL::ppo.permission_grants,$1)",
      [JSON.stringify(g)],
    );
  await commandCase(f.p, f.id, cmd);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='service.work_order.edit'",
    [f.p.actor_id],
  );
  await assert.rejects(commandCase(f.p, f.id, cmd), denied);
});
for (const action of ["record_reply", "withdraw"] as const)
  test(`SV08 regression 2: coordinator can ${action} after owner loses access; unauthorised actor cannot`, async () => {
    const f = await waitingCommandFixture(),
      owner = f.p.actor_id,
      coordinator = await principal("observer");
    // This fictional second user receives the exact coordinator scopes, not a workspace bypass.
    await database().query(
      `INSERT INTO ppo.permission_grants(id,workspace_id,user_id,capability,scope_type,scope_id,company_id,site_id,valid_from,valid_to)
      SELECT gen_random_uuid(),workspace_id,$2,capability,scope_type,scope_id,company_id,site_id,valid_from,valid_to FROM ppo.permission_grants WHERE user_id=$1 ON CONFLICT DO NOTHING`,
      [owner, coordinator.actor_id],
    );
    const d = await readCase(coordinator, f.id),
      cmd = {
        ...base(),
        expected_version: d.record.version,
        action,
        ...(action === "withdraw"
          ? { outcome: "SYN coordinator withdraws retained case" }
          : replyFields()),
      };
    await database().query("UPDATE ppo.users SET active=false WHERE id=$1", [
      owner,
    ]);
    await assert.rejects(
      commandCase(await principal("site-observer"), f.id, cmd),
      denied,
    );
    const removed = (
      await database().query(
        "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='service.work_order.edit' RETURNING *",
        [coordinator.actor_id],
      )
    ).rows;
    await assert.rejects(commandCase(coordinator, f.id, cmd), denied);
    for (const g of removed)
      await database().query(
        "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_record(NULL::ppo.permission_grants,$1)",
        [JSON.stringify(g)],
      );
    await commandCase(coordinator, f.id, cmd);
    const after = await readCase(coordinator, f.id),
      chase = await readActivity(coordinator, after.record.chase_activity_id!);
    assert.equal(
      after.record.state,
      action === "withdraw" ? "Withdrawn" : "ReplyToActOn",
    );
    assert.equal(after.record.owner_id, owner);
    assert.equal(chase.owner_id, owner);
    assert.equal(chase.status, "Cancelled");
    const audit = (
      await database().query(
        "SELECT actor_id,details FROM ppo.audit_events WHERE object_id=$1 AND details->>'parent_operation_id'=$2",
        [chase.id, cmd.operation_id],
      )
    ).rows;
    assert.equal(audit.length, 1);
    assert.equal(audit[0].actor_id, coordinator.actor_id);
    assert.equal(audit[0].details.case_id, f.id);
  });
for (const kind of ["Relocate", "CorrectLocation"])
  test(`SV08 regression 3: ${kind} refuses a site move with open cases, then permits it after withdrawal`, async () => {
    const f = await escalationFixture(),
      preview = await previewEquipmentChange(f.p, f.asset.id),
      id = randomUUID();
    await proposeEquipmentChange(f.p, f.asset.id, {
      ...base(),
      id,
      expected_version: preview.impact.asset_version,
      kind,
      effective_at: "2026-10-01T00:00:00.000Z",
      source_reference: "SYN relocation",
      source_revision: "r01",
      basis_hash: preview.basis_hash,
      configuration: null,
      site_id: "70000000-0000-4000-8000-000000000002",
      consequences: "SYN reviewed equipment and site consequences",
    });
    const before = (
      await database().query(
        "SELECT site_id,version FROM ppo.assets WHERE id=$1",
        [f.asset.id],
      )
    ).rows;
    await assert.rejects(
      reviewEquipmentChange(f.p, id, {
        ...base(),
        expected_version: 1,
        decision: "Apply",
      }),
      (e: unknown) => (e as { code: string }).code === "OpenEscalationCases",
    );
    assert.deepEqual(
      (
        await database().query(
          "SELECT site_id,version FROM ppo.assets WHERE id=$1",
          [f.asset.id],
        )
      ).rows,
      before,
    );
    await act(f, "withdraw", {
      outcome: "SYN close escalation before relocation",
    });
    await reviewEquipmentChange(f.p, id, {
      ...base(),
      expected_version: 1,
      decision: "Apply",
    });
    assert.equal(
      (
        await database().query("SELECT site_id FROM ppo.assets WHERE id=$1", [
          f.asset.id,
        ])
      ).rows[0].site_id,
      "70000000-0000-4000-8000-000000000002",
    );
  });
test("SV08 regression 4: maintaining a support route requires Equipment edit duty", async () => {
  const f = await escalationFixture(),
    cmd = {
      ...base(),
      expected_version: f.asset.version,
      method: "Email",
      recipient: "synthetic-support@example.invalid",
    };
  const before = await nativeLedger();
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='shared.edit'",
    [f.p.actor_id],
  );
  await assert.rejects(recordSupportRoute(f.p, f.asset.id, cmd), denied);
  assert.deepEqual(await nativeLedger(), before);
  assert.equal(
    (
      await database().query("SELECT version FROM ppo.assets WHERE id=$1", [
        f.asset.id,
      ])
    ).rows[0].version,
    f.asset.version,
  );
  assert.equal(
    (
      await database().query(
        "SELECT * FROM ppo.equipment_support_routes WHERE asset_id=$1",
        [f.asset.id],
      )
    ).rowCount,
    0,
  );
});
test("SV08 regression 7: sending cannot predate its retained pack", async () => {
  const f = await reviewedCommandFixture(),
    d = await readCase(f.p, f.id),
    created = (
      await database().query(
        "SELECT created_at FROM ppo.service_escalation_cases WHERE id=$1",
        [f.id],
      )
    ).rows[0].created_at;
  const fields = {
    pack_id: d.record.reviewed_pack_id,
    sent_at: created.toISOString(),
    sent_by: f.p.actor_id,
    method: "Email",
    recipient: "synthetic-support@example.invalid",
    manufacturer_reference: "SYN time boundary",
    reply_expected_at: new Date(Date.now() + 86400000).toISOString(),
  };
  const before = await nativeLedger();
  await assert.rejects(act(f, "record_sent", fields), (e: unknown) =>
    (
      e as { field_errors: { field: string; message: string }[] }
    ).field_errors?.some(
      (f) =>
        f.field === "sent_at" &&
        /predate the reviewed evidence pack/.test(f.message),
    ),
  );
  assert.deepEqual(await nativeLedger(), before);
  await act(f, "record_sent", { ...fields, sent_at: new Date().toISOString() });
  assert.equal(
    (await readCase(f.p, f.id)).record.state,
    "WaitingOnManufacturer",
  );
});
test("SV08 regression 10: register index supports its workspace and chronological order without sorting", async () => {
  const f = await escalationFixture();
  await transaction(async (c) => {
    await c.query("SET LOCAL enable_seqscan=off");
    const plan = (
      await c.query(
        "EXPLAIN (FORMAT JSON) SELECT id FROM ppo.service_escalation_cases WHERE workspace_id=$1 ORDER BY updated_at DESC,id LIMIT 1001",
        [f.p.workspace_id],
      )
    ).rows[0]["QUERY PLAN"];
    const text = JSON.stringify(plan);
    assert.match(text, /service_escalations_register/);
    assert.doesNotMatch(text, /\"Node Type\":\"(?:Incremental )?Sort\"/);
  });
});
