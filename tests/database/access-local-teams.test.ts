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
import {
  createLocalTeam,
  localTeams,
  localTeam,
  recoverLocalTeam,
} from "../../src/access/local-teams";
import { submitAccessRequest } from "../../src/access/requests";
import { accessTeamSeedGrants } from "../helpers/engineering-materials-grants";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required");
after(closeDatabase);
const ws = "10000000-0000-4000-8000-000000000001";
const rows = async (sql: string, params: unknown[] = []) =>
  (await database().query(sql, params)).rows;
const code = (code: string) => (e: unknown) =>
  (e as { code: string }).code === code;
let creator: Principal, reader: Principal, person: Principal;
const cmd = (extra: Record<string, unknown> = {}) => ({
  schema_version: 1,
  operation_id: randomUUID(),
  team_id: randomUUID(),
  expected_version: 0,
  name: "SYN Service roster",
  purpose: "Coordinate synthetic service work examples.",
  reason: "Record this explicit local roster for inspection.",
  lead_id: creator.actor_id,
  member_ids: [person.actor_id, reader.actor_id],
  ...extra,
});
const snap = async (tables: string[]) =>
  Promise.all(
    tables.map((t) =>
      rows(
        `SELECT to_jsonb(r) value FROM ppo.${t} r ORDER BY to_jsonb(r)::text`,
      ),
    ),
  );
const counts = () =>
  snap([
    "access_teams",
    "access_team_members",
    "access_team_operations",
    "audit_events",
  ]);

test(
  "AD01 teams: populated 0082 upgrade preserves history and adds exactly one local duty",
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
    await migrate(82);
    await seed(82);
    creator = (await createSession("systems")).principal;
    reader = (await createSession("scheduling-policy-reviewer")).principal;
    person = (await createSession("site-observer")).principal;
    await submitAccessRequest(creator, {
      schema_version: 1,
      operation_id: randomUUID(),
      request_id: randomUUID(),
      subject_id: person.actor_id,
      reviewer_id: reader.actor_id,
      capability: "pack.prepare",
      scope_type: "Workspace",
      company_id: null,
      site_id: null,
      valid_from: "2035-01-01T00:00:00Z",
      valid_to: null,
      reason: "Preserve this exact request through the team upgrade.",
    });
    const tables = [
      "users",
      "sessions",
      "access_change_requests",
      "access_change_operations",
      "audit_events",
    ];
    const original = await snap(tables),
      grants = await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
      ledger = await rows(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      ),
      seeds = await rows("SELECT * FROM ppo.seed_receipts ORDER BY version");
    await migrate();
    await seed();
    assert.deepEqual(await snap(tables), original);
    const next = await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
      ids = new Set(grants.map((g) => g.id));
    assert.deepEqual(
      next.filter((g) => ids.has(g.id)),
      grants,
    );
    assert.deepEqual(
      next.filter((g) => !ids.has(g.id)),
      accessTeamSeedGrants(grants).map((g) => ({
        ...g,
        id: "ad010082-0000-4000-8000-000000000001",
      })),
    );
    const newLedger = await rows(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      ),
      newSeeds = await rows("SELECT * FROM ppo.seed_receipts ORDER BY version");
    assert.deepEqual(newLedger.slice(0, -1), ledger);
    assert.equal(newLedger.at(-1).version, 83);
    assert.deepEqual(newSeeds.slice(0, -1), seeds);
    assert.equal(newSeeds.at(-1).version, 83);
    assert.deepEqual(await localTeams(creator), { items: [], has_more: false });
    await migrate();
    await seed();
    assert.deepEqual(await snap(tables), original);
    assert.deepEqual(
      await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
      next,
    );
    assert.deepEqual(
      await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
      newLedger,
    );
    assert.deepEqual(
      await rows("SELECT * FROM ppo.seed_receipts ORDER BY version"),
      newSeeds,
    );
  },
);

