// Actual route adapters on a task-owned loopback server; no UI or compiled-routing claim.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { closeDatabase, database } from "../../src/platform/database";
import { createSession, sessionCookie } from "../../src/platform/identity";
import { withRequestScope } from "../../src/platform/working-company";
import type { RouteContext } from "../../src/shared/http";
import { GET as site } from "../../src/app/api/v1/sites/[id]/route";
import { GET as search } from "../../src/app/api/v1/search/route";
import { GET as suggest } from "../../src/app/api/v1/shell/search/route";
import { GET as preview } from "../../src/app/api/v1/search/preview/route";
import { GET as notices } from "../../src/app/api/v1/notifications/route";
import { GET as notice } from "../../src/app/api/v1/notifications/[id]/route";
import { POST as create } from "../../src/app/api/v1/activities/route";
import { GET as activity } from "../../src/app/api/v1/activities/[id]/route";
import { GET as operation } from "../../src/app/api/v1/operations/[id]/route";
import { GET as finance } from "../../src/app/api/v1/finance/handoffs/route";
import { POST as company } from "../../src/app/api/v1/shell/company/route";
import {
  generatedFile,
  issueFile,
  previewPack,
} from "../../src/documents/http";
import { digest, LocalSyntheticDocumentStore } from "../../src/documents/store";
import { CRM, crmBase } from "./crm";
import { issued } from "./packs";

const routes: Record<
  string,
  (r: NextRequest, c: RouteContext) => Promise<Response>
> = {
  site,
  search,
  suggest,
  preview,
  notices,
  notice,
  create,
  activity,
  operation,
  finance,
  company,
  "issue-html": issueFile("html"),
  "issue-pdf": issueFile("pdf"),
  "issue-manifest": issueFile("manifest"),
  "draft-preview": previewPack,
  "generated-html": generatedFile("html"),
  "generated-pdf": generatedFile("pdf"),
};

