import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import {
  productActor,
  productInput,
  productContentFixture,
  relationshipFixture,
} from "../tests/helpers/products";
import { productCapabilities } from "../src/products/model";
import { crmBase, CRM } from "../tests/helpers/crm";
import { sourceInput } from "../tests/helpers/estimating-sources";
import type { readProduct } from "../src/products/reads";
import type { readCostSource } from "../src/estimating/sources/reads";
import type { readImport } from "../src/products/imports";
import type { listRelationships } from "../src/products/relationships";
import type { OperationReceipt } from "../src/platform/operations";

const config = localConfig(),
  phase = process.argv[2],
  root = "tmp/products-restart",
  evidence = "docs/testing/evidence/products-native";
assert.equal(config.database_name, "ppo_synthetic_test");
assert.ok(["write", "recover", "verify"].includes(phase));
const origin = config.origin;
type Accepted = {
  cookie: string;
  path: string;
  body: Record<string, unknown>;
  receipt: OperationReceipt;
};
type Proof = {
  actors: string[];
  accepted: Accepted[];
  rows: unknown;
  pids: number[];
  starts: string[];
};
const tables = [
  "products",
  "product_revisions",
  "product_events",
  "product_cost_source_bindings",
  "product_use_references",
  "product_relationships",
  "product_relationship_reviews",
  "product_imports",
  "product_import_plans",
  "product_import_events",
  "cost_sources",
  "cost_source_revisions",
  "cost_source_events",
];
async function snapshot(actors: string[]) {
  const data: Record<string, unknown> = {};
  for (const t of tables)
    data[t] = (
      await database().query(
        `SELECT to_jsonb(t) AS row FROM ppo.${t} t WHERE created_by=ANY($1::uuid[]) ORDER BY to_jsonb(t)::text`,
        [actors],
      )
    ).rows;
  return data;
}
const server = spawn(
  process.execPath,
  [
    "--env-file=.env.local",
    "--import",
    "tsx",
    "scripts/local-server.ts",
    "--compiled",
  ],
  { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
);
let serverLog = "";
server.stdout.on("data", (d) => {
  serverLog += d.toString();
});
server.stderr.on("data", (d) => {
  serverLog += d.toString();
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null)
      throw Error(`Proof application exited: ${serverLog}`);
    try {
      const r = await fetch(origin + "/login");
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  assert.ok(ready, "Proof application must start");
  const start = (
    await database().query("SELECT pg_postmaster_start_time()::text AS started")
  ).rows[0].started as string;
  async function call<T>(
    cookie: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const r = await fetch(`${origin}/api/v1/${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Cookie: cookie,
        Origin: origin,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await r.json();
    assert.ok(r.ok, JSON.stringify(data));
    return data as T;
  }
  let proof: Proof;
  if (phase === "write") {
    const author = await productActor([
        ...productCapabilities,
        "estimating.read",
        "estimating.edit",
      ]),
      reviewer = await productActor();
    const accepted: Accepted[] = [];
    async function record(
      cookie: string,
      path: string,
      body: Record<string, unknown>,
    ) {
      const receipt = await call<OperationReceipt>(cookie, path, body);
      accepted.push({ cookie, path, body, receipt });
      return receipt;
    }
    const product = productInput(),
      other = productInput();
    await record(author.cookie, "products", product);
    await record(author.cookie, "products", other);
    await record(author.cookie, `products/${product.id}`, {
      ...crmBase(),
      expected_version: 1,
      content: { ...product.content, title: "SYN exact persisted successor" },
    });
    const detail = await call<Awaited<ReturnType<typeof readProduct>>>(
      author.cookie,
      `products/${product.id}`,
    );
    for (const [action, expected_version, cookie] of [
      ["Submit", 2, author.cookie],
      ["Reviewed", 3, reviewer.cookie],
      ["Published", 4, author.cookie],
    ] as const)
      await record(cookie, `products/${product.id}/review`, {
        ...crmBase(),
        expected_version,
        revision_id: detail.revision.id,
        action,
        ...(action === "Published"
          ? {
              purpose: "SYN restart catalogue",
              audience: "Internal synthetic",
              effective_on: "2026-09-25",
            }
          : {}),
      });
    const source = sourceInput();
    await record(author.cookie, "estimating/cost-sources", source);
    const sr = await call<Awaited<ReturnType<typeof readCostSource>>>(
      author.cookie,
      `estimating/cost-sources/${source.id}`,
    );
    await record(author.cookie, `products/${product.id}/pricing`, {
      ...crmBase(),
      expected_version: 5,
      revision_id: detail.revision.id,
      source_id: source.id,
      source_revision_id: sr.revision.id,
      status: "Mapped",
      evidence: "SYN persistent exact source binding",
    });
    const asset = (
      await database().query(
        "SELECT id,version FROM ppo.assets WHERE company_id=$1 ORDER BY id LIMIT 1",
        [CRM.company],
      )
    ).rows[0];
    await record(author.cookie, `products/${product.id}/uses`, {
      ...crmBase(),
      expected_version: 6,
      revision_id: detail.revision.id,
      kind: "Asset",
      target_id: asset.id,
      target_version: asset.version,
      evidence: "SYN retained installed-use observation",
    });
    const od = await call<Awaited<ReturnType<typeof readProduct>>>(
        author.cookie,
        `products/${other.id}`,
      ),
      relationshipId = randomUUID();
    await record(author.cookie, "products/relationships", {
      ...crmBase(),
      id: relationshipId,
      from: { product_id: product.id, revision_id: detail.revision.id },
      to: { product_id: other.id, revision_id: od.revision.id },
      predecessor_id: null,
      content: relationshipFixture(),
    });
    const rs = await call<Awaited<ReturnType<typeof listRelationships>>>(
      author.cookie,
      `products/relationships?product_id=${product.id}`,
    );
    await record(
      reviewer.cookie,
      `products/relationships/${relationshipId}/review`,
      {
        ...crmBase(),
        expected_version: 1,
        content_hash: rs.items[0].content_hash,
        outcome: "Unresolved",
      },
    );
    const batchId = randomUUID();
    await record(author.cookie, "products/imports", {
      ...crmBase(),
      id: batchId,
      company_id: CRM.company,
      filename: "restart.json",
      source_description: "SYN exact persistent raw evidence",
      provider: "Synthetic catalogue",
      source_time: null,
      raw_content: JSON.stringify({
        format: "PPO synthetic catalogue 1",
        rows: [
          {
            external_key: `SYN-${randomUUID()}`,
            reference: `SYN-${randomUUID()}`,
            kind: "Family",
            parent_id: null,
            content: productContentFixture(),
          },
        ],
      }),
    });
    await record(author.cookie, `products/imports/${batchId}/map`, {
      ...crmBase(),
      expected_version: 1,
      mappings: [
        {
          row_number: 1,
          action: "New",
          target_id: null,
          reason: "SYN explicit identity",
        },
      ],
    });
    const b = await call<Awaited<ReturnType<typeof readImport>>>(
      author.cookie,
      `products/imports/${batchId}`,
    );
    for (const [action, expected_version, cookie] of [
      ["Reviewed", 2, reviewer.cookie],
      ["Apply", 3, author.cookie],
    ] as const)
      await record(cookie, `products/imports/${batchId}/review`, {
        ...crmBase(),
        expected_version,
        action,
        plan_id: b.current!.id,
        comparison_hash: b.current!.comparison_hash,
      });
    proof = {
      actors: [author.p.actor_id, reviewer.p.actor_id],
      accepted,
      rows: await snapshot([author.p.actor_id, reviewer.p.actor_id]),
      pids: [server.pid!],
      starts: [start],
    };
  } else {
    proof = JSON.parse(await readFile(`${root}/proof.json`, "utf8"));
    assert.ok(
      !proof.pids.includes(server.pid!),
      "New application process required",
    );
    assert.ok(
      !proof.starts.includes(start),
      "Actual PostgreSQL restart required",
    );
    proof.pids.push(server.pid!);
    proof.starts.push(start);
  }
  for (const op of proof.accepted) {
    assert.deepEqual(
      await call(op.cookie, `operations/${op.body.operation_id}`),
      op.receipt,
    );
    assert.deepEqual(await call(op.cookie, op.path, op.body), op.receipt);
  }
  assert.deepEqual(await snapshot(proof.actors), proof.rows);
  await mkdir(root, { recursive: true });
  await writeFile(`${root}/proof.json`, JSON.stringify(proof));
  await mkdir(evidence, { recursive: true });
  await writeFile(
    `${evidence}/restart-${phase}.json`,
    JSON.stringify(
      {
        phase,
        source_head: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        build_id: (await readFile(".next/BUILD_ID", "utf8")).trim(),
        application_pids: proof.pids,
        postgres_started_at: proof.starts,
        exact_tables: tables,
        original_receipts: proof.accepted.length,
        rows_sha256: createHash("sha256")
          .update(JSON.stringify(proof.rows))
          .digest("hex"),
        result:
          "Exact retained rows and every original receipt/replay verified; no duplicate effects.",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Products ${phase}: ${proof.accepted.length} original receipts; ${proof.pids.length} application processes / ${proof.starts.length - 1} PostgreSQL restarts.`,
  );
} finally {
  server.kill();
  await closeDatabase();
}
