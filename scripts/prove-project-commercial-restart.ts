import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import {
  commercialFixture,
  commercialAction,
  variation,
} from "../tests/helpers/project-commercial";
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
const h = httpAcceptance(localConfig().origin);
const tables = [
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
try {
  if (mode === "write") {
    const f = await commercialFixture(),
      route = `projects/${f.project.id}/commercial`;
    const saved = await h.call("coordinator", route, f.create);
    assert.equal(saved.status, 201);
    assert.equal(
      (
        await h.call(
          "coordinator",
          route,
          commercialAction(f.create.id, 1, "Submit"),
        )
      ).status,
      201,
    );
    const decision = {
      ...commercialAction(f.create.id, 2, "Decide"),
      outcome: "Approved",
    };
    const approved = await h.call(
      "estimating-source-reviewer",
      route,
      decision,
    );
    assert.equal(approved.status, 201);
    const v = variation(f, "0.11", "0.10");
    assert.equal((await h.call("coordinator", route, v)).status, 201);
    assert.equal(
      (await h.call("coordinator", route, commercialAction(v.id, 1, "Submit")))
        .status,
      201,
    );
    assert.equal(
      (
        await h.call("estimating-source-reviewer", route, {
          ...commercialAction(v.id, 2, "Decide"),
          outcome: "Approved",
        })
      ).status,
      201,
    );
    const finance = await h.call("coordinator", route + "/finance");
    assert.equal(finance.body.adjusted_control_value, "350.10");
    const data = {
      route,
      create: f.create,
      decision,
      saved: saved.body,
      approved: approved.body,
      finance: finance.body,
      cookies: {
        coordinator: await h.cookie("coordinator"),
        "estimating-source-reviewer": await h.cookie(
          "estimating-source-reviewer",
        ),
      },
      postmaster: await postmaster(),
      snapshot: await snapshot(),
    };
    await mkdir(dirname(file), { recursive: true });
    // Includes local synthetic session cookies; private checkpoint only, never publish it.
    await writeFile(file, JSON.stringify(data), { mode: 0o600 });
    console.log(
      "PJ05 restart checkpoint saved outside Git; stop/start application and PostgreSQL before verify.",
    );
  } else {
    const data = JSON.parse(await readFile(file, "utf8"));
    // Reuse original private synthetic sessions: signing in again would itself append audit evidence.
    const retainedCall = async (
      profile: string,
      path: string,
      body?: unknown,
    ) => {
      assert.equal(typeof data.cookies[profile], "string");
      const response = await fetch(localConfig().origin + "/api/v1/" + path, {
        method: body ? "POST" : "GET",
        headers: {
          cookie: data.cookies[profile],
          origin: localConfig().origin,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      assert.ok(
        response.ok,
        `Retained session request failed: ${response.status}`,
      );
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      return { body: await response.json() };
    };
    assert.notEqual(
      await postmaster(),
      data.postmaster,
      "Actual PostgreSQL restart required",
    );
    assert.deepEqual(await snapshot(), data.snapshot);
    const finance = (await retainedCall("coordinator", data.route + "/finance"))
      .body;
    assert.deepEqual(
      { ...finance, observed_at: data.finance.observed_at },
      data.finance,
    );
    for (const [profile, input, receipt] of [
      ["coordinator", data.create, data.saved],
      ["estimating-source-reviewer", data.decision, data.approved],
    ] as const) {
      assert.deepEqual(
        (await retainedCall(profile, `operations/${input.operation_id}`)).body,
        receipt,
      );
      assert.deepEqual(
        (await retainedCall(profile, data.route, input)).body,
        receipt,
      );
    }
    assert.deepEqual(await snapshot(), data.snapshot);
    console.log(
      JSON.stringify(
        {
          proof: "PJ05 actual application/PostgreSQL restart",
          result: "Passed",
          synthetic: true,
          retained_tables: tables.length,
          graph_hash: digest(canonical(data.snapshot)),
          adjusted_control_value: finance.adjusted_control_value,
          original_receipts_recovered: 2,
          original_sessions_reused: 2,
          replayed_effects: 0,
        },
        null,
        2,
      ),
    );
  }
} finally {
  await closeDatabase();
}
