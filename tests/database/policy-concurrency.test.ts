import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { closeDatabase } from "../../src/platform/database";
import {
  publishSchedulingPolicy,
  reviewSchedulingPolicy,
} from "../../src/scheduling/policy-commands";
import {
  readAppointment,
  confirmAppointment,
  moveAppointment,
  cancelAppointment,
  createChangeRequest,
  decideChangeRequest,
} from "../../src/scheduling/planner";
import { readFieldJob } from "../../src/field/reads";
import { startAttendance } from "../../src/field/start";
import { readBundle } from "../../src/documents/worker";
import { downloadContext, preserveRecovery } from "../../src/offline/recovery";
import { operation } from "../helpers/offline";
import { confirmed, id } from "../helpers/packs";
import { acknowledged, startInput } from "../helpers/field";
import {
  base,
  principal,
  reviewed,
  rows,
  setupPolicy,
  snapshot,
} from "../helpers/policy-commands";
import { serialised } from "../helpers/policy-concurrency";

beforeEach(setupPolicy);
after(closeDatabase);
const crew = (ids = [id("a4", 9), id("a4", 2)]) =>
  ids.map((resource_id, index) => ({
    resource_id,
    resource_version: 1,
    calendar_version: 1,
    crew_role: index ? "Technician" : "Lead",
    travel_before_minutes: 0,
    travel_after_minutes: 0,
    travel_reason: "SYN explicit zero local travel",
  }));
