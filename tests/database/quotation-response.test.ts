import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase, transaction } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset, migrate, seed } from "../../scripts/database";
import { createSession } from "../../src/platform/identity";
import { readResponse } from "../../src/estimating/response/reads";
import {
  recordResponse,
  recordClarification,
  prepareResponseHandover,
} from "../../src/estimating/response/service";
import { readOperation } from "../../src/shared/receipts";
import { readRelease } from "../../src/estimating/release/reads";
import { prepareRelease } from "../../src/estimating/release/service";
import { draftBytes, retryQuote } from "../../src/estimating/worker";
import { saveEstimate } from "../../src/estimating/service";
import {
  responseFixture,
  response,
  responseCommand,
} from "../helpers/quotation-response";
import {
  releaseFixture,
  prepared,
  issued,
  preparation,
} from "../helpers/quotation-release";
import { crmBase, CRM } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const code = (s: string) => (e: unknown) => (e as { code: string }).code === s;
test("ES06 exact acceptance, owned preparation, immutable correction, receipt recovery and original Draft/issued bytes", async () => {
  const f = await responseFixture();
  await retryQuote(f.owner, f.draft.id);
  const bytes = await draftBytes(f.owner, f.id),
    draft = await draftBytes(f.owner, f.draft.id),
    command = response(f.d),
    r = await recordResponse(f.owner, f.id, command);
  let d = await readResponse(f.owner, f.id);
  assert.equal(d.state.ready, true);
  assert.equal(d.events[0].created_by, f.owner.actor_id);
  assert.equal(d.events[0].report!.respondent, "Fictional Pat");
  assert.ok(
    d.events[0].created_at.getTime() >= Date.parse(command.report.responded_at),
  );
  const prep = {
    ...responseCommand(d),
    owner_id: f.owner.actor_id,
    due_date: "2026-10-10",
    note: "SYN ES07 authority and target review outstanding",
  };
  const receipt = await prepareResponseHandover(f.owner, f.id, prep);
  d = await readResponse(f.owner, f.id);
  assert.equal(d.state.preparedApplicable, true);
  await assert.rejects(
    prepareResponseHandover(f.owner, f.id, { ...prep, ...responseCommand(d) }),
    code("ResponseConflict"),
  );
  const correction = {
    ...response(d, "Declined"),
    action: "Correct",
    reason: "SYN original acceptance entered in error",
  };
  await recordResponse(f.owner, f.id, correction);
  d = await readResponse(f.owner, f.id);
  assert.equal(d.events[0].report!.outcome, "Accepted");
  assert.equal(d.events[2].response_id, d.events[0].id);
  assert.equal(d.state.preparedApplicable, false);
  assert.deepEqual(
    (await recordResponse(f.owner, f.id, command)).receipt,
    r.receipt,
  );
  assert.deepEqual(
    await readOperation(f.owner, prep.operation_id),
    receipt.receipt,
  );
  await assert.rejects(
    recordResponse(f.owner, f.id, { ...command, reason: "changed payload" }),
    code("OperationConflict"),
  );
  for (const sql of [
    "UPDATE ppo.quote_response_events SET reason='overwrite' WHERE revision_id=$1",
    "DELETE FROM ppo.quote_response_events WHERE revision_id=$1",
  ])
    await assert.rejects(database().query(sql, [f.id]), code("55000"));
  assert.deepEqual(await draftBytes(f.owner, f.id), bytes);
  assert.deepEqual(await draftBytes(f.owner, f.draft.id), draft);
});
test("ES06 information clarification requires exact answer and attributable confirmation; conditional acceptance holds preparation", async () => {
  const f = await responseFixture();
  await recordResponse(f.owner, f.id, response(f.d, "Clarification"));
  let d = await readResponse(f.owner, f.id);
  await assert.rejects(
    recordResponse(f.owner, f.id, response(d)),
    code("ResponseConflict"),
  );
  await assert.rejects(
    recordClarification(f.owner, f.id, {
      ...responseCommand(d),
      action: "Confirm",
      detail: {
        respondent: "Pat",
        claimed_role: "Buyer",
        responded_at: new Date().toISOString(),
      },
    }),
    code("ResponseConflict"),
  );
  await recordClarification(f.owner, f.id, {
    ...responseCommand(d),
    action: "Answer",
    detail: { answer: "SYN unchanged included scope explained" },
  });
  d = await readResponse(f.owner, f.id);
  await recordClarification(f.owner, f.id, {
    ...responseCommand(d),
    action: "Confirm",
    detail: {
      respondent: "Pat",
      claimed_role: "Buyer",
      responded_at: new Date().toISOString(),
    },
  });
  d = await readResponse(f.owner, f.id);
  const accepted = response(d);
  accepted.report.conditions = "SYN subject to delivery confirmation";
  await recordResponse(f.owner, f.id, accepted);
  d = await readResponse(f.owner, f.id);
  assert.equal(d.state.ready, false);
  await assert.rejects(
    prepareResponseHandover(f.owner, f.id, {
      ...responseCommand(d),
      owner_id: f.owner.actor_id,
      due_date: "2026-10-10",
      note: "SYN",
    }),
    code("ResponseConflict"),
  );
  await recordResponse(f.owner, f.id, response(d));
  assert.equal((await readResponse(f.owner, f.id)).state.ready, true);
});
test("ES06 material negotiation cannot be silently cleared and explicit ES05 successor inherits no response", async () => {
  const f = await responseFixture(),
    oldBytes = await draftBytes(f.owner, f.id);
  const original = response(f.d, "Negotiation"),
    r = await recordResponse(f.owner, f.id, original);
  let d = await readResponse(f.owner, f.id);
  await recordResponse(f.owner, f.id, { ...response(d), action: "Correct" });
  d = await readResponse(f.owner, f.id);
  assert.equal(d.state.material, true);
  assert.equal(d.state.ready, false);
  await assert.rejects(
    recordResponse(f.owner, f.id, response(d)),
    code("ResponseConflict"),
  );
  const next = preparation(await readRelease(f.owner, f.id));
  await prepareRelease(f.owner, f.id, next);
  await retryQuote(f.owner, next.id);
  await issued(f, next.id);
  assert.equal((await readResponse(f.owner, f.id)).current, false);
  const fresh = await readResponse(f.owner, next.id);
  assert.equal(fresh.events.length, 0);
  assert.equal(fresh.base.predecessor_issue_id, f.d.issue.id);
  await recordResponse(f.owner, next.id, response(fresh));
  assert.equal((await readResponse(f.owner, next.id)).state.ready, true);
  assert.deepEqual(
    (await recordResponse(f.owner, f.id, original)).receipt,
    r.receipt,
  );
  assert.deepEqual(await draftBytes(f.owner, f.id), oldBytes);
});
test("ES06 unrelated source change and unissued preparation retain offer applicability; actual successor holds original preparation", async () => {
  const f = await responseFixture();
  await recordResponse(f.owner, f.id, response(f.d));
  let d = await readResponse(f.owner, f.id);
  await prepareResponseHandover(f.owner, f.id, {
    ...responseCommand(d),
    owner_id: f.owner.actor_id,
    due_date: "2026-10-10",
    note: "SYN",
  });
  const next = preparation(await readRelease(f.owner, f.id));
  await prepareRelease(f.owner, f.id, next);
  assert.equal(
    (await readResponse(f.owner, f.id)).state.preparedApplicable,
    true,
  );
  await retryQuote(f.owner, next.id);
  await issued(f, next.id);
  d = await readResponse(f.owner, f.id);
  assert.equal(d.state.preparedApplicable, false);
  await assert.rejects(
    recordResponse(f.owner, f.id, response(d)),
    code("ResponseConflict"),
  );
  await recordResponse(f.owner, f.id, { ...response(d), action: "Correct" });
  assert.equal((await readResponse(f.owner, f.id)).state.ready, false);
  const fresh = await readResponse(f.owner, next.id);
  await recordResponse(f.owner, next.id, response(fresh));
  await saveEstimate(f.owner, f.input.id, {
    ...crmBase(),
    expected_version: 1,
    title: f.input.title,
    scope: f.input.scope,
    lines: f.input.lines.map((l) => ({ ...l, unit_cost: "50.00" })),
    policy: f.input.policy,
  });
  assert.equal((await readResponse(f.owner, next.id)).state.ready, true);
  assert.equal((await readRelease(f.owner, next.id)).current, false);
});
test("ES06 same original concurrency converges; different submissions conflict; wrong issue and time are refused", async () => {
  const f = await responseFixture(),
    command = response(f.d);
  await assert.rejects(
    recordResponse(f.owner, f.id, { ...command, issue_id: randomUUID() }),
    code("ResponseConflict"),
  );
  await assert.rejects(
    recordResponse(f.owner, f.id, {
      ...command,
      report: { ...command.report, responded_at: "2100-01-01T00:00:00Z" },
    }),
    code("InvalidData"),
  );
  const races = await Promise.all([
    recordResponse(f.owner, f.id, command),
    recordResponse(f.owner, f.id, command),
  ]);
  assert.deepEqual(races[0].receipt, races[1].receipt);
  assert.equal(races.filter((x) => x.replayed).length, 1);
  const d = await readResponse(f.owner, f.id),
    a = response(d, "Declined"),
    b = response(d, "Clarification");
  const outcomes = await Promise.allSettled([
    recordResponse(f.owner, f.id, a),
    recordResponse(f.owner, f.id, b),
  ]);
  assert.equal(outcomes.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await readResponse(f.owner, f.id)).events.length, 2);
});
test("ES06 current role, company, original recipient and receipt authority are enforced", async () => {
  const f = await responseFixture(),
    command = response(f.d),
    r = await recordResponse(f.owner, f.id, command);
  await assert.rejects(
    recordResponse(
      f.approver,
      f.id,
      response(await readResponse(f.approver, f.id)),
    ),
    code("RecordUnavailable"),
  );
  const other = (await createSession("second-company")).principal;
  await assert.rejects(readResponse(other, f.id));
  const grants = (
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='estimating.quote.prepare' RETURNING *",
      [f.owner.actor_id],
    )
  ).rows;
  try {
    await assert.rejects(recordResponse(f.owner, f.id, command));
    await assert.rejects(readOperation(f.owner, command.operation_id));
    assert.equal((await readResponse(f.owner, f.id)).can_record, false);
  } finally {
    for (const g of grants)
      await database().query(
        "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_record(NULL::ppo.permission_grants,$1)",
        [JSON.stringify(g)],
      );
  }
  await database().query(
    "UPDATE ppo.relationships SET valid_to=CURRENT_DATE WHERE organisation_id=$1 AND person_id=$2",
    [CRM.org, CRM.person],
  );
  try {
    await assert.rejects(readResponse(f.owner, f.id));
    await assert.rejects(readOperation(f.owner, command.operation_id));
    await assert.rejects(recordResponse(f.owner, f.id, command));
    await assert.rejects(draftBytes(f.owner, f.id));
  } finally {
    await database().query(
      "UPDATE ppo.relationships SET valid_to=NULL WHERE organisation_id=$1 AND person_id=$2",
      [CRM.org, CRM.person],
    );
  }
  assert.deepEqual(
    await readOperation(f.owner, command.operation_id),
    r.receipt,
  );
});
test("ES06 deferred atomic evidence guard rolls back a command after late failure", async () => {
  const f = await responseFixture(),
    command = response(f.d);
  await database().query(
    "CREATE FUNCTION ppo.es06_fail_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.operation_id='" +
      command.operation_id +
      "'::uuid THEN RAISE EXCEPTION 'SYN late failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER es06_fail_receipt BEFORE INSERT ON ppo.operation_receipts FOR EACH ROW EXECUTE FUNCTION ppo.es06_fail_receipt()",
  );
  try {
    await assert.rejects(
      recordResponse(f.owner, f.id, command),
      /SYN late failure/,
    );
    assert.equal((await readResponse(f.owner, f.id)).events.length, 0);
  } finally {
    await database().query(
      "DROP TRIGGER es06_fail_receipt ON ppo.operation_receipts; DROP FUNCTION ppo.es06_fail_receipt()",
    );
  }
  const result = await recordResponse(f.owner, f.id, command);
  assert.equal(result.replayed, false);
});
test("ES06 missing output holds a new response but cannot erase or prevent authorised original receipt recovery", async () => {
  const f = await responseFixture(),
    command = response(f.d),
    result = await recordResponse(f.owner, f.id, command);
  const d = await readResponse(f.owner, f.id),
    next = response(d, "Declined"),
    originalDirectory = process.env.PPO_DOCUMENT_DIRECTORY;
  process.env.PPO_DOCUMENT_DIRECTORY =
    join(tmpdir(), "ppo-es06-missing-" + randomUUID());
  try {
    await assert.rejects(
      recordResponse(f.owner, f.id, next),
      code("ExactDocumentUnavailable"),
    );
    assert.deepEqual(
      (await recordResponse(f.owner, f.id, command)).receipt,
      result.receipt,
    );
    assert.deepEqual(
      await readOperation(f.owner, command.operation_id),
      result.receipt,
    );
    assert.equal((await readResponse(f.owner, f.id)).events.length, 1);
  } finally {
    if (originalDirectory === undefined) delete process.env.PPO_DOCUMENT_DIRECTORY;
    else process.env.PPO_DOCUMENT_DIRECTORY = originalDirectory;
  }
});
test("ES06 direct insert needs exact issue/hash and deferred atomic evidence", async () => {
  const f = await responseFixture(),
    command = response(f.d);
  const insert = (hash: string, report: unknown = command.report, client: Pick<ReturnType<typeof database>, "query"> = database()) =>
    client.query(
      `INSERT INTO ppo.quote_response_events
    (id,workspace_id,quote_id,revision_id,issue_id,sequence,action,response_id,output_hash,report,detail,evidence,reason,created_by,operation_id)
    VALUES($1,$2,$3,$4,$5,1,'Record',NULL,$6,$7,'{}','SYN','SYN',$8,$9)`,
      [
        randomUUID(),
        f.owner.workspace_id,
        f.d.revision.quote_id,
        f.id,
        f.d.issue.id,
        hash,
        report,
        f.owner.actor_id,
        randomUUID(),
      ],
    );
  await assert.rejects(insert("a".repeat(64)), code("23514"));
  await assert.rejects(insert(f.d.issue.output_hash), code("23514"));
  for (const change of [{ respondent: null }, { claimed_role: null }, { outcome: null }, { respondent: 42 }, { conditions: {} }]) {
    await assert.rejects(transaction(async c => {
      await insert(f.d.issue.output_hash, { ...command.report, ...change }, c);
      throw Error("Malformed attribution must fail before deferred evidence validation");
    }), (e: unknown) => !!e && typeof e === "object" && "constraint" in e && e.constraint === "ck_quote_response_report");
  }
  assert.equal((await readResponse(f.owner, f.id)).events.length, 0);
});
test("ES06 populated 0059 upgrade preserves release/review, receipts, grants, identities and exact Draft/issue bytes", async () => {
  await database().query(
    await readFile(
      new URL("../../db/migrations/0001-recover.sql", import.meta.url),
      "utf8",
    ),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(59);
  await seed(59);
  const f = await releaseFixture(),
    r = await prepared(f);
  await issued(f, r.id);
  await retryQuote(f.owner, f.draft.id);
  const draft = await draftBytes(f.owner, f.draft.id),
    bytes = await draftBytes(f.owner, r.id);
  const tables = [
    "estimates",
    "estimate_versions",
    "estimate_review_events",
    "draft_quotes",
    "draft_quote_revisions",
    "quote_release_bases",
    "quote_release_events",
    "estimate_quote_jobs",
    "business_identities",
    "permission_grants",
    "users",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
  ];
  const snapshot = async () =>
    Object.fromEntries(
      await Promise.all(
        tables.map(async (t) => [
          t,
          (
            await database().query(
              `SELECT to_jsonb(t) AS row FROM ppo.${t} t ORDER BY to_jsonb(t)::text`,
            )
          ).rows,
        ]),
      ),
    );
  const before = await snapshot(),
    ledger = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows,
    seeds = (
      await database().query("SELECT * FROM ppo.seed_receipts ORDER BY version")
    ).rows;
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  const after = (
    await database().query(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  assert.deepEqual(after.filter(r=>r.version<=59), ledger);
  assert.deepEqual(after.filter(r=>r.version>59).map(r=>r.version), [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70]);
  assert.deepEqual(
    (await database().query("SELECT * FROM ppo.seed_receipts ORDER BY version"))
      .rows,
    seeds,
  );
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  assert.deepEqual(
    (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows,
    after,
  );
  assert.deepEqual(await draftBytes(f.owner, r.id), bytes);
  assert.deepEqual(await draftBytes(f.owner, f.draft.id), draft);
  await recordResponse(
    f.owner,
    r.id,
    response(await readResponse(f.owner, r.id)),
  );
});
