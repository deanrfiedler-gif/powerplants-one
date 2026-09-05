import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createWorkOrder, readWorkOrder } from "../src/service/work-orders";
import { createSession } from "../src/platform/identity";
import { readTicket, saveDraft } from "../src/service/tickets";
import { createActivity, readActivity } from "../src/activities/activities";
import { createOrganisation } from "../src/shared/commands";
import { readShared } from "../src/shared/reads";
import { readOperation } from "../src/shared/receipts";
import { confirmAppointment, readAppointment } from "../src/scheduling/planner";
import { SCHEDULING_POLICY_ID } from "../src/scheduling/validation";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw new Error("Persistence proof requires ppo_synthetic_test.");
try {
  const p = (await createSession("coordinator")).principal,
    id = "40000000-0000-4000-8000-000000000001",
    current = await readTicket(p, id);
  if (process.argv[2] === "write") {
    await saveDraft(p, id, {
      operation_id: randomUUID(),
      schema_version: 1,
      expected_version: current.version,
      summary: "SYN database restart sentinel",
      reason: "P01 PostgreSQL process restart proof",
    });
    await createOrganisation(p, {
      operation_id: "95000000-0000-4000-8000-000000000001",
      schema_version: 1,
      id: "95000000-0000-4000-8000-000000000002",
      company_id: "20000000-0000-4000-8000-000000000001",
      display_name: "SYN shared restart sentinel",
      relationship_status: "Prospect",
      owner_id: p.actor_id,
      reason: "P02 PostgreSQL restart proof",
    });
    await createActivity(p, {
      operation_id: "96000000-0000-4000-8000-000000000001",
      schema_version: 1,
      id: "96000000-0000-4000-8000-000000000002",
      company_id: "20000000-0000-4000-8000-000000000001",
      site_id: "70000000-0000-4000-8000-000000000001",
      kind: "TechnicalFollowUp",
      owner_id: p.actor_id,
      summary: "SYN P03 restart-owned follow-up",
      due_at: null,
      due_needed: true,
      access_class: "RestrictedService",
      links: [
        {
          object_type: "Site",
          object_id: "70000000-0000-4000-8000-000000000001",
        },
      ],
      reason: "P03 PostgreSQL restart proof",
    });
    await createWorkOrder(p, {
      operation_id: "99000000-0000-4000-8000-000000000001",
      schema_version: 1,
      id: "99000000-0000-4000-8000-000000000002",
      company_id: "20000000-0000-4000-8000-000000000001",
      site_id: "70000000-0000-4000-8000-000000000001",
      customer_id: "50000000-0000-4000-8000-000000000001",
      service_owner_id: p.actor_id,
      tickets: [
        {
          ticket_id: "40000000-0000-4000-8000-000000000020",
          issue_disposition: "SYN restart work-order link",
        },
      ],
      reason: "P04 PostgreSQL restart proof",
    });
    const a = (await readAppointment(p, "a8000000-0000-4000-8000-000000000008"))
      .items[0];
    await confirmAppointment(p, a.id, {
      operation_id: "b3000000-0000-4000-8000-000000000001",
      schema_version: 1,
      reason: "SYN P05 PostgreSQL process restart proof",
      expected_version: a.version,
      expected_work_order_version: a.work_order_version,
      expected_assignment_version: a.assignment_version,
      scope_revision_id: a.scope_revision_id,
      scope_version: a.scope_version,
      policy_version_id: a.policy_version_id,
      scheduling_policy_id: SCHEDULING_POLICY_ID,
      scheduling_policy_version: 1,
      crew: [
        {
          resource_id: "a4000000-0000-4000-8000-000000000005",
          resource_version: 1,
          calendar_version: 1,
          crew_role: "Lead",
          travel_before_minutes: 0,
          travel_after_minutes: 0,
          travel_reason:
            "SYN explicit zero buffer for same-site restart sentinel",
        },
      ],
    });
  } else {
    const a = (await readAppointment(p, "a8000000-0000-4000-8000-000000000008"))
      .items[0];
    assert.equal(a.status, "Confirmed");
    assert.equal(a.assignments.filter((x) => x.active).length, 1);
    assert.equal(a.dispatch_hold, true);
    const booking = (
      await database().query(
        "SELECT a.booking_hash=encode(sha256(convert_to(a.booking_snapshot::text,'UTF8')),'hex') AS exact, (SELECT count(*)::int FROM ppo.resource_reservations r JOIN ppo.assignments x ON x.id=r.assignment_id WHERE x.appointment_id=a.id AND r.active) AS reservations FROM ppo.appointments a WHERE a.id=$1",
        [a.id],
      )
    ).rows[0];
    assert.equal(booking.exact, true);
    assert.equal(booking.reservations, 1);
    assert.equal(
      (await readOperation(p, "b3000000-0000-4000-8000-000000000001")).state,
      "Confirmed",
    );
    assert.equal(current.summary, "SYN database restart sentinel");
    assert.ok(current.version > 1);
    assert.equal(
      (
        await readShared(
          p,
          "Organisation",
          "95000000-0000-4000-8000-000000000002",
        )
      ).id,
      "95000000-0000-4000-8000-000000000002",
    );
    assert.equal(
      (await readOperation(p, "95000000-0000-4000-8000-000000000001"))
        .record_version,
      1,
    );
    assert.equal(
      (await readActivity(p, "96000000-0000-4000-8000-000000000002")).summary,
      "SYN P03 restart-owned follow-up",
    );
    assert.equal(
      (await readOperation(p, "96000000-0000-4000-8000-000000000001"))
        .record_version,
      1,
    );
    assert.equal(
      (await readWorkOrder(p, "99000000-0000-4000-8000-000000000002")).items[0]
        .tickets.length,
      1,
    );
    assert.equal(
      (await readOperation(p, "99000000-0000-4000-8000-000000000001")).state,
      "Draft",
    );
    console.log(
      "PostgreSQL restart: P01 ticket, P02 organisation, P03 activity/link, P04 work order/ticket link, P05 confirmed assignment/reservation/exact evidence and original operation receipts verified",
    );
  }
} finally {
  await closeDatabase();
}
