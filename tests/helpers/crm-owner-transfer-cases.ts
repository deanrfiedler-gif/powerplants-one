import assert from "node:assert/strict";
import { facilitySeedCounters, facilitySeedIdentities } from "./facility-seed-identities";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { database, transaction } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import {
  createOpportunity,
  qualifyOpportunity,
  planOpportunityAction,
} from "../../src/crm/opportunities";
import {
  changeDealStage,
  editDealInformation,
} from "../../src/crm/refinements";
import {
  transferOpportunityOwner,
  ownerTransferOptions,
} from "../../src/crm/owner-transfer";
import { readOpportunity, listOpportunities } from "../../src/crm/reads";
import { readOperation } from "../../src/shared/receipts";
import {
  activityCommand,
  createActivity,
} from "../../src/activities/activities";
import {
  createEstimate,
  saveEstimate,
  prepareQuote,
} from "../../src/estimating/service";
import { readEstimate, readQuote } from "../../src/estimating/reads";
import {
  draftBytes,
  readQuoteJob,
  runQuoteJob,
} from "../../src/estimating/worker";
import { estimateInput, quoteCommand } from "./estimating";
import { seed, migrate } from "../../scripts/database";
import {
  CRM,
  crmBase,
  crmCreate,
  crmDiscovery,
  crmAction,
  crmQualify,
} from "./crm";
const receiver = "30000000-0000-4000-8000-000000000015";
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const code = (value: string) => (e: unknown) =>
  (e as { code: string }).code === value;
const rows = async (sql: string, args: unknown[] = []) =>
  (await database().query(sql, args)).rows;
async function fixture(legacy = false) {
  const p = await principal(),
    input = legacy ? crmCreate() : crmDiscovery();
  const created = await createOpportunity(p, input);
  return { p, input, created };
}
async function intent(
  p: Awaited<ReturnType<typeof principal>>,
  id: string,
  new_owner_id = receiver,
) {
  const o = await ownerTransferOptions(p, id),
    next = o.next_activity,
    identification = o.identification_activity;
  return {
    ...crmBase(),
    expected_version: o.opportunity_version,
    new_owner_id,
    expected_next_activity: { id: next.id, version: next.version },
    expected_identification_activity: identification
      ? { id: identification.id, version: identification.version }
      : null,
  };
}
async function grantOnward() {
  await rows(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to) SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to FROM ppo.permission_grants WHERE user_id=$2 AND capability='crm.opportunity.transfer.own'",
    [receiver, CRM.owner],
  );
}
const tables = [
  "opportunities",
  "opportunity_origins",
  "opportunity_owner_transfers",
  "opportunity_events",
  "activities",
  "activity_links",
  "business_identities",
  "reference_counters",
  "audit_events",
  "operation_receipts",
  "outbox_jobs",
];
const snapshot = () =>
  Promise.all(
    tables.map((t) =>
      rows(
        `SELECT to_jsonb(x) AS row FROM ppo.${t} x ORDER BY to_jsonb(x)::text`,
      ),
    ),
  );
