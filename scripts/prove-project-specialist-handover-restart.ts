import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import {
  specialistHandoverFixture,
  handoverAction,
} from "../tests/helpers/project-specialist-handover";
import { httpAcceptance } from "../tests/helpers/acceptance-http";
import { digest } from "../src/documents/store";
import { canonical } from "../src/platform/operations";
const [mode, filename] = process.argv.slice(2),
  file = resolve(filename ?? "");
if (
  !["write", "verify"].includes(mode) ||
  !filename ||
  !isAbsolute(filename) ||
  !relative(process.cwd(), file).startsWith("..") ||
  localConfig().database_name !== "ppo_synthetic_test"
)
  throw Error(
    "Use write/verify with an absolute checkpoint outside Git and disposable database.",
  );
const tables = [
  "material_handovers",
  "material_events",
  "material_releases",
  "material_release_lines",
  "material_sources",
  "material_source_changes",
  "material_lines",
  "material_sets",
  "project_specialist_packages",
  "project_specialist_events",
  "engineering_packages",
  "supply_records",
  "supply_facts",
  "project_commercial_entries",
  "project_commercial_sources",
  "project_commercial_events",
  "projects",
  "draft_quotes",
  "draft_quote_revisions",
  "quote_release_events",
  "quote_response_events",
  "sales_delivery_bindings",
  "library_documents",
  "library_revisions",
  "library_reviews",
  "business_identities",
  "audit_events",
  "operation_receipts",
  "outbox_jobs",
  "permission_grants",
];
const snapshot = async () =>
  Object.fromEntries(
    await Promise.all(
      tables.map(async (t) => [
        t,
        (
          await database().query(
            `SELECT to_jsonb(x) row FROM ppo.${t} x ORDER BY to_jsonb(x)::text`,
          )
        ).rows,
      ]),
    ),
  );
const postmaster = async () =>
  String(
    (await database().query("SELECT pg_postmaster_start_time() started"))
      .rows[0].started,
  );
const stable = (body: Record<string, unknown>) => {
  const { observed_at: _observed, ...rest } = body;
  void _observed;
  return rest;
};
try {
  if (mode === "write") {
    const f = await specialistHandoverFixture(),
      h = httpAcceptance(localConfig().origin),
      route = `engineering/${f.engineering.id}/materials/handover`;
    const prepare = f.prepare,
      send = handoverAction({
        action: "send",
        handover_id: prepare.id,
        expected_version: 1,
      }),
      decide = handoverAction({
        action: "decide",
        handover_id: prepare.id,
        expected_version: 2,
        result: "Accepted",
      });
    const inputs = [
      ["coordinator", prepare],
      ["coordinator", send],
      ["materials-supply", decide],
    ] as const;
    const receipts = [];
    for (const [profile, body] of inputs) {
      const r = await h.call(profile, route, body);
      assert.equal(r.status, 201, JSON.stringify(r.body));
      receipts.push(r.body);
    }
    const query = `${route}?set=${f.set}&handover_id=${prepare.id}`;
    const detail = await h.call("materials-supply", query);
    assert.equal(detail.body.selected.state, "Accepted");
    const data = {
      route,
      query,
      inputs,
      receipts,
      detail: stable(detail.body),
      postmaster: await postmaster(),
      snapshot: await snapshot(),
      cookies: {
        coordinator: await h.cookie("coordinator"),
        "materials-supply": await h.cookie("materials-supply"),
      },
    };
    await mkdir(dirname(file), { recursive: true });
    // Local synthetic sessions remain private; neither checkpoint nor environment is publishable evidence.
    await writeFile(file, JSON.stringify(data), { mode: 0o600 });
    console.log(
      "PJ06 R2 checkpoint saved; restart the actual application and PostgreSQL before verification.",
    );
  } else {
    const data = JSON.parse(await readFile(file, "utf8"));
    const call = async (profile: string, path: string, body?: unknown) => {
      const r = await fetch(localConfig().origin + "/api/v1/" + path, {
        method: body ? "POST" : "GET",
        headers: {
          cookie: data.cookies[profile],
          origin: localConfig().origin,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      assert.equal(r.status, 200);
      assert.equal(r.headers.get("cache-control"), "private, no-store");
      return r.json();
    };
    assert.notEqual(
      await postmaster(),
      data.postmaster,
      "Actual PostgreSQL restart required",
    );
    assert.deepEqual(await snapshot(), data.snapshot);
    assert.deepEqual(
      stable(await call("materials-supply", data.query)),
      data.detail,
    );
    for (const [i, [profile, input]] of data.inputs.entries()) {
      assert.deepEqual(
        await call(profile, `operations/${input.operation_id}`),
        data.receipts[i],
      );
      assert.deepEqual(
        await call(profile, data.route, input),
        data.receipts[i],
      );
    }
    assert.deepEqual(await snapshot(), data.snapshot);
    console.log(
      JSON.stringify({
        synthetic: true,
        result: "Passed",
        tables: tables.length,
        original_receipts: data.receipts.length,
        repeated_effects: 0,
        snapshot_hash: digest(canonical(data.snapshot)),
        application_restart: "verified by process harness",
        postgres_restart: true,
      }),
    );
  }
} finally {
  await closeDatabase();
}
