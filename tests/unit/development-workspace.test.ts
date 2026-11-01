import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
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
  readPageGuide,
  sourceRoutes,
  resourceId,
  guideContentHash,
  guideReviewState,
} from "../../src/development/catalog";
import {
  entryGuide,
  matchEntry,
  origin,
  resolveDestination,
  type Register,
  type Entry,
  type Guide,
} from "../../src/development/model";
import { syncNewRoutes } from "../../src/development/sync";
import { readGuideLibrary } from "../../src/guides/library";

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
    !(await developmentRequest(
      new Headers({ "x-ppo-local-gateway": "wrong" }),
      env,
    )),
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
  const scopes = master.entries.filter((e) => e.kind === "scope"),
    imported = scopes.filter((e) => !e.key.includes("/"));
  assert.equal(imported.length, 150);
  // Owner-decided pages within a scope (e.g. scope:CX-02/kitting) extend an imported identity, never replace one.
  for (const e of scopes.filter((s) => !imported.includes(s)))
    assert(imported.some((s) => e.key.startsWith(s.key + "/")), e.key);
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

test("page guidance reads current bindings and content without unrelated catalogue sources", async () => {
  const root = await mkdtemp(join(tmpdir(), "ppo-page-guide-"));
  const directory = join(root, "docs/design/development");
  const guide: Guide = {
    guide_key: "guide.detail",
    entry_key: "route:detail",
    title: "Original guide",
    status: "Reviewed",
    owner_role: "Fixture owner",
    reviewer: "Fixture reviewer",
    reviewed_at: "2026-10-05",
    reviewed_content_hash: null,
    content_mode: "Fixture",
    source_commit: "fixture",
    sections: [],
    related_entry_keys: [],
  };
  guide.reviewed_content_hash = guideContentHash(guide);
  const entries = [
    { kind: "route", path: "/sample/[id]", guide_key: guide.guide_key },
    { kind: "route", path: "/sample/new", guide_key: "missing-guide" },
  ];
  const saveRegister = () =>
    writeFile(
      join(directory, "register.json"),
      JSON.stringify({ schema_version: 2, shared_sources: [], entries }),
    );
  const saveGuide = () =>
    writeFile(
      join(directory, "guides.json"),
      JSON.stringify({ schema_version: 2, guides: [guide] }),
    );
  try {
    await mkdir(directory, { recursive: true });
    await saveRegister();
    await saveGuide();
    const original = await readPageGuide(root, "/sample/123");
    assert.equal(original?.title, "Original guide");
    assert.equal(original?.review_state, "Reviewed");
    assert.equal(original?.history.state, "History unavailable");
    assert.equal(await readPageGuide(root, "/sample/new"), undefined);
    assert.equal(await readPageGuide(root, "/unknown"), undefined);
    guide.title = "Changed working guide";
    await saveGuide();
    assert.equal(
      (await readPageGuide(root, "/sample/123"))?.title,
      guide.title,
    );
    assert.equal(
      (await readPageGuide(root, "/sample/123"))?.review_state,
      "Changes awaiting review",
    );
    entries[0].guide_key = "removed-binding";
    await saveRegister();
    assert.equal(await readPageGuide(root, "/sample/123"), undefined);
    await writeFile(join(directory, "register.json"), '{"schema_version":1}');
    await assert.rejects(
      () => readPageGuide(root, "/sample/123"),
      /Unsupported/,
    );
  } finally {
    // Only this test's freshly allocated temporary root is removed.
    assert(root.startsWith(join(tmpdir(), "ppo-page-guide-")));
    await rm(root, { recursive: true, force: true });
  }
});

test("only the gated component preview allows same-origin framing", () => {
  assert.equal(
    developmentFramePolicy("/development/component-preview", env),
    "SAMEORIGIN",
  );
  for (const path of [
    "/projects",
    "/schedule",
    "/development/design-system",
    "/development/component-preview/extra",
    "/development/component-preview-other",
  ])
    assert.equal(developmentFramePolicy(path, env), "DENY");
  for (const override of [
    { PPO_ENV: "azure-demo" },
    { NODE_ENV: "production" },
    { PPO_DEVELOPMENT_WORKSPACE: "off" },
  ])
    assert.equal(
      developmentFramePolicy("/development/component-preview", {
        ...env,
        ...override,
      }),
      "DENY",
    );
});

