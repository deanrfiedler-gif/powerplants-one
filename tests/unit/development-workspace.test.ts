import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import {
  developmentAvailable,
  developmentFramePolicy,
  developmentRequest,
} from "../../src/development/access";
import {
  buildCatalog,
  containedPath,
  readMaster,
  sourceRoutes,
  resourceId,
  guideContentHash,
  guideReviewState,
} from "../../src/development/catalog";
import {
  matchEntry,
  origin,
  resolveDestination,
  type Register,
  type Entry,
  type Guide,
} from "../../src/development/model";

const env = {
  PPO_ENV: "local-synthetic",
  PPO_EXPOSURE: "loopback",
  PPO_IDENTITY: "synthetic",
  NODE_ENV: "test",
  DATABASE_URL:
    "postgresql://fixture:fixture@127.0.0.1:5432/ppo_synthetic_test",
  PPO_LOCAL_GATEWAY: "temporary-test-gateway",
};
test("development gate requires local configuration and the trusted gateway", async () => {
  assert(developmentAvailable(env));
  assert(
    await developmentRequest(
      new Headers({ "x-ppo-local-gateway": env.PPO_LOCAL_GATEWAY }),
      env,
    ),
  );
  assert(!(await developmentRequest(new Headers(), env)));
  assert(
    !(await developmentRequest(new Headers({ "x-ppo-local-gateway": "wrong" }), env)),
  );
  for (const override of [
    { NODE_ENV: "production" },
    { PPO_ENV: "azure-demo" },
    { PPO_EXPOSURE: "shared" },
    { CONTAINER_APP_NAME: "hosted" },
    { PPO_DEVELOPMENT_WORKSPACE: "off" },
  ])
    assert(
      !(await developmentRequest(
        new Headers({ "x-ppo-local-gateway": env.PPO_LOCAL_GATEWAY }),
        { ...env, ...override },
      )),
    );
});
test("environment links require correct record context and reject hostile origins", () => {
  assert.equal(
    resolveDestination("/customers/[id]", "http://127.0.0.1:3000", {}),
    null,
  );
  assert.equal(
    resolveDestination("/customers/[id]", "https://demo.example", {
      id: "SYN-PPO-001",
    }),
    null,
  );
  assert.equal(
    resolveDestination("/customers/[id]", "https://demo.example", {
      id: "00000000-0000-4000-8000-000000000001",
    }),
    "https://demo.example/customers/00000000-0000-4000-8000-000000000001",
  );
  assert.equal(
    resolveDestination("/configuration/[view]", "https://demo.example", {
      view: "unknown",
    }),
    null,
  );
  assert.equal(
    resolveDestination("//other.example", "https://demo.example", {}),
    null,
  );
  for (const value of [
    "javascript:alert(1)",
    "https://user:password@example.com",
    "https://example.com/path",
    "https://example.com/?token=secret",
  ])
    assert.throws(() => origin(value));
});
test("exact creation routes take precedence over record patterns", () => {
  const entries = [
    { kind: "route", key: "detail", path: "/customers/[id]" },
    { kind: "route", key: "create", path: "/customers/new" },
  ] as Entry[];
  assert.equal(matchEntry(entries, "/customers/new")?.key, "create");
  assert.equal(matchEntry(entries, "/customers/123")?.key, "detail");
  assert.equal(matchEntry(entries, "/unknown"), undefined);
});
test("real working register covers routes and retains stable imported scope identities", async () => {
  const root = process.cwd(),
    [catalog, master, routes] = await Promise.all([
      buildCatalog(root),
      readMaster(root),
      sourceRoutes(root),
    ]);
  assert.deepEqual(catalog.errors, []);
  assert.equal(master.entries.filter((e) => e.kind === "scope").length, 150);
  assert(catalog.entries.some((e) => e.key === "system:shell"));
  for (const route of routes.filter((r) => !r.path.startsWith("/crm/")))
    assert(
      catalog.entries.some((e) => e.kind === "route" && e.path === route.path),
      route.path,
    );
  assert(catalog.journeys.length >= 20);
  assert(catalog.journeys.some((j) => !j.current));
  assert(
    catalog.tokens.some((t) => t.name === "--navy" && t.value === "#242a37"),
  );
});
test("source discovery catches omissions and shared changes invalidate recorded review", async () => {
  const root = await mkdtemp(join(tmpdir(), "ppo-studio-contract-"));
  const put = async (path: string, data: string) => {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), data);
  };
  try {
    const entry: Entry = {
      key: "route:/sample",
      title: "Sample",
      kind: "route",
      module: "Test",
      summary: "Test",
      path: "/sample",
      source_paths: ["src/app/(business)/sample/page.tsx"],
      guide_key: "sample",
      design_path: "docs/spec.md",
      html_path: null,
      image_paths: [],
      dependencies: [],
      scope_status: "Source",
      visual_status: "Pending",
      functional_status: "Pending",
      deployment_status: "Unknown",
      review_fingerprint: null,
      reviewed_at: null,
      reviewer: null,
      owner: "Fixture",
      build_rank: null,
      related_keys: [],
    };
    const master: Register = {
      schema_version: 2,
      title: "Fixture",
      source_baseline: "fixture",
      local_base: "http://127.0.0.1:3000",
      live_base: "https://example.com",
      shared_sources: ["src/app/globals.css"],
      entries: [entry],
    };
    const save = () =>
      put("docs/design/development/register.json", JSON.stringify(master));
    await put(
      "src/app/(business)/sample/page.tsx",
      "export default function Page() {}",
    );
    await put("src/app/globals.css", ":root{--navy:#242a37;}");
    await put("docs/spec.md", "## Desktop\n\n## Mobile");
    await put(
      "docs/design/development/guides.json",
      JSON.stringify({
        schema_version: 2,
        guides: [
          {
            guide_key: "sample",
            entry_key: "route:/sample",
            status: "Draft",
            owner_role: "Fixture owner",
          },
        ],
      }),
    );
    await mkdir(join(root, "docs/reference/ui/module-workflow-maps"), {
      recursive: true,
    });
    await save();
    let catalog = await buildCatalog(root);
    assert.deepEqual(catalog.errors, []);
    entry.review_fingerprint = catalog.entries[0].fingerprint;
    entry.reviewer = "Fixture reviewer";
    entry.reviewed_at = "2026-09-23";
    await save();
    catalog = await buildCatalog(root);
    assert.equal(catalog.entries[0].review_state, "Current");
    await put("src/app/globals.css", ":root{--navy:#242a38;}");
    catalog = await buildCatalog(root);
    assert.equal(catalog.entries[0].review_state, "Stale");
    await put(
      "src/app/(business)/sample/page.tsx",
      "import {card} from '../../../card'; export default function Page() { return card; }",
    );
    await put("src/card.ts", "export const card = 1");
    catalog = await buildCatalog(root);
    entry.review_fingerprint = catalog.entries[0].fingerprint;
    await save();
    await put("src/card.ts", "export const card = 2");
    catalog = await buildCatalog(root);
    assert.equal(catalog.entries[0].review_state, "Stale");
    await put("src/app/new-page/page.tsx", "export default function Page() {}");
    catalog = await buildCatalog(root);
    assert.deepEqual(catalog.unregistered_routes, ["/new-page"]);
    assert(catalog.errors.length);
    await assert.rejects(() => containedPath(root, "../private.txt"));
    await assert.rejects(() => containedPath(root, "docs/../../private.txt"));
    assert.notEqual(resourceId("docs/a.md"), resourceId("docs/b.md"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("guide review is explicit and content changes cannot inherit review", () => {
  const guide: Guide = {
    guide_key: "fixture",
    entry_key: "route:/fixture",
    title: "Fixture guide",
    status: "Draft",
    owner_role: "Fixture owner",
    reviewer: null,
    reviewed_at: null,
    reviewed_content_hash: null,
    content_mode: "Fixture",
    source_commit: "fixture-source",
    sections: [],
    related_entry_keys: [],
  };
  assert.equal(guideReviewState(guide), "Draft");
  guide.status = "Reviewed";
  assert.equal(guideReviewState(guide), "Changes awaiting review");
  guide.reviewer = "Fixture reviewer";
  guide.reviewed_at = "2026-09-23";
  guide.reviewed_content_hash = guideContentHash(guide);
  assert.equal(guideReviewState(guide), "Reviewed");
  guide.title = "Changed instructions";
  assert.equal(guideReviewState(guide), "Changes awaiting review");
  guide.status = "Draft";
  assert.equal(guideReviewState(guide), "Draft");
});

test("only the gated component preview allows same-origin framing", () => {
  assert.equal(developmentFramePolicy("/development/component-preview", env), "SAMEORIGIN");
  for (const path of ["/projects", "/schedule", "/development/design-system", "/development/component-preview/extra", "/development/component-preview-other"]) assert.equal(developmentFramePolicy(path, env), "DENY");
  for (const override of [{PPO_ENV:"azure-demo"},{NODE_ENV:"production"},{PPO_DEVELOPMENT_WORKSPACE:"off"}]) assert.equal(developmentFramePolicy("/development/component-preview", {...env,...override}), "DENY");
});
