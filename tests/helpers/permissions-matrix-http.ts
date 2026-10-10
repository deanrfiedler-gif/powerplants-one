// PT-01 / AT-01: explicit expected roles, never derived from the authorisation
// implementation. Real sessions, PostgreSQL, HTTP transport and exported routes.
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
import { GET as customer } from "../../src/app/api/v1/customers/[id]/route";
import { GET as search } from "../../src/app/api/v1/search/route";
import { GET as suggest } from "../../src/app/api/v1/shell/search/route";
import { GET as preview } from "../../src/app/api/v1/search/preview/route";
import { GET as notices } from "../../src/app/api/v1/notifications/route";
import { GET as notice } from "../../src/app/api/v1/notifications/[id]/route";
import { POST as noticeState } from "../../src/app/api/v1/notifications/state/route";
import { POST as createActivity } from "../../src/app/api/v1/activities/route";
import { GET as activity } from "../../src/app/api/v1/activities/[id]/route";
import { GET as report } from "../../src/app/api/v1/reports/[id]/route";
import { POST as serviceReview } from "../../src/app/api/v1/reports/[id]/review/route";
import { GET as reportHtml } from "../../src/app/api/v1/reports/[id]/html/route";
import { GET as reportPdf } from "../../src/app/api/v1/reports/[id]/pdf/route";
import { GET as reportManifest } from "../../src/app/api/v1/reports/[id]/manifest/route";
import { GET as reportGenerated } from "../../src/app/api/v1/report-render-jobs/[id]/output/route";
import { GET as reportPhoto } from "../../src/app/api/v1/reports/[id]/photo/route";
import { POST as respond } from "../../src/app/api/v1/reports/[id]/respond/route";
import { GET as signature } from "../../src/app/api/v1/customer-responses/[id]/signature/route";
import { GET as attachment } from "../../src/app/api/v1/attachments/[id]/route";
import { GET as attachmentFile } from "../../src/app/api/v1/attachments/[id]/bytes/route";
import { GET as finance } from "../../src/app/api/v1/finance/handoffs/[id]/route";
import { POST as financeReview } from "../../src/app/api/v1/finance/handoffs/[id]/review/route";
import { GET as financeFile } from "../../src/app/api/v1/finance/issues/[id]/bytes/route";
import { POST as company } from "../../src/app/api/v1/shell/company/route";
import {
  generatedFile,
  issueFile,
  previewPack,
} from "../../src/documents/http";
import { digest, LocalSyntheticDocumentStore } from "../../src/documents/store";
import {
  processFinanceJob,
  requestFinanceEvidence,
} from "../../src/finance/worker";
import { reconciledFinance, base, rows } from "./finance";
import { decision, response as responseInput } from "./reports";
import { png } from "./field";
import { CRM } from "./crm";

const profiles = [
  "coordinator",
  "assigned-technician",
  "finance",
  "finance-reviewer",
  "finance-processor",
  "finance-reconciler",
  "systems",
  "second-company",
  "other-workspace",
  "site-observer",
  "workspace-observer",
] as const;
type Profile = (typeof profiles)[number];
const financeRoles: readonly Profile[] = [
  "finance",
  "finance-reviewer",
  "finance-processor",
  "finance-reconciler",
];
const serviceRoles: readonly Profile[] = ["coordinator", "assigned-technician"];
const routes: Record<
  string,
  (r: NextRequest, c: RouteContext) => Promise<Response>
> = {
  site,
  customer,
  search,
  suggest,
  preview,
  notices,
  notice,
  noticeState,
  createActivity,
  activity,
  report,
  serviceReview,
  reportHtml,
  reportPdf,
  reportManifest,
  reportGenerated,
  reportPhoto,
  respond,
  signature,
  attachment,
  attachmentFile,
  finance,
  financeReview,
  financeFile,
  company,
  packHtml: issueFile("html"),
  packPdf: issueFile("pdf"),
  packManifest: issueFile("manifest"),
  packDraft: previewPack,
  packGeneratedHtml: generatedFile("html"),
  packGeneratedPdf: generatedFile("pdf"),
};

