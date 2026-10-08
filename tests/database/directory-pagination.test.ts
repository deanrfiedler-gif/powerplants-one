import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { closeDatabase } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { createOrganisation } from "../../src/shared/commands";
import { createOpportunity } from "../../src/crm/opportunities";
import { readDirectory } from "../../src/crm/directory";
import { CRM, crmBase, crmCreate } from "../helpers/crm";

assert.equal(localConfig().database_name, "ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

test("organisation page counts preserve complete totals, count sorting and company isolation", async () => {
  const p = (await createSession("coordinator")).principal;
  const ids: string[] = [];
  // Push the existing customer with relationships beyond the default first page.
  for (let n = 0; n < 51; n++) {
    const id = randomUUID();
    ids.push(id);
    await createOrganisation(p, {
      ...crmBase(),
      id,
      company_id: CRM.company,
      owner_id: CRM.owner,
      display_name: `AAA SYN directory page ${String(n).padStart(2, "0")}`,
      relationship_status: "Prospect",
    });
  }
  await createOpportunity(p, crmCreate());
  const all = await readDirectory(p, { kind: "organisations", limit: 100 });
  const customer = all.items.find((row) => row.id === CRM.org)!;
  assert.ok(customer.sites > 0);
  assert.ok(customer.facilities > 0);
  assert.equal(customer.deals, 1);
  const pages = await Promise.all(
    [1, 2, 3].map((page) => readDirectory(p, { kind: "organisations", page })),
  );
  assert.ok(pages.every((page) => page.total === all.total));
  assert.deepEqual(
    pages.flatMap((page) => page.items),
    all.items,
  );
  assert.ok(!pages[0].items.some((row) => row.id === CRM.org));
  for (const sort of ["sites", "facilities", "deals"] as const) {
    const sorted = await readDirectory(p, {
      kind: "organisations",
      sort,
      direction: "desc",
    });
    assert.equal(sorted.total, all.total);
    assert.deepEqual(
      sorted.items.find((row) => row.id === CRM.org),
      customer,
    );
    assert.ok(sorted.items[0][sort] > 0);
    assert.ok(
      sorted.items.every(
        (row, i) => i === 0 || sorted.items[i - 1][sort] >= row[sort],
      ),
    );
  }
  const filtered = await readDirectory(p, {
    kind: "organisations",
    q: "AAA SYN directory page",
    page: 3,
  });
  assert.equal(filtered.total, 51);
  assert.equal(filtered.items.length, 1);
  assert.equal(filtered.items[0].id, ids[50]);
  const other = await readDirectory(
    (await createSession("second-company")).principal,
    { kind: "organisations", limit: 100 },
  );
  assert.ok(
    other.items.every((row) => !ids.includes(row.id) && row.id !== CRM.org),
  );
});