function booking(
  a: Awaited<ReturnType<typeof readAppointment>>["items"][number],
) {
  return {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
    scope_revision_id: a.scope_revision_id,
    scope_version: a.scope_version,
    policy_version_id: a.policy_version_id,
    scheduling_policy_id: id("a0"),
    scheduling_policy_version: 1,
    crew: crew(),
  };
}
test("C26 two-connection competing publications serialise on the shared graph; one head, receipt and consequence set", async () => {
  const f = await reviewed();
  const results = await serialised(
    () => publishSchedulingPolicy(f.publisher, f.publish),
    () =>
      publishSchedulingPolicy(f.publisher, {
        ...f.publish,
        operation_id: randomUUID(),
      }),
  );
  assert.equal(results[0].status, "fulfilled");
  assert.equal(results[1].status, "rejected");
  if (results[1].status === "rejected")
    assert.equal(results[1].reason.code, "InvalidData");
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.scheduling_policy_publications",
      )
    )[0].n,
    1,
  );
  assert.equal(
    (await rows("SELECT version FROM ppo.scheduling_policy_heads"))[0].version,
    2,
  );
});
test("C26 identical concurrent original waits on original-operation lock then recovers one exact receipt", async () => {
  const f = await reviewed();
  const [a, b] = await serialised(
    () => publishSchedulingPolicy(f.publisher, f.publish),
    () => publishSchedulingPolicy(f.publisher, f.publish),
    true,
  );
  assert.equal(a.status, "fulfilled");
  assert.equal(b.status, "fulfilled");
  if (a.status === "fulfilled" && b.status === "fulfilled") {
    assert.equal(a.value.replayed, false);
    assert.equal(b.value.replayed, true);
    assert.deepEqual(a.value.receipt, b.value.receipt);
  }
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.scheduling_policy_publications",
      )
    )[0].n,
    1,
  );
});
for (const action of [
  "confirm",
  "move",
  "cancel",
  "change-acceptance",
] as const) {
  test(`C26 shared-lock serialization with existing ${action}; this is NOT Step 4 impact-hold enforcement`, async () => {
    const actor = await principal();
    if (action !== "confirm") await confirmed();
    const a = (
      await readAppointment(actor, id("a8", action === "confirm" ? 2 : 9))
    ).items[0];
    const cmd = {
      ...booking(a),
      crew: action === "confirm" ? crew([id("a4", 5)]) : crew(),
    };
    let requestId: string | undefined;
    if (action === "change-acceptance") {
      requestId = randomUUID();
      await createChangeRequest(actor, a.id, {
        ...base(),
        id: requestId,
        expected_version: a.version,
        source_type: "Manual",
        source_reference: "SYN C26 competing change",
        source_version: "1",
        start_at: new Date(a.start_at).toISOString(),
        end_at: new Date(a.end_at).toISOString(),
        crew: cmd.crew,
      });
    }
    const f = await reviewed();
    const other = () =>
      action === "confirm"
        ? confirmAppointment(actor, a.id, cmd)
        : action === "move"
          ? moveAppointment(actor, a.id, {
              ...cmd,
              start_at: new Date(a.start_at).toISOString(),
              end_at: new Date(a.end_at).toISOString(),
            })
          : action === "cancel"
            ? cancelAppointment(actor, a.id, {
                ...base(),
                expected_version: a.version,
                expected_work_order_version: a.work_order_version,
                expected_assignment_version: a.assignment_version,
              })
            : decideChangeRequest(
                actor,
                requestId!,
                (() => {
                  const { crew: _crew, ...v } = cmd;
                  void _crew;
                  return { ...v, expected_request_version: 1 };
                })(),
                "accept",
              );
    const [published, changed] = await serialised(
      () => publishSchedulingPolicy(f.publisher, f.publish),
      other,
    );
    assert.equal(published.status, "fulfilled");
    assert.equal(
      changed.status,
      "fulfilled",
      changed.status === "rejected" ? String(changed.reason) : undefined,
    );
    assert.equal(
      (
        await rows(
          "SELECT scheduling_policy_id FROM ppo.appointments WHERE id=$1",
          [a.id],
        )
      )[0].scheduling_policy_id,
      id("a0"),
    );
    // The next review enumerates actual changed state, never the former candidate list.
    await assert.rejects(
      reviewSchedulingPolicy(f.reviewer, {
        ...f.reviewCommand,
        ...base(),
        id: randomUUID(),
      }),
    );
  });
}
test("C26 actual start shares the graph lock; issued files/pins survive and actual attendance becomes an explicit exclusion", async () => {
  const issued = await acknowledged(),
    technician = await principal("assigned-technician");
  const job = (await readFieldJob(technician, issued.pack.appointment_id))
      .items[0],
    cmd = startInput(job);
  const manifest = (
    await rows("SELECT manifest FROM ppo.pack_issues WHERE id=$1", [
      issued.issue_id,
    ])
  )[0].manifest;
  const bytes = await readBundle(issued.p, manifest),
    originals = await snapshot([
      "pack_revisions",
      "pack_issues",
      "scheduling_policies",
    ]);
  const context = await downloadContext(technician, job.id, {});
  const offline = operation(technician, job, "Start", { ...cmd, ...base() });
  await preserveRecovery(technician, {
    grant_id: context.recovery.id,
    token: context.recovery.token,
    operation: offline,
  });
  const offlineBefore = await snapshot([
    "offline_recovery_cases",
    "offline_recovery_dispositions",
    "offline_recovery_grants",
  ]);
  assert.equal(offlineBefore.offline_recovery_cases.length, 1);
  const earlierReceipts = await rows(
    "SELECT * FROM ppo.operation_receipts ORDER BY id",
  );
  const f = await reviewed();
  const [published, started] = await serialised(
    () => publishSchedulingPolicy(f.publisher, f.publish),
    () => startAttendance(technician, job.id, cmd),
  );
  assert.equal(published.status, "fulfilled");
  assert.equal(
    started.status,
    "fulfilled",
    started.status === "rejected" ? String(started.reason) : undefined,
  );
  assert.deepEqual(await snapshot(Object.keys(offlineBefore)), offlineBefore);
  assert.deepEqual(
    await rows(
      "SELECT * FROM ppo.operation_receipts WHERE id=ANY($1::uuid[]) ORDER BY id",
      [earlierReceipts.map((x) => x.id)],
    ),
    earlierReceipts,
  );
  assert.deepEqual(await readBundle(issued.p, manifest), bytes);
  const retained = await snapshot([
    "pack_revisions",
    "pack_issues",
    "scheduling_policies",
  ]);
  assert.deepEqual(retained.pack_revisions, originals.pack_revisions);
  assert.deepEqual(retained.pack_issues, originals.pack_issues);
  assert.deepEqual(
    retained.scheduling_policies.filter(
      (r: { id: string }) => r.id === id("a0"),
    ),
    originals.scheduling_policies,
  );
  const next = await reviewed(90, "2031-09-22T00:30:00.000Z");
  assert(
    !next.review.candidates.some(
      (x) => x.dependencies.booking.appointment.id === job.id,
    ),
  );
  const excluded = next.context.exclusions.find(
    (x: { appointment: { id: string } }) => x.appointment.id === job.id,
  );
  assert.equal(excluded.reason, "Started");
  assert.equal(excluded.attendance.length, 1);
});

test("C26 confirmation winning the graph lock invalidates the full reviewed population; no phantom booking is missed", async () => {
  const owner = await principal(),
    a = (await readAppointment(owner, id("a8", 2))).items[0],
    f = await reviewed();
  const [confirmed, published] = await serialised(
    () =>
      confirmAppointment(owner, a.id, {
        ...booking(a),
        crew: crew([id("a4", 5)]),
      }),
    () => publishSchedulingPolicy(f.publisher, f.publish),
    false,
    "appointment",
  );
  assert.equal(confirmed.status, "fulfilled");
  assert.equal(published.status, "rejected");
  if (published.status === "rejected")
    assert.equal(published.reason.code, "InvalidData");
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.scheduling_policy_publications",
      )
    )[0].n,
    0,
  );
  assert.equal(
    (await rows("SELECT version FROM ppo.scheduling_policy_heads"))[0].version,
    1,
  );
});
