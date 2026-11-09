import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import { createSite } from "../../src/shared/commands";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate, prepareQuote } from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import { readRelease } from "../../src/estimating/release/reads";
import { prepareRelease } from "../../src/estimating/release/service";
import { readEstimatingReviewQueue } from "../../src/estimating/review/queue";
import { readEstimatingReviewQueue as mainQueue } from "../helpers/estimate-review-queue-main";
import { CRM, crmBase, crmCreate } from "../helpers/crm";
import { estimateInput, quoteCommand } from "../helpers/estimating";
import { reviewed, preparation } from "../helpers/quotation-release";

assert.equal(localConfig().database_name, "ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";

async function fixture() {
  const owner = (await createSession("coordinator")).principal;
  const reviewer = (await createSession("estimating-source-reviewer"))
    .principal;
  const partial = (await createSession("quotation-approver")).principal;
  const issuer = (await createSession("quotation-issuer")).principal;
  const title = `SYN Candidate authority ${randomUUID()}`;
  const hiddenSite = randomUUID();
  await createSite(owner, {
    ...crmBase(),
    id: hiddenSite,
    company_id: CRM.company,
    display_name: "SYN Hidden candidate site",
    location_description: "Synthetic comparison only",
    timezone: "Australia/Brisbane",
    owner_id: owner.actor_id,
    parties: [
      {
        organisation_id: CRM.org,
        role: "Operator",
        valid_from: "2026-01-01T00:00:00Z",
      },
    ],
  });
  const visible = new Set<string>(),
    hidden = new Set<string>();
  for (let i = 0; i < 29; i++) {
    const isHidden = [1, 14, 27].includes(i);
    const o = { ...crmCreate(), site_id: isHidden ? hiddenSite : CRM.site };
    await createOpportunity(owner, o);
    const input = { ...estimateInput(o.id), title };
    await createEstimate(owner, input);
    await reviewed(owner, reviewer, input.id);
    const d = await readEstimate(owner, input.id),
      draft = quoteCommand(d.saved);
    await prepareQuote(owner, input.id, draft);
    await prepareRelease(
      owner,
      draft.id,
      preparation(await readRelease(owner, draft.id)),
    );
    (isHidden ? hidden : visible).add(input.id);
  }
  assert.equal(visible.size, 26);
  assert.equal(hidden.size, 3);
  const grants = (
    await database().query(
      `SELECT id,scope_type,scope_id,company_id,site_id FROM ppo.permission_grants
    WHERE user_id=$1 AND capability IN ('estimating.read','estimating.quote.read')`,
      [partial.actor_id],
    )
  ).rows;
  assert.equal(grants.length, 2);
  // Narrow two existing synthetic grants; add no capability or grant.
  await database().query(
    `UPDATE ppo.permission_grants SET scope_type='Site',site_id=$2,scope_id=$2
      WHERE user_id=$1 AND capability IN ('estimating.read','estimating.quote.read')`,
    [partial.actor_id, CRM.site],
  );

  return { owner, partial, issuer, title, visible, hidden, grants };
}

let f: Awaited<ReturnType<typeof fixture>>;
before(async () => {
  await reset();
  f = await fixture();
});
after(async () => {
  if (f) {
    const { grants } = f;

    for (const g of grants)
      await database().query(
        "UPDATE ppo.permission_grants SET scope_type=$2,company_id=$3,site_id=$4,scope_id=$5 WHERE id=$1",
        [g.id, g.scope_type, g.company_id, g.site_id, g.scope_id],
      );
  }
  await closeDatabase();
});

for (const profile of ["owner", "partial", "issuer"] as const) {
  for (const source of ["all", "estimates", "quotations"]) {
    for (const search of [true, false]) {
      test(`frozen main equivalence: ${profile}, ${source}, search=${search}`, async () => {
        const { partial, visible, hidden } = f;
        const p = f[profile],
          q = search ? f.title : "";
        const results = [];
        for (const offset of [0, 25, 100]) {
          const input = { source, q, offset: String(offset) };
          const expected = await mainQueue(p, input);
          const actual = await readEstimatingReviewQueue(p, input);
          const { as_of: expectedTime, ...expectedStable } = expected;
          const { as_of: actualTime, ...actualStable } = actual;
          assert.ok(expectedTime && actualTime);
          assert.deepEqual(actualStable, expectedStable);
          assert.equal(
            JSON.stringify(actualStable),
            JSON.stringify(expectedStable),
          );
          assert.equal(actual.completeness, "CompleteWindow");
          assert.equal(
            actual.quotation_source,
            source === "estimates" ? "NotRequested" : "Available",
          );
          if (offset === 100) {
            assert.equal(actual.items.length, 0);
            assert.equal(actual.next_offset, null);
          } else {
            assert.ok(actual.items.length > 0);
            assert.ok(
              actual.items.every((r) => r.state !== ("Restricted" as string)),
            );
            if (source === "estimates") {
              assert.equal(
                actual.items.length,
                offset === 0 ? 75 : p === partial ? 3 : 12,
              );
              assert.ok(actual.items.some((r) => r.kind === "Technical"));
              assert.ok(actual.items.every((r) => r.state === "Reviewed"));
            }
            if (source === "quotations") {
              assert.equal(
                actual.items.length,
                offset === 0 ? 25 : p === partial ? 1 : 4,
              );
              assert.ok(
                actual.items.every(
                  (r) =>
                    r.kind === "QuotationApproval" &&
                    r.state === "Output pending",
                ),
              );
            }
            assert.equal(
              actual.next_offset,
              offset === 0 || source === "all" ? offset + 25 : null,
            );
            if (p === partial)
              assert.ok(
                actual.items.every(
                  (r) =>
                    visible.has(r.estimate_id) && !hidden.has(r.estimate_id),
                ),
              );
          }
          results.push(actual);
        }
        if (p === partial && source !== "all") {
          const ids = new Set(
            results.flatMap((r) => r.items.map((i) => i.estimate_id)),
          );
          assert.deepEqual(ids, visible);
          // Exactly 25 visible candidates precede the final visible one;
          // three interleaved hidden candidates never consume an offset.
          assert.equal(
            new Set(results[0].items.map((i) => i.estimate_id)).size,
            25,
          );
          assert.equal(
            new Set(results[1].items.map((i) => i.estimate_id)).size,
            1,
          );
          assert.equal(results[1].next_offset, null);
        }
      });
    }
  }
}

for (const outcome of ["commit", "rollback"] as const) {
  test(`queue disables JIT exactly once and restores the same pooled client on ${outcome}`, async (t) => {
    const original = pg.Client.prototype.query;
    const before: string[] = [],
      during: string[] = [],
      after: string[] = [];
    const clients = new Set<pg.Client>();
    let settings = 0;
    const failure = new Error(
      "SYN candidate failure to prove rollback restoration",
    );
    t.mock.method(pg.Client.prototype, "query", function (
      this: pg.Client,
      ...args: unknown[]
    ) {
      const sql = args[0];
      if (sql === "SET LOCAL jit = off") {
        settings++;
        clients.add(this);
        return Reflect.apply(original, this, ["SHOW jit"]).then(
          (r: { rows: { jit: string }[] }) => {
            before.push(r.rows[0].jit);
            return Reflect.apply(original, this, args);
          },
        );
      }
      if (
        clients.has(this) &&
        typeof sql === "string" &&
        sql.includes("WITH candidates AS")
      ) {
        return Reflect.apply(original, this, ["SHOW jit"]).then(
          (r: { rows: { jit: string }[] }) => {
            during.push(r.rows[0].jit);
            if (outcome === "rollback") throw failure;
            return Reflect.apply(original, this, args);
          },
        );
      }
      const result = Reflect.apply(original, this, args);
      if (clients.has(this) && sql === outcome.toUpperCase()) {
        // Observe this exact connection before transaction() releases it to the
        // pool; a SHOW on some other pooled connection would be a weak proof.
        return result.then((value: unknown) =>
          Reflect.apply(original, this, ["SHOW jit"]).then(
            (r: { rows: { jit: string }[] }) => {
              after.push(r.rows[0].jit);
              return value;
            },
          ),
        );
      }
      return result;
    } as typeof original);
    const read = () =>
      readEstimatingReviewQueue(f.owner, {
        q: f.title,
        source: "estimates",
        offset: "25",
      });
    if (outcome === "rollback")
      await assert.rejects(read, (e) => e === failure);
    else {
      const result = await read();
      assert.equal(result.items.length, 12);
      assert.equal(result.next_offset, null);
      assert.equal(result.completeness, "CompleteWindow");
    }
    assert.equal(settings, 1);
    assert.equal(clients.size, 1);
    assert.deepEqual(before, ["on"]);
    assert.deepEqual(during, ["off"]);
    assert.equal(after.length, 1);
    assert.deepEqual(after, before);
  });
}
