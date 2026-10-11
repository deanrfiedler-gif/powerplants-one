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
  accessCapabilities,
  accessCapability,
  accessRoles,
  compareAccessRole,
} from "../../src/access/service";
import { capabilityLabels } from "../../src/access/capabilities";
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

test("AD01-03 capability catalogue and holders preserve workspace authority and grant meaning", async (t) => {
  const systems = (await createSession("systems")).principal;
  const observer = (await createSession("site-observer")).principal;
  await t.test(
    "complete catalogue includes unassigned and hosted-only keys; literal search and domains",
    async () => {
      const all = await accessCapabilities(systems);
      assert.deepEqual(
        all.items.map((item) => item.key),
        Object.keys(capabilityLabels),
      );
      assert.equal(
        all.items.find((item) => item.key === "email.connect")?.hosted_only,
        true,
      );
      assert.equal(
        all.items.find((item) => item.key === "email.connect")?.recorded,
        0,
      );
      assert.equal(
        (await accessCapability(systems, "email.connect")).items.length,
        0,
      );
      assert.equal(
        (await accessCapabilities(systems, { q: "%" })).items.length,
        0,
      );
      assert.deepEqual(
        (
          await accessCapabilities(systems, { q: "  inspect workspace  " })
        ).items.map((item) => item.key),
        ["admin.access.read"],
      );
      assert(
        (await accessCapabilities(systems, { domain: "finance" })).items.every(
          (item) => item.domain === "finance",
        ),
      );
      await assert.rejects(
        accessCapabilities(systems, { domain: "not-a-domain" }),
        code("InvalidFilter"),
      );
      await assert.rejects(
        accessCapabilities(systems, { q: "x".repeat(101) }),
        code("InvalidFilter"),
      );
      await assert.rejects(
        accessCapability(systems, "admin.access.approve"),
        code("NotFound"),
      );
      await assert.rejects(
        accessCapability(systems, "shared.read", { scope: "All" }),
        code("InvalidFilter"),
      );
      await assert.rejects(
        accessCapability(systems, "shared.read", { state: "Allowed" }),
        code("InvalidFilter"),
      );
      for (const offset of ["-1", "1.5", "NaN", "100001"])
        await assert.rejects(
          accessCapability(systems, "shared.read", { offset }),
          code("InvalidPage"),
        );
    },
  );
  await t.test(
    "unauthorised, expired and company-narrowed reviewers cannot inspect the catalogue or holders",
    async () => {
      for (const p of [
        observer,
        (await createSession("other-workspace")).principal,
      ]) {
        await assert.rejects(accessCapabilities(p), code("Forbidden"));
        await assert.rejects(
          accessCapability(p, "shared.read"),
          code("Forbidden"),
        );
      }
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='admin.access.read'",
        [systems.actor_id],
      );
      try {
        await assert.rejects(accessCapabilities(systems), code("Forbidden"));
        await assert.rejects(
          accessCapability(systems, "shared.read"),
          code("Forbidden"),
        );
      } finally {
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='admin.access.read'",
          [systems.actor_id],
        );
      }
      await database().query(
        "INSERT INTO ppo.working_companies(workspace_id,user_id,company_id) VALUES($1,$2,$3)",
        [ws, systems.actor_id, companyA],
      );
      try {
        await assert.rejects(
          accessCapabilities(systems),
          code("WorkingCompanySelected"),
        );
        await assert.rejects(
          accessCapability(systems, "shared.read"),
          code("WorkingCompanySelected"),
        );
      } finally {
        await database().query(
          "DELETE FROM ppo.working_companies WHERE user_id=$1",
          [systems.actor_id],
        );
      }
    },
  );
  await t.test(
    "same-name companies, site scope and cross-workspace grants remain distinct",
    async () => {
      const all = await accessCapability(systems, "shared.read");
      assert(
        !all.items.some(
          (g) => g.user_id === "30000000-0000-4000-8000-000000000004",
        ),
      );
      const companies = all.items.filter((g) => g.scope_type === "Company");
      assert(companies.some((g) => g.erp_company_id === "SYN-A"));
      assert(companies.some((g) => g.erp_company_id === "SYN-B"));
      const sites = await accessCapability(systems, "shared.read", {
        scope: "Site",
      });
      assert(sites.items.length);
      assert(
        sites.items.every(
          (g) =>
            g.scope_type === "Site" &&
            g.site_id &&
            g.site_number &&
            g.erp_company_id,
        ),
      );
      assert(
        sites.items.some(
          (g) => g.user_id === observer.actor_id && g.site_id === siteA,
        ),
      );
    },
  );
  await t.test(
    "current counts exclude expired, scheduled and inactive identities; stable pagination and masked names",
    async () => {
      // All synthetic fixtures are local to this proof. The 60 grants exceed a page.
      const ids = Array.from({ length: 60 }, () => randomUUID());
      const before = (await accessCapabilities(systems, { q: "shared.read" }))
        .items[0];
      try {
        for (const [index, id] of ids.entries()) {
          await database().query(
            "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name,active) VALUES($1::uuid,$2,$3,$1::text,$4,$5)",
            [
              id,
              ws,
              index === 0 ? "PPO-EntraDemo" : "PPO-LocalSynthetic",
              index === 0
                ? "SYN Hidden catalogue name"
                : `SYN Catalogue ${String(index).padStart(2, "0")}`,
              index !== 3,
            ],
          );
          await database().query(
            `INSERT INTO ppo.permission_grants(workspace_id,user_id,capability,scope_type,scope_id,company_id,valid_from,valid_to)
          VALUES($1,$2,'shared.read','Company',$3,$3,
            CASE WHEN $4=1 THEN clock_timestamp()+interval '1 day' ELSE clock_timestamp()-interval '2 days' END,
            CASE WHEN $4=2 THEN clock_timestamp()-interval '1 day' ELSE NULL END)`,
            [ws, id, companyA, index],
          );
        }
        const after = (await accessCapabilities(systems, { q: "shared.read" }))
          .items[0];
        assert.equal(after.recorded, before.recorded + 60);
        assert.equal(after.current, before.current + 57);
        const first = await accessCapability(systems, "shared.read");
        const second = await accessCapability(systems, "shared.read", {
          offset: "50",
        });
        assert.equal(first.items.length, 50);
        assert(first.has_more);
        assert(!second.has_more);
        const all = [...first.items, ...second.items];
        assert.equal(new Set(all.map((g) => g.id)).size, after.recorded);
        assert.equal(all.length, after.recorded);
        assert.equal(
          all.find((g) => g.user_id === ids[0])?.display_name,
          "Hosted identity (masked)",
        );
        assert(!JSON.stringify(all).includes("Hidden catalogue"));
        assert(!JSON.stringify(all).includes("subject_id"));
        for (const [index, state] of [
          [1, "Scheduled"],
          [2, "Expired"],
          [3, "Inactive identity"],
        ] as const) {
          const filtered = await accessCapability(systems, "shared.read", {
            state,
          });
          assert(filtered.items.some((g) => g.user_id === ids[index]));
          assert(filtered.items.every((g) => g.state === state));
        }
      } finally {
        await database().query(
          "DELETE FROM ppo.permission_grants WHERE user_id=ANY($1::uuid[])",
          [ids],
        );
        // Each user is referenced by the full integrated schema. Bound each FK
        // cleanup statement instead of exhausting the ordinary statement timeout.
        for (const id of ids)
          await database().query("DELETE FROM ppo.users WHERE id=$1", [id]);
      }
    },
  );
  await t.test(
    "catalogue and holder reads leave identities, grants, audit, sessions and working-company rows unchanged",
    async () => {
      const snapshot = () =>
        Promise.all(
          [
            "users",
            "permission_grants",
            "audit_events",
            "sessions",
            "working_companies",
          ].map((table) =>
            rows(
              `SELECT row_to_json(t) AS value FROM ppo.${table} t ORDER BY row_to_json(t)::text`,
            ),
          ),
        );
      const before = await snapshot();
      await accessCapabilities(systems);
      await accessCapability(systems, "shared.read");
      assert.deepEqual(await snapshot(), before);
    },
  );
});

