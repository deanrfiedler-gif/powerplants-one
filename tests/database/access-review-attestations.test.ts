import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { migrate, seed } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession, type Principal } from "../../src/platform/identity";
import { createLocalTeam } from "../../src/access/local-teams";
import {
  accessReviewBasis,
  recordAccessReview,
  recoverAccessReview,
  accessReviews,
  accessReview,
} from "../../src/access/reviews";
import { accessReviewSeedGrants } from "../helpers/engineering-materials-grants";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required");
after(closeDatabase);
const ws = "10000000-0000-4000-8000-000000000001";
const rows = async (sql: string, params: unknown[] = []) =>
  (await database().query(sql, params)).rows;
const code = (value: string) => (e: unknown) =>
  (e as { code: string }).code === value;
const snap = (tables: string[]) =>
  Promise.all(
    tables.map((t) =>
      rows(
        `SELECT to_jsonb(r) value FROM ppo.${t} r ORDER BY to_jsonb(r)::text`,
      ),
    ),
  );
const retained = [
  "users",
  "permission_grants",
  "sessions",
  "working_companies",
  "access_teams",
  "access_team_members",
  "access_team_operations",
  "access_change_requests",
  "access_change_operations",
];
const evidence = () =>
  snap([
    "access_review_attestations",
    "access_review_operations",
    "audit_events",
  ]);
let actor: Principal,
  reader: Principal,
  subject: Principal,
  team: string,
  grant: string;
const query = () => ({ team_id: team, grant_id: grant });
const input = async (extra: Record<string, unknown> = {}) => ({
  schema_version: 1,
  operation_id: randomUUID(),
  attestation_id: randomUUID(),
  expected_version: 0,
  ...query(),
  basis_hash: (await accessReviewBasis(actor, query())).basis_hash,
  decision: "Keep",
  reason: "SYN independent inspection of this exact current grant row.",
  ...extra,
});

test(
  "AD01 review: populated 0083 upgrade retains originals and adds exactly one local duty",
  { timeout: 300000 },
  async () => {
    await transaction(async (c) => {
      await c.query("SET LOCAL statement_timeout='120s'");
      await c.query(
        await readFile(
          new URL("../../db/migrations/0001-recover.sql", import.meta.url),
          "utf8",
        ),
      );
      await c.query("DROP TABLE IF EXISTS public.ppo_migrations");
    });
    await migrate(83);
    await seed(83);
    actor = (await createSession("systems")).principal;
    reader = (await createSession("scheduling-policy-reviewer")).principal;
    subject = (await createSession("site-observer")).principal;
    team = randomUUID();
    await createLocalTeam(actor, {
      schema_version: 1,
      operation_id: randomUUID(),
      team_id: team,
      expected_version: 0,
      name: "SYN review roster",
      purpose: "Explicit members for a synthetic independent review.",
      reason: "Preserve this initial team through review installation.",
      lead_id: actor.actor_id,
      member_ids: [actor.actor_id, subject.actor_id],
    });
    grant = (
      await rows(
        "SELECT id FROM ppo.permission_grants WHERE user_id=$1 ORDER BY id LIMIT 1",
        [subject.actor_id],
      )
    )[0].id;
    const preserved = retained
        .filter((t) => t !== "permission_grants")
        .concat("audit_events"),
      original = await snap(preserved);
    const grants = await rows(
        "SELECT * FROM ppo.permission_grants ORDER BY id",
      ),
      ids = new Set(grants.map((g) => g.id));
    const ledger = await rows(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      ),
      seeds = await rows("SELECT * FROM ppo.seed_receipts ORDER BY version");
    await migrate();
    await seed();
    assert.deepEqual(await snap(preserved), original);
    const next = await rows("SELECT * FROM ppo.permission_grants ORDER BY id");
    assert.deepEqual(
      next.filter((g) => ids.has(g.id)),
      grants,
    );
    assert.deepEqual(
      next.filter((g) => !ids.has(g.id)),
      accessReviewSeedGrants(grants).map((g) => ({
        ...g,
        id: "ad010084-0000-4000-8000-000000000001",
      })),
    );
    const nextLedger = await rows(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      ),
      nextSeeds = await rows(
        "SELECT * FROM ppo.seed_receipts ORDER BY version",
      );
    assert.deepEqual(
      nextLedger.filter((r) => r.version <= 83),
      ledger,
    );
    assert.deepEqual(
      nextLedger.filter((r) => r.version > 83).map((r) => r.version),
      [84, 85, 86, 87, 88, 89, 90, 91, 92, 95],
    );
    assert.deepEqual(
      nextSeeds.filter((r) => r.version <= 83),
      seeds,
    );
    assert.deepEqual(
      nextSeeds.filter((r) => r.version > 83).map((r) => r.version),
      [84],
    );
    await migrate();
    await seed();
    assert.deepEqual(await snap(preserved), original);
    assert.deepEqual(
      await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
      next,
    );
    assert.deepEqual(
      await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
      nextLedger,
    );
    assert.deepEqual(
      await rows("SELECT * FROM ppo.seed_receipts ORDER BY version"),
      nextSeeds,
    );
  },
);