// User guide stage 1 (ADR-0065): the design workspace reads the Markdown guides beside guides.json. Each fixture is a
// temporary root holding synthetic values only.
const fixtureEntry = (key: string, path: string, guideKey: string): Entry => ({
  key,
  title: `Fixture ${key}`,
  kind: "route",
  module: "Test",
  summary: "Fixture entry.",
  path,
  source_paths: [],
  guide_key: guideKey,
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
});
const markdownGuide = (front: string, body = "## Purpose {#purpose}\n\nFixture text.\n") =>
  `---\n${front.trim()}\nversioning: git\nowner_role: Fixture owner\nsource_commit: fixture\n---\n\n${body}`;
async function guideFixture(
  prefix: string,
  entries: Entry[],
  jsonGuides: unknown[],
  files: Record<string, string>,
) {
  const root = await mkdtemp(join(tmpdir(), prefix));
  const put = async (path: string, data: string) => {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), data);
  };
  await put("src/app/globals.css", ":root{--navy:#242a37;}");
  await put("docs/spec.md", "## Desktop\n\n## Mobile");
  await mkdir(join(root, "docs/reference/ui/module-workflow-maps"), { recursive: true });
  for (const entry of entries)
    await put(`src/app/(business)${entry.path}/page.tsx`, "export default function Page() {}");
  const master: Register = {
    schema_version: 2,
    title: "Fixture",
    source_baseline: "fixture",
    local_base: "http://127.0.0.1:3000",
    live_base: "https://example.com",
    shared_sources: ["src/app/globals.css"],
    entries,
  };
  await put("docs/design/development/register.json", JSON.stringify(master, null, 2) + "\n");
  await put(
    "docs/design/development/guides.json",
    JSON.stringify({ schema_version: 2, guides: jsonGuides }, null, 2) + "\n",
  );
  for (const [path, data] of Object.entries(files)) await put(path, data);
  return { root, put, remove: () => rm(root, { recursive: true, force: true }) };
}

test("catalog reads Markdown guides and reports their errors", async () => {
  const fixture = await guideFixture(
    "ppo-studio-markdown-",
    [fixtureEntry("route:/sample", "/sample", "guide.sample")],
    [],
    {
      "docs/guides/pages/guide.sample.md": markdownGuide(
        'guide_key: guide.sample\nentry_key: "route:/sample"\ntitle: Sample guide\nstatus: InReview',
      ),
    },
  );
  try {
    let catalog = await buildCatalog(fixture.root);
    assert.deepEqual(catalog.errors, []);
    const [entry] = catalog.entries;
    assert.deepEqual(entry.issues.filter((i) => i === "User guide missing"), []);
    assert.equal(entry.guide_status, "In review");
    const page = await readPageGuide(fixture.root, "/sample");
    assert.equal(page?.markdown?.front.guide_key, "guide.sample");
    assert.equal(page?.title, "Sample guide");
    assert.equal(page?.review_state, "In review");
    assert.equal(page?.history.path, "docs/guides/pages/guide.sample.md");
    // The fingerprint follows the guide's content hash, which excludes review fields.
    await fixture.put(
      "docs/guides/pages/guide.sample.md",
      markdownGuide(
        'guide_key: guide.sample\nentry_key: "route:/sample"\ntitle: Sample guide\nstatus: InReview\nreviewer: Fixture reviewer',
      ),
    );
    assert.equal((await buildCatalog(fixture.root)).entries[0].fingerprint, entry.fingerprint);
    await fixture.put(
      "docs/guides/pages/guide.sample.md",
      markdownGuide(
        'guide_key: guide.sample\nentry_key: "route:/sample"\ntitle: Sample guide\nstatus: InReview',
        "## Purpose {#purpose}\n\nChanged fixture text.\n",
      ),
    );
    assert.notEqual((await buildCatalog(fixture.root)).entries[0].fingerprint, entry.fingerprint);
    // A file that does not compile is reported with its path and line, and the entry loses its guide.
    await fixture.put("docs/guides/pages/guide.sample.md", "No front matter here.\n");
    catalog = await buildCatalog(fixture.root);
    assert(catalog.errors.some((e) => e.startsWith("docs/guides/pages/guide.sample.md:1 ")), catalog.errors.join("\n"));
    assert(catalog.errors.includes("route:/sample: User guide missing"));
  } finally {
    await fixture.remove();
  }
});

