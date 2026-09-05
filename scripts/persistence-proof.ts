import { base, entry, materialPayload, startInput, photo, draft } from "../tests/helpers/field";
import { readFieldJob } from "../src/field/reads";
import { startAttendance } from "../src/field/start";
import { captureEntry } from "../src/field/entries";
import { saveCompletionDraft } from "../src/field/completion";
import { attachmentBytes } from "../src/field/attachments";
import { digest } from "../src/documents/store";
import { issued } from "../tests/helpers/packs";
import { readBundle } from "../src/documents/worker";
import { acknowledgePack, readPack } from "../src/documents/packs";
import { writeFile, readFile } from "node:fs/promises";
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
    const p06 = await issued();
    const doc = p06.pack.issues[0];
    await writeFile(
      "/tmp/ppo-p06-restart.json",
      JSON.stringify({
        pack_id: p06.pack.id,
        issue_id: doc.id,
        manifest: doc.manifest,
        queued_receipt: p06.receipt.receipt,
        operation_id: p06.cmd.operation_id,
      }),
    );
    const tech=(await createSession("assigned-technician")).principal;
    for(const profile of ["assigned-technician","second-technician"]){
      const actor=(await createSession(profile)).principal;
      const recipient=p06.pack.readiness.recipients.find((r:{user_id:string})=>r.user_id===actor.actor_id)!;
      await acknowledgePack(actor,doc.id,{...base(),assignment_id:recipient.assignment_id,assignment_version:recipient.assignment_version,presented_hash:doc.output_hash,captured_at:new Date().toISOString()});
    }
    let job=(await readFieldJob(tech,p06.pack.appointment_id)).items[0];
    const start=startInput(job),receipt=await startAttendance(tech,job.id,start);
    job=(await readFieldJob(tech,job.id)).items[0];
    const original=entry(job,"Material",materialPayload());
    await captureEntry(tech,original);
    const successor={...original,...base(),id:randomUUID(),expected_version:1,payload:{...materialPayload(),quantity:"1"},reason:"SYN corrected actual quantity before database restart"};
    await captureEntry(tech,successor,original.id);
    const image=await photo(job,tech);
    await captureEntry(tech,entry(job,"Photo",{attachment_id:image.id,caption:"SYN persisted original inspection fixture"}));
    job=(await readFieldJob(tech,job.id)).items[0];
    const completion=draft(job);await saveCompletionDraft(tech,job.id,completion);
    await writeFile("/tmp/ppo-p07-restart.json",JSON.stringify({appointment_id:job.id,authority_hash:job.attendance.authority_hash,original_entry_id:original.id,corrected_entry_id:successor.id,attachment_id:image.id,photo_hash:digest(image.bytes),draft_id:completion.id,operation_id:start.operation_id,receipt:receipt.receipt}));
  } else {
    const proof=JSON.parse(await readFile("/tmp/ppo-p07-restart.json","utf8")),tech=(await createSession("assigned-technician")).principal;
    const job=(await readFieldJob(tech,proof.appointment_id)).items[0];
    assert.equal(job.attendance.authority_hash,proof.authority_hash);assert.equal(job.status,"InProgress");
    assert.equal(job.draft.id,proof.draft_id);
    assert.equal(job.entries.find(e=>e.id===proof.original_entry_id)?.payload.quantity,"2");
    assert.equal(job.entries.find(e=>e.id===proof.corrected_entry_id)?.supersedes_entry_id,proof.original_entry_id);
    assert.equal(digest((await attachmentBytes(tech,proof.attachment_id)).bytes),proof.photo_hash);
    assert.deepEqual(await readOperation(tech,proof.operation_id),proof.receipt);
    console.log("P07 PostgreSQL process restart: exact start authority, original/corrected capture lineage, durable verified PNG, completion draft, owned follow-up and original receipt verified");
    const saved = JSON.parse(
      await readFile("/tmp/ppo-p06-restart.json", "utf8"),
    );
    const p06 = (await readPack(p, saved.pack_id)).items[0];
    assert.equal(p06.current_issue_id, saved.issue_id);
    assert.deepEqual(p06.issues[0].manifest, saved.manifest);
    assert.ok((await readBundle(p, saved.manifest)).pdf.length > 1000);
    assert.deepEqual(
      await readOperation(p, saved.operation_id),
      saved.queued_receipt,
    );
    assert.equal(p06.readiness.recipients.length, 2);
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