test(
  "AD01 review: authority, freshness, evidence and original recovery",
  { timeout: 300000 },
  async (t) => {
    await t.test(
      "basis read and Keep preserve all authority/business records and link exact evidence",
      async () => {
        const before = await snap(retained),
          beforeEvidence = await evidence();
        const basis = await accessReviewBasis(reader, query());
        assert.equal(basis.snapshot.subject.id, subject.actor_id);
        assert.equal(basis.snapshot.row_state, "Current");
        assert.match(
          basis.checked_at,
          /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{6}Z$/,
        );
        assert.deepEqual(await evidence(), beforeEvidence);
        const cmd = await input(),
          saved = await recordAccessReview(actor, cmd),
          detail = await accessReview(reader, cmd.attestation_id);
        assert.equal(saved.replayed, false);
        assert.equal(detail.decision, "Keep");
        assert.equal(detail.actor_id, actor.actor_id);
        assert.deepEqual(detail.basis_snapshot, basis.snapshot);
        assert.equal(detail.operation_id, cmd.operation_id);
        assert.equal(
          detail.checked_at,
          (
            await rows(
              `SELECT to_char(checked_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') value
           FROM ppo.access_review_attestations WHERE id=$1`,
              [cmd.attestation_id],
            )
          )[0].value,
        );
        assert.deepEqual(
          (
            await rows("SELECT details FROM ppo.audit_events WHERE id=$1", [
              detail.audit_id,
            ])
          )[0].details,
          (
            await rows(
              "SELECT snapshot FROM ppo.access_review_operations WHERE attestation_id=$1",
              [cmd.attestation_id],
            )
          )[0].snapshot,
        );
        assert.deepEqual(
          await recoverAccessReview(actor, cmd.operation_id),
          saved.receipt,
        );
        assert.deepEqual(await snap(retained), before);
        assert.equal(
          (
            await accessReviews(reader, {
              team_id: team,
              subject_id: subject.actor_id,
            })
          ).items.length,
          1,
        );
      },
    );
    await t.test(
      "explicit Workspace duty and independent actor are required; team lead is insufficient",
      async () => {
        const cmd = await input(),
          before = await evidence();
        await assert.rejects(
          recordAccessReview(reader, cmd),
          code("Forbidden"),
        );
        await assert.rejects(
          recordAccessReview(subject, cmd),
          code("Forbidden"),
        );
        await assert.rejects(
          recordAccessReview({ ...actor, workspace_id: randomUUID() }, cmd),
          code("Forbidden"),
        );
        const own = (
          await rows(
            "SELECT id FROM ppo.permission_grants WHERE user_id=$1 LIMIT 1",
            [actor.actor_id],
          )
        )[0].id;
        const b = await accessReviewBasis(actor, {
          team_id: team,
          grant_id: own,
        });
        await assert.rejects(
          recordAccessReview(actor, {
            ...cmd,
            grant_id: own,
            basis_hash: b.basis_hash,
          }),
          code("SelfReview"),
        );
        assert.deepEqual(await evidence(), before);
      },
    );
    await t.test(
      "strict payload, wrong team/member/grant and invalid offsets refuse without evidence",
      async () => {
        const cmd = await input(),
          before = await evidence();
        for (const extra of [
          { expected_version: 1 },
          { decision: "Revoke" },
          { reason: "tiny" },
          { basis_hash: "guessed" },
          { snapshot: {} },
          { attestation_id: "invalid" },
        ])
          await assert.rejects(
            recordAccessReview(actor, { ...cmd, ...extra }),
            code("InvalidData"),
          );
        for (const q of [
          { ...query(), team_id: randomUUID() },
          { ...query(), grant_id: randomUUID() },
        ])
          await assert.rejects(accessReviewBasis(actor, q), code("NotFound"));
        const outsider = (
          await rows(
            "SELECT id FROM ppo.permission_grants WHERE user_id=$1 LIMIT 1",
            [reader.actor_id],
          )
        )[0].id;
        await assert.rejects(
          accessReviewBasis(actor, { team_id: team, grant_id: outsider }),
          code("NotFound"),
        );
        await assert.rejects(
          accessReviews(actor, { offset: "-1" }),
          code("InvalidData"),
        );
        assert.deepEqual(
          await accessReviews(actor, { subject_id: randomUUID() }),
          { items: [], has_more: false },
        );
        assert.deepEqual(await evidence(), before);
      },
    );
    await t.test(
      "working-company selection blocks reads, commands and original recovery",
      async () => {
        const cmd = await input(),
          saved = await recordAccessReview(actor, cmd);
        await rows(
          "INSERT INTO ppo.working_companies(workspace_id,user_id,company_id) VALUES($1,$2,'20000000-0000-4000-8000-000000000001')",
          [ws, actor.actor_id],
        );
        try {
          for (const run of [
            () => accessReviewBasis(actor, query()),
            () => recordAccessReview(actor, cmd),
            () => recoverAccessReview(actor, cmd.operation_id),
            () => accessReviews(actor),
            () => accessReview(actor, saved.receipt.record_id),
          ])
            await assert.rejects(run(), code("WorkingCompanySelected"));
        } finally {
          await rows("DELETE FROM ppo.working_companies WHERE user_id=$1", [
            actor.actor_id,
          ]);
        }
      },
    );
    await t.test(
      "any reviewed row change, inactive subject and noncurrent dates invalidate the basis",
      async () => {
        const cmd = await input(),
          original = (
            await rows(
              "SELECT valid_from,valid_to FROM ppo.permission_grants WHERE id=$1",
              [grant],
            )
          )[0],
          before = await evidence();
        for (const date of ["2026-02-01", "2035-01-01"]) {
          await rows(
            "UPDATE ppo.permission_grants SET valid_from=$2 WHERE id=$1",
            [grant, date],
          );
          await assert.rejects(
            recordAccessReview(actor, cmd),
            code("ReviewBasisChanged"),
          );
        }
        await rows(
          "UPDATE ppo.permission_grants SET valid_from=$2,valid_to='2026-03-01' WHERE id=$1",
          [grant, original.valid_from],
        );
        await assert.rejects(
          recordAccessReview(actor, await input()),
          code("ReviewBasisChanged"),
        );
        await rows("UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1", [
          grant,
          original.valid_to,
        ]);
        await rows("UPDATE ppo.users SET active=false WHERE id=$1", [
          subject.actor_id,
        ]);
        try {
          await assert.rejects(
            recordAccessReview(actor, await input()),
            code("ReviewBasisChanged"),
          );
        } finally {
          await rows("UPDATE ppo.users SET active=true WHERE id=$1", [
            subject.actor_id,
          ]);
        }
        assert.deepEqual(await evidence(), before);
      },
    );
    await t.test(
      "same-operation races record once; changed payload and duplicate identity conflict",
      async () => {
        const cmd = await input(),
          result = await Promise.all([
            recordAccessReview(actor, cmd),
            recordAccessReview(actor, cmd),
          ]);
        assert.deepEqual(result[0].receipt, result[1].receipt);
        assert.equal(result.filter((r) => r.replayed).length, 1);
        assert.equal(
          (
            await rows(
              "SELECT * FROM ppo.access_review_operations WHERE operation_id=$1",
              [cmd.operation_id],
            )
          ).length,
          1,
        );
        await assert.rejects(
          recordAccessReview(actor, {
            ...cmd,
            reason: "SYN deliberately changed review reason",
          }),
          code("OperationConflict"),
        );
        await assert.rejects(
          recordAccessReview(actor, { ...cmd, operation_id: randomUUID() }),
          code("ReviewConflict"),
        );
      },
    );
    await t.test(
      "recovery is actor-bound and retains the original when the grant is removed",
      async () => {
        const cmd = await input(),
          saved = await recordAccessReview(actor, cmd),
          original = (
            await rows(
              "SELECT to_jsonb(g) value FROM ppo.permission_grants g WHERE id=$1",
              [grant],
            )
          )[0].value;
        const duty = randomUUID();
        await rows(
          "INSERT INTO ppo.permission_grants(id,workspace_id,user_id,capability,scope_type,scope_id,valid_from) VALUES($1,$2,$3,'admin.access.review.attest','Workspace',$2,'2026-01-01')",
          [duty, ws, reader.actor_id],
        );
        try {
          await assert.rejects(
            recoverAccessReview(reader, cmd.operation_id),
            code("NotFound"),
          );
          await rows("DELETE FROM ppo.permission_grants WHERE id=$1", [grant]);
          assert.deepEqual(
            await recoverAccessReview(actor, cmd.operation_id),
            saved.receipt,
          );
          assert.deepEqual(
            (await recordAccessReview(actor, cmd)).receipt,
            saved.receipt,
          );
          assert.equal(
            (await accessReview(reader, cmd.attestation_id)).basis_snapshot
              .grant.id,
            grant,
          );
          await assert.rejects(
            recordAccessReview(actor, {
              ...cmd,
              operation_id: randomUUID(),
              attestation_id: randomUUID(),
            }),
            code("NotFound"),
          );
        } finally {
          await rows(
            "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_record(NULL::ppo.permission_grants,$1)",
            [original],
          );
          await rows("DELETE FROM ppo.permission_grants WHERE id=$1", [duty]);
        }
      },
    );
    await t.test(
      "loss of either current duty or actor activity blocks replay and recovery",
      async () => {
        const cmd = await input();
        await recordAccessReview(actor, cmd);
        for (const capability of [
          "admin.access.read",
          "admin.access.review.attest",
        ]) {
          await rows(
            "UPDATE ppo.permission_grants SET valid_to='2026-01-02' WHERE user_id=$1 AND capability=$2",
            [actor.actor_id, capability],
          );
          try {
            await assert.rejects(
              recoverAccessReview(actor, cmd.operation_id),
              code("Forbidden"),
            );
            await assert.rejects(
              recordAccessReview(actor, cmd),
              code("Forbidden"),
            );
          } finally {
            await rows(
              "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability=$2",
              [actor.actor_id, capability],
            );
          }
        }
        await rows("UPDATE ppo.users SET active=false WHERE id=$1", [
          actor.actor_id,
        ]);
        try {
          await assert.rejects(
            recoverAccessReview(actor, cmd.operation_id),
            code("Forbidden"),
          );
        } finally {
          await rows("UPDATE ppo.users SET active=true WHERE id=$1", [
            actor.actor_id,
          ]);
        }
      },
    );
    await t.test(
      "queued authority loss is revalidated after acquiring the write lock",
      async () => {
        const cmd = await input(),
          before = await evidence(),
          blocker = await database().connect();
        await blocker.query("BEGIN");
        await blocker.query(
          "LOCK TABLE ppo.permission_grants IN SHARE ROW EXCLUSIVE MODE",
        );
        const pending = recordAccessReview(actor, cmd);
        const rejected = assert.rejects(pending, code("Forbidden"));
        try {
          const deadline = Date.now() + 10000;
          let blocked = false;
          while (Date.now() < deadline) {
            blocked =
              (
                await rows(
                  "SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE 'LOCK TABLE ppo.users%' ",
                )
              ).length > 0;
            if (blocked) break;
            await new Promise((r) => setTimeout(r, 20));
          }
          assert(blocked, "Command must actually wait for the authority lock");
          await blocker.query(
            "UPDATE ppo.permission_grants SET valid_to='2026-01-02' WHERE user_id=$1 AND capability='admin.access.review.attest'",
            [actor.actor_id],
          );
          await blocker.query("COMMIT");
          await rejected;
          assert.deepEqual(await evidence(), before);
        } finally {
          await blocker.query("ROLLBACK");
          blocker.release();
          await rows(
            "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='admin.access.review.attest'",
            [actor.actor_id],
          );
        }
      },
    );
    await t.test(
      "date boundary during evidence writing rolls back the complete attestation",
      async () => {
        const original = (
          await rows("SELECT valid_to FROM ppo.permission_grants WHERE id=$1", [
            grant,
          ])
        )[0].valid_to;
        await rows(
          "UPDATE ppo.permission_grants SET valid_to=clock_timestamp()+interval '2 seconds' WHERE id=$1",
          [grant],
        );
        const cmd = await input(),
          before = await evidence();
        await rows(
          "CREATE FUNCTION ppo.review_test_delay() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.object_type='AccessReview' THEN PERFORM pg_sleep(2.1); END IF; RETURN NEW; END $$",
        );
        await rows(
          "CREATE TRIGGER review_test_delay BEFORE INSERT ON ppo.audit_events FOR EACH ROW EXECUTE FUNCTION ppo.review_test_delay()",
        );
        try {
          await assert.rejects(
            recordAccessReview(actor, cmd),
            code("ReviewBasisChanged"),
          );
          assert.deepEqual(await evidence(), before);
        } finally {
          await rows(
            "DROP TRIGGER review_test_delay ON ppo.audit_events; DROP FUNCTION ppo.review_test_delay()",
          );
          await rows(
            "UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1",
            [grant, original],
          );
        }
      },
    );
    await t.test(
      "audit failure and incomplete/tampered evidence roll back; accepted records are immutable",
      async () => {
        const cmd = await input();
        await recordAccessReview(actor, cmd);
        const before = await evidence();
        for (const table of [
          "access_review_attestations",
          "access_review_operations",
        ]) {
          await assert.rejects(rows(`DELETE FROM ppo.${table}`));
          await assert.rejects(
            rows(`UPDATE ppo.${table} SET id=$1`, [randomUUID()]),
          );
        }
        await assert.rejects(
          rows(
            `INSERT INTO ppo.access_review_attestations
      SELECT $1,workspace_id,team_id,subject_id,grant_id,actor_id,decision,reason,basis_hash,basis_snapshot,checked_at,created_at,state,version,synthetic FROM ppo.access_review_attestations WHERE id=$2`,
            [randomUUID(), cmd.attestation_id],
          ),
          code("23514"),
        );
        await rows(
          "CREATE FUNCTION ppo.review_test_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.object_type='AccessReview' THEN RAISE EXCEPTION 'SYN review audit failure'; END IF; RETURN NEW; END $$",
        );
        await rows(
          "CREATE TRIGGER review_test_fail BEFORE INSERT ON ppo.audit_events FOR EACH ROW EXECUTE FUNCTION ppo.review_test_fail()",
        );
        try {
          await assert.rejects(
            recordAccessReview(actor, await input()),
            /SYN review audit failure/,
          );
          assert.deepEqual(await evidence(), before);
        } finally {
          await rows(
            "DROP TRIGGER review_test_fail ON ppo.audit_events; DROP FUNCTION ppo.review_test_fail()",
          );
        }
      },
    );
    await t.test(
      "Workspace, Company and Site grant bases remain exact; unrelated rows do not stale a review",
      async () => {
        const ids = [randomUUID(), randomUUID(), randomUUID()];
        const scopes = [
          ["Workspace", ws, null, null],
          [
            "Company",
            "20000000-0000-4000-8000-000000000001",
            "20000000-0000-4000-8000-000000000001",
            null,
          ],
          [
            "Site",
            "70000000-0000-4000-8000-000000000001",
            "20000000-0000-4000-8000-000000000001",
            "70000000-0000-4000-8000-000000000001",
          ],
        ];
        const cmd = await input();
        try {
          for (let i = 0; i < scopes.length; i++) {
            const [scope, scopeId, company, site] = scopes[i];
            await rows(
              "INSERT INTO ppo.permission_grants(id,workspace_id,user_id,capability,scope_type,scope_id,company_id,site_id,valid_from) VALUES($1,$2,$3,'pack.prepare',$4,$5,$6,$7,'2026-01-01')",
              [ids[i], ws, subject.actor_id, scope, scopeId, company, site],
            );
            const b = await accessReviewBasis(actor, {
              team_id: team,
              grant_id: ids[i],
            });
            assert.equal(b.snapshot.grant.scope_type, scope);
            await recordAccessReview(
              actor,
              await input({ grant_id: ids[i], basis_hash: b.basis_hash }),
            );
          }
          await recordAccessReview(actor, cmd);
          await assert.rejects(
            rows(
              "INSERT INTO ppo.permission_grants(id,workspace_id,user_id,capability,scope_type,scope_id,company_id,valid_from) VALUES($1,$2,$3,'admin.access.review.attest','Company',$4,$4,'2026-01-01')",
              [randomUUID(), ws, reader.actor_id, scopes[1][1]],
            ),
            code("23514"),
          );
        } finally {
          await rows(
            "DELETE FROM ppo.permission_grants WHERE id=ANY($1::uuid[])",
            [ids],
          );
        }
      },
    );
    await t.test(
      "deferred agreement rejects a forged receipt and leaves no record or audit",
      async () => {
        const cmd = await input(),
          before = await evidence();
        await rows(
          "CREATE FUNCTION ppo.review_test_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.receipt:=jsonb_set(NEW.receipt,'{record_version}','2'); RETURN NEW; END $$",
        );
        await rows(
          "CREATE TRIGGER review_test_receipt BEFORE INSERT ON ppo.access_review_operations FOR EACH ROW EXECUTE FUNCTION ppo.review_test_receipt()",
        );
        try {
          await assert.rejects(recordAccessReview(actor, cmd), code("23514"));
          assert.deepEqual(await evidence(), before);
        } finally {
          await rows(
            "DROP TRIGGER review_test_receipt ON ppo.access_review_operations; DROP FUNCTION ppo.review_test_receipt()",
          );
        }
      },
    );
    await t.test(
      "hosted replacement identities are masked and cannot be newly reviewed or act",
      async () => {
        const cmd = await input();
        await recordAccessReview(actor, cmd);
        await rows(
          await readFile(
            new URL("../../db/demo/0001-identity.sql", import.meta.url),
            "utf8",
          ),
        );
        await rows("UPDATE ppo.users SET issuer='PPO-EntraDemo' WHERE id=$1", [
          subject.actor_id,
        ]);
        try {
          await assert.rejects(
            accessReviewBasis(actor, query()),
            code("NotFound"),
          );
          const detail = await accessReview(reader, cmd.attestation_id);
          assert.equal(detail.subject_name, "Hosted identity (masked)");
          assert.equal(detail.masked, true);
          assert.equal(detail.basis_snapshot, null);
          assert.equal(detail.reason, null);
        } finally {
          await rows(
            "UPDATE ppo.users SET issuer='PPO-LocalSynthetic' WHERE id=$1",
            [subject.actor_id],
          );
        }
        await rows("UPDATE ppo.users SET issuer='PPO-EntraDemo' WHERE id=$1", [
          actor.actor_id,
        ]);
        try {
          await assert.rejects(accessReviews(actor), code("Forbidden"));
        } finally {
          await rows(
            "UPDATE ppo.users SET issuer='PPO-LocalSynthetic' WHERE id=$1",
            [actor.actor_id],
          );
        }
      },
    );
    await t.test(
      "bounded pagination preserves distinct explicit later observations",
      async () => {
        for (let n = 0; n < 51; n++)
          await recordAccessReview(actor, await input());
        const first = await accessReviews(reader),
          second = await accessReviews(reader, { offset: "50" });
        assert.equal(first.items.length, 50);
        assert.equal(first.has_more, true);
        assert.equal(second.has_more, false);
        const ids = [...first.items, ...second.items].map((r) => r.id);
        assert.equal(new Set(ids).size, ids.length);
      },
    );
    await t.test(
      "hosted environment refuses all review services before database use",
      async () => {
        const prior = process.env.PPO_ENV;
        process.env.PPO_ENV = "azure-demo";
        try {
          for (const run of [
            () => accessReviewBasis(actor, query()),
            () => recordAccessReview(actor, {}),
            () => recoverAccessReview(actor, randomUUID()),
            () => accessReviews(actor),
            () => accessReview(actor, randomUUID()),
          ])
            await assert.rejects(run(), code("LocalOnly"));
        } finally {
          process.env.PPO_ENV = prior;
        }
      },
    );
  },
);