test("also_applies_to covers an entry", async () => {
  const fixture = await guideFixture(
    "ppo-studio-also-",
    [
      fixtureEntry("route:/sample", "/sample", "guide.sample"),
      fixtureEntry("route:/sample/[id]", "/sample/[id]", "guide.sample.id"),
    ],
    [],
    {
      "docs/guides/pages/guide.sample.md": markdownGuide(
        'guide_key: guide.sample\nentry_key: "route:/sample"\nalso_applies_to: ["route:/sample/[id]"]\ntitle: Sample guide\nstatus: Draft',
      ),
    },
  );
  try {
    let catalog = await buildCatalog(fixture.root);
    assert.deepEqual(catalog.errors, []);
    const detail = catalog.entries.find((e) => e.key === "route:/sample/[id]")!;
    assert(!detail.issues.includes("User guide missing"));
    assert.equal(detail.guide_status, "Draft");
    // Without the also_applies_to claim, the detail page has no guide.
    await fixture.put(
      "docs/guides/pages/guide.sample.md",
      markdownGuide('guide_key: guide.sample\nentry_key: "route:/sample"\ntitle: Sample guide\nstatus: Draft'),
    );
    catalog = await buildCatalog(fixture.root);
    assert.deepEqual(catalog.errors, ["route:/sample/[id]: User guide missing"]);
  } finally {
    await fixture.remove();
  }
});

test("a guide key in both sources is an error", async () => {
  const fixture = await guideFixture(
    "ppo-studio-duplicate-",
    [fixtureEntry("route:/sample", "/sample", "guide.sample")],
    [{ guide_key: "guide.sample", entry_key: "route:/sample", status: "Draft", owner_role: "Fixture owner" }],
    {
      "docs/guides/pages/guide.sample.md": markdownGuide(
        'guide_key: guide.sample\nentry_key: "route:/sample"\ntitle: Sample guide\nstatus: Draft',
      ),
    },
  );
  try {
    const catalog = await buildCatalog(fixture.root);
    assert.deepEqual(catalog.errors, ["Guide key exists in Markdown and guides.json: guide.sample"]);
  } finally {
    await fixture.remove();
  }
});

test("JSON guides accept the six statuses", async () => {
  const statuses = ["Draft", "InReview", "Reviewed", "Published", "Superseded", "Withdrawn"];
  const row = (name: string, status: string, review: Record<string, string | null> = {}) => ({
    guide_key: `guide.${name}`,
    entry_key: `route:/${name}`,
    status,
    owner_role: "Fixture owner",
    reviewer: null,
    reviewed_at: null,
    reviewed_content_hash: null,
    ...review,
  });
  const guides = [
    ...statuses.map((status) => row(status.toLowerCase(), status)),
    // A status outside the six is refused, and a blank reviewer is no review evidence.
    row("approved", "Approved"),
    row("blank", "Reviewed", { reviewer: " ", reviewed_at: "2026-10-01", reviewed_content_hash: "fixture-hash" }),
  ];
  const fixture = await guideFixture(
    "ppo-studio-statuses-",
    guides.map((g) => fixtureEntry(g.entry_key, g.entry_key.slice("route:".length), g.guide_key)),
    guides,
    {},
  );
  try {
    const catalog = await buildCatalog(fixture.root);
    assert.deepEqual(catalog.errors, [
      "Guide review evidence missing: guide.reviewed",
      "Guide review evidence missing: guide.published",
      "Guide needs living-master metadata: guide.approved",
      "Guide review evidence missing: guide.blank",
    ]);
    const status = (key: string) => catalog.entries.find((e) => e.key === key)?.guide_status;
    assert.equal(status("route:/inreview"), "In review");
    assert.equal(status("route:/published"), "Changes awaiting review");
    assert.equal(status("route:/withdrawn"), "Withdrawn");
    assert.equal(status("route:/blank"), "Changes awaiting review");
  } finally {
    await fixture.remove();
  }
});

