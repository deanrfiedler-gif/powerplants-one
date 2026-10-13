import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { database } from "../../src/platform/database";
import { createSession, type Principal } from "../../src/platform/identity";
import { withWorkingCompany } from "../../src/platform/working-company";
import {
  createCostSource,
  decideCostSource,
  reviseCostSource,
} from "../../src/estimating/sources/commands";
import {
  listCostSources,
  readCostSource,
} from "../../src/estimating/sources/reads";
import { listCostSourceRegister } from "../../src/estimating/sources/register";
import { sourceInput } from "./estimating-sources";
import { CRM, crmBase } from "./crm";

async function actors() {
  return {
    owner: (await createSession("coordinator")).principal,
    reviewer: (await createSession("estimating-source-reviewer")).principal,
  };
}
async function create(
  p: Principal,
  group: string,
  changes: Record<string, unknown> = {},
) {
  const input = sourceInput();
  input.content.title = group;
  await createCostSource(p, {
    ...input,
    content: { ...input.content, ...changes },
  });
  return { input, detail: await readCostSource(p, input.id) };
}
async function decide(p: Principal, id: string, action: string) {
  const d = await readCostSource(p, id);
  return decideCostSource(p, id, {
    ...crmBase(),
    expected_version: d.source.version,
    revision_id: d.revision.id,
    action,
  });
}
const effects = async () =>
  (
    await database().query(`SELECT
  (SELECT count(*) FROM ppo.audit_events) audit,
  (SELECT count(*) FROM ppo.operation_receipts) receipts,
  (SELECT count(*) FROM ppo.cost_source_events) events,
  (SELECT count(*) FROM ppo.estimate_versions) estimates`)
  ).rows;

