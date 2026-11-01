import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset, migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  createCase,
  commandCase,
} from "../../src/service/escalations/commands";
import {
  readCase,
  listCases,
  retainedFile,
} from "../../src/service/escalations/reads";
import { readFinding } from "../../src/service/findings/reads";
import { hashBytes } from "../../src/service/escalations/model";
import { readActivity } from "../../src/activities/activities";
import { readOperation } from "../../src/shared/receipts";
import {
  escalationFixture,
  preparedEscalation,
  repliedEscalation,
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
  const f = await repliedEscalation(),
    d = await readCase(f.p, f.id);
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