test("a page in also_applies_to shows the Markdown guide, not its own leftover JSON draft", async () => {
  const draft = {
    guide_key: "guide.sample.id",
    entry_key: "route:/sample/[id]",
    title: "Leftover draft",
    status: "Draft",
    owner_role: "Fixture owner",
    sections: [],
  };
  const front =
    'guide_key: guide.sample\nentry_key: "route:/sample"\nalso_applies_to: ["route:/sample/[id]"]\ntitle: Sample guide\nstatus: InReview';
  const fixture = await guideFixture(
    "ppo-studio-claim-",
    [
      fixtureEntry("route:/sample", "/sample", "guide.sample"),
      fixtureEntry("route:/sample/[id]", "/sample/[id]", "guide.sample.id"),
    ],
    [draft],
    { "docs/guides/pages/guide.sample.md": markdownGuide(front) },
  );
  const detail = async () => (await buildCatalog(fixture.root)).entries.find((e) => e.key === "route:/sample/[id]")!;
  try {
    const catalog = await buildCatalog(fixture.root);
    assert.deepEqual(catalog.errors, []);
    const before = await detail();
    assert.equal(before.guide_status, "In review");
    const page = await readPageGuide(fixture.root, "/sample/123");
    assert.equal(page?.markdown?.front.guide_key, "guide.sample");
    assert.equal(page?.title, "Sample guide");
    // The fingerprint follows the Markdown guide: the draft no user sees does not move it, the guide's text does.
    await fixture.put(
      "docs/design/development/guides.json",
      JSON.stringify({ schema_version: 2, guides: [{ ...draft, title: "Changed draft" }] }),
    );
    assert.equal((await detail()).fingerprint, before.fingerprint);
    await fixture.put("docs/guides/pages/guide.sample.md", markdownGuide(front, "## Purpose {#purpose}\n\nChanged text.\n"));
    assert.notEqual((await detail()).fingerprint, before.fingerprint);
    // The hosted snapshot chooses with the same helper.
    const hosted = [
      { guide_key: "guide.sample.id", title: "Leftover draft" },
      { guide_key: "guide.sample", title: "Sample guide", markdown: page!.markdown },
    ];
    assert.equal(entryGuide(hosted, { key: "route:/sample/[id]", guide_key: "guide.sample.id" })?.title, "Sample guide");
    assert.equal(entryGuide(hosted, { key: "route:/other", guide_key: "guide.sample.id" })?.title, "Leftover draft");
  } finally {
    await fixture.remove();
  }
});

test("syncNewRoutes writes a Markdown stub that compiles", async () => {
  const fixture = await guideFixture(
    "ppo-studio-sync-",
    [fixtureEntry("route:/sample", "/sample", "guide.sample")],
    [{ guide_key: "guide.sample", entry_key: "route:/sample", status: "Draft", owner_role: "Fixture owner" }],
    {
      "src/app/(business)/fresh/page.tsx": "export default function Page() {}",
      "src/app/(business)/fresh/[id]/page.tsx": "export default function Page() {}",
    },
  );
  try {
    const guidesBefore = await readFile(join(fixture.root, "docs/design/development/guides.json"), "utf8");
    assert.equal(await syncNewRoutes(fixture.root), 2);
    assert.equal(await readFile(join(fixture.root, "docs/design/development/guides.json"), "utf8"), guidesBefore);
    const stub = await readFile(join(fixture.root, "docs/guides/pages/guide.route-fresh-id.md"), "utf8");
    assert.match(stub, /^status: Draft$/m);
    const master = await readMaster(fixture.root);
    const library = await readGuideLibrary(fixture.root, master.entries);
    assert.deepEqual(library.errors, []);
    const fresh = library.guides.find((g) => g.front.guide_key === "guide.route-fresh-id")!;
    assert.equal(fresh.front.entry_key, "route:/fresh/[id]");
    assert.equal(fresh.front.status, "Draft");
    assert.deepEqual(
      fresh.sections.map((s) => s.id),
      ["purpose", "quick-start", "recovery"],
    );
    assert(library.guides.some((g) => g.front.guide_key === "guide.route-fresh"));
    const catalog = await buildCatalog(fixture.root);
    assert.deepEqual(catalog.errors, []);
    // A second run finds nothing new and leaves the stubs as they are.
    assert.equal(await syncNewRoutes(fixture.root), 0);
    assert.equal(await readFile(join(fixture.root, "docs/guides/pages/guide.route-fresh-id.md"), "utf8"), stub);
  } finally {
    await fixture.remove();
  }
});