async function blockedBy(pid: number, count = 1) {
  for (let n = 0; n < 100; n++) {
    if (
      (
        await rows(
          "WITH RECURSIVE waiting AS (SELECT pid FROM pg_stat_activity WHERE $1=ANY(pg_blocking_pids(pid)) UNION SELECT a.pid FROM pg_stat_activity a JOIN waiting w ON w.pid=ANY(pg_blocking_pids(a.pid))) SELECT DISTINCT pid FROM waiting",
          [pid],
        )
      ).length >= count
    )
      return true;
    await new Promise((r) => setTimeout(r, 20));
  }
  return false;
}
// Registered by the existing CRM refinement suite so its focused CI runs every case.
export function ownerTransferCases() {
  test("HV-01/02/09: one immediate owner change preserves Activity values; recipient has no onward or estimating grant", async () => {
    const { p, input, created } = await fixture(),
      body = await intent(p, input.id),
      before = await readOpportunity(p, input.id),
      q = await principal("crm-receiver");
    const counters = await rows(
      "SELECT * FROM ppo.reference_counters ORDER BY record_type",
    );
    const result = await transferOpportunityOwner(p, input.id, body),
      saved = await readOpportunity(p, input.id);
    assert.equal(saved.owner_id, receiver);
    assert.equal(saved.version, 2);
    assert.equal(saved.original_owner?.original_owner_id, p.actor_id);
    assert.equal(saved.owner_transfers[0].from_owner_id, p.actor_id);
    assert.equal(saved.owner_transfers[0].to_owner_id, receiver);
    assert.deepEqual(saved.events.slice(0, -1), before.events);
    assert.deepEqual(saved.actions, before.actions);
    assert.equal(saved.stage_entered_at, before.stage_entered_at);
    assert.equal(saved.close_outcome, "Open");
    assert.deepEqual(
      await rows("SELECT * FROM ppo.reference_counters ORDER BY record_type"),
      counters,
    );
    assert.deepEqual(
      (await transferOpportunityOwner(p, input.id, body)).receipt,
      result.receipt,
    );
    assert.deepEqual(await readOperation(p, body.operation_id), result.receipt);
    assert.deepEqual(
      await readOperation(p, input.operation_id),
      created.receipt,
    );
    await assert.rejects(
      transferOpportunityOwner(q, input.id, {
        ...body,
        ...crmBase(),
        expected_version: 2,
        new_owner_id: p.actor_id,
      }),
      code("CRM_TRANSFER_REQUIRED"),
    );
    await assert.rejects(
      changeDealStage(p, input.id, {
        ...crmBase(),
        expected_version: 2,
        stage_id: "Scoping",
        qualification_note: null,
        identification_activity_id: null,
      }),
      code("CRM_OWNER_REQUIRED"),
    );
    await assert.rejects(
      activityCommand(
        q,
        input.initial_action.id,
        {
          ...crmBase(),
          expected_version: 1,
          outcome: "SYN receiver may not complete another actor's action",
        },
        "complete",
      ),
      code("ACTIVITY_OWNER_REQUIRED"),
    );
    assert.equal(
      (
        await rows(
          "SELECT count(*)::int AS n FROM ppo.permission_grants WHERE user_id=$1 AND (capability LIKE 'estimating.%' OR capability LIKE 'finance.%' OR capability='crm.opportunity.transfer.own')",
          [receiver],
        )
      )[0].n,
      0,
    );
    assert.ok(
      (
        await listOpportunities(q, {
          pipeline_definition_id: input.pipeline_definition_id,
          owner_id: receiver,
        })
      ).items.some((o) => o.id === input.id),
    );
  });
  test("HV-03/14: bounded owner options exclude wrong scopes, inactive and same owner; cursor binds version and query", async () => {
    const { p, input } = await fixture();
    const options = await ownerTransferOptions(p, input.id, { limit: 1 });
    assert.deepEqual(
      options.items.map((x) => x.id),
      [receiver],
    );
    assert.ok(!JSON.stringify(options).includes("Systems"));
    assert.ok(!JSON.stringify(options).includes("Company B"));
    for (const profile of [
      "observer",
      "systems",
      "second-company",
      "other-workspace",
      "site-observer",
    ])
      await assert.rejects(
        ownerTransferOptions(await principal(profile), input.id),
      );
    await assert.rejects(ownerTransferOptions(p, input.id, { limit: 101 }));
    await assert.rejects(
      transferOpportunityOwner(p, input.id, {
        ...(await intent(p, input.id)),
        new_owner_id: p.actor_id,
      }),
      code("CRM_TRANSFER_SAME_OWNER"),
    );
    await rows("UPDATE ppo.users SET active=false WHERE id=$1", [receiver]);
    assert.deepEqual((await ownerTransferOptions(p, input.id)).items, []);
  });
  test("HV-14: owner cursor binds actual second candidate, query, actor and saved version", async () => {
    const { p, input } = await fixture(),
      extra = randomUUID();
    await rows(
      "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-LocalSynthetic',$3,'SYN Additional eligible owner')",
      [extra, p.workspace_id, `hv-${extra}`],
    );
    await rows(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to) SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to FROM ppo.permission_grants WHERE user_id=$2",
      [extra, receiver],
    );
    const first = await ownerTransferOptions(p, input.id, { limit: 1 });
    assert.ok(first.next_cursor);
    const second = await ownerTransferOptions(p, input.id, {
      limit: 1,
      cursor: first.next_cursor,
    });
    assert.equal(second.items.length, 1);
    assert.notEqual(second.items[0].id, first.items[0].id);
    assert.equal(second.next_cursor, null);
    await assert.rejects(
      ownerTransferOptions(p, input.id, {
        limit: 1,
        cursor: first.next_cursor,
        q: "SYN",
      }),
      code("InvalidData"),
    );
    await assert.rejects(
      ownerTransferOptions(await principal("crm-receiver"), input.id, {
        limit: 1,
        cursor: first.next_cursor,
      }),
    );
    await changeDealStage(p, input.id, {
      ...crmBase(),
      expected_version: 1,
      stage_id: "Scoping",
      qualification_note: null,
      identification_activity_id: null,
    });
    await assert.rejects(
      ownerTransferOptions(p, input.id, {
        limit: 1,
        cursor: first.next_cursor,
      }),
      code("InvalidData"),
    );
  });
  test("HV-04: an extra hidden Activity target excludes the recipient without leaking it", async () => {
    const { p, input } = await fixture();
    const mixed = {
      ...crmBase(),
      id: randomUUID(),
      company_id: CRM.company,
      site_id: CRM.site,
      owner_id: p.actor_id,
      kind: "CustomerContact",
      summary: "SYN Required comparison with restricted ticket",
      due_at: null,
      due_needed: true,
      access_class: "Internal",
      links: [
        { object_type: "Opportunity", object_id: input.id },
        {
          object_type: "Ticket",
          object_id: (
            await rows(
              "SELECT id FROM ppo.tickets WHERE company_id=$1 AND site_id=$2 ORDER BY id LIMIT 1",
              [CRM.company, CRM.site],
            )
          )[0].id,
        },
      ],
    };
    await createActivity(p, mixed);
    await planOpportunityAction(p, input.id, {
      ...crmBase(),
      expected_version: 1,
      activity_id: mixed.id,
      new_action: null,
    });
    const options = await ownerTransferOptions(p, input.id);
    assert.deepEqual(options.items, []);
    assert.ok(!JSON.stringify(options).includes(mixed.links[1].object_id));
    const body = {
      ...crmBase(),
      expected_version: 2,
      new_owner_id: receiver,
      expected_next_activity: { id: mixed.id, version: 1 },
      expected_identification_activity: null,
    };
    const before = await snapshot();
    await assert.rejects(transferOpportunityOwner(p, input.id, body));
    assert.deepEqual(await snapshot(), before);
  });
  test("HV-07/11: identical concurrent transfer returns one original; changed payload conflicts after recovery authority", async () => {
    const { p, input } = await fixture(),
      body = await intent(p, input.id);
    const results = await Promise.all([
      transferOpportunityOwner(p, input.id, body),
      transferOpportunityOwner(p, input.id, body),
    ]);
    assert.deepEqual(results[0].receipt, results[1].receipt);
    assert.equal(results.filter((x) => x.replayed).length, 1);
    assert.equal(
      (await readOpportunity(p, input.id)).owner_transfers.length,
      1,
    );
    await assert.rejects(
      transferOpportunityOwner(p, input.id, {
        ...body,
        reason: "SYN Changed original",
      }),
      code("OperationConflict"),
    );
    await assert.rejects(
      readOperation(await principal("crm-receiver"), body.operation_id),
      code("RecordUnavailable"),
    );
  });
  for (const competitor of ["qualification", "planning", "planning-existing", "transfer"] as const)
    for (const transferFirst of [true, false])
      test(`HV-05/06/07: real competing ${competitor}; transfer queued ${transferFirst ? "first" : "second"}`, async () => {
        const { p, input } = await fixture(true),
          body = await intent(p, input.id);
        const existing = { ...crmAction(), ...crmBase(), company_id: CRM.company, site_id: CRM.site,
          access_class: "Internal", links: [{ object_type: "Opportunity", object_id: input.id }] };
        if (competitor === "planning-existing") await createActivity(p, existing);
        const blocker = await database().connect();
        await blocker.query("BEGIN");
        const pid = (await blocker.query("SELECT pg_backend_pid() AS pid"))
          .rows[0].pid;
        await blocker.query(
          "SELECT id FROM ppo.workspaces WHERE id=$1 FOR UPDATE",
          [p.workspace_id],
        );
        const transfer = () => transferOpportunityOwner(p, input.id, body);
        const competing = () =>
          competitor === "qualification"
            ? qualifyOpportunity(p, input.id, crmQualify())
            : competitor === "planning" || competitor === "planning-existing"
              ? planOpportunityAction(p, input.id, {
                  ...crmBase(),
                  expected_version: 1,
                  new_action: competitor === "planning" ? crmAction() : null,
                  activity_id: competitor === "planning-existing" ? existing.id : null,
                })
              : transferOpportunityOwner(p, input.id, {
                  ...body,
                  ...crmBase(),
                });
        const first = Promise.allSettled([
          (transferFirst ? transfer : competing)(),
        ]);
        let second: typeof first | undefined;
        try {
          assert.equal(await blockedBy(pid), true);
          second = Promise.allSettled([
            (transferFirst ? competing : transfer)(),
          ]);
          assert.equal(await blockedBy(pid, 2), true);
        } finally {
          await blocker.query("COMMIT");
          blocker.release();
        }
        const firstResult = (await first)[0];
        const secondResult = ((await second) as Awaited<typeof first>)[0];
        assert.equal(firstResult.status, "fulfilled");
        assert.equal(secondResult.status, "rejected");
        const results = transferFirst
          ? [firstResult, secondResult]
          : [secondResult, firstResult];
        assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
        const saved = await readOpportunity(p, input.id);
        assert.equal(saved.version, 2);
        assert.equal(saved.events.length, 2);
        assert.equal(
          (
            await rows(
              "SELECT count(*)::int AS n FROM ppo.operation_receipts WHERE operation_id=$1",
              [body.operation_id],
            )
          )[0].n,
          results[0].status === "fulfilled" ? 1 : 0,
        );
      });
  for (const action of ["complete", "cancel", "update"] as const)
    for (const transferFirst of [true, false])
      test(`HV-08: observed ${action} race, transfer queued ${transferFirst ? "first" : "second"}`, async () => {
        const { p, input } = await fixture(), body = await intent(p, input.id);
        const command = { ...crmBase(), expected_version: 1,
          ...(action === "complete" ? { outcome: "SYN independently completed" } : action === "cancel" ? { cancellation_reason: "SYN independently cancelled" } :
            { owner_id: receiver, summary: input.initial_action.summary, due_at: null, due_needed: true }) };
        const blocker = await database().connect();
        await blocker.query("BEGIN");
        const pid = (await blocker.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
        await blocker.query("SELECT id FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [p.workspace_id]);
        const transfer = () => transferOpportunityOwner(p, input.id, body);
        const activity = () => activityCommand(p, input.initial_action.id, command, action);
        const first = Promise.allSettled([(transferFirst ? transfer : activity)()]);
        let second: typeof first | undefined;
        try {
          assert.equal(await blockedBy(pid), true);
          second = Promise.allSettled([(transferFirst ? activity : transfer)()]);
          assert.equal(await blockedBy(pid, 2), true);
        } finally { await blocker.query("COMMIT"); blocker.release(); }
        const a = (await first)[0], b = (await second!)[0];
        assert.equal(a.status, "fulfilled");
        assert.equal(b.status, transferFirst ? "fulfilled" : "rejected");
        if (!transferFirst && b.status === "rejected") assert.equal(b.reason.code, "ActivityComparisonConflict");
        const saved = await readOpportunity(p, input.id);
        assert.equal(saved.owner_id, transferFirst ? receiver : p.actor_id);
        assert.equal(saved.version, transferFirst ? 2 : 1);
        assert.equal(saved.next_activity!.version, 2);
        assert.equal(saved.next_activity!.owner_id, action === "update" ? receiver : p.actor_id);
        assert.equal(saved.next_activity!.status, action === "complete" ? "Completed" : action === "cancel" ? "Cancelled" : "Open");
        assert.equal((await rows("SELECT count(*)::int n FROM ppo.operation_receipts WHERE operation_id=$1", [body.operation_id]))[0].n, transferFirst ? 1 : 0);
        const activityResult = transferFirst ? b : a;
        assert.equal(activityResult.status, "fulfilled");
        if (activityResult.status === "fulfilled") assert.deepEqual(await readOperation(p, command.operation_id), activityResult.value.receipt);
      });
  test("HV-22: renamed and inactive historical owners retain exact chain across intervening qualification and planning", async () => {
    const p = await principal(), q = await principal("crm-receiver"), input = { ...crmCreate(), owner_id: receiver };
    await createOpportunity(p, input); await grantOnward();
    const origin = (await readOpportunity(p, input.id)).original_owner!;
    const first = await intent(q, input.id, p.actor_id), accepted = await transferOpportunityOwner(q, input.id, first);
    await qualifyOpportunity(p, input.id, crmQualify(2));
    await planOpportunityAction(p, input.id, { ...crmBase(), expected_version: 3, new_action: crmAction(), activity_id: null });
    await transferOpportunityOwner(p, input.id, await intent(p, input.id));
    const before = await rows("SELECT to_jsonb(t) row FROM ppo.opportunity_events t WHERE opportunity_id=$1 ORDER BY opportunity_version", [input.id]);
    await rows("UPDATE ppo.users SET display_name='SYN Renamed historical creator',active=false WHERE id=$1", [p.actor_id]);
    const saved = await readOpportunity(q, input.id);
    assert.equal(saved.original_owner!.original_owner_id, origin.original_owner_id);
    assert.equal((await rows("SELECT created_by FROM ppo.opportunities WHERE id=$1", [input.id]))[0].created_by, p.actor_id);
    assert.deepEqual(saved.owner_transfers.map(x => [x.from_owner_id,x.to_owner_id]), [[receiver,p.actor_id],[p.actor_id,receiver]]);
    assert.deepEqual(await rows("SELECT to_jsonb(t) row FROM ppo.opportunity_events t WHERE opportunity_id=$1 ORDER BY opportunity_version", [input.id]), before);
    assert.deepEqual(await readOperation(q, first.operation_id), accepted.receipt);
  });
  test("HV-08: completed Activity conflicts with an old comparison; transfer then completion leaves independent outcomes", async () => {
    const { p, input } = await fixture(),
      body = await intent(p, input.id);
    await activityCommand(
      p,
      input.initial_action.id,
      {
        ...crmBase(),
        expected_version: 1,
        outcome: "SYN completed while transfer was being reviewed",
      },
      "complete",
    );
    await assert.rejects(
      transferOpportunityOwner(p, input.id, body),
      code("ActivityComparisonConflict"),
    );
    const fresh = await intent(p, input.id);
    await transferOpportunityOwner(p, input.id, fresh);
    const saved = await readOpportunity(p, input.id);
    assert.equal(saved.next_activity?.status, "Completed");
    assert.equal(saved.next_activity?.owner_id, p.actor_id);
    assert.equal(saved.next_action_state, "Needed");
    assert.equal(saved.owner_transfers.length, 1);
  });
  test("HV-10/22: historical unknown-contact qualification retains its original owner across transfer and stage moves", async () => {
    const p = await principal(),
      input = crmDiscovery();
    input.primary_person_id = null;
    input.contact_unknown_reason = "SYN introduction pending";
    await createOpportunity(p, input);
    const before = await readOpportunity(p, input.id);
    await transferOpportunityOwner(p, input.id, await intent(p, input.id));
    const q = await principal("crm-receiver");
    await changeDealStage(q, input.id, {
      ...crmBase(),
      expected_version: 2,
      stage_id: "Scoping",
      qualification_note: null,
      identification_activity_id: null,
    });
    const saved = await readOpportunity(p, input.id);
    assert.equal(saved.stage_id, "Scoping");
    assert.equal(saved.identification_activity_id, input.initial_action.id);
    assert.deepEqual(saved.events[0], before.events[0]);
    assert.deepEqual(saved.actions, before.actions);
    // Transfer an already terminal legacy identification action without requalifying it.
    const legacy = crmCreate();
    legacy.primary_person_id = null;
    legacy.contact_unknown_reason = "SYN pending introduction";
    await createOpportunity(p, legacy);
    const qualified = {
      ...crmQualify(),
      identification_activity_id: legacy.initial_action.id,
    };
    await qualifyOpportunity(p, legacy.id, qualified);
    await activityCommand(
      p,
      legacy.initial_action.id,
      {
        ...crmBase(),
        expected_version: 1,
        outcome: "SYN identification follow-up retained",
      },
      "complete",
    );
    await transferOpportunityOwner(p, legacy.id, await intent(p, legacy.id));
    assert.equal(
      (await readOperation(p, qualified.operation_id)).state,
      "Qualified",
    );
  });
  test("HV-11/12/22: several handovers preserve original actor receipts despite later recipient revocation", async () => {
    const { p, input, created } = await fixture(),
      q = await principal("crm-receiver"),
      first = await intent(p, input.id);
    const accepted = await transferOpportunityOwner(p, input.id, first);
    await grantOnward();
    await transferOpportunityOwner(
      q,
      input.id,
      await intent(q, input.id, p.actor_id),
    );
    await rows("UPDATE ppo.users SET active=false WHERE id=$1", [receiver]);
    assert.deepEqual(
      await readOperation(p, first.operation_id),
      accepted.receipt,
    );
    assert.deepEqual(
      (await createOpportunity(p, input)).receipt,
      created.receipt,
    );
    const history = await readOpportunity(p, input.id);
    assert.deepEqual(
      history.owner_transfers.map((x) => [x.from_owner_id, x.to_owner_id]),
      [
        [p.actor_id, receiver],
        [receiver, p.actor_id],
      ],
    );
    await rows(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.transfer.own'",
      [p.actor_id],
    );
    await assert.rejects(
      readOperation(p, first.operation_id),
      code("RecordUnavailable"),
    );
    await assert.rejects(transferOpportunityOwner(p, input.id, first));
    await seed();
    assert.equal(
      (
        await rows(
          "SELECT count(*)::int AS n FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.transfer.own'",
          [p.actor_id],
        )
      )[0].n,
      0,
    );
  });
  for (const target of [
    "initiator",
    "recipient",
    "affiliation",
    "grant",
  ] as const)
    test(`HV-13: committed ${target} revocation wins its actual row-lock race and transfer makes no effect`, async () => {
      const { p, input } = await fixture(),
        body = await intent(p, input.id),
        admin = await database().connect();
      await admin.query("BEGIN");
      const pid = (await admin.query("SELECT pg_backend_pid() AS pid")).rows[0]
        .pid;
      if (target === "grant")
        await admin.query(
          "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.transfer.own'",
          [p.actor_id],
        );
      else if (target === "affiliation")
        await admin.query(
          "UPDATE ppo.relationships SET valid_to=CURRENT_DATE WHERE organisation_id=$1 AND person_id=$2",
          [CRM.org, CRM.person],
        );
      else
        await admin.query("UPDATE ppo.users SET active=false WHERE id=$1", [
          target === "initiator" ? p.actor_id : receiver,
        ]);
      const pending = Promise.allSettled([
        transferOpportunityOwner(p, input.id, body),
      ]);
      try {
        assert.equal(await blockedBy(pid), true);
      } finally {
        await admin.query("COMMIT");
        admin.release();
      }
      assert.equal((await pending)[0].status, "rejected");
      assert.equal(
        (
          await rows("SELECT version FROM ppo.opportunities WHERE id=$1", [
            input.id,
          ])
        )[0].version,
        1,
      );
      assert.equal(
        (
          await rows(
            "SELECT count(*)::int AS n FROM ppo.operation_receipts WHERE operation_id=$1",
            [body.operation_id],
          )
        )[0].n,
        0,
      );
    });
  for (const target of [
    "initiator",
    "recipient",
    "affiliation",
    "grant",
  ] as const)
    test(`HV-13: transfer holds authority before competing ${target} revocation, then later access reflects the revocation`, async () => {
      const { p, input } = await fixture(),
        body = await intent(p, input.id);
      const blocker = await database().connect(),
        admin = await database().connect();
      await blocker.query("BEGIN");
      const pid = (await blocker.query("SELECT pg_backend_pid() AS pid"))
        .rows[0].pid;
      await blocker.query(
        "SELECT id FROM ppo.opportunities WHERE id=$1 FOR UPDATE",
        [input.id],
      );
      const transferring = Promise.allSettled([
        transferOpportunityOwner(p, input.id, body),
      ]);
      let revoking: PromiseSettledResult<unknown>[] | undefined;
      let pending: Promise<PromiseSettledResult<unknown>[]> | undefined;
      try {
        // Transfer has already acquired authority SHARE locks when it reaches
        // this independently held Opportunity lock. Observe that actual wait.
        assert.equal(await blockedBy(pid), true);
        await admin.query("BEGIN");
        const sql =
          target === "grant"
            ? "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.transfer.own'"
            : target === "affiliation"
              ? "UPDATE ppo.relationships SET valid_to=CURRENT_DATE WHERE organisation_id=$1 AND person_id=$2"
              : "UPDATE ppo.users SET active=false WHERE id=$1";
        const args =
          target === "affiliation"
            ? [CRM.org, CRM.person]
            : [target === "recipient" ? receiver : p.actor_id];
        pending = Promise.allSettled([admin.query(sql, args)]);
        // The administrative writer now waits behind the transfer, which
        // itself waits behind our blocker: prove both edges before release.
        assert.equal(await blockedBy(pid, 2), true);
      } finally {
        await blocker.query("COMMIT");
        blocker.release();
        if (pending) revoking = await pending;
        await admin.query(
          revoking?.[0]?.status === "fulfilled" ? "COMMIT" : "ROLLBACK",
        );
        admin.release();
      }
      const result = (await transferring)[0];
      assert.equal(result.status, "fulfilled");
      assert.equal(revoking?.[0]?.status, "fulfilled");
      const saved = (
        await rows(
          "SELECT owner_id,version FROM ppo.opportunities WHERE id=$1",
          [input.id],
        )
      )[0];
      assert.equal(saved.owner_id, receiver);
      assert.equal(saved.version, 2);
      assert.equal(
        (
          await rows(
            "SELECT count(*)::int AS n FROM ppo.opportunity_owner_transfers WHERE opportunity_id=$1",
            [input.id],
          )
        )[0].n,
        1,
      );
      assert.equal(
        (
          await rows(
            "SELECT count(*)::int AS n FROM ppo.operation_receipts WHERE operation_id=$1",
            [body.operation_id],
          )
        )[0].n,
        1,
      );
      if (target === "recipient") {
        assert.equal(result.status, "fulfilled");
        assert.deepEqual(
          await readOperation(p, body.operation_id),
          result.value.receipt,
        );
      } else await assert.rejects(readOperation(p, body.operation_id));
    });
  test("HV-18: every final evidence failure rolls back the full transfer and SQL cannot bypass its chain", async () => {
    const { p, input } = await fixture();
    await rows(
      "CREATE FUNCTION ppo.fail_transfer_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN injected final-write failure' USING ERRCODE='23514'; END $$",
    );
    for (const table of [
      "opportunity_events",
      "opportunity_owner_transfers",
      "audit_events",
      "operation_receipts",
      "outbox_jobs",
    ]) {
      const body = await intent(p, input.id),
        before = await snapshot();
      await rows(
        `CREATE TRIGGER fail_transfer_test BEFORE INSERT ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.fail_transfer_test()`,
      );
      await assert.rejects(transferOpportunityOwner(p, input.id, body));
      await rows(`DROP TRIGGER fail_transfer_test ON ppo.${table}`);
      assert.deepEqual(await snapshot(), before);
    }
    await assert.rejects(
      transaction((c) =>
        c.query(
          "UPDATE ppo.opportunities SET owner_id=$1,version=version+1 WHERE id=$2",
          [receiver, input.id],
        ),
      ),
    );
    await transferOpportunityOwner(p, input.id, await intent(p, input.id));
    for (const table of ["opportunity_origins", "opportunity_owner_transfers"])
      await assert.rejects(
        rows(`DELETE FROM ppo.${table} WHERE opportunity_id=$1`, [input.id]),
      );
  });
  test("HV-19/20/22: original owner differs from author and repeat migration/seed preserve exact provenance", async () => {
    const p = await principal(),
      input = { ...crmCreate(), owner_id: receiver };
    await createOpportunity(p, input);
    const original = (await readOpportunity(p, input.id)).original_owner!;
    assert.equal(original.original_owner_id, receiver);
    assert.equal(original.provenance, "Creation");
    const before = await snapshot();
    await migrate();
    await seed();
    await migrate();
    assert.deepEqual(await snapshot(), before);
    const saved = await readOpportunity(p, input.id);
    assert.equal(saved.original_owner?.original_owner_id, receiver);
    assert.notEqual(saved.original_owner?.original_owner_id, p.actor_id);
  });
  test("HV-19/22: upgrade captures the pre-transfer owner at its exact old version when creation author differs", async () => {
    await transaction(async (c) => {
      await c.query(
        await readFile(
          new URL("../../db/migrations/0001-recover.sql", import.meta.url),
          "utf8",
        ),
      );
      await c.query("DROP TABLE IF EXISTS public.ppo_migrations");
    });
    await migrate(23);
    await seed(23);
    const p = await principal(),
      selectedOwner = randomUUID();
    await rows(
      "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-LocalSynthetic',$3,'SYN Pre-upgrade selected owner')",
      [selectedOwner, p.workspace_id, `hv-${selectedOwner}`],
    );
    await rows(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to) SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to FROM ppo.permission_grants WHERE user_id=$2",
      [selectedOwner, p.actor_id],
    );
    const owner = {
      ...p,
      actor_id: selectedOwner,
      display_name: "SYN Pre-upgrade selected owner",
    };
    const input = {
      ...crmCreate(),
      owner_id: selectedOwner,
      initial_action: crmAction(selectedOwner),
    };
    const accepted = await createOpportunity(p, input);
    const qualification = crmQualify();
    const qualified = await qualifyOpportunity(owner, input.id, qualification);
    const oldTables = tables.filter(
      (t) =>
        !["opportunity_origins", "opportunity_owner_transfers"].includes(t),
    );
    const oldState = () =>
      Promise.all(
        oldTables.map((t) =>
          rows(
            `SELECT to_jsonb(x) AS row FROM ppo.${t} x ORDER BY ${t === "business_identities" ? "x.id" : t === "reference_counters" ? "x.workspace_id,x.record_type,x.namespace" : "to_jsonb(x)::text"}`,
          ),
        ),
      );
    const before = await oldState(),
      ledger = await rows(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      );
    await migrate();
    await seed();
    // 0028 adds scheduling fields to activities with catalogue defaults. Rows sort by their
    // identifier first, so the order is unchanged and every original value remains exact.
    assert.deepEqual(
      await oldState(),
      before.map((tableRows, i) =>
        oldTables[i] === "activities"
          ? tableRows.map((r) => ({
              row: { ...r.row, activity_type: "Task", starts_at: null, due_date_only: false },
            }))
          : oldTables[i] === "activity_links"
            ? tableRows.map((r) => ({ row: { ...r.row, project_id: null } }))
            : oldTables[i] === "reference_counters"
              ? facilitySeedCounters(tableRows.map(r => r.row)).map(row => ({ row }))
              : oldTables[i] === "business_identities"
                ? [...tableRows, ...facilitySeedIdentities(before[oldTables.indexOf("reference_counters")].map(r => r.row)).map(row => ({ row }))].sort((a, b) => a.row.id.localeCompare(b.row.id))
                : tableRows,
      ),
    );
    assert.deepEqual(
      await rows(
        "SELECT * FROM public.ppo_migrations WHERE version<=23 ORDER BY version",
      ),
      ledger,
    );
    const original = (await readOpportunity(p, input.id)).original_owner!;
    assert.equal(original.original_owner_id, selectedOwner);
    assert.notEqual(original.original_owner_id, p.actor_id);
    assert.equal(original.source_version, 2);
    assert.equal(original.provenance, "UpgradeCapture");
    assert.deepEqual(
      (await createOpportunity(p, input)).receipt,
      accepted.receipt,
    );
    assert.deepEqual(
      (await qualifyOpportunity(owner, input.id, qualification)).receipt,
      qualified.receipt,
    );
    await rows(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to) SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to FROM ppo.permission_grants WHERE user_id=$2 AND capability='crm.opportunity.transfer.own'",
      [selectedOwner, p.actor_id],
    );
    await transferOpportunityOwner(
      owner,
      input.id,
      await intent(owner, input.id),
    );
    assert.deepEqual(
      (await readOpportunity(p, input.id)).original_owner,
      original,
    );
    assert.deepEqual(
      (await createOpportunity(p, input)).receipt,
      accepted.receipt,
    );
    assert.deepEqual(
      (await qualifyOpportunity(owner, input.id, qualification)).receipt,
      qualified.receipt,
    );
    const after = await snapshot();
    await migrate();
    await seed();
    assert.deepEqual(await snapshot(), after);
  });
  test("HV-11: information receipts recover after transfer without permitting a former owner's fresh edit", async () => {
    const { p, input } = await fixture();
    const body = {
      ...crmBase(),
      expected_version: 1,
      title: "SYN Original information before transfer",
      primary_person_id: CRM.person,
      contact_unknown_reason: null,
      value_amount: "2500",
      expected_close_date: null,
    };
    const accepted = await editDealInformation(p, input.id, body);
    await transferOpportunityOwner(p, input.id, await intent(p, input.id));
    assert.deepEqual(
      (await editDealInformation(p, input.id, body)).receipt,
      accepted.receipt,
    );
    await assert.rejects(
      editDealInformation(p, input.id, {
        ...body,
        ...crmBase(),
        expected_version: 3,
      }),
      code("CRM_OWNER_REQUIRED"),
    );
  });
  test("HV-12: each revoked original actor permission blocks accepted transfer recovery without deleting evidence", async () => {
    const { p, input } = await fixture(),
      body = await intent(p, input.id);
    const accepted = await transferOpportunityOwner(p, input.id, body);
    for (const capability of [
      "crm.opportunity.read",
      "crm.opportunity.edit",
      "crm.opportunity.transfer.own",
      "shared.read",
      "shared.internal.read",
      "activity.read",
      "activity.edit",
    ]) {
      const grants = await rows(
        "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability=$2 RETURNING *",
        [p.actor_id, capability],
      );
      assert.ok(grants.length);
      await assert.rejects(
        readOperation(p, body.operation_id),
        code("RecordUnavailable"),
      );
      await assert.rejects(transferOpportunityOwner(p, input.id, body));
      // Explicit disposable fixture restoration, never the once-only seed.
      await rows(
        "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_recordset(NULL::ppo.permission_grants,$1::jsonb)",
        [JSON.stringify(grants)],
      );
      assert.deepEqual(
        await readOperation(p, body.operation_id),
        accepted.receipt,
      );
    }
    assert.equal(
      (await readOpportunity(p, input.id)).owner_transfers.length,
      1,
    );
  });
  test("HV-13: restricted runtime role can acquire authority locks without gaining user or grant writes", async () => {
    const { p } = await fixture(),
      c = await database().connect(),
      role = `ppo_hv_lock_${randomUUID().replaceAll("-", "")}`;
    await c.query("BEGIN");
    try {
      await c.query(`CREATE ROLE "${role}" NOLOGIN`);
      await c.query(`GRANT USAGE ON SCHEMA ppo TO "${role}"`);
      await c.query(
        `GRANT SELECT ON ppo.users,ppo.permission_grants TO "${role}"`,
      );
      await c.query(`SET LOCAL ROLE "${role}"`);
      await c.query("SELECT ppo.lock_crm_transfer_authority($1)", [
        p.workspace_id,
      ]);
      for (const table of ["users", "permission_grants"]) {
        await c.query("SAVEPOINT denied_write");
        await assert.rejects(
          c.query(
            `UPDATE ppo.${table} SET workspace_id=workspace_id WHERE false`,
          ),
          code("42501"),
        );
        await c.query("ROLLBACK TO SAVEPOINT denied_write");
      }
    } finally {
      await c.query("ROLLBACK");
      c.release();
    }
  });
  test("HV-08/13: accepted transfer precedes later Activity completion and recipient revocation", async () => {
    const { p, input } = await fixture(),
      body = await intent(p, input.id);
    const accepted = await transferOpportunityOwner(p, input.id, body);
    await activityCommand(
      p,
      input.initial_action.id,
      {
        ...crmBase(),
        expected_version: 1,
        outcome: "SYN separately completed after handover",
      },
      "complete",
    );
    await rows("UPDATE ppo.users SET active=false WHERE id=$1", [receiver]);
    const saved = await readOpportunity(p, input.id);
    assert.equal(saved.owner_id, receiver);
    assert.equal(saved.version, 2);
    assert.equal(saved.next_activity?.owner_id, p.actor_id);
    assert.equal(saved.next_activity?.status, "Completed");
    assert.deepEqual(
      await readOperation(p, body.operation_id),
      accepted.receipt,
    );
  });
  test("HV-21: E1 original owner, source and exact draft bytes survive CRM transfer; receiver gains no commercial authority", async () => {
    const { p, input } = await fixture(true),
      eInput = estimateInput(input.id);
    await createEstimate(p, eInput);
    const e = await readEstimate(p, eInput.id),
      command = quoteCommand(e.saved);
    await prepareQuote(p, e.id, command);
    await runQuoteJob((await readQuoteJob(p, command.id)).j.id);
    const exact = await draftBytes(p, command.id),
      quote = await readQuote(p, command.id);
    const unrelatedTables = (
      await rows(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='ppo' AND (table_name LIKE 'report%' OR table_name LIKE 'finance%' OR table_name IN ('estimates','estimate_versions','draft_quotes','draft_quote_revisions','estimate_quote_jobs')) ORDER BY table_name",
      )
    ).map((r) => r.table_name as string);
    assert.ok(unrelatedTables.includes("estimates"));
    const commercial = () =>
      Promise.all(
        unrelatedTables.map((t) =>
          rows(
            `SELECT to_jsonb(x) AS row FROM ppo.${t} x ORDER BY to_jsonb(x)::text`,
          ),
        ),
      );
    const before = await commercial();
    await transferOpportunityOwner(p, input.id, await intent(p, input.id));
    assert.deepEqual(await commercial(), before);
    assert.deepEqual((await readEstimate(p, e.id)).saved, e.saved);
    assert.equal((await readEstimate(p, e.id)).owner_id, p.actor_id);
    assert.deepEqual(await readQuote(p, command.id), quote);
    assert.deepEqual(await draftBytes(p, command.id), exact);
    const q = await principal("crm-receiver");
    for (const read of [
      () => readEstimate(q, e.id),
      () => readQuote(q, command.id),
      () => draftBytes(q, command.id),
    ])
      await assert.rejects(read(), code("RecordUnavailable"));
    await saveEstimate(p, e.id, {
      ...crmBase(),
      expected_version: 1,
      title: eInput.title,
      scope: eInput.scope,
      lines: eInput.lines,
      policy: eInput.policy,
    });
    assert.equal((await readEstimate(p, e.id)).version, 2);
    assert.deepEqual(await draftBytes(p, command.id), exact);
  });
  test("HV-18: corrupt event and companion evidence cannot conceal a different owner or intermediate version", async () => {
    const { p, input } = await fixture();
    const challenges = [
      [
        "opportunity_events",
        "NEW.company_id:='20000000-0000-4000-8000-000000000002';",
      ],
      ["opportunity_events", "NEW.from_stage:='Scoping';"],
      [
        "opportunity_events",
        "NEW.record_snapshot:=NEW.record_snapshot || jsonb_build_object('title','SYN fabricated transfer snapshot');",
      ],
      [
        "opportunity_owner_transfers",
        "NEW.from_owner_id:='30000000-0000-4000-8000-000000000002';",
      ],
      [
        "opportunity_owner_transfers",
        "NEW.to_owner_id:='30000000-0000-4000-8000-000000000002';",
      ],
      [
        "opportunity_owner_transfers",
        "NEW.opportunity_version:=NEW.opportunity_version+1;",
      ],
      [
        "opportunity_owner_transfers",
        "NEW.next_activity_version:=NEW.next_activity_version+1;",
      ],
    ];
    for (const [table, change] of challenges) {
      const before = await snapshot(),
        body = await intent(p, input.id);
      await rows(
        `CREATE OR REPLACE FUNCTION ppo.corrupt_transfer_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN ${change} RETURN NEW; END $$`,
      );
      await rows(
        `CREATE TRIGGER corrupt_transfer_test BEFORE INSERT ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.corrupt_transfer_test()`,
      );
      try {
        await assert.rejects(transferOpportunityOwner(p, input.id, body));
      } finally {
        await rows(`DROP TRIGGER corrupt_transfer_test ON ppo.${table}`);
      }
      assert.deepEqual(await snapshot(), before);
    }
    const before = await snapshot();
    await assert.rejects(
      transaction(async (c) => {
        await c.query(
          "UPDATE ppo.opportunities SET owner_id=$1,version=version+1,updated_by=$2,updated_at=clock_timestamp() WHERE id=$3",
          [receiver, p.actor_id, input.id],
        );
        await c.query(
          "UPDATE ppo.opportunities SET owner_id=$1,version=version+1,updated_by=$2,updated_at=clock_timestamp() WHERE id=$3",
          [p.actor_id, receiver, input.id],
        );
      }),
    );
    assert.deepEqual(await snapshot(), before);
  });
}
