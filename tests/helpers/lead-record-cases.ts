import assert from "node:assert/strict";
import { test } from "node:test";
import { database } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { withWorkingCompany } from "../../src/platform/working-company";
import {
  createLead,
  planLeadAction,
  changeLead,
  convertLead,
} from "../../src/crm/leads/service";
import { resolveLeadContext } from "../../src/crm/leads/amendments";
import { readLead } from "../../src/crm/leads/reads";
import {
  activityCommand,
  createActivity,
  readActivity,
} from "../../src/activities/activities";
import { createProject } from "../../src/projects/service";
import { projectInput } from "./projects";
import { leadCreate, leadConvert } from "./leads";
import { CRM, crmBase, crmAction } from "./crm";

const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const check = (lead: Awaited<ReturnType<typeof readLead>>, key: string) =>
  lead.conversion_readiness.checks.find((c) => c.key === key)?.state;
const code = (value: string) => (e: unknown) =>
  (e as { code: string }).code === value;
async function fixture(overrides: Record<string, unknown> = {}) {
  const p = await principal(),
    input = { ...leadCreate(), ...overrides },
    action = crmAction();
  await createLead(p, input);
  await planLeadAction(p, input.id, {
    ...crmBase(),
    expected_version: 1,
    activity_id: null,
    new_action: action,
  });
  return { p, input, action };
}
async function snapshot() {
  const tables = [
    "lead_candidates",
    "lead_events",
    "lead_conversions",
    "activities",
    "activity_links",
    "opportunities",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
  ];
  const result = [];
  for (const table of tables)
    result.push(
      (
        await database().query(
          `SELECT to_jsonb(t) AS row FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
        )
      ).rows,
    );
  return result;
}

export function registerLeadRecordTests() {
  test("LREC-01 readiness uses saved facts, undated actions and native completion; summary excludes lead notes and reads write nothing", async () => {
    const f = await fixture(),
      before = await snapshot();
    let lead = await readLead(f.p, f.input.id);
    assert.equal(lead.conversion_readiness.state, "ReadyForReview");
    assert.equal(lead.conversion_readiness.authority, "Allowed");
    assert.equal(check(lead, "qualification_note"), "AskedOnConversion");
    assert.equal(check(lead, "next_activity"), "Complete");
    assert.equal(lead.record_summary.next_action_state, "DueNeeded");
    assert.equal(lead.record_summary.last_activity?.id, f.action.id);
    assert.equal(lead.record_summary.activity_scope, "VisibleLinkedActivities");
    assert.equal(lead.record_summary.age_days, 0);
    assert.equal(lead.record_summary.lead_version, 2);
    await readLead(f.p, f.input.id);
    assert.deepEqual(await snapshot(), before);
    const last = lead.record_summary.last_activity;
    await changeLead(f.p, f.input.id, {
      ...crmBase(),
      expected_version: 2,
      action: "note",
      note: "SYN Note is not an Activity update",
    });
    lead = await readLead(f.p, f.input.id);
    assert.deepEqual(lead.record_summary.last_activity, last);
    assert.equal(lead.record_summary.lead_version, 3);
    await assert.rejects(
      convertLead(f.p, f.input.id, leadConvert(2, f.action.id)),
      code("VersionConflict"),
    );
    await activityCommand(
      f.p,
      f.action.id,
      {
        ...crmBase(),
        expected_version: 1,
        outcome: "SYN Conversation completed",
      },
      "complete",
    );
    lead = await readLead(f.p, f.input.id);
    assert.equal(check(lead, "next_activity"), "Missing");
    assert.equal(lead.conversion_readiness.state, "NeedsAttention");
    assert.equal(lead.record_summary.last_activity?.status, "Completed");
    assert.equal(
      lead.record_summary.last_activity?.updated_at,
      (await readActivity(f.p, f.action.id)).updated_at,
    );
    assert.equal(lead.record_summary.next_action_state, "Needed");
    await assert.rejects(
      convertLead(f.p, f.input.id, leadConvert(3, f.action.id)),
      code("LEAD_ACTION_TERMINAL"),
    );
    await convertLead(f.p, f.input.id, leadConvert(3));
    lead = await readLead(f.p, f.input.id);
    assert.equal(lead.conversion_readiness.state, "NotApplicable");
    assert.equal(lead.conversion_readiness.lifecycle, "Converted");
  });

  test("LREC-02 unresolved fields remain missing and current resolution requires explicit source-activity review", async () => {
    const f = await fixture({
      organisation_id: null,
      site_id: null,
      primary_person_id: null,
      need_summary: null,
    });
    let lead = await readLead(f.p, f.input.id);
    for (const key of ["organisation", "site", "contact", "requirement"])
      assert.equal(check(lead, key), "Missing", key);
    assert.equal(lead.conversion_readiness.context_source, "Captured");
    assert.equal(lead.conversion_readiness.state, "NeedsAttention");
    await resolveLeadContext(f.p, f.input.id, {
      ...crmBase(),
      expected_version: 2,
      organisation_id: CRM.org,
      site_id: CRM.site,
      primary_person_id: CRM.person,
    });
    lead = await readLead(f.p, f.input.id);
    assert.equal(lead.organisation_id, null, "original capture is retained");
    assert.equal(lead.conversion_readiness.context_source, "Resolved");
    for (const key of ["organisation", "site", "contact", "customer_context"])
      assert.equal(check(lead, key), "Complete", key);
    assert.equal(check(lead, "source_activities"), "ReviewRequired");
    await assert.rejects(
      convertLead(f.p, f.input.id, leadConvert(3)),
      code("LEAD_ACTIVITY_CONTEXT"),
    );
    await convertLead(f.p, f.input.id, {
      ...leadConvert(3),
      new_action: {
        ...crmAction(),
        kind: "RelationshipReview",
        due_at: "2031-11-13T03:00:00.000Z",
        due_needed: false,
      },
      source_activity_review: [
        {
          id: f.action.id,
          version: 1,
          disposition: "Retain",
          reason: "SYN Retain unresolved source enquiry at its original scope",
        },
      ],
    });
    assert.equal(
      (await readLead(f.p, f.input.id)).conversion_readiness.state,
      "NotApplicable",
    );
  });

  test("LREC-03 lifecycle blocks readiness independently of missing facts and reopens with fresh facts", async () => {
    const f = await fixture();
    for (const [action, version, lifecycle] of [
      ["archive", 2, "Archived"],
      ["unarchive", 3, "Active"],
      ["disqualify", 4, "Disqualified"],
      ["reopen", 5, "Active"],
    ] as const) {
      await changeLead(f.p, f.input.id, {
        ...crmBase(),
        expected_version: version,
        action,
      });
      const lead = await readLead(f.p, f.input.id);
      assert.equal(lead.conversion_readiness.lifecycle, lifecycle);
      assert.equal(
        lead.conversion_readiness.state,
        lifecycle === "Active" ? "ReadyForReview" : "NotApplicable",
      );
    }
    await activityCommand(
      f.p,
      f.action.id,
      {
        ...crmBase(),
        expected_version: 1,
        cancellation_reason: "SYN No longer needed",
      },
      "cancel",
    );
    const lead = await readLead(f.p, f.input.id);
    assert.equal(check(lead, "next_activity"), "Missing");
    assert.equal(lead.record_summary.last_activity?.status, "Cancelled");
  });

  test("LREC-04 other owners, company/workspace selection and revoked conversion authority stay separate from readable facts", async () => {
    const f = await fixture(),
      other = await principal("observer");
    await database().query(
      `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to) SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to FROM ppo.permission_grants WHERE user_id=$2 ON CONFLICT DO NOTHING`,
      [other.actor_id, f.p.actor_id],
    );
    const readOnly = await readLead(other, f.input.id);
    assert.equal(readOnly.conversion_readiness.authority, "Unavailable");
    assert.equal(check(readOnly, "requirement"), "Complete");
    assert.equal(readOnly.record_summary.last_activity?.id, f.action.id);
    for (const profile of ["second-company", "other-workspace", "systems"])
      await assert.rejects(readLead(await principal(profile), f.input.id));
    await assert.rejects(
      withWorkingCompany(f.p.actor_id, CRM.companyB, () =>
        readLead(f.p, f.input.id),
      ),
    );
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.lead.convert'",
      [f.p.actor_id],
    );
    assert.equal(
      (await readLead(f.p, f.input.id)).conversion_readiness.authority,
      "Unavailable",
    );
    await assert.rejects(
      convertLead(f.p, f.input.id, leadConvert(2, f.action.id)),
    );
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.lead.read'",
      [f.p.actor_id],
    );
    await assert.rejects(readLead(f.p, f.input.id));
  });

  test("LREC-05 hidden linked history never becomes missing or a leaked last activity and still blocks conversion", async () => {
    const f = await fixture(),
      project = projectInput(),
      hidden = { ...crmAction(), summary: "SYN PRIVATE linked activity title" };
    await createProject(f.p, project);
    await createActivity(f.p, {
      ...crmBase(),
      ...hidden,
      company_id: CRM.company,
      site_id: CRM.site,
      access_class: "Internal",
      links: [
        { object_type: "Lead", object_id: f.input.id },
        { object_type: "Project", object_id: project.id },
      ],
    });
    assert.equal(
      (await readLead(f.p, f.input.id)).record_summary.last_activity?.id,
      hidden.id,
    );
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='project.read'",
      [f.p.actor_id],
    );
    let lead = await readLead(f.p, f.input.id);
    assert.equal(lead.record_summary.last_activity?.id, f.action.id);
    assert.equal(check(lead, "next_activity"), "Complete");
    assert.equal(check(lead, "source_activities"), "Unavailable");
    assert.equal(lead.conversion_readiness.state, "Unavailable");
    assert(!JSON.stringify(lead.record_summary).includes(hidden.id));
    assert(!JSON.stringify(lead.conversion_readiness).includes(hidden.summary));
    await assert.rejects(
      convertLead(f.p, f.input.id, leadConvert(2, f.action.id)),
    );
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='activity.read'",
      [f.p.actor_id],
    );
    lead = await readLead(f.p, f.input.id);
    assert.equal(lead.record_summary.last_activity, null);
    assert.equal(lead.record_summary.next_action_state, "Unavailable");
    assert.equal(check(lead, "next_activity"), "Unavailable");
  });

  test("LREC-06 expired customer relationships and removed owner eligibility invalidate the same saved context as conversion", async () => {
    const f = await fixture();
    await database().query(
      "UPDATE ppo.relationships SET valid_to=CURRENT_DATE WHERE workspace_id=$1 AND person_id=$2 AND organisation_id=$3",
      [f.p.workspace_id, CRM.person, CRM.org],
    );
    let lead = await readLead(f.p, f.input.id);
    assert.equal(check(lead, "contact"), "Complete");
    assert.equal(check(lead, "customer_context"), "Unavailable");
    assert.equal(lead.conversion_readiness.state, "Unavailable");
    await assert.rejects(
      convertLead(f.p, f.input.id, leadConvert(2, f.action.id)),
    );
    await database().query(
      "UPDATE ppo.relationships SET valid_to=NULL WHERE workspace_id=$1 AND person_id=$2 AND organisation_id=$3",
      [f.p.workspace_id, CRM.person, CRM.org],
    );
    assert.equal(
      (await readLead(f.p, f.input.id)).conversion_readiness.state,
      "ReadyForReview",
    );
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.edit'",
      [f.p.actor_id],
    );
    lead = await readLead(f.p, f.input.id);
    assert.equal(check(lead, "customer_context"), "Unavailable");
    await assert.rejects(
      convertLead(f.p, f.input.id, leadConvert(2, f.action.id)),
    );
  });
  test("LREC-07 detail waits for native completion and returns one current readiness and summary", async () => {
    const { p, input: lead, action } = await fixture();
    const blocker = await database().connect();
    let mutation: Promise<unknown> | undefined,
      read: ReturnType<typeof readLead> | undefined;
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
      read = readLead(p, lead.id);
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
      const detail = await read;
      assert.equal(detail.record_summary.last_activity?.status, "Completed");
      assert.equal(detail.record_summary.next_action_state, "Needed");
      assert.equal(detail.conversion_readiness.state, "NeedsAttention");
      assert.equal(check(detail, "next_activity"), "Missing");
      assert.equal((await readActivity(p, action.id)).status, "Completed");
    } finally {
      await blocker.query("ROLLBACK");
      blocker.release();
      await Promise.allSettled([mutation, read]);
    }
  });
}