test("AD01 teams: creation, retention, authority and recovery", async (t) => {
  await t.test(
    "atomic original roster, audit and receipt; no permission, session or request mutation",
    async () => {
      const before = await snap([
          "permission_grants",
          "sessions",
          "access_change_requests",
          "access_change_operations",
        ]),
        input = cmd(),
        result = await createLocalTeam(creator, input);
      assert.equal(result.replayed, false);
      assert.equal(result.receipt.state, "Recorded");
      assert.equal(result.receipt.record_version, 1);
      const d = await localTeam(reader, input.team_id);
      assert.deepEqual(
        d.members.map((m) => m.user_id),
        input.member_ids.toSorted(),
      );
      assert.equal(d.team.lead_id, creator.actor_id);
      assert(!d.members.some((m) => m.user_id === creator.actor_id));
      assert.equal(d.history.length, 1);
      assert.equal(d.history[0].operation_id, input.operation_id);
      const [op] = await rows(
        "SELECT * FROM ppo.access_team_operations WHERE team_id=$1",
        [input.team_id],
      );
      const [audit] = await rows("SELECT * FROM ppo.audit_events WHERE id=$1", [
        op.audit_id,
      ]);
      assert.deepEqual(audit.details, op.snapshot);
      assert.deepEqual(op.receipt, result.receipt);
      assert.deepEqual(
        await snap([
          "permission_grants",
          "sessions",
          "access_change_requests",
          "access_change_operations",
        ]),
        before,
      );
      assert.deepEqual(
        await recoverLocalTeam(creator, input.operation_id),
        result.receipt,
      );
      assert.deepEqual(
        await createLocalTeam(creator, {
          ...input,
          member_ids: input.member_ids.toReversed(),
        }),
        { receipt: result.receipt, replayed: true },
      );
      await assert.rejects(
        createLocalTeam(creator, {
          ...input,
          purpose: "A different proposed purpose.",
        }),
        code("OperationConflict"),
      );
      await assert.rejects(
        createLocalTeam(creator, { ...input, operation_id: randomUUID() }),
        code("TeamConflict"),
      );
      await assert.rejects(
        recoverLocalTeam(reader, input.operation_id),
        code("Forbidden"),
      );
    },
  );
  await t.test(
    "strict schema, exact IDs, explicit distinct bounded roster and version",
    async () => {
      const before = await counts();
      for (const invalid of [
        { member_ids: [] },
        { member_ids: Array(21).fill(person.actor_id) },
        { member_ids: [person.actor_id, person.actor_id] },
        { member_ids: [randomUUID()] },
        { lead_id: randomUUID() },
        { expected_version: 1 },
        { name: "" },
        { purpose: "short" },
        { reason: "short" },
        { extra: true },
        { schema_version: 2 },
        { team_id: "not-an-id" },
      ])
        await assert.rejects(
          createLocalTeam(creator, cmd(invalid)),
          code("InvalidData"),
        );
      assert.deepEqual(await counts(), before);
    },
  );
  await t.test(
    "read/approve, lead and membership confer no creation duty",
    async () => {
      await assert.rejects(
        createLocalTeam(reader, cmd({ lead_id: reader.actor_id })),
        code("Forbidden"),
      );
      await assert.rejects(localTeams(person), code("Forbidden"));
      await assert.rejects(
        localTeam({ ...creator, workspace_id: randomUUID() }, randomUUID()),
        code("Forbidden"),
      );
      await assert.rejects(localTeam(creator, randomUUID()), code("NotFound"));
      await assert.rejects(
        localTeams(creator, { offset: "-1" }),
        code("InvalidData"),
      );
    },
  );
  await t.test(
    "current working company, inactive actor and expired duty refuse without mutation",
    async () => {
      const before = await counts();
      await rows(
        "INSERT INTO ppo.working_companies(workspace_id,user_id,company_id) VALUES($1,$2,'20000000-0000-4000-8000-000000000001')",
        [ws, creator.actor_id],
      );
      try {
        await assert.rejects(
          createLocalTeam(creator, cmd()),
          code("WorkingCompanySelected"),
        );
        await assert.rejects(
          localTeams(creator),
          code("WorkingCompanySelected"),
        );
      } finally {
        await rows(
          "DELETE FROM ppo.working_companies WHERE workspace_id=$1 AND user_id=$2",
          [ws, creator.actor_id],
        );
      }
      await rows("UPDATE ppo.users SET active=false WHERE id=$1", [
        creator.actor_id,
      ]);
      try {
        await assert.rejects(
          createLocalTeam(creator, cmd()),
          code("Forbidden"),
        );
      } finally {
        await rows("UPDATE ppo.users SET active=true WHERE id=$1", [
          creator.actor_id,
        ]);
      }
      await rows(
        "UPDATE ppo.permission_grants SET valid_to='2026-01-02' WHERE capability='admin.access.team.create'",
      );
      try {
        await assert.rejects(
          createLocalTeam(creator, cmd()),
          code("Forbidden"),
        );
      } finally {
        await rows(
          "UPDATE ppo.permission_grants SET valid_to=NULL WHERE capability='admin.access.team.create'",
        );
      }
      assert.deepEqual(await counts(), before);
    },
  );
  await t.test(
    "deactivated or hosted participant refused; original replay survives later identity changes",
    async () => {
      const input = cmd(),
        saved = await createLocalTeam(creator, input);
      await rows("UPDATE ppo.users SET active=false WHERE id=$1", [
        person.actor_id,
      ]);
      try {
        await assert.rejects(
          createLocalTeam(creator, cmd()),
          code("InvalidData"),
        );
        assert.deepEqual(
          (await createLocalTeam(creator, input)).receipt,
          saved.receipt,
        );
        assert.deepEqual(
          await recoverLocalTeam(creator, input.operation_id),
          saved.receipt,
        );
        assert.equal(
          (await localTeam(creator, input.team_id)).members.find(
            (m) => m.user_id === person.actor_id,
          )?.active,
          false,
        );
      } finally {
        await rows("UPDATE ppo.users SET active=true WHERE id=$1", [
          person.actor_id,
        ]);
      }
      await database().query(
        await readFile(
          new URL("../../db/demo/0001-identity.sql", import.meta.url),
          "utf8",
        ),
      );
      await rows("UPDATE ppo.users SET issuer='PPO-EntraDemo' WHERE id=$1", [
        person.actor_id,
      ]);
      try {
        await assert.rejects(
          createLocalTeam(creator, cmd()),
          code("InvalidData"),
        );
        assert.equal(
          (await localTeam(creator, input.team_id)).members.find(
            (m) => m.user_id === person.actor_id,
          )?.display_name,
          "Hosted identity (masked)",
        );
      } finally {
        await rows(
          "UPDATE ppo.users SET issuer='PPO-LocalSynthetic' WHERE id=$1",
          [person.actor_id],
        );
      }
    },
  );
  await t.test(
    "same-operation concurrent retry records once; same-team concurrent operation conflicts",
    async () => {
      const input = cmd(),
        results = await Promise.all([
          createLocalTeam(creator, input),
          createLocalTeam(creator, input),
        ]);
      assert.equal(results.filter((r) => r.replayed).length, 1);
      assert.deepEqual(results[0].receipt, results[1].receipt);
      const race = cmd(),
        out = await Promise.allSettled([
          createLocalTeam(creator, race),
          createLocalTeam(creator, { ...race, operation_id: randomUUID() }),
        ]);
      assert.equal(out.filter((r) => r.status === "fulfilled").length, 1);
      assert.equal(
        (out.find((r) => r.status === "rejected") as PromiseRejectedResult)
          .reason.code,
        "TeamConflict",
      );
      assert.equal((await localTeam(creator, race.team_id)).history.length, 1);
    },
  );
  await t.test(
    "authority mutation queued before creation is revalidated after table lock",
    async () => {
      const blocker = await database().connect();
      let pending: Promise<unknown> | undefined;
      try {
        await blocker.query("BEGIN");
        await blocker.query("UPDATE ppo.users SET active=false WHERE id=$1", [
          person.actor_id,
        ]);
        pending = createLocalTeam(creator, cmd());
        // Observe the blocked command, instead of relying on a scheduling sleep.
        const deadline = Date.now() + 10000;
        let blocked = false;
        while (Date.now() < deadline) {
          blocked =
            (
              await rows(
                "SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE 'LOCK TABLE ppo.users%'",
              )
            ).length > 0;
          if (blocked) break;
          await new Promise((r) => setTimeout(r, 20));
        }
        assert(blocked);
        await blocker.query("COMMIT");
        await assert.rejects(pending, code("InvalidData"));
      } finally {
        await blocker.query("ROLLBACK");
        blocker.release();
        if (pending) await pending.catch(() => {});
        await rows("UPDATE ppo.users SET active=true WHERE id=$1", [
          person.actor_id,
        ]);
      }
    },
  );
  await t.test(
    "SQL guards retain exact record, roster and evidence; incomplete insertion rolls back",
    async () => {
      const input = cmd();
      await createLocalTeam(creator, input);
      const before = await counts();
      for (const table of [
        "access_teams",
        "access_team_members",
        "access_team_operations",
      ]) {
        await assert.rejects(rows(`DELETE FROM ppo.${table}`));
      }
      await assert.rejects(
        rows("UPDATE ppo.access_teams SET name='Changed' WHERE id=$1", [
          input.team_id,
        ]),
      );
      await assert.rejects(
        rows("INSERT INTO ppo.access_team_members VALUES($1,$2,$3)", [
          ws,
          input.team_id,
          creator.actor_id,
        ]),
        code("23514"),
      );
      await assert.rejects(
        rows(
          "INSERT INTO ppo.access_teams(id,workspace_id,name,purpose,lead_id,created_by,reason) VALUES($1,$2,'SYN incomplete','No complete evidence record',$3,$3,'No complete evidence record')",
          [randomUUID(), ws, creator.actor_id],
        ),
        code("23514"),
      );
      assert.deepEqual(await counts(), before);
    },
  );
  await t.test(
    "another authorised actor cannot recover or collide with the original actor receipt",
    async () => {
      const input = cmd(),
        saved = await createLocalTeam(creator, input),
        grant = randomUUID();
      await rows(
        "INSERT INTO ppo.permission_grants(id,workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from) VALUES($1,$2,$3,NULL,'admin.access.team.create','Workspace',$2,NULL,'2026-01-01')",
        [grant, ws, reader.actor_id],
      );
      try {
        await assert.rejects(
          recoverLocalTeam(reader, input.operation_id),
          code("NotFound"),
        );
        await assert.rejects(
          createLocalTeam(reader, input),
          code("TeamConflict"),
        );
        assert.deepEqual(
          await recoverLocalTeam(creator, input.operation_id),
          saved.receipt,
        );
      } finally {
        await rows("DELETE FROM ppo.permission_grants WHERE id=$1", [grant]);
      }
    },
  );
  await t.test(
    "failed audit insertion rolls back team, roster and all receipts",
    async () => {
      const before = await counts();
      await rows(
        "CREATE FUNCTION ppo.reject_team_test_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.object_type='AccessTeam' THEN RAISE EXCEPTION 'SYN forced audit failure'; END IF; RETURN NEW; END $$",
      );
      await rows(
        "CREATE TRIGGER reject_team_test_audit BEFORE INSERT ON ppo.audit_events FOR EACH ROW EXECUTE FUNCTION ppo.reject_team_test_audit()",
      );
      try {
        await assert.rejects(
          createLocalTeam(creator, cmd()),
          /SYN forced audit failure/,
        );
        assert.deepEqual(await counts(), before);
      } finally {
        await rows("DROP TRIGGER reject_team_test_audit ON ppo.audit_events");
        await rows("DROP FUNCTION ppo.reject_team_test_audit()");
      }
    },
  );
  await t.test(
    "current authority is required for original recovery and replay",
    async () => {
      const input = cmd();
      await createLocalTeam(creator, input);
      await rows(
        "UPDATE ppo.permission_grants SET valid_to='2026-01-02' WHERE capability='admin.access.team.create'",
      );
      try {
        await assert.rejects(
          recoverLocalTeam(creator, input.operation_id),
          code("Forbidden"),
        );
        await assert.rejects(
          createLocalTeam(creator, input),
          code("Forbidden"),
        );
      } finally {
        await rows(
          "UPDATE ppo.permission_grants SET valid_to=NULL WHERE capability='admin.access.team.create'",
        );
      }
    },
  );
  await t.test("bounded pages retain exact IDs when names repeat", async () => {
    for (let n = 0; n < 51; n++)
      await createLocalTeam(creator, cmd({ name: "SYN repeated name" }));
    const first = await localTeams(creator),
      second = await localTeams(creator, { offset: "50" });
    assert.equal(first.items.length, 50);
    assert.equal(first.has_more, true);
    assert(second.items.length > 0);
    assert.equal(second.has_more, false);
    const ids = [...first.items, ...second.items].map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.deepEqual(await localTeams(creator, { offset: "100000" }), {
      items: [],
      has_more: false,
    });
  });
  await t.test(
    "hosted environment refuses every team API service before database access",
    async () => {
      const prior = process.env.PPO_ENV;
      process.env.PPO_ENV = "azure-demo";
      try {
        for (const run of [
          () => createLocalTeam(creator, cmd()),
          () => localTeams(creator),
          () => localTeam(creator, randomUUID()),
          () => recoverLocalTeam(creator, randomUUID()),
        ])
          await assert.rejects(run(), code("LocalOnly"));
      } finally {
        process.env.PPO_ENV = prior;
      }
    },
  );
});
