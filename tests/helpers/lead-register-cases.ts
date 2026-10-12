import assert from "node:assert/strict";
import { test } from "node:test";
import { database } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { withWorkingCompany } from "../../src/platform/working-company";
import {
  activityCommand,
  createActivity,
  readActivity,
} from "../../src/activities/activities";
import { createProject } from "../../src/projects/service";
import {
  createLead,
  changeLead,
  planLeadAction,
  convertLead,
} from "../../src/crm/leads/service";
import { listLeads, readLead } from "../../src/crm/leads/reads";
import { countLeads } from "../../src/crm/leads/register";
import { CRM, crmAction, crmBase } from "./crm";
import { leadCreate, leadConvert } from "./leads";
import { projectInput } from "./projects";

const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
type Principal = Awaited<ReturnType<typeof principal>>;
const code = (value: string) => (e: unknown) =>
  (e as { code: string }).code === value;
async function capture(
  p: Principal,
  overrides: Partial<ReturnType<typeof leadCreate>> = {},
) {
  const input = { ...leadCreate(), ...overrides };
  await createLead(p, input);
  return input;
}
async function plan(p: Principal, id: string, due: string | null = null) {
  const action = { ...crmAction(), due_at: due, due_needed: due === null };
  await planLeadAction(p, id, {
    ...crmBase(),
    expected_version: 1,
    activity_id: null,
    new_action: action,
  });
  return action;
}
async function all(p: Principal, filters: Record<string, string> = {}) {
  const ids: string[] = [];
  let cursor: string | null = null;
  do {
    const result = await listLeads(p, {
      ...filters,
      limit: "1",
      ...(cursor ? { cursor } : {}),
    });
    ids.push(...result.items.map((l) => l.id));
    cursor = result.next_cursor;
    assert(ids.length < 50, "pagination must terminate");
  } while (cursor);
  assert.equal(ids.length, new Set(ids).size);
  return ids;
}
async function ledger() {
  return (
    await database().query(`SELECT
    (SELECT count(*) FROM ppo.lead_events)::int AS leads,
    (SELECT count(*) FROM ppo.audit_events)::int AS audit,
    (SELECT count(*) FROM ppo.operation_receipts)::int AS receipts,
    (SELECT count(*) FROM ppo.outbox_jobs)::int AS jobs`)
  ).rows[0];
}