export function registerCostSourceRegisterTests() {
  test("ES03 register follows current revisions and independent decisions without changing originals", async () => {
    const { owner, reviewer } = await actors(),
      q = randomUUID();
    const f = await create(owner, q);
    const oldList = await listCostSources(owner, { q });
    const draft = (await listCostSourceRegister(owner, { q })).items[0];
    assert.equal(draft.state, "Draft");
    assert.deepEqual(draft.tier_1, {
      minimum_quantity: "1.000",
      unit_cost: "100.00",
    });
    await decide(owner, f.input.id, "Submit");
    const own = await listCostSourceRegister(owner, { q });
    assert.equal(own.items[0].your_submission, true);
    assert.equal(own.items[0].can_review, false);
    assert.equal(own.counts.awaiting_my_review, 0);
    const pending = await listCostSourceRegister(reviewer, {
      q,
      view: "awaiting_my_review",
    });
    assert.equal(pending.matching_count, 1);
    assert.equal(pending.items[0].can_review, true);
    assert.equal(pending.items[0].revision_author_id, owner.actor_id);
    await decide(reviewer, f.input.id, "Reviewed");
    const original = await readCostSource(owner, f.input.id);
    await reviseCostSource(owner, f.input.id, {
      ...crmBase(),
      expected_version: 3,
      content: {
        ...f.input.content,
        title: q,
        tiers: [{ minimum_quantity: "7", unit_cost: "0" }],
      },
    });
    const before = await effects();
    const next = await listCostSourceRegister(reviewer, { q });
    assert.equal(next.items[0].revision, 2);
    assert.equal(next.items[0].state, "Draft");
    assert.deepEqual(next.items[0].tier_1, {
      minimum_quantity: "7.000",
      unit_cost: "0.00",
    });
    assert.equal(next.counts.awaiting_my_review, 0);
    assert.deepEqual(
      (
        await readCostSource(owner, f.input.id, {
          revision_id: original.revision.id,
        })
      ).revision,
      original.revision,
    );
    assert.equal(oldList.items[0].revision, 1);
    assert.deepEqual(await effects(), before);
  });

  test("ES03 register counts all search matches before view filters and preserves expiry boundaries", async () => {
    const { owner, reviewer } = await actors(),
      q = randomUUID();
    const today = (await listCostSourceRegister(owner)).validity_date;
    const unknown = await create(owner, q, {
      supplier_label: "SYN 50%_ supplier",
    });
    await decide(owner, unknown.input.id, "Submit");
    const past = await create(owner, q, {
      effective_from: "2000-01-01",
      valid_until: "2000-01-02",
    });
    await decide(owner, past.input.id, "Submit");
    await decide(reviewer, past.input.id, "Returned");
    const current = await create(owner, q, {
      effective_from: "2000-01-01",
      valid_until: today,
    });
    await decide(owner, current.input.id, "Submit");
    await decide(reviewer, current.input.id, "Rejected");
    const before = await effects();
    const result = await listCostSourceRegister(reviewer, {
      q,
      validity: "unknown",
      view: "awaiting_my_review",
      limit: "1",
    });
    assert.equal(result.counts_scope, "AllAuthorisedSearchMatches");
    assert.equal(result.counts.all, 3);
    assert.deepEqual(result.counts.states, {
      Draft: 0,
      Submitted: 1,
      Reviewed: 0,
      Returned: 1,
      Rejected: 1,
    });
    assert.deepEqual(result.counts.validity, { unknown: 1, past: 1 });
    assert.equal(result.matching_count, 1);
    assert.equal(result.items[0].id, unknown.input.id);
    assert.equal(result.items[0].expiry_unknown, true);
    assert.equal(result.next_offset, null);
    assert.equal(
      (await listCostSourceRegister(owner, { q, validity: "past" })).items[0]
        .id,
      past.input.id,
    );
    assert.equal(
      (await listCostSourceRegister(owner, { q, state: "Rejected" })).items[0]
        .expiry_past,
      false,
    );
    assert.equal(
      (await listCostSourceRegister(owner, { q, supplier: "%_" })).counts.all,
      1,
    );
    assert.equal(
      (await listCostSourceRegister(owner, { q: "' OR 1=1 --" })).counts.all,
      0,
    );
    assert.equal(
      (await listCostSourceRegister(owner, { q, company_id: CRM.companyB }))
        .counts.all,
      0,
    );
    assert.deepEqual(await effects(), before);
  });

  test("ES03 register pages beyond 100 with complete counts and stable current-source ordering", async () => {
    const { owner } = await actors(),
      q = randomUUID();
    const created: string[] = [];
    for (let i = 0; i < 101; i++)
      created.push((await create(owner, q)).input.id);
    const before = await effects();
    const first = await listCostSourceRegister(owner, { q, limit: "100" });
    const last = await listCostSourceRegister(owner, {
      q,
      limit: "100",
      offset: String(first.next_offset),
    });
    assert.equal(first.counts.all, 101);
    assert.equal(first.matching_count, 101);
    assert.equal(first.items.length, 100);
    assert.equal(first.next_offset, 100);
    assert.equal(last.items.length, 1);
    assert.equal(last.next_offset, null);
    assert.deepEqual(
      [...first.items, ...last.items].map((x) => x.id),
      [...created].reverse(),
    );
    assert.deepEqual(
      (await listCostSourceRegister(owner, { q, limit: "100" })).items,
      first.items,
    );
    assert.equal(
      (await listCostSourceRegister(owner, { q, offset: "1000" })).counts.all,
      101,
    );
    assert.deepEqual(await effects(), before);
  });

  test("ES03 register refuses inactive actors and excludes foreign company, site-only and expired grants", async () => {
    const { owner, reviewer } = await actors(),
      q = randomUUID();
    const f = await create(owner, q);
    await decide(owner, f.input.id, "Submit");
    const other = (await createSession("second-company")).principal;
    assert.equal((await listCostSourceRegister(other, { q })).counts.all, 0);
    assert.equal(
      (
        await withWorkingCompany(owner.actor_id, CRM.companyB, () =>
          listCostSourceRegister(owner, { q }),
        )
      ).counts.all,
      0,
    );
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.source.review'",
      [reviewer.actor_id],
    );
    try {
      const result = await listCostSourceRegister(reviewer, {
        q,
        view: "awaiting_my_review",
      });
      assert.equal(result.counts.all, 1);
      assert.equal(result.counts.awaiting_my_review, 0);
      assert.equal(result.items.length, 0);
    } finally {
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='estimating.source.review'",
        [reviewer.actor_id],
      );
    }
    const grants = (
      await database().query(
        "UPDATE ppo.permission_grants SET scope_type='Site',scope_id=$2,site_id=$2 WHERE user_id=$1 AND capability='shared.read' RETURNING id",
        [reviewer.actor_id, CRM.site],
      )
    ).rows;
    try {
      assert.equal(
        (await listCostSourceRegister(reviewer, { q })).counts.all,
        0,
      );
    } finally {
      await database().query(
        "UPDATE ppo.permission_grants SET scope_type='Company',scope_id=company_id,site_id=NULL WHERE id=ANY($1::uuid[])",
        [grants.map((g) => g.id)],
      );
    }
    await database().query("UPDATE ppo.users SET active=false WHERE id=$1", [
      reviewer.actor_id,
    ]);
    try {
      await assert.rejects(listCostSourceRegister(reviewer, { q }), {
        code: "Forbidden",
      });
    } finally {
      await database().query("UPDATE ppo.users SET active=true WHERE id=$1", [
        reviewer.actor_id,
      ]);
    }
  });

  test("ES03 register rechecks counts, review affordances and lookahead after hydration", async (t) => {
    const { owner, reviewer } = await actors(),
      q = randomUUID();
    const f = await create(owner, q);
    await decide(owner, f.input.id, "Submit");
    const second = await create(owner, q);
    await decide(owner, second.input.id, "Submit");
    assert.equal(
      (await listCostSourceRegister(reviewer, { q, limit: "1" })).next_offset,
      1,
    );
    // Interpose only the timing of a real PostgreSQL read; grants are actually revoked
    // through a second connection. No mocked rows or permission outcomes.
    const original = pg.Client.prototype.query;
    for (const capability of [
      "estimating.source.review",
      "shared.read",
      "estimating.read",
    ]) {
      let triggered = false;
      const hook = t.mock.method(
        pg.Client.prototype,
        "query",
        function (this: pg.Client, ...args: unknown[]) {
          const result = Reflect.apply(original, this, args);
          if (
            !triggered &&
            typeof args[0] === "string" &&
            args[0].startsWith("SELECT * FROM ppo.cost_source_revisions")
          ) {
            triggered = true;
            return Promise.resolve(result).then(async (value) => {
              await database().query(
                "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability=$2",
                [reviewer.actor_id, capability],
              );
              return value;
            });
          }
          return result;
        },
      );
      try {
        await assert.rejects(
          listCostSourceRegister(reviewer, { q, limit: "1" }),
          {
            code:
              capability === "estimating.source.review"
                ? "CostSourceRegisterChanged"
                : "Forbidden",
          },
        );
        assert.equal(triggered, true);
      } finally {
        hook.mock.restore();
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability=$2",
          [reviewer.actor_id, capability],
        );
      }
    }
  });
}
