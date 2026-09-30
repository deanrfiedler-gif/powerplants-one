import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { closeDatabase, database } from "../../src/platform/database";
import { setTimeout } from "node:timers/promises";
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
import { acknowledged, startInput, entry } from "../helpers/field";
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
    scheduling_policy_hash:
      "130d586ec49c5e23dffd49916148babc6ddf329a442e054ecc1c29f9089cca44",
    publication_head_version: 1,
    selected_policy: {
      id: "a0000000-0000-4000-8000-000000000001",
      version: 1,
      content_hash:
        "130d586ec49c5e23dffd49916148babc6ddf329a442e054ecc1c29f9089cca44",
    },
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
  for (const publicationFirst of [true, false])
    test(`C26 shared-lock ${action}: ${publicationFirst ? "publication" : "booking"} wins; Step 4 rechecks exact preparation and population`, async () => {
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
      const publish = () => publishSchedulingPolicy(f.publisher, f.publish);
      const results = publicationFirst
        ? await serialised(publish, other)
        : await serialised(other, publish, false, "appointment");
      const [published, changed] = publicationFirst
        ? results
        : [results[1], results[0]];
      assert.equal(
        published.status,
        publicationFirst ? "fulfilled" : "rejected",
      );
      if (!publicationFirst && published.status === "rejected")
        assert.equal(published.reason.code, "InvalidData");
      assert.equal(
        changed.status,
        !publicationFirst || action === "cancel" ? "fulfilled" : "rejected",
      );
      if (
        publicationFirst &&
        action !== "cancel" &&
        changed.status === "rejected"
      )
        assert.equal(changed.reason.code, "VersionConflict");
      assert.equal(
        (
          await rows(
            "SELECT scheduling_policy_id FROM ppo.appointments WHERE id=$1",
            [a.id],
          )
        )[0].scheduling_policy_id,
        publicationFirst && action === "confirm" ? null : id("a0"),
      );
      // The next review enumerates actual changed state, never the former candidate list.
      if (publicationFirst)
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
  const offlineStart = operation(technician, job, "Start", {
    ...cmd,
    ...base(),
  });
  // Restricted recovery accepts factual originals, never an authority intent.
  // Its unresolved causal start stays local; publication must preserve these bytes.
  const offline = operation(
    technician,
    job,
    "Capture",
    {
      ...entry({ ...job, attendance: { id: randomUUID() } }),
      attendance_id: { operation_id: offlineStart.operation_id },
    },
    [offlineStart.operation_id],
  );
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
  const f = await reviewed(240);
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

test("C26 grant expiry during complete source visibility prevents original receipt disclosure", async () => {
  const f = await reviewed();
  await publishSchedulingPolicy(f.publisher, f.publish);
  const gate = await database().connect();
  let replay:
    | Promise<
        PromiseSettledResult<
          Awaited<ReturnType<typeof publishSchedulingPolicy>>
        >
      >
    | undefined;
  try {
    await gate.query("BEGIN");
    await gate.query("LOCK TABLE ppo.work_orders IN ACCESS EXCLUSIVE MODE");
    const pid = (await gate.query("SELECT pg_backend_pid() pid")).rows[0].pid;
    const expires = (
      await rows(
        "UPDATE ppo.permission_grants SET valid_to=clock_timestamp()+interval '5 seconds' WHERE user_id=$1 AND capability='schedule.policy.publish' RETURNING valid_to",
        [f.publisher.actor_id],
      )
    )[0].valid_to as Date;
    replay = Promise.allSettled([
      publishSchedulingPolicy(f.publisher, f.publish),
    ]).then(([value]) => value);
    const deadline = Date.now() + 8000;
    let observed = false;
    while (Date.now() < deadline) {
      const waiting = await rows(
        "SELECT query FROM pg_stat_activity WHERE datname=current_database() AND $1=ANY(pg_blocking_pids(pid))",
        [pid],
      );
      if (waiting.some((x) => /FROM ppo.work_orders w/.test(x.query))) {
        observed = true;
        break;
      }
      await setTimeout(15);
    }
    assert(
      observed,
      "Original reached complete-source visibility while holding the shared graph lock",
    );
    await setTimeout(Math.max(0, expires.getTime() - Date.now() + 25));
    await gate.query("COMMIT");
    const result = await replay;
    assert.equal(
      result.status,
      "rejected",
      "Expired publisher must not receive the accepted original",
    );
    if (result.status === "rejected")
      assert.equal(result.reason.code, "PolicyAuthorityRequired");
    assert.equal(
      (
        await rows(
          "SELECT count(*)::int n FROM ppo.scheduling_policy_publications",
        )
      )[0].n,
      1,
    );
  } finally {
    await gate.query("ROLLBACK");
    await replay;
    gate.release();
  }
});