export function registerLeadRegisterTests() {
  test("LR-01 counts match every lifecycle/status view across pages and reads create no history", async () => {
    const p = await principal();
    const fresh = await capture(p);
    const contacting = await capture(p, { title: "SYN Contacting enquiry" });
    const nurturing = await capture(p, { title: "SYN Nurturing enquiry" });
    for (const [input, status] of [
      [contacting, "Contacting"],
      [nurturing, "Nurturing"],
    ] as const) {
      const {
        title,
        need_summary,
        organisation_text,
        contact_text,
        source_channel,
        source_basis,
      } = input;
      await changeLead(p, input.id, {
        ...crmBase(),
        expected_version: 1,
        action: "update",
        status,
        title,
        need_summary,
        organisation_text,
        contact_text,
        source_channel,
        source_basis,
      });
    }
    const archived = await capture(p),
      disqualified = await capture(p),
      converted = await capture(p);
    await changeLead(p, archived.id, {
      ...crmBase(),
      expected_version: 1,
      action: "archive",
    });
    await changeLead(p, disqualified.id, {
      ...crmBase(),
      expected_version: 1,
      action: "disqualify",
    });
    await convertLead(p, converted.id, leadConvert(1));
    const before = await ledger(),
      counts = await countLeads(p);
    assert.deepEqual(counts.counts, {
      Active: 3,
      MyLeads: 3,
      New: 1,
      Contacting: 1,
      Nurturing: 1,
      Overdue: 0,
      NextActionNeeded: 3,
      Archived: 1,
      Disqualified: 1,
      Converted: 1,
      FollowUpUnavailable: 0,
    });
    assert.equal(counts.count_scope, "AllAuthorisedMatches");
    assert.equal(counts.completeness, "Complete");
    for (const view of [
      "Active",
      "MyLeads",
      "Archived",
      "Disqualified",
      "Converted",
    ] as const)
      assert.equal((await all(p, { view })).length, counts.counts[view]);
    for (const status of ["New", "Contacting", "Nurturing"] as const)
      assert.equal((await all(p, { status })).length, counts.counts[status]);
    assert.deepEqual(await all(p, { status: "New" }), [fresh.id]);
    for (const l of (await listLeads(p)).items) {
      const detail = await readLead(p, l.id);
      assert.deepEqual(l.next_activity, detail.next_activity);
    }
    assert.deepEqual(await ledger(), before);
  });

  test("LR-02 follow-up uses active next activity, includes missing due dates and reacts to native completion/rescheduling", async () => {
    const p = await principal();
    const missing = await capture(p),
      undated = await capture(p),
      overdue = await capture(p),
      upcoming = await capture(p),
      cancelled = await capture(p);
    await plan(p, undated.id);
    const old = await plan(p, overdue.id, "2000-01-01T00:00:00.000Z");
    await plan(p, upcoming.id, "2090-01-01T00:00:00.000Z");
    const cancel = await plan(p, cancelled.id);
    await activityCommand(
      p,
      cancel.id,
      {
        ...crmBase(),
        expected_version: 1,
        cancellation_reason: "SYN Cancelled follow-up",
      },
      "cancel",
    );
    assert.deepEqual(
      new Set(await all(p, { follow_up: "NextActionNeeded" })),
      new Set([missing.id, undated.id, cancelled.id]),
    );
    assert.deepEqual(await all(p, { follow_up: "Overdue" }), [overdue.id]);
    assert.equal((await countLeads(p)).counts.NextActionNeeded, 3);
    await activityCommand(
      p,
      old.id,
      { ...crmBase(), expected_version: 1 },
      "start",
    );
    assert.equal((await countLeads(p)).counts.Overdue, 1);
    await activityCommand(
      p,
      old.id,
      {
        ...crmBase(),
        expected_version: 2,
        owner_id: p.actor_id,
        summary: old.summary,
        due_at: "2090-01-01T00:00:00.000Z",
        due_needed: false,
      },
      "update",
    );
    assert.equal((await countLeads(p)).counts.Overdue, 0);
    await activityCommand(
      p,
      old.id,
      { ...crmBase(), expected_version: 3, outcome: "SYN Follow-up done" },
      "complete",
    );
    assert.equal((await countLeads(p)).counts.NextActionNeeded, 4);
    assert.equal(
      (await listLeads(p, { follow_up: "Overdue" })).items.length,
      0,
    );
    assert.equal(
      (await listLeads(p, { follow_up: "NextActionNeeded" })).items.length,
      4,
    );
  });

  test("LR-03 source/search/owner intersection and signed follow-up cursors retain stable tied ordering", async () => {
    const p = await principal(),
      other = await principal("observer");
    await database().query(
      `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
      SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to FROM ppo.permission_grants
      WHERE user_id=$2 AND capability IN ('crm.lead.read','crm.lead.edit','activity.read','shared.read','shared.internal.read') ON CONFLICT DO NOTHING`,
      [other.actor_id, p.actor_id],
    );
    const own = await capture(p, {
      title: "SYN Needles",
      source_channel: "Email",
    });
    const second = await capture(p, {
      title: "SYN Needles",
      source_channel: "Email",
    });
    await capture(p, {
      title: "SYN Needles",
      owner_id: other.actor_id,
      source_channel: "Phone",
    });
    await capture(p, { title: "SYN Other enquiry" });
    const filters = { q: "needles", source: "Email", owner_id: p.actor_id };
    const counts = await countLeads(p, filters);
    assert.equal(counts.counts.Active, 2);
    assert.deepEqual(counts.filters, { ...filters, status: null });
    for (const sort of ["Newest", "Oldest", "Name"])
      assert.deepEqual(
        new Set(
          await all(p, { ...filters, sort, follow_up: "NextActionNeeded" }),
        ),
        new Set([own.id, second.id]),
      );
    const first = await listLeads(p, {
      ...filters,
      follow_up: "NextActionNeeded",
      limit: "1",
    });
    assert(first.next_cursor);
    for (const changed of [
      { follow_up: "Overdue" },
      { view: "MyLeads" },
      { source: "Phone" },
      { owner_id: other.actor_id },
      { status: "Contacting" },
      { q: "other" },
      { sort: "Oldest" },
    ])
      await assert.rejects(
        listLeads(p, {
          ...filters,
          follow_up: "NextActionNeeded",
          limit: "1",
          cursor: first.next_cursor,
          ...changed,
        }),
      );
    assert.equal(
      (await countLeads(p, { owner_id: other.actor_id })).counts.MyLeads,
      0,
    );
    assert.equal(
      (await listLeads(p, { view: "MyLeads", owner_id: other.actor_id })).items
        .length,
      0,
    );
    assert.equal(
      (await countLeads(p, { q: "no such enquiry" })).counts.Active,
      0,
    );
    for (const bad of [
      { follow_up: "Upcoming" },
      { follow_up: "Overdue", view: "Archived" },
      { follow_up: "NextActionNeeded", view: "Converted" },
    ])
      await assert.rejects(listLeads(p, bad));
    for (const bad of [
      { limit: "1" },
      { view: "Active" },
      { follow_up: "Overdue" },
      { q: "x".repeat(201) },
      { owner_id: "bad" },
    ])
      await assert.rejects(countLeads(p, bad));
  });

  test("LR-04 linked-source and activity denial cannot become missing or overdue; company/workspace and revocation remain scoped", async () => {
    const p = await principal(),
      lead = await capture(p),
      project = projectInput(),
      action = crmAction();
    await createProject(p, project);
    await createActivity(p, {
      ...crmBase(),
      ...action,
      company_id: CRM.company,
      site_id: CRM.site,
      due_at: "2000-01-01T00:00:00.000Z",
      due_needed: false,
      access_class: "Internal",
      links: [
        { object_type: "Lead", object_id: lead.id },
        { object_type: "Project", object_id: project.id },
      ],
    });
    await planLeadAction(p, lead.id, {
      ...crmBase(),
      expected_version: 1,
      activity_id: action.id,
      new_action: null,
    });
    assert.equal((await countLeads(p)).counts.Overdue, 1);
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='project.read'",
      [p.actor_id],
    );
    const hidden = await countLeads(p);
    assert.equal(hidden.counts.Active, 1);
    assert.equal(hidden.counts.FollowUpUnavailable, 1);
    assert.equal(hidden.counts.Overdue, 0);
    assert.equal(hidden.counts.NextActionNeeded, 0);
    assert.equal(hidden.follow_up_completeness, "Partial");
    const list = await listLeads(p);
    assert.equal(list.items[0].next_action_state, "Unavailable");
    assert.equal(list.items[0].next_activity, null);
    for (const follow_up of ["Overdue", "NextActionNeeded"])
      assert.equal((await listLeads(p, { follow_up })).items.length, 0);
    const foreign = await principal("other-workspace");
    await assert.rejects(countLeads(foreign), code("Forbidden"));
    // Give the foreign-workspace fixture its own Lead read capability. It must
    // still see none of this workspace's rows or activity-derived counts.
    await database().query(
      `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
      SELECT workspace_id,user_id,company_id,'crm.lead.read',scope_type,scope_id,site_id,valid_from,valid_to FROM ppo.permission_grants
      WHERE user_id=$1 AND capability='shared.read' ON CONFLICT DO NOTHING`,
      [foreign.actor_id],
    );
    for (const profile of ["second-company", "other-workspace"]) {
      const outsider = await principal(profile);
      assert.equal((await countLeads(outsider)).counts.Active, 0);
      assert.equal((await listLeads(outsider)).items.length, 0);
    }
    const plain = await capture(p);
    await plan(p, plain.id, "2000-01-01T00:00:00.000Z");
    assert.equal((await countLeads(p)).counts.Overdue, 1);
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='activity.read'",
      [p.actor_id],
    );
    const deniedActivities = await countLeads(p);
    assert.equal(deniedActivities.counts.FollowUpUnavailable, 2);
    assert.equal(deniedActivities.counts.Overdue, 0);
    assert.equal(deniedActivities.counts.NextActionNeeded, 0);
    assert.equal(
      (await withWorkingCompany(p.actor_id, CRM.companyB, () => countLeads(p)))
        .counts.Active,
      0,
    );
    assert.equal(
      (await withWorkingCompany(p.actor_id, CRM.companyB, () => listLeads(p)))
        .items.length,
      0,
    );
    await assert.rejects(
      countLeads(await principal("systems")),
      code("Forbidden"),
    );
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.lead.read'",
      [p.actor_id],
    );
    await assert.rejects(countLeads(p), code("Forbidden"));
    await assert.rejects(listLeads(p), code("Forbidden"));
  });

  test("LR-05 due-time equality and date-only day boundary agree in counts and list", async (t) => {
    const p = await principal(),
      dateOnly = await capture(p),
      equal = await capture(p),
      future = await capture(p);
    const boundary = "2035-10-12T13:59:59.999Z";
    const day = await plan(p, dateOnly.id, boundary);
    await activityCommand(
      p,
      day.id,
      {
        ...crmBase(),
        expected_version: 1,
        owner_id: p.actor_id,
        summary: day.summary,
        due_at: boundary,
        due_needed: false,
        due_date_only: true,
      },
      "update",
    );
    await plan(p, equal.id, "2035-10-12T14:00:00.000Z");
    await plan(p, future.id, "2035-10-12T14:00:00.001Z");
    t.mock.timers.enable({
      apis: ["Date"],
      now: Date.parse("2035-10-12T14:00:00.000Z"),
    });
    const counts = await countLeads(p),
      list = await listLeads(p, { follow_up: "Overdue" });
    assert.equal(counts.counts.Overdue, 1);
    assert.deepEqual(
      list.items.map((l) => l.id),
      [dateOnly.id],
    );
    assert.equal(list.observed_at, counts.observed_at);
    assert.equal((await readLead(p, equal.id)).next_action_state, "Upcoming");
    t.mock.timers.tick(1);
    assert.equal((await countLeads(p)).counts.Overdue, 2);
    assert.equal(
      (await listLeads(p, { follow_up: "Overdue" })).items.length,
      2,
    );
  });

  test("LR-06 list waits for native activity mutation and returns its completed follow-up state", async () => {
    const p = await principal(),
      lead = await capture(p);
    const action = await plan(p, lead.id, "2000-01-01T00:00:00.000Z");
    const blocker = await database().connect();
    let mutation: Promise<unknown> | undefined,
      read: ReturnType<typeof listLeads> | undefined;
    try {
      await blocker.query("BEGIN");
      await blocker.query(
        "SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE",
        [p.workspace_id],
      );
      mutation = activityCommand(
        p,
        action.id,
        {
          ...crmBase(),
          expected_version: 1,
          outcome: "SYN Completed while register waited",
        },
        "complete",
      );
      for (let i = 0; i < 100; i++) {
        const waiting = await database().query(
          "SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE '%ppo.workspaces%FOR UPDATE%'",
        );
        if (waiting.rowCount) break;
        assert(i < 99, "native command must reach workspace lock");
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      let settled = false;
      read = listLeads(p, { follow_up: "NextActionNeeded" });
      void read.then(
        () => {
          settled = true;
        },
        () => {
          settled = true;
        },
      );
      await new Promise((resolve) => setTimeout(resolve, 40));
      assert.equal(settled, false);
      await blocker.query("COMMIT");
      await mutation;
      assert.deepEqual(
        (await read).items.map((l) => l.id),
        [lead.id],
      );
      assert.equal((await countLeads(p)).counts.NextActionNeeded, 1);
      assert.equal((await readActivity(p, action.id)).status, "Completed");
    } finally {
      await blocker.query("ROLLBACK");
      blocker.release();
      await Promise.allSettled([mutation, read]);
    }
  });
}