test("AD01-04 proposed roles compare current authority at one exact scope without assigning access", async (t) => {
  const systems = (await createSession("systems")).principal;
  const observer = (await createSession("site-observer")).principal;
  const workspaceObserver = (await createSession("workspace-observer"))
    .principal;
  const selection = {
    bundle_id: "bundle-observer",
    revision: "r01",
    company_id: companyA,
    site_id: siteA,
  };
  const compare = (input = selection, id = observer.actor_id) =>
    compareAccessRole(systems, id, input);
  await t.test(
    "catalogue is proposed only; exact revision and selection are required",
    async () => {
      const catalogue = await accessRoles(systems);
      assert.equal(catalogue.items.length, 7);
      assert(!JSON.stringify(catalogue).includes("Adopted"));
      assert(!catalogue.items.some((item) => item.id === "bundle-hosted-demo"));
      for (const fields of [
        { bundle_id: "bundle-hosted-demo" },
        { bundle_id: "toString" },
        { revision: "latest" },
        { revision: "r02" },
      ])
        await assert.rejects(
          compare({ ...selection, ...fields }),
          code("InvalidRoleProposal"),
        );
      await assert.rejects(
        compare({ ...selection, company_id: "" }),
        code("InvalidIdentifier"),
      );
      await assert.rejects(
        compare({ ...selection, company_id: companyB }),
        code("NotFound"),
      );
      await assert.rejects(
        compare(selection, "30000000-0000-4000-8000-000000000004"),
        code("NotFound"),
      );
      await assert.rejects(
        compare({ ...selection, company_id: randomUUID(), site_id: "" }),
        code("NotFound"),
      );
      const first = await compare({
        ...selection,
        bundle_id: "bundle-service-coordinator",
      });
      const draft = await compare({
        ...selection,
        bundle_id: "bundle-service-coordinator",
        revision: "r02",
      });
      assert.equal(first.items.length, 13);
      assert.equal(first.state, "Proposed");
      assert.equal(draft.items.length, 14);
      assert.equal(draft.state, "Draft");
      assert.deepEqual(
        draft.items
          .filter(
            (item) =>
              !first.items.some(
                (prior) => prior.capability === item.capability,
              ),
          )
          .map((item) => item.capability),
        ["pack.check"],
      );
    },
  );
  await t.test(
    "Site, Company and Workspace checks never match an unrelated grant",
    async () => {
      assert.equal((await compare()).matched, 1);
      assert.equal(
        (await compare({ ...selection, site_id: siteB })).matched,
        0,
      );
      assert.equal((await compare({ ...selection, site_id: "" })).matched, 0);
      assert.equal(
        (await compare({ ...selection, company_id: companyB, site_id: "" }))
          .matched,
        0,
      );
      const wide = await compare(
        { ...selection, company_id: companyB, site_id: "" },
        workspaceObserver.actor_id,
      );
      assert.equal(wide.matched, 1);
      assert.equal(wide.company.erp_company_id, "SYN-B");
      assert.match(wide.limitation, /no role is assigned/);
      assert.match(wide.limitation, /independent approval/);
      await database().query(
        "INSERT INTO ppo.working_companies(workspace_id,user_id,company_id) VALUES($1,$2,$3)",
        [ws, workspaceObserver.actor_id, companyA],
      );
      try {
        const narrowed = await compare(
          { ...selection, company_id: companyB, site_id: "" },
          workspaceObserver.actor_id,
        );
        assert.equal(narrowed.matched, 0);
        assert.match(narrowed.reason, /working company/);
      } finally {
        await database().query(
          "DELETE FROM ppo.working_companies WHERE user_id=$1",
          [workspaceObserver.actor_id],
        );
      }
    },
  );
  await t.test(
    "inactive identity and future/expired grants remove matches",
    async () => {
      const saved = await rows(
        "SELECT id,valid_from,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability='shared.read'",
        [observer.actor_id],
      );
      await database().query("UPDATE ppo.users SET active=false WHERE id=$1", [
        observer.actor_id,
      ]);
      try {
        const inactive = await compare();
        assert.equal(inactive.matched, 0);
        assert.match(inactive.reason, /inactive/);
      } finally {
        await database().query("UPDATE ppo.users SET active=true WHERE id=$1", [
          observer.actor_id,
        ]);
      }
      try {
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=clock_timestamp()-interval '1 second' WHERE user_id=$1 AND capability='shared.read'",
          [observer.actor_id],
        );
        assert.equal((await compare()).matched, 0);
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=NULL,valid_from=clock_timestamp()+interval '1 day' WHERE user_id=$1 AND capability='shared.read'",
          [observer.actor_id],
        );
        assert.equal((await compare()).matched, 0);
      } finally {
        for (const grant of saved)
          await database().query(
            "UPDATE ppo.permission_grants SET valid_from=$2,valid_to=$3 WHERE id=$1",
            [grant.id, grant.valid_from, grant.valid_to],
          );
      }
    },
  );
  await t.test(
    "reviewer permissions and cleared working company are required on both reads",
    async () => {
      await assert.rejects(accessRoles(observer), code("Forbidden"));
      await assert.rejects(
        compareAccessRole(observer, observer.actor_id, selection),
        code("Forbidden"),
      );
      const saved = await rows(
        "SELECT id,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability='admin.access.read'",
        [systems.actor_id],
      );
      try {
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='admin.access.read'",
          [systems.actor_id],
        );
        await assert.rejects(accessRoles(systems), code("Forbidden"));
        await assert.rejects(compare(), code("Forbidden"));
      } finally {
        for (const grant of saved)
          await database().query(
            "UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1",
            [grant.id, grant.valid_to],
          );
      }
      await database().query(
        "INSERT INTO ppo.working_companies(workspace_id,user_id,company_id) VALUES($1,$2,$3)",
        [ws, systems.actor_id, companyA],
      );
      try {
        await assert.rejects(
          accessRoles(systems),
          code("WorkingCompanySelected"),
        );
        await assert.rejects(compare(), code("WorkingCompanySelected"));
      } finally {
        await database().query(
          "DELETE FROM ppo.working_companies WHERE user_id=$1",
          [systems.actor_id],
        );
      }
    },
  );
  await t.test(
    "hosted comparison masks identities; all reads preserve grants, users, audit and session state",
    async () => {
      const hosted = randomUUID();
      await database().query(
        "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-EntraDemo','role-comparison-private-subject','SYN Role private name')",
        [hosted, ws],
      );
      try {
        const snapshot = () =>
          Promise.all(
            [
              "users",
              "permission_grants",
              "audit_events",
              "sessions",
              "working_companies",
            ].map((name) => rows(`SELECT * FROM ppo.${name} ORDER BY 1,2`)),
          );
        const before = await snapshot();
        const masked = await compare(selection, hosted);
        assert.equal(masked.person.display_name, "Hosted identity (masked)");
        assert.equal(masked.matched, 0);
        assert.match(masked.authentication, /not been evaluated/);
        assert(
          !JSON.stringify(masked).includes("role-comparison-private-subject"),
        );
        assert(!JSON.stringify(masked).includes("SYN Role private name"));
        await accessRoles(systems);
        await compare();
        await compare({ ...selection, bundle_id: "bundle-technician" });
        assert.deepEqual(await snapshot(), before);
      } finally {
        await database().query("DELETE FROM ppo.users WHERE id=$1", [hosted]);
      }
    },
  );
});