test("PT-01 joined role, scope, projection, export and approval matrix", async (t) => {
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error("Disposable synthetic database required");
  t.after(closeDatabase);
  process.env.PPO_ALLOW_RESET = "dispose-synthetic";
  process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
  await reset();
  // Existing domain commands create real reviewed/issued Service and reconciled
  // Finance originals. No insert fabricates an approval, recipient or output.
  const q = await reconciledFinance();
  const [handoff] = await rows(
    "SELECT * FROM ppo.finance_handoffs WHERE id=$1",
    [q.id],
  );
  const [review] = await rows(
    "SELECT * FROM ppo.finance_reviews WHERE handoff_id=$1",
    [q.id],
  );
  const [reconciliation] = await rows(
    "SELECT * FROM ppo.finance_reconciliations WHERE handoff_id=$1",
    [q.id],
  );
  await requestFinanceEvidence(q.reconciler, q.id, {
    ...base(),
    expected_version: handoff.version,
    revision_id: handoff.current_revision_id,
    review_id: review.id,
    reconciliation_id: reconciliation.id,
  });
  const [financeJob] = await rows(
    "SELECT * FROM ppo.finance_render_jobs WHERE handoff_id=$1",
    [q.id],
  );
  assert.ok("issue_id" in (await processFinanceJob(financeJob.id)));
  const [financeIssue] = await rows(
    "SELECT * FROM ppo.finance_issues WHERE handoff_id=$1",
    [q.id],
  );
  const [reportIssue] = await rows(
    "SELECT * FROM ppo.report_issues WHERE report_id=$1",
    [q.q.report.id],
  );
  const [reportJob] = await rows(
    "SELECT * FROM ppo.report_render_jobs WHERE report_id=$1",
    [q.q.report.id],
  );
  const [presentation] = await rows(
    "SELECT * FROM ppo.report_presentations WHERE issue_id=$1",
    [reportIssue.id],
  );
  const [packIssue] = await rows("SELECT * FROM ppo.pack_issues WHERE id=$1", [
    q.q.issue_id,
  ]);
  const [packJob] = await rows(
    "SELECT * FROM ppo.pack_render_jobs WHERE pack_id=$1",
    [q.q.pack.id],
  );
  const origin = localConfig().origin,
    gateway = randomUUID();
  process.env.PPO_LOCAL_GATEWAY = gateway;
  const sessions = Object.fromEntries(
    await Promise.all(profiles.map(async (p) => [p, await createSession(p)])),
  );
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
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      res.writeHead(500);
      res.end("Test harness failed");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
  });
  const address = server.address();
  assert(address && typeof address !== "string");
  const call = (path: string, profile: Profile | "anonymous", body?: unknown) =>
    fetch(`http://127.0.0.1:${address.port}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "x-ppo-local-gateway": gateway,
        origin,
        "content-type": "application/json",
        cookie: `${sessionCookie}=${sessions[profile]?.token ?? ""}`,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  function privateResponse(r: Response) {
    assert.match(r.headers.get("cache-control") ?? "", /private/);
    assert.match(r.headers.get("cache-control") ?? "", /no-store/);
  }
  async function json(r: Response, status = 200) {
    assert.equal(r.status, status, await r.clone().text());
    privateResponse(r);
    return r.json();
  }
  function absent(value: unknown, secrets: string[]) {
    const text = JSON.stringify(value);
    for (const secret of secrets)
      assert.ok(
        !text.includes(secret),
        `Restricted value disclosed: ${secret}`,
      );
  }
  const documentSecrets = [packIssue, reportIssue, financeIssue].flatMap(
    (i) => [
      i.id,
      i.manifest.filename,
      i.manifest.html_hash,
      i.manifest.pdf_hash,
    ],
  );
  async function denied(
    r: Response,
    secrets: string[] = documentSecrets,
    status = [403, 404],
  ) {
    assert.ok(
      status.includes(r.status),
      `Expected ${status}; got ${r.status} (${r.headers.get("content-type")})`,
    );
    privateResponse(r);
    assert.equal(r.headers.get("content-type"), "application/json");
    assert.equal(r.headers.has("content-disposition"), false);
    assert.equal(r.headers.has("x-content-sha256"), false);
    absent([await r.text(), [...r.headers]], secrets);
  }
  const sites = await rows(
    "SELECT id,display_name,company_id FROM ppo.sites WHERE id=ANY($1::uuid[]) ORDER BY id",
    [
      [1, 2, 3, 4].map(
        (n) => `70000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
      ),
    ],
  );
  assert.equal(sites.length, 4);
  const siteIndices: Record<Profile, number[]> = {
    coordinator: [0, 1],
    "assigned-technician": [0],
    finance: [0, 1],
    "finance-reviewer": [0, 1],
    "finance-processor": [0, 1],
    "finance-reconciler": [0, 1],
    systems: [],
    "second-company": [2],
    "other-workspace": [3],
    "site-observer": [0],
    "workspace-observer": [0, 1, 2],
  };
  const mark = png(144, 64),
    response = {
      ...responseInput(q.q.report),
      signature: {
        sha256: digest(mark),
        byte_count: mark.length,
        content_base64: mark.toString("base64"),
      },
    };
  await json(
    await call(`/respond/${q.q.report.id}`, "assigned-technician", response),
    201,
  );
  const [photo] = await rows(
    "SELECT * FROM ppo.field_attachments WHERE id=$1",
    [q.q.photo.id],
  );
  const bytes = [
    {
      path: `/packHtml/${packIssue.id}`,
      roles: serviceRoles,
      manifest: packIssue.manifest,
      format: "html",
    },
    {
      path: `/packPdf/${packIssue.id}`,
      roles: serviceRoles,
      manifest: packIssue.manifest,
      format: "pdf",
    },
    {
      path: `/packGeneratedHtml/${packJob.id}`,
      roles: ["coordinator"],
      manifest: packIssue.manifest,
      format: "html",
    },
    {
      path: `/packGeneratedPdf/${packJob.id}`,
      roles: ["coordinator"],
      manifest: packIssue.manifest,
      format: "pdf",
    },
    {
      path: `/reportHtml/${q.q.report.id}?presentation_id=${presentation.id}`,
      roles: serviceRoles,
      manifest: reportIssue.manifest,
      format: "html",
    },
    {
      path: `/reportPdf/${q.q.report.id}?presentation_id=${presentation.id}`,
      roles: serviceRoles,
      manifest: reportIssue.manifest,
      format: "pdf",
    },
    {
      path: `/reportGenerated/${reportJob.id}?kind=html`,
      roles: ["coordinator"],
      manifest: reportIssue.manifest,
      format: "html",
    },
    {
      path: `/reportGenerated/${reportJob.id}?kind=pdf`,
      roles: ["coordinator"],
      manifest: reportIssue.manifest,
      format: "pdf",
    },
    {
      path: `/financeFile/${financeIssue.id}?format=html`,
      roles: financeRoles,
      manifest: financeIssue.manifest,
      format: "html",
    },
    {
      path: `/financeFile/${financeIssue.id}?format=pdf`,
      roles: financeRoles,
      manifest: financeIssue.manifest,
      format: "pdf",
    },
    {
      path: `/attachmentFile/${photo.id}`,
      roles: ["assigned-technician"],
      manifest: { png_hash: photo.content_hash, png_bytes: photo.byte_count },
      format: "png",
    },
    {
      path: `/reportPhoto/${q.q.report.id}?revision_id=${q.q.report.revisions[0].id}&attachment_id=${photo.id}`,
      roles: ["coordinator"],
      manifest: { png_hash: photo.content_hash, png_bytes: photo.byte_count },
      format: "png",
    },
    {
      path: `/signature/${response.id}`,
      roles: serviceRoles,
      manifest: { png_hash: digest(mark), png_bytes: mark.length },
      format: "png",
    },
  ];
  async function exact(
    path: string,
    profile: Profile,
    manifest: Record<string, unknown>,
    format: string,
  ) {
    const r = await call(path, profile);
    assert.equal(r.status, 200, await r.clone().text());
    privateResponse(r);
    const data = Buffer.from(await r.arrayBuffer());
    assert.equal(digest(data), manifest[`${format}_hash`]);
    assert.equal(data.length, manifest[`${format}_bytes`]);
  }
  for (const profile of profiles) {
    await t.test(
      `${profile}: direct company/site, search and suggestion matrix`,
      async () => {
        for (const [i, s] of sites.entries()) {
          for (const path of [
            `/site/${s.id}`,
            `/preview?kind=Site&id=${s.id}`,
          ]) {
            if (siteIndices[profile].includes(i)) {
              const value = await json(await call(path, profile));
              assert.ok(JSON.stringify(value).includes(s.display_name));
            } else
              await denied(await call(path, profile), [s.id, s.display_name]);
          }
        }
        for (const path of ["/search?q=SYN&kind=Site", "/suggest?q=SYN"]) {
          const value = await json(await call(path, profile));
          const restricted = sites.filter(
            (_, i) => !siteIndices[profile].includes(i),
          );
          absent(
            value,
            restricted.flatMap((s) => [s.id, s.display_name]),
          );
          for (const i of siteIndices[profile])
            assert.ok(
              value.items.some(
                (item: { id: string }) => item.id === `Site:${sites[i].id}`,
              ),
            );
          if (profile === "systems") assert.deepEqual(value.items, []);
        }
      },
    );
    await t.test(
      `${profile}: document previews, manifests, exports and downloads`,
      async () => {
        for (const output of bytes) {
          if (output.roles.includes(profile))
            await exact(output.path, profile, output.manifest, output.format);
          else await denied(await call(output.path, profile));
        }
        const metadata = [
          {
            path: `/packManifest/${packIssue.id}`,
            roles: serviceRoles,
            secret: packIssue.manifest.pdf_hash,
          },
          {
            path: `/reportManifest/${q.q.report.id}?presentation_id=${presentation.id}`,
            roles: serviceRoles,
            secret: reportIssue.manifest.pdf_hash,
          },
          {
            path: `/preview?kind=Issued%20job%20pack&id=${packIssue.id}`,
            roles: serviceRoles,
            secret: q.q.pack.display_number,
          },
          {
            path: `/report/${q.q.report.id}`,
            roles: serviceRoles,
            secret: q.q.report.id,
          },
          { path: `/finance/${q.id}`, roles: financeRoles, secret: q.id },
          {
            path: `/attachment/${photo.id}`,
            roles: ["assigned-technician"],
            secret: photo.content_hash,
          },
        ];
        for (const row of metadata) {
          if (row.roles.includes(profile))
            assert.ok(
              JSON.stringify(
                await json(await call(row.path, profile)),
              ).includes(row.secret),
            );
          else
            await denied(await call(row.path, profile), [
              ...documentSecrets,
              row.secret,
            ]);
        }
        const found = await json(
          await call(
            `/search?q=${encodeURIComponent(q.q.pack.display_number)}&kind=Issued%20job%20pack`,
            profile,
          ),
        );
        assert.equal(
          found.items.some(
            (i: { id: string }) => i.id === `Issued job pack:${packIssue.id}`,
          ),
          serviceRoles.includes(profile),
        );
        if (!serviceRoles.includes(profile))
          absent(found, [packIssue.id, q.q.pack.display_number]);
        if (profile !== "coordinator")
          await denied(await call(`/packDraft/${q.q.pack.id}`, profile));
        else {
          const draft = await call(`/packDraft/${q.q.pack.id}`, profile);
          assert.equal(draft.status, 200);
          privateResponse(draft);
          assert.ok((await draft.text()).includes(q.q.pack.display_number));
        }
      },
    );
  }

  await t.test(
    "restricted customer fields do not leak through direct or search projections",
    async () => {
      const [org] = await rows(
        "SELECT notes FROM ppo.organisations WHERE id=$1",
        [CRM.org],
      );
      const marker = "SYN PT01 INTERNAL CUSTOMER NOTE";
      await database().query(
        "UPDATE ppo.organisations SET notes=$2 WHERE id=$1",
        [CRM.org, marker],
      );
      try {
        for (const profile of [
          "coordinator",
          "assigned-technician",
          "finance",
          "systems",
        ] as const) {
          const paths = [
            `/customer/${CRM.org}`,
            `/preview?kind=Customer&id=${CRM.org}`,
          ];
          for (const path of paths) {
            if (profile === "systems")
              await denied(await call(path, profile), [marker]);
            else {
              const value = await json(await call(path, profile));
              if (profile === "coordinator" && path.startsWith("/customer"))
                assert.ok(JSON.stringify(value).includes(marker));
              else absent(value, [marker]);
            }
          }
          absent(
            await json(await call("/search?q=SYN&kind=Customer", profile)),
            [marker],
          );
          absent(await json(await call("/suggest?q=SYN", profile)), [marker]);
        }
      } finally {
        await database().query(
          "UPDATE ppo.organisations SET notes=$2 WHERE id=$1",
          [CRM.org, org.notes],
        );
      }
    },
  );

  const owned: {
    profile: Profile;
    id: string;
    title: string;
    notice: string;
  }[] = [];
  for (const profile of [
    "coordinator",
    "assigned-technician",
    "finance",
    "second-company",
  ] as const) {
    const id = randomUUID(),
      title = `SYN PT01 owned ${profile} followup`;
    const site_id = profile === "second-company" ? sites[2].id : CRM.site;
    await json(
      await call("/createActivity", profile, {
        ...base(),
        id,
        company_id: profile === "second-company" ? CRM.companyB : CRM.company,
        site_id,
        kind: profile === "finance" ? "FinanceQuery" : "CustomerContact",
        owner_id: sessions[profile].principal.actor_id,
        summary: title,
        due_at: null,
        due_needed: true,
        access_class:
          profile === "finance" ? "RestrictedFinance" : "RestrictedService",
        links: [{ object_type: "Site", object_id: site_id }],
      }),
      201,
    );
    const inbox = await json(await call("/notices", profile));
    const n = inbox.items.find(
      (item: { source_id: string }) => item.source_id === id,
    );
    assert.ok(n, "The authorised owner's actual audit event projects a notice");
    owned.push({ profile, id, title, notice: n.id });
  }
  for (const profile of profiles)
    await t.test(
      `${profile}: notification recipient, counts, target and state matrix`,
      async () => {
        const expected = owned.filter((n) => n.profile === profile);
        if (
          ["systems", "finance-processor", "finance-reconciler"].includes(
            profile,
          )
        ) {
          await denied(
            await call("/notices", profile),
            owned.flatMap((n) => [n.id, n.title, n.notice]),
          );
        } else {
          const inbox = await json(await call("/notices", profile));
          absent(
            inbox,
            owned
              .filter((n) => n.profile !== profile)
              .flatMap((n) => [n.id, n.title, n.notice]),
          );
          for (const n of expected) {
            assert.ok(
              inbox.items.some((item: { id: string }) => item.id === n.notice),
            );
            assert.ok(
              inbox.obligations.some(
                (item: { id: string }) => item.id === n.id,
              ),
            );
            assert.equal(
              (await json(await call(`/notice/${n.notice}`, profile))).title,
              n.title,
            );
            await json(
              await call("/noticeState", profile, {
                action: "read",
                items: [{ id: n.notice, expected_version: 0 }],
              }),
            );
          }
        }
        for (const n of owned.filter((n) => n.profile !== profile)) {
          await denied(await call(`/notice/${n.notice}`, profile), [
            n.id,
            n.title,
            n.notice,
          ]);
          await denied(
            await call("/noticeState", profile, {
              action: "read",
              items: [{ id: n.notice, expected_version: 0 }],
            }),
            [n.id, n.title, n.notice],
          );
        }
      },
    );

  await t.test(
    "Finance activity fields remain restricted in direct reads, previews, search and suggestions",
    async () => {
      const n = owned.find((n) => n.profile === "finance")!;
      for (const profile of [
        "coordinator",
        "assigned-technician",
        "systems",
        "second-company",
        "other-workspace",
      ] as const) {
        await denied(await call(`/activity/${n.id}`, profile), [n.id, n.title]);
        await denied(await call(`/preview?kind=Activity&id=${n.id}`, profile), [
          n.id,
          n.title,
        ]);
        for (const path of ["/search?q=PT01&kind=Activity", "/suggest?q=PT01"])
          absent(await json(await call(path, profile)), [n.id, n.title]);
      }
      assert.ok(
        JSON.stringify(
          await json(await call(`/activity/${n.id}`, "finance")),
        ).includes(n.title),
      );
    },
  );

  await t.test(
    "Systems and non-review duties cannot approve Service or Finance, with no accepted effects",
    async () => {
      const snapshot = () =>
        rows(
          `SELECT 'service' kind,to_jsonb(r) row FROM ppo.service_reports r WHERE id=$1
      UNION ALL SELECT 'finance',to_jsonb(r) FROM ppo.finance_handoffs r WHERE id=$2
      UNION ALL SELECT 'service-review',to_jsonb(r) FROM ppo.report_reviews r WHERE report_id=$1
      UNION ALL SELECT 'finance-review',to_jsonb(r) FROM ppo.finance_reviews r WHERE handoff_id=$2 ORDER BY kind`,
          [q.q.report.id, q.id],
        );
      const before = await snapshot();
      const [revision] = await rows(
        "SELECT * FROM ppo.finance_revisions WHERE id=$1",
        [handoff.current_revision_id],
      );
      const operations: string[] = [];
      for (const profile of profiles) {
        if (profile !== "coordinator") {
          const cmd = decision(q.q.report);
          operations.push(cmd.operation_id);
          await denied(
            await call(`/serviceReview/${q.q.report.id}`, profile, cmd),
          );
        }
        if (profile !== "finance-reviewer") {
          const cmd = {
            ...base(),
            expected_version: handoff.version,
            revision_id: revision.id,
            source_hash: revision.source_hash,
            decision: "Approved",
          };
          operations.push(cmd.operation_id);
          await denied(await call(`/financeReview/${q.id}`, profile, cmd));
        }
      }
      assert.deepEqual(await snapshot(), before);
      assert.equal(
        (
          await rows(
            "SELECT count(*)::int n FROM ppo.operation_receipts WHERE operation_id=ANY($1::uuid[])",
            [operations],
          )
        )[0].n,
        0,
      );
      assert.equal(
        (
          await rows(
            "SELECT count(*)::int n FROM ppo.outbox_jobs WHERE operation_id=ANY($1::uuid[])",
            [operations],
          )
        )[0].n,
        0,
      );
      assert.equal(
        (
          await rows(
            "SELECT count(*)::int n FROM ppo.permission_grants WHERE user_id=$1",
            [sessions.systems.principal.actor_id],
          )
        )[0].n,
        0,
      );
    },
  );

  await t.test(
    "working company narrows every selected channel and clearing it restores only granted scope",
    async () => {
      // Explicit additional company-B read grant in this disposable fixture allows
      // selecting B; it grants no A document/business duty and is removed below.
      for (const profile of [
        "coordinator",
        "assigned-technician",
        "finance",
      ] as const) {
        const actor = sessions[profile].principal.actor_id,
          grant = randomUUID();
        await database().query(
          `INSERT INTO ppo.permission_grants(id,workspace_id,user_id,company_id,capability,scope_type,scope_id)
        VALUES($1,$2,$3,$4,'shared.read','Company',$4)`,
          [grant, CRM.workspace, actor, CRM.companyB],
        );
        const n = owned.find((n) => n.profile === profile)!;
        try {
          await json(
            await call("/company", profile, { company_id: CRM.companyB }),
          );
          await json(await call(`/site/${sites[2].id}`, profile));
          await denied(await call(`/site/${CRM.site}`, profile), [
            CRM.site,
            sites[0].display_name,
          ]);
          for (const path of ["/search?q=SYN&kind=Site", "/suggest?q=SYN"])
            absent(await json(await call(path, profile)), [
              CRM.site,
              sites[0].display_name,
            ]);
          const narrowedInbox = await json(await call("/notices", profile));
          assert.equal(narrowedInbox.owned, 0);
          assert.equal(narrowedInbox.unread, 0);
          absent(narrowedInbox, [n.id, n.title, n.notice]);
          await denied(await call(`/notice/${n.notice}`, profile), [
            n.id,
            n.title,
            n.notice,
          ]);
          for (const output of bytes)
            await denied(await call(output.path, profile));
          await denied(
            await call(
              `/preview?kind=Issued%20job%20pack&id=${packIssue.id}`,
              profile,
            ),
          );
          await denied(await call(`/finance/${q.id}`, profile));
        } finally {
          await json(await call("/company", profile, { company_id: null }));
          await database().query(
            "DELETE FROM ppo.permission_grants WHERE id=$1",
            [grant],
          );
        }
        await json(await call(`/site/${CRM.site}`, profile));
        await denied(await call(`/site/${sites[2].id}`, profile), [
          sites[2].display_name,
        ]);
        assert.equal(
          (await json(await call(`/notice/${n.notice}`, profile))).title,
          n.title,
        );
        for (const output of bytes.filter((o) => o.roles.includes(profile)))
          await exact(output.path, profile, output.manifest, output.format);
      }
    },
  );

  for (const profile of [
    "coordinator",
    "assigned-technician",
    "finance",
  ] as const) {
    await t.test(
      `${profile}: expired grants hide every channel and restore exact originals`,
      async () => {
        const actor = sessions[profile].principal.actor_id;
        const grants = await rows(
          "SELECT id,valid_to FROM ppo.permission_grants WHERE user_id=$1",
          [actor],
        );
        const n = owned.find((n) => n.profile === profile)!;
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1",
          [actor],
        );
        try {
          await denied(await call(`/site/${CRM.site}`, profile), [
            CRM.site,
            sites[0].display_name,
          ]);
          for (const path of ["/search?q=SYN", "/suggest?q=SYN"]) {
            const value = await json(await call(path, profile));
            assert.deepEqual(value.items, []);
            assert.equal(value.has_more, false);
            assert.equal(value.next_cursor, null);
          }
          await denied(await call("/notices", profile), [n.id, n.title]);
          await denied(await call(`/notice/${n.notice}`, profile), [
            n.id,
            n.title,
          ]);
          await denied(
            await call(
              `/preview?kind=Issued%20job%20pack&id=${packIssue.id}`,
              profile,
            ),
          );
          for (const output of bytes)
            await denied(await call(output.path, profile));
        } finally {
          for (const g of grants)
            await database().query(
              "UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1",
              [g.id, g.valid_to],
            );
        }
        assert.equal(
          (await json(await call(`/notice/${n.notice}`, profile))).title,
          n.title,
        );
        for (const output of bytes.filter((o) => o.roles.includes(profile)))
          await exact(output.path, profile, output.manifest, output.format);
      },
    );
  }
  await t.test(
    "anonymous and inactive identities receive no channel data",
    async () => {
      const actor = sessions.coordinator.principal.actor_id;
      await database().query("UPDATE ppo.users SET active=false WHERE id=$1", [
        actor,
      ]);
      try {
        for (const profile of ["anonymous", "coordinator"] as const)
          for (const path of [
            `/site/${CRM.site}`,
            "/search?q=SYN",
            "/suggest?q=SYN",
            "/notices",
            `/preview?kind=Issued%20job%20pack&id=${packIssue.id}`,
            ...bytes.map((o) => o.path),
          ])
            await denied(await call(path, profile), documentSecrets, [401]);
      } finally {
        await database().query("UPDATE ppo.users SET active=true WHERE id=$1", [
          actor,
        ]);
      }
    },
  );

  await t.test(
    "notification source scope is filtered before the result window, counts and personal state",
    async () => {
      const id = randomUUID(),
        title = "SYN PT01 hidden same-company second-site followup";
      await json(
        await call("/createActivity", "coordinator", {
          ...base(),
          id,
          company_id: CRM.company,
          site_id: sites[1].id,
          kind: "CustomerContact",
          owner_id: CRM.owner,
          summary: title,
          due_at: null,
          due_needed: true,
          access_class: "RestrictedService",
          links: [{ object_type: "Site", object_id: sites[1].id }],
        }),
        201,
      );
      const full = await json(await call("/notices", "coordinator"));
      const hidden = full.items.find(
        (n: { source_id: string }) => n.source_id === id,
      );
      assert.ok(hidden);
      const [grant] = await rows(
        "SELECT * FROM ppo.permission_grants WHERE user_id=$1 AND capability='shared.read'",
        [CRM.owner],
      );
      assert.equal(grant.scope_type, "Company");
      await database().query(
        "UPDATE ppo.permission_grants SET scope_type='Site',scope_id=$2,site_id=$2 WHERE id=$1",
        [grant.id, CRM.site],
      );
      try {
        const scoped = await json(await call("/notices", "coordinator"));
        absent(scoped, [id, title, hidden.id]);
        assert.equal(scoped.owned, full.owned - 1);
        assert.equal(scoped.unread, full.unread - 1);
        const window = await json(
          await call("/notices?limit=1", "coordinator"),
        );
        assert.equal(
          window.items.length,
          1,
          "Hidden newest notice must not consume the permitted window",
        );
        assert.equal(window.items[0].id, scoped.items[0].id);
        assert.equal(window.owned, scoped.owned);
        absent(window, [id, title, hidden.id]);
        await denied(await call(`/notice/${hidden.id}`, "coordinator"), [
          id,
          title,
          hidden.id,
        ]);
        await denied(
          await call("/noticeState", "coordinator", {
            action: "read",
            items: [{ id: hidden.id, expected_version: 0 }],
          }),
          [id, title, hidden.id],
        );
        assert.equal(
          (
            await rows(
              "SELECT count(*)::int n FROM ppo.notification_states WHERE notification_id=$1",
              [hidden.id],
            )
          )[0].n,
          0,
        );
      } finally {
        await database().query(
          "UPDATE ppo.permission_grants SET scope_type=$2,scope_id=$3,site_id=$4 WHERE id=$1",
          [grant.id, grant.scope_type, grant.scope_id, grant.site_id],
        );
      }
      assert.equal(
        (await json(await call(`/notice/${hidden.id}`, "coordinator"))).title,
        title,
      );
    },
  );

  for (const target of [
    {
      path: `/attachmentFile/${photo.id}`,
      profile: "assigned-technician",
      cap: "field.read.own",
    },
    {
      path: `/attachment/${photo.id}`,
      profile: "assigned-technician",
      cap: "field.read.own",
    },
    {
      path: `/signature/${response.id}`,
      profile: "assigned-technician",
      cap: "report.read",
    },
    {
      path: `/signature/${response.id}`,
      profile: "coordinator",
      cap: "report.read",
    },
  ] as const)
    await t.test(
      `${target.profile} ${target.path.split("/")[1]}: storage-time revocation withholds bytes and metadata`,
      async (sub) => {
        const original = await call(target.path, target.profile);
        assert.equal(original.status, 200);
        const originalBytes = Buffer.from(await original.arrayBuffer());
        const actor = sessions[target.profile].principal.actor_id;
        const grants = await rows(
          "SELECT id,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability=$2",
          [actor, target.cap],
        );
        assert.ok(grants.length);
        const snapshot = () =>
          rows(
            `SELECT 'attachment' kind,to_jsonb(r) row FROM ppo.field_attachments r WHERE id=$1
      UNION ALL SELECT 'response',to_jsonb(r) FROM ppo.customer_responses r WHERE id=$2 ORDER BY kind`,
            [photo.id, response.id],
          );
        const before = await snapshot();
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
              [actor, target.cap],
            );
            challenged = true;
            return bytes;
          },
        );
        try {
          await denied(await call(target.path, target.profile), [
            photo.id,
            photo.content_hash,
            response.id,
            digest(mark),
          ]);
          assert.equal(challenged, true);
        } finally {
          hook.mock.restore();
          for (const grant of grants)
            await database().query(
              "UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1",
              [grant.id, grant.valid_to],
            );
        }
        const restored = await call(target.path, target.profile);
        assert.equal(restored.status, 200);
        assert.deepEqual(
          Buffer.from(await restored.arrayBuffer()),
          originalBytes,
        );
        assert.deepEqual(await snapshot(), before);
      },
    );
});
