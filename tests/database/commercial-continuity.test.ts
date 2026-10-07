import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import {
  opportunityCommercial,
  readEstimate,
} from "../../src/estimating/reads";
import { prepareQuote } from "../../src/estimating/service";
import { prepareRelease } from "../../src/estimating/release/service";
import { readRelease } from "../../src/estimating/release/reads";
import {
  costed,
  discoveryCostSetup,
  reviseCostDiscovery,
  selectCostOption,
} from "../helpers/estimating-cost-basis";
import { quoteCommand } from "../helpers/estimating";
import { releaseFixture, preparation } from "../helpers/quotation-release";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);

test("LC-14 Deal lists exact quotations from both independently costed alternatives without changing the stable primary or any native fact", async () => {
  const a = await costed(await discoveryCostSetup());
  const qa = quoteCommand(a.estimate.saved);
  await prepareQuote(a.p, a.estimate.id, qa);
  const primary = (await opportunityCommercial(a.p, a.o.id)).estimate;
  const branch = await reviseCostDiscovery(a, undefined, true);
  await selectCostOption(a, branch.new_option_id!);
  const b = await costed(a);
  const qb = quoteCommand(b.estimate.saved);
  await prepareQuote(b.p, b.estimate.id, qb);
  const tables = [
    "estimates",
    "estimate_versions",
    "draft_quotes",
    "draft_quote_revisions",
    "opportunities",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
  ];
  const snapshot = () =>
    Promise.all(
      tables.map((t) =>
        database()
          .query(
            `SELECT to_jsonb(t) row FROM ppo.${t} t ORDER BY to_jsonb(t)::text`,
          )
          .then((r) => r.rows),
      ),
    );
  const before = await snapshot();
  const result = await opportunityCommercial(a.p, a.o.id);
  assert.deepEqual(result.estimate, primary);
  assert.deepEqual(
    result.quotes.map((q) => [
      q.id,
      q.estimate_id,
      q.estimate_version_id,
      q.option_label,
      q.release,
    ]),
    [
      [qa.id, a.estimate.id, a.estimate.saved.id, "A", false],
      [qb.id, b.estimate.id, b.estimate.saved.id, "B", false],
    ],
  );
  assert.deepEqual(await snapshot(), before);
  assert.equal((await readEstimate(a.p, a.estimate.id)).quotes[0].id, qa.id);
  const other = (await createSession("second-company")).principal;
  await assert.rejects(opportunityCommercial(other, a.o.id));
});

test("LC-14 Deal preserves release identity and render state while quote access revocation hides every quotation", async () => {
  const f = await releaseFixture();
  const release = preparation(await readRelease(f.owner, f.draft.id));
  await prepareRelease(f.owner, f.draft.id, release);
  const d = await opportunityCommercial(f.owner, f.o.id);
  assert.deepEqual(
    d.quotes.map((q) => [q.id, q.release, q.render_state]),
    [
      [release.id, true, "Pending"],
      [f.draft.id, false, "Pending"],
    ],
  );
  assert.ok(
    d.quotes.every(
      (q) =>
        q.estimate_id === f.input.id &&
        q.estimate_version_id === f.estimate.saved.id,
    ),
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='estimating.quote.read'",
    [f.owner.workspace_id, f.owner.actor_id],
  );
  const hidden = await opportunityCommercial(f.owner, f.o.id);
  assert.equal(hidden.estimate?.id, f.input.id);
  assert.deepEqual(hidden.quotes, []);
});
