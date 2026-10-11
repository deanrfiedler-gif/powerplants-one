import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { migrate, seed } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import {
  accessPeople,
  accessPerson,
  explainAccess,
} from "../../src/access/service";
import { accessInspectionSeedGrants } from "../helpers/engineering-materials-grants";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required");
after(closeDatabase);
const ws = "10000000-0000-4000-8000-000000000001";
const companyA = "20000000-0000-4000-8000-000000000001",
  companyB = "20000000-0000-4000-8000-000000000002";
const siteA = "70000000-0000-4000-8000-000000000001",
  siteB = "70000000-0000-4000-8000-000000000002";
const rows = async (sql: string, values: unknown[] = []) =>
  (await database().query(sql, values)).rows;
const code = (name: string) => (error: unknown) =>
  (error as { code: string }).code === name;
const shape = (values: Record<string, unknown>[]) =>
  values
    .map(({ id: _id, ...value }) => {
      void _id;
      return JSON.stringify(value);
    })
    .sort();

test("AD01-01 populated 0077 upgrade preserves identities and grants; reseed adds exactly one Systems read duty", async () => {
  await transaction(async (c) => {
    await c.query(
      await readFile(
        new URL("../../db/migrations/0001-recover.sql", import.meta.url),
        "utf8",
      ),
    );
    await c.query("DROP TABLE IF EXISTS public.ppo_migrations");
  });
  await migrate(77);
  await seed(77);
  const grants = await rows("SELECT * FROM ppo.permission_grants ORDER BY id");
  const users = await rows("SELECT * FROM ppo.users ORDER BY id");
  const ledger = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  await migrate();
  await seed();
  const upgraded = await rows(
    "SELECT * FROM ppo.permission_grants ORDER BY id",
  );
  const ids = new Set(grants.map((g) => g.id));
  assert.deepEqual(
    upgraded.filter((g) => ids.has(g.id)),
    grants,
  );
  assert.deepEqual(
    shape(upgraded.filter((g) => !ids.has(g.id))),
    shape(accessInspectionSeedGrants(grants)),
  );
  assert.deepEqual(await rows("SELECT * FROM ppo.users ORDER BY id"), users);
  const next = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  assert.deepEqual(
    next.filter((r) => r.version <= 77),
    ledger,
  );
  assert.deepEqual(
    next.filter((r) => r.version > 77).map((r) => r.version),
    [78],
  );
  await migrate();
  await seed();
  assert.deepEqual(
    await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
    upgraded,
  );
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    next,
  );
});

