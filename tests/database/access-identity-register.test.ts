import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { recoverSchema } from "../helpers/recover-schema";
import { readFile } from "node:fs/promises";
import { migrate, seed } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { accessIdentityRegister } from "../../src/access/identity-register";
import { createLocalTeam } from "../../src/access/local-teams";
import {
  submitAccessRequest,
  decideAccessRequest,
  applyAccessRequest,
} from "../../src/access/requests";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required");
after(closeDatabase);
const ws = "10000000-0000-4000-8000-000000000001",
  companyA = "20000000-0000-4000-8000-000000000001",
  companyB = "20000000-0000-4000-8000-000000000002",
  site = "70000000-0000-4000-8000-000000000001";
const rows = async (sql: string, params: unknown[] = []) =>
  (await database().query(sql, params)).rows;
const code = (value: string) => (e: unknown) =>
  (e as { code: string }).code === value;

test(
  "AD01 identity register: current projection, private identities, filters, pagination and read boundary",
  { timeout: 300000 },
  async (t) => {
    await transaction(async (c) => {
      await recoverSchema(c);
      await c.query("DROP TABLE IF EXISTS public.ppo_migrations");
    });
    await migrate();
    await seed();
    if (
      !(await rows("SELECT to_regclass('ppo.demo_testers') AS table_name"))[0]
        .table_name
    )
      await database().query(
        await readFile(
          new URL("../../db/demo/0001-identity.sql", import.meta.url),
          "utf8",
        ),
      );
    const systems = (await createSession("systems")).principal;
    const reviewer = (await createSession("scheduling-policy-reviewer"))
      .principal;
    const prefix = `SYN register ${randomUUID().slice(0, 8)}`;
    const subject = randomUUID(),
      inactive = randomUUID(),
      hosted = randomUUID();
    for (const [id, name, active, issuer] of [
      [subject, `${prefix} Person`, true, "PPO-LocalSynthetic"],
      [inactive, `${prefix} Inactive`, false, "PPO-LocalSynthetic"],
      [hosted, `Private ${prefix}`, true, "PPO-EntraDemo"],
    ]) {
      await rows(
        "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name,active) VALUES($1::uuid,$2,$3,($1::uuid)::text,$4,$5)",
        [id, ws, issuer, name, active],
      );
    }
    await rows(
      `INSERT INTO ppo.permission_grants(workspace_id,user_id,capability,scope_type,scope_id,company_id,site_id,valid_from,valid_to) VALUES
    ($1,$2,'shared.read','Company',$4,$4,NULL,'2000-01-01',NULL),
    ($1,$2,'shared.read','Company',$5,$5,NULL,'2090-01-01T00:00:00Z',NULL),
    ($1,$2,'shared.read','Site',$6,$4,$6,'2000-01-01','2001-01-01'),
    ($1,$3,'shared.read','Company',$4,$4,NULL,'2000-01-01',NULL)`,
      [ws, subject, inactive, companyA, companyB, site],
    );
    await t.test(
      "states share one read instant; inactive identity takes precedence; scope keeps ERP keys and sites",
      async () => {
        const result = await accessIdentityRegister(systems, { q: prefix });
        assert.equal(result.total, 2);
        assert.equal(result.counts.active, 1);
        assert.equal(result.counts.inactive, 1);
        const person = result.items.find((r) => r.id === subject)!;
        assert.deepEqual(
          [
            person.grant_count,
            person.current_count,
            person.scheduled_count,
            person.expired_count,
          ],
          [3, 1, 1, 1],
        );
        assert.deepEqual(person.company_keys, ["SYN-A", "SYN-B"]);
        assert.equal(person.site_count, 1);
        assert.equal(person.last_changed_at, null);
        assert.equal(
          new Date(person.next_scheduled_at!).getUTCFullYear(),
          2090,
        );
        assert(!Number.isNaN(Date.parse(result.observed_at)));
        const off = result.items.find((r) => r.id === inactive)!;
        assert.deepEqual(
          [
            off.grant_count,
            off.current_count,
            off.scheduled_count,
            off.expired_count,
          ],
          [1, 0, 0, 0],
        );
      },
    );
    await t.test(
      "literal search, masked hosted fields, company reach and out-of-workspace company refusal",
      async () => {
        assert.equal(
          (await accessIdentityRegister(systems, { q: `Private ${prefix}` }))
            .total,
          0,
        );
        assert.equal(
          (await accessIdentityRegister(systems, { q: "%" })).total,
          0,
        );
        const mask = (
          await accessIdentityRegister(systems, { view: "hosted" })
        ).items.find((r) => r.id === hosted)!;
        assert.equal(mask.display_name, "Hosted identity (masked)");
        assert.equal(mask.masked, true);
        assert(!JSON.stringify(mask).includes("subject_id"));
        assert(!JSON.stringify(mask).includes("SYN-Hosted"));
        assert.deepEqual(
          (
            await accessIdentityRegister(systems, {
              q: prefix,
              company_id: companyB,
            })
          ).items.map((r) => r.id),
          [subject],
        );
        assert.equal(
          (
            await accessIdentityRegister(systems, {
              q: prefix,
              view: "inactive",
            })
          ).items[0].id,
          inactive,
        );
        await assert.rejects(
          accessIdentityRegister(systems, { company_id: randomUUID() }),
          code("NotFound"),
        );
        const allA = await accessIdentityRegister(systems, {
          company_id: companyA,
        });
        assert(
          allA.items.some((r) => r.id === systems.actor_id),
          "workspace grants reach the company filter",
        );
      },
    );
    await t.test(
      "real saved teams and independent requests are counted without granting access on approval",
      async () => {
        await createLocalTeam(systems, {
          schema_version: 1,
          operation_id: randomUUID(),
          team_id: randomUUID(),
          expected_version: 0,
          name: `${prefix} team`,
          purpose: "Synthetic register membership proof",
          reason: "Verify the saved team register projection.",
          lead_id: subject,
          member_ids: [subject, reviewer.actor_id],
        });
        const requestId = randomUUID();
        await submitAccessRequest(systems, {
          schema_version: 1,
          operation_id: randomUUID(),
          request_id: requestId,
          subject_id: subject,
          reviewer_id: reviewer.actor_id,
          capability: "pack.prepare",
          scope_type: "Company",
          company_id: companyA,
          site_id: null,
          valid_from: "2090-01-01T00:00:00Z",
          valid_to: null,
          reason: "Synthetic identity register request proof.",
        });
        const read = async () =>
          (await accessIdentityRegister(systems, { q: `${prefix} Person` }))
            .items[0];
        assert.deepEqual((await read()).teams, [`${prefix} team`]);
        assert.equal((await read()).submitted_count, 1);
        await decideAccessRequest(reviewer, requestId, {
          schema_version: 1,
          operation_id: randomUUID(),
          expected_version: 1,
          decision: "Approved",
          reason: "Independently reviewed the synthetic request.",
        });
        assert.equal((await read()).approved_count, 1);
        assert.equal((await read()).grant_count, 3);
        assert.equal((await read()).last_changed_at, null);
        await applyAccessRequest(systems, requestId, {
          schema_version: 1,
          operation_id: randomUUID(),
          expected_version: 2,
          reason: "Apply the independently approved synthetic grant.",
        });
        const applied = await read();
        assert.equal(applied.approved_count, 0);
        assert.equal(applied.grant_count, 4);
        assert.equal(applied.scheduled_count, 2);
        assert(applied.last_changed_at);
      },
    );
    await t.test(
      "stable ties and zero-grant identities survive paging and an empty later page",
      async () => {
        for (let i = 0; i < 52; i++) {
          const id = randomUUID();
          await rows(
            "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1::uuid,$2,'PPO-LocalSynthetic',($1::uuid)::text,$3)",
            [id, ws, `${prefix} Page ${String(i).padStart(2, "0")}`],
          );
        }
        const first = await accessIdentityRegister(systems, {
          q: `${prefix} Page`,
          sort: "current",
        });
        const next = await accessIdentityRegister(systems, {
          q: `${prefix} Page`,
          sort: "current",
          offset: "50",
        });
        assert.equal(first.total, 52);
        assert.equal(first.items.length, 50);
        assert.equal(first.has_more, true);
        assert.equal(next.items.length, 2);
        assert.equal(next.has_more, false);
        assert.equal(
          new Set([...first.items, ...next.items].map((r) => r.id)).size,
          52,
        );
        assert(
          first.items.every(
            (r) => r.grant_count === 0 && r.company_keys.length === 0,
          ),
        );
        const empty = await accessIdentityRegister(systems, {
          q: `${prefix} Page`,
          offset: "100",
        });
        assert.equal(empty.total, 52);
        assert.equal(empty.items.length, 0);
      },
    );
    await t.test(
      "reads preserve all users and grants and enforce authority and workspace context",
      async () => {
        const snap = async () => ({
          users: await rows("SELECT * FROM ppo.users ORDER BY id"),
          grants: await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
        });
        const before = await snap();
        await accessIdentityRegister(systems);
        await accessIdentityRegister(systems, {
          sort: "expired",
          direction: "desc",
        });
        assert.deepEqual(await snap(), before);
        const observer = (await createSession("observer")).principal;
        await assert.rejects(
          accessIdentityRegister(observer),
          code("Forbidden"),
        );
        await rows(
          "INSERT INTO ppo.working_companies(workspace_id,user_id,company_id) VALUES($1,$2,$3)",
          [ws, systems.actor_id, companyA],
        );
        try {
          await assert.rejects(
            accessIdentityRegister(systems),
            code("WorkingCompanySelected"),
          );
        } finally {
          await rows(
            "DELETE FROM ppo.working_companies WHERE workspace_id=$1 AND user_id=$2",
            [ws, systems.actor_id],
          );
        }
        const invalidInputs: Record<string, string>[] = [
          { sort: "name; DROP TABLE users" },
          { direction: "up" },
          { view: "unknown" },
          { state: "unknown" },
          { offset: "-1" },
          { offset: "1.2" },
          { q: "x".repeat(101) },
          { company_id: "wrong" },
        ];
        for (const input of invalidInputs)
          await assert.rejects(accessIdentityRegister(systems, input));
      },
    );
  },
);
