import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFileSync } from "node:fs";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { database, closeDatabase } from "../../src/platform/database";
import { customer360 } from "../../src/shared/customer-360";
import { withWorkingCompany } from "../../src/platform/working-company";
import type { Principal } from "../../src/platform/identity";
import { customer360PerRow } from "../helpers/customer-360-per-row";
import { customer360Fixture, customer360FinanceFixture } from "../helpers/customer-360-fixture";
import { CRM } from "../helpers/crm";
import { readAccount } from "../../src/finance/accounts";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);

test("Customer 360 full DTO and JSON preserve per-row authority across principals, expiry, revocation and working company", async (t) => {
  const f = await customer360Fixture();
  // Freeze only the observation clock; PostgreSQL still evaluates live grants.
  t.mock.timers.enable({ apis: ["Date"], now: new Date() });
  async function equivalent(p: Principal, id = CRM.org) {
    const expected = await customer360PerRow(p, id),
      actual = await customer360(p, id);
    assert.deepEqual(actual, expected);
    assert.equal(JSON.stringify(actual), JSON.stringify(expected));
    for (const [key, section] of Object.entries(actual.sections))
      assert.notEqual(section.state, "Unavailable", key);
    return actual;
  }
  const broad = await equivalent(f.broad),
    site = await equivalent(f.siteOnly),
    expired = await equivalent(f.expired);
  assert.equal(broad.sections.quotations.items.length, 16);
  assert.equal(site.sections.quotations.items.length, 8);
  assert.equal(expired.sections.quotations.items.length, 8);
  assert.equal(expired.sections.projects.state, "Restricted");
  assert.ok(
    broad.sections.projects.items.length > site.sections.projects.items.length,
  );
  assert.ok(
    broad.sections.activities.items.length >
      site.sections.activities.items.length,
  );
  assert.ok(
    broad.sections.work_orders.items.length >
      site.sections.work_orders.items.length,
  );
  assert.ok(!broad.sections.deals.items.some((x) => x.id === f.otherDeal));
  assert.ok(
    (await equivalent(f.other, CRM.orgB)).sections.deals.items.some(
      (x) => x.id === f.otherDeal,
    ),
  );
  await withWorkingCompany(f.broad.actor_id, CRM.company, () =>
    equivalent(f.broad),
  );
  for (const read of [customer360PerRow, customer360])
    await assert.rejects(
      withWorkingCompany(f.broad.actor_id, CRM.companyB, () =>
        read(f.broad, CRM.org),
      ),
      (e: unknown) => (e as { status: number }).status === 404,
    );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.quote.read' AND valid_to IS NULL",
    [f.broad.actor_id],
  );
  const revoked = await equivalent(f.broad);
  assert.equal(
    revoked.sections.quotations.items.filter(
      (x) => x.record_kind === "Quotation",
    ).length,
    0,
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='shared.read' AND valid_to IS NULL",
    [f.siteOnly.actor_id],
  );
  for (const read of [customer360PerRow, customer360])
    await assert.rejects(
      read(f.siteOnly, CRM.org),
      (e: unknown) => (e as { status: number }).status === 403,
    );
  // The oracle is deliberately retained as source, not a mode in production.
  assert.ok(
    readFileSync(
      new URL("../helpers/customer-360-per-row.ts", import.meta.url),
      "utf8",
    ).includes("for (const candidate of candidates.slice(0, 100))"),
  );
});

test("Customer 360 Finance DTO and JSON preserve current and stale mappings with retained account runs", async (t) => {
  await reset();
  const f = await customer360FinanceFixture();
  t.mock.timers.enable({ apis: ["Date"], now: new Date() });
  const expected = await customer360PerRow(f.principal, CRM.org),
    actual = await customer360(f.principal, CRM.org);
  assert.deepEqual(actual, expected);
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
  const accounts = actual.sections.accounts;
  assert.notEqual(accounts.state, "Restricted");
  assert.notEqual(accounts.state, "Unavailable");
  for (const id of [f.currentAccount, f.staleAccount])
    assert.ok(accounts.items.some(account => account.id === id));
  const current = accounts.items.find(account => account.id === f.currentAccount)!,
    stale = accounts.items.find(account => account.id === f.staleAccount)!;
  assert.equal(current.amount, "1000.00");
  assert.equal(current.state, "Fixture source reconciled");
  assert.equal(stale.amount, null);
  assert.equal(stale.state, "Current account verification unavailable; original observations retained");
  for (const id of [f.currentAccount, f.staleAccount]) {
    const account = await readAccount(f.principal, CRM.org, { account_id: id });
    assert.deepEqual(account.history.map(run => run.fixture), ["F-03", "F-01"]);
    assert.equal(account.current?.id, account.history[0].id);
    assert.equal(account.last_good?.id, account.history[0].id);
    if (id === f.staleAccount)
      assert.equal(account.context_error, "The exact synthetic account verification no longer matches its source mapping.");
    else assert.equal(account.context_error, null);
  }
});

test("Customer 360 preserves 100-candidate windows, per-estimate revision limits and the activity continuation", async (t) => {
  await reset();
  const f = await customer360Fixture(101);
  const { readEstimate } = await import("../../src/estimating/reads");
  const { prepareQuote } = await import("../../src/estimating/service");
  const { quoteCommand } = await import("../helpers/estimating");
  const estimate = await readEstimate(f.broad, [...f.estimates].sort()[0]);
  for (let version = 1; version <= 100; version++)
    await prepareQuote(
      f.broad,
      estimate.id,
      quoteCommand(estimate.saved, estimate.version, version),
    );
  t.mock.timers.enable({ apis: ["Date"], now: new Date() });
  const expected = await customer360PerRow(f.broad, CRM.org),
    actual = await customer360(f.broad, CRM.org);
  assert.deepEqual(actual, expected);
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
  assert.equal(actual.sections.deals.items.length, 100);
  assert.equal(actual.sections.deals.state, "Partial");
  assert.equal(actual.sections.projects.items.length, 100);
  assert.equal(
    actual.sections.quotations.items.filter((x) => x.record_kind === "Estimate")
      .length,
    100,
  );
  assert.equal(
    actual.sections.quotations.items.filter(
      (x) => x.record_kind === "Quotation",
    ).length,
    199,
  );
  assert.equal(actual.sections.activities.items.length, 100);
  assert.ok(actual.sections.activities.next_cursor);
  assert.equal(actual.sections.activities.state, "Partial");
});