test("AD01-02 workspace authority, masking, scope explanation and read-only preservation", async (t) => {
  const systems = (await createSession("systems")).principal;
  const observer = (await createSession("site-observer")).principal;
  const coordinator = (await createSession("coordinator")).principal;
  const target = observer.actor_id;
  await t.test(
    "ordinary identities cannot enumerate people or read explanations",
    async () => {
      for (const profile of [
        "coordinator",
        "observer",
        "other-workspace",
        "finance",
      ]) {
        const p = (await createSession(profile)).principal;
        await assert.rejects(accessPeople(p), code("Forbidden"));
        await assert.rejects(accessPerson(p, target), code("Forbidden"));
        await assert.rejects(
          explainAccess(p, target, {
            capability: "shared.read",
            company_id: companyA,
          }),
          code("Forbidden"),
        );
      }
    },
  );
  await t.test(
    "list and detail preserve exact company keys and refuse another workspace",
    async () => {
      const list = await accessPeople(systems);
      assert(list.items.some((p) => p.id === target));
      assert(
        !list.items.some(
          (p) => p.id === "30000000-0000-4000-8000-000000000004",
        ),
      );
      await assert.rejects(
        accessPerson(systems, "30000000-0000-4000-8000-000000000004"),
        code("NotFound"),
      );
      const detail = await accessPerson(systems, coordinator.actor_id);
      assert.deepEqual(
        detail.companies.map((c) => c.erp_company_id),
        ["SYN-A", "SYN-B"],
      );
      assert.equal(
        detail.companies[0].display_name,
        detail.companies[1].display_name,
      );
      assert(!JSON.stringify(detail).includes("subject_id"));
      assert.equal((await accessPeople(systems, { q: "%" })).items.length, 0);
    },
  );
  await t.test(
    "grant eligibility differentiates company and exact site scope",
    async () => {
      assert.equal(
        (
          await explainAccess(systems, target, {
            capability: "shared.read",
            company_id: companyA,
            site_id: siteA,
          })
        ).allowed,
        true,
      );
      assert.equal(
        (
          await explainAccess(systems, target, {
            capability: "shared.read",
            company_id: companyA,
            site_id: siteB,
          })
        ).allowed,
        false,
      );
      assert.equal(
        (
          await explainAccess(systems, target, {
            capability: "shared.read",
            company_id: companyB,
          })
        ).allowed,
        false,
      );
      assert.equal(
        (
          await explainAccess(systems, target, {
            capability: "unknown.capability",
            company_id: companyA,
          })
        ).allowed,
        false,
      );
      await assert.rejects(
        explainAccess(systems, target, {
          capability: "shared.read",
          company_id: companyB,
          site_id: siteA,
        }),
        code("NotFound"),
      );
    },
  );
  await t.test(
    "inactive, future and expired subjects/grants cannot produce a positive explanation",
    async () => {
      await database().query("UPDATE ppo.users SET active=false WHERE id=$1", [
        target,
      ]);
      try {
        assert.equal(
          (
            await explainAccess(systems, target, {
              capability: "shared.read",
              company_id: companyA,
              site_id: siteA,
            })
          ).allowed,
          false,
        );
      } finally {
        await database().query("UPDATE ppo.users SET active=true WHERE id=$1", [
          target,
        ]);
      }
      const saved = await rows(
        "SELECT id,valid_from,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability='shared.read'",
        [target],
      );
      try {
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=clock_timestamp()-interval '1 second' WHERE user_id=$1 AND capability='shared.read'",
          [target],
        );
        assert.equal(
          (
            await explainAccess(systems, target, {
              capability: "shared.read",
              company_id: companyA,
              site_id: siteA,
            })
          ).allowed,
          false,
        );
        assert(
          (await accessPerson(systems, target)).grants.some(
            (g) => g.state === "Expired",
          ),
        );
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=NULL,valid_from=clock_timestamp()+interval '1 day' WHERE user_id=$1 AND capability='shared.read'",
          [target],
        );
        assert.equal(
          (
            await explainAccess(systems, target, {
              capability: "shared.read",
              company_id: companyA,
              site_id: siteA,
            })
          ).allowed,
          false,
        );
      } finally {
        for (const g of saved)
          await database().query(
            "UPDATE ppo.permission_grants SET valid_from=$2,valid_to=$3 WHERE id=$1",
            [g.id, g.valid_from, g.valid_to],
          );
      }
    },
  );
  await t.test(
    "expired reviewer authority is rechecked; Company inspection grants are rejected by the schema",
    async () => {
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='admin.access.read'",
        [systems.actor_id],
      );
      try {
        await assert.rejects(accessPerson(systems, target), code("Forbidden"));
      } finally {
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='admin.access.read'",
          [systems.actor_id],
        );
      }
      await assert.rejects(
        database().query(
          "UPDATE ppo.permission_grants SET scope_type='Company',scope_id=$2,company_id=$2 WHERE user_id=$1 AND capability='admin.access.read'",
          [systems.actor_id, companyA],
        ),
        code("23514"),
      );
    },
  );
  await t.test(
    "working company narrows subject explanations and requires reviewer workspace context",
    async () => {
      for (const actor of [systems.actor_id, coordinator.actor_id]) {
        await database().query(
          "INSERT INTO ppo.working_companies(workspace_id,user_id,company_id) VALUES($1,$2,$3)",
          [ws, actor, companyA],
        );
        try {
          if (actor === systems.actor_id)
            await assert.rejects(
              accessPeople(systems),
              code("WorkingCompanySelected"),
            );
          else {
            const result = await explainAccess(systems, actor, {
              capability: "shared.read",
              company_id: companyB,
            });
            assert.equal(result.allowed, false);
            assert.match(result.reason, /working company/);
          }
        } finally {
          await database().query(
            "DELETE FROM ppo.working_companies WHERE user_id=$1",
            [actor],
          );
        }
      }
    },
  );
  await t.test(
    "hosted names/subject keys cannot leak through search or detail",
    async () => {
      await database().query(
        await readFile(
          new URL("../../db/demo/0001-identity.sql", import.meta.url),
          "utf8",
        ),
      );
      const id = randomUUID();
      await database().query(
        "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-EntraDemo','synthetic-private-subject','SYN Private hosted name')",
        [id, ws],
      );
      try {
        assert.equal(
          (await accessPeople(systems, { q: "Private hosted" })).items.length,
          0,
        );
        const detail = await accessPerson(systems, id);
        assert.equal(detail.person.display_name, "Hosted identity (masked)");
        assert(!JSON.stringify(detail).includes("synthetic-private-subject"));
        assert.match(
          (
            await explainAccess(systems, id, {
              capability: "shared.read",
              company_id: companyA,
            })
          ).authentication,
          /not been evaluated/,
        );
      } finally {
        await database().query("DELETE FROM ppo.users WHERE id=$1", [id]);
      }
    },
  );
  await t.test(
    "reads preserve every identity, grant and audit row",
    async () => {
      const snapshot = () =>
        Promise.all(
          ["users", "permission_grants", "audit_events"].map((name) =>
            rows(`SELECT * FROM ppo.${name} ORDER BY id`),
          ),
        );
      const before = await snapshot();
      await accessPeople(systems);
      await accessPerson(systems, target);
      await explainAccess(systems, target, {
        capability: "shared.read",
        company_id: companyA,
        site_id: siteA,
      });
      assert.deepEqual(await snapshot(), before);
    },
  );
});