test("PT-01 / PT-18 scoped projections, recovery and storage-time authority", async (t) => {
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error("Disposable synthetic database required");
  t.after(closeDatabase);
  process.env.PPO_ALLOW_RESET = "dispose-synthetic";
  process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
  await reset();
  const origin = localConfig().origin,
    gateway = randomUUID();
  process.env.PPO_LOCAL_GATEWAY = gateway;
  const profiles = [
    "coordinator",
    "assigned-technician",
    "second-company",
    "other-workspace",
    "systems",
    "finance",
    "workspace-observer",
  ];
  const sessions = Object.fromEntries(
    await Promise.all(profiles.map(async (p) => [p, await createSession(p)])),
  );
  let discardOriginal = false;
  const server = createServer(async (req, res) => {
    try {
      const [route, id = ""] = new URL(req.url ?? "/", origin).pathname
        .slice(1)
        .split("/");
      const handler = routes[route];
      if (!handler) {
        res.writeHead(404);
        res.end();
        return;
      }
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const request = new NextRequest(origin + req.url, {
        method: req.method,
        headers: req.headers as Record<string, string>,
        ...(req.method === "GET" ? {} : { body: Buffer.concat(chunks) }),
      });
      const response = await withRequestScope(() =>
        handler(request, { params: Promise.resolve({ id }) }),
      );
      if (route === "create" && response.status === 201 && discardOriginal) {
        discardOriginal = false;
        res.destroy();
        return;
      }
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      res.writeHead(500);
      res.end("Test harness failed");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}`;
  const call = (path: string, profile = "coordinator", body?: unknown) =>
    fetch(url + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "x-ppo-local-gateway": gateway,
        origin,
        "content-type": "application/json",
        cookie: `${sessionCookie}=${sessions[profile]?.token ?? ""}`,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const checked = async (response: Response, status = 200) => {
    assert.equal(response.status, status, await response.clone().text());
    assert.match(response.headers.get("cache-control") ?? "", /private/);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    return response.json();
  };
  const denied = async (response: Response, secrets: string[]) => {
    assert.ok(
      [403, 404].includes(response.status),
      `Expected refusal; got ${response.status}`,
    );
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.equal(response.headers.has("content-disposition"), false);
    const text = await response.text();
    for (const secret of secrets) {
      assert.ok(!text.includes(secret), "Restricted value in response body");
      assert.ok(
        !JSON.stringify([...response.headers]).includes(secret),
        "Restricted value in response headers",
      );
    }
  };
  const input = {
    ...crmBase(),
    id: randomUUID(),
    company_id: CRM.company,
    site_id: CRM.site,
    kind: "CustomerContact",
    owner_id: CRM.owner,
    summary: "SYN PT01 PRIVATE OWNED FOLLOWUP",
    due_at: null,
    due_needed: true,
    access_class: "RestrictedService",
    links: [{ object_type: "Site", object_id: CRM.site }],
  };
  try {
    await t.test(
      "company/site/workspace isolation applies to direct reads, search, suggestions and Finance",
      async () => {
        await checked(await call(`/site/${CRM.site}`, "assigned-technician"));
        const hiddenSites = [
          "70000000-0000-4000-8000-000000000002",
          "70000000-0000-4000-8000-000000000003",
          "70000000-0000-4000-8000-000000000004",
        ];
        const hiddenTitles = [
          "SYN V01 Previous Site",
          "SYN Company B Site",
          "SYN Isolated Site",
        ];
        for (const [index, id] of hiddenSites.entries()) {
          await denied(await call(`/site/${id}`, "assigned-technician"), [
            hiddenTitles[index],
          ]);
          await denied(
            await call(`/preview?kind=Site&id=${id}`, "assigned-technician"),
            [hiddenTitles[index]],
          );
        }
        for (const path of ["/search?q=SYN&kind=Site", "/suggest?q=SYN"]) {
          const value = await checked(await call(path, "assigned-technician"));
          for (const secret of [...hiddenSites, ...hiddenTitles])
            assert.ok(!JSON.stringify(value).includes(secret));
          assert.ok(
            JSON.stringify(value).includes(CRM.site),
            "Allowed site remains discoverable",
          );
        }
        for (const p of ["systems", "second-company", "other-workspace"])
          await denied(await call(`/site/${CRM.site}`, p), [
            "SYN Q01 Demonstration Site",
          ]);
        for (const p of ["systems", "assigned-technician", "coordinator"])
          await denied(await call("/finance", p), ["SYN-PPO-FIN"]);
        await checked(await call("/finance", "finance"));
        assert.equal(
          (await checked(await call("/search?q=SYN", "systems"))).items.length,
          0,
        );
        await denied(await call("/notices", "systems"), [input.summary]);
        await checked(await call(`/site/${CRM.site}`, "anonymous"), 401);
        const reader = "workspace-observer";
        await checked(
          await call("/company", reader, { company_id: CRM.companyB }),
        );
        await denied(await call(`/site/${CRM.site}`, reader), [
          "SYN Q01 Demonstration Site",
        ]);
        await checked(await call(`/site/${hiddenSites[1]}`, reader));
        const narrowed = await checked(
          await call("/search?q=SYN&kind=Site", reader),
        );
        assert.ok(!JSON.stringify(narrowed).includes(CRM.site));
        assert.ok(JSON.stringify(narrowed).includes(hiddenSites[1]));
        await checked(await call("/company", reader, { company_id: null }));
      },
    );

    await t.test(
      "lost response, revoked authority and restored retry preserve one exact original",
      async () => {
        discardOriginal = true;
        await assert.rejects(call("/create", "coordinator", input));
        assert.equal(
          discardOriginal,
          false,
          "Response lost after a successful commit",
        );
        const original = await checked(
          await call(`/operation/${input.operation_id}`),
        );
        const snapshot = async () =>
          (
            await database().query(
              `SELECT 'activity' kind,to_jsonb(a) row FROM ppo.activities a WHERE id=$1
         UNION ALL SELECT 'receipt',to_jsonb(r) FROM ppo.operation_receipts r WHERE operation_id=$2
         UNION ALL SELECT 'accepted-audit',to_jsonb(a) FROM ppo.audit_events a WHERE operation_id=$2 AND outcome='Accepted'
         UNION ALL SELECT 'outbox',to_jsonb(j) FROM ppo.outbox_jobs j WHERE operation_id=$2 ORDER BY kind`,
              [input.id, input.operation_id],
            )
          ).rows;
        const saved = await snapshot();
        assert.equal(saved.length, 4);
        for (const p of [
          "assigned-technician",
          "systems",
          "second-company",
          "other-workspace",
          "finance",
        ])
          await denied(await call(`/operation/${input.operation_id}`, p), [
            input.id,
            original.receipt_id,
          ]);
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='activity.edit'",
          [CRM.owner],
        );
        await denied(await call(`/operation/${input.operation_id}`), [
          input.id,
          original.receipt_id,
        ]);
        await denied(await call("/create", "coordinator", input), [
          input.id,
          original.receipt_id,
        ]);
        await checked(await call(`/activity/${input.id}`)); // Read permission is independent of recovery authority.
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='activity.edit'",
          [CRM.owner],
        );
        assert.deepEqual(
          await checked(await call(`/operation/${input.operation_id}`)),
          original,
        );
        assert.deepEqual(
          await checked(await call("/create", "coordinator", input)),
          original,
        );
        await checked(
          await call("/create", "coordinator", {
            ...input,
            summary: "SYN changed original",
          }),
          409,
        );
        assert.deepEqual(await snapshot(), saved);
      },
    );

    await t.test(
      "notifications and previews recheck current source access without changing saved evidence",
      async () => {
        const inbox = await checked(await call("/notices"));
        const owned = inbox.items.find(
          (n: { source_id: string }) => n.source_id === input.id,
        );
        assert.ok(owned);
        for (const p of [
          "assigned-technician",
          "second-company",
          "other-workspace",
          "finance",
        ]) {
          const other = await checked(await call("/notices", p));
          assert.ok(!JSON.stringify(other).includes(input.summary));
          await denied(await call(`/notice/${owned.id}`, p), [
            input.summary,
            input.id,
          ]);
        }
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='shared.read'",
          [CRM.owner],
        );
        const hidden = await checked(await call("/notices"));
        assert.ok(!JSON.stringify(hidden).includes(input.summary));
        assert.ok(
          !hidden.obligations.some((o: { id: string }) => o.id === input.id),
        );
        await denied(await call(`/notice/${owned.id}`), [
          input.summary,
          input.id,
        ]);
        await denied(await call(`/preview?kind=Activity&id=${input.id}`), [
          input.summary,
        ]);
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='shared.read'",
          [CRM.owner],
        );
        assert.equal(
          (await checked(await call(`/notice/${owned.id}`))).title,
          input.summary,
        );
      },
    );

    const pack = await issued();
    const manifest = pack.pack.issues.find(
      (i: { id: string }) => i.id === pack.issue_id,
    ).manifest;
    await t.test(
      "issued previews, manifests and file exports retain recipient and company isolation",
      async () => {
        for (const p of [
          "systems",
          "second-company",
          "other-workspace",
          "finance",
        ])
          for (const route of ["issue-html", "issue-pdf", "issue-manifest"])
            await denied(await call(`/${route}/${pack.issue_id}`, p), [
              pack.pack.display_number,
              manifest.filename,
              manifest.html_hash,
            ]);
        await denied(
          await call(`/draft-preview/${pack.pack.id}`, "assigned-technician"),
          [pack.pack.display_number],
        );
        await checked(
          await call(
            `/preview?kind=Issued%20job%20pack&id=${pack.issue_id}`,
            "assigned-technician",
          ),
        );
      },
    );

    for (const kind of ["html", "pdf"] as const) {
      for (const generated of [false, true]) {
        const route = `${generated ? "generated" : "issue"}-${kind}`;
        await t.test(
          `${route} refuses authority revoked during storage and recovers exact bytes`,
          async (sub) => {
            const profile = generated ? "coordinator" : "assigned-technician";
            const actor = sessions[profile].principal.actor_id;
            const capability = generated ? "pack.issue" : "pack.read";
            const path = `/${route}/${generated ? pack.job.id : pack.issue_id}`;
            const allowed = await call(path, profile);
            assert.equal(allowed.status, 200);
            assert.equal(
              allowed.headers.get("cache-control"),
              "private, no-store",
            );
            const original = Buffer.from(await allowed.arrayBuffer());
            assert.equal(digest(original), manifest[`${kind}_hash`]);
            const events = async () =>
              (
                await database().query(
                  "SELECT count(*)::int n FROM ppo.pack_distribution_events",
                )
              ).rows[0].n;
            const before = await events();
            const read = LocalSyntheticDocumentStore.prototype.read;
            let challenged = false;
            const hook = sub.mock.method(
              LocalSyntheticDocumentStore.prototype,
              "read",
              async function (
                this: LocalSyntheticDocumentStore,
                ...args: Parameters<typeof read>
              ) {
                const bytes = await read.apply(this, args);
                await database().query(
                  "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability=$2",
                  [actor, capability],
                );
                challenged = true;
                return bytes;
              },
            );
            try {
              await denied(await call(path, profile), [
                pack.pack.display_number,
                manifest.filename,
                manifest.html_hash,
              ]);
              assert.equal(challenged, true);
              assert.equal(
                await events(),
                before,
                "A denied read must not record delivery",
              );
            } finally {
              hook.mock.restore();
              await database().query(
                "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability=$2",
                [actor, capability],
              );
            }
            const recovered = await call(path, profile);
            assert.equal(recovered.status, 200);
            assert.deepEqual(
              Buffer.from(await recovered.arrayBuffer()),
              original,
            );
          },
        );
      }
    }
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
    await closeDatabase();
  }
});
