// Run write before, then verify after actual application and PostgreSQL restarts.
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import { crmCreate, crmBase } from "../tests/helpers/crm";
import { estimateInput, quoteCommand } from "../tests/helpers/estimating";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic test database only");
const origin = process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000";
const directory =
  process.env.PPO_REVIEW_PROOF_DIRECTORY ??
  "verification-evidence/estimating-e1-review-restart";
const file = path.join(directory, "checkpoint.json");
const sha = (v: Uint8Array | string) =>
  createHash("sha256").update(v).digest("hex");
async function session(profile: string) {
  const r = await fetch(`${origin}/api/v1/local-session`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function request(cookie: string, p: string, body?: unknown) {
  const r = await fetch(`${origin}/api/v1/${p}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      Origin: origin,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  assert.ok(r.ok, await r.clone().text());
  return r;
}
async function json(cookie: string, p: string, body?: unknown) {
  return (await request(cookie, p, body)).json();
}
async function snapshot(id: string) {
  return (
    await database().query(
      `SELECT * FROM (SELECT 'estimate' AS kind,to_jsonb(e) AS value FROM ppo.estimates e WHERE id=$1 UNION ALL SELECT 'version',to_jsonb(v) FROM ppo.estimate_versions v WHERE estimate_id=$1 UNION ALL SELECT 'review',to_jsonb(r) FROM ppo.estimate_review_events r WHERE estimate_id=$1 UNION ALL SELECT 'quote',to_jsonb(q) FROM ppo.draft_quote_revisions q WHERE estimate_id=$1 UNION ALL SELECT 'receipt',to_jsonb(r) FROM ppo.operation_receipts r WHERE record_id=$1 OR record_id IN (SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)  ) evidence ORDER BY kind,value::text`,
      [id],
    )
  ).rows;
}
try {
  const owner = await session("coordinator"),
    reviewer = await session("estimating-source-reviewer");
  if (process.argv[2] === "write") {
    const o = crmCreate();
    await json(owner, "crm/opportunities", o);
    const input = estimateInput(o.id);
    await json(owner, "estimating/estimates", input);
    const saved = await json(owner, `estimating/estimates/${input.id}`),
      quote = quoteCommand(saved.saved);
    await json(owner, `estimating/estimates/${input.id}/quotes`, quote);
    await json(owner, `estimating/quotes/${quote.id}/render`, {});
    const p = `estimating/estimates/${input.id}/review`,
      submission = {
        ...crmBase(),
        estimate_version_id: saved.saved.id,
        basis_hash: (await json(owner, p)).basis_hash,
        expected_version: 1,
        expected_review_version: 0,
        responses: [],
      };
    const receipts: {
      actor: string;
      command: Record<string, unknown>;
      path: string;
      receipt: unknown;
    }[] = [
      {
        actor: "owner",
        command: submission,
        path: p,
        receipt: await json(owner, p, submission),
      },
    ];
    for (const kind of ["Completeness", "SourcePrice", "Technical"]) {
      const d = await json(reviewer, p),
        command = {
          ...crmBase(),
          submission_id: d.submissions.at(-1).id,
          kind,
          outcome: "Reviewed",
          expected_version: 1,
          expected_review_version: d.sequence,
          findings: [],
        };
      receipts.push({
        actor: "reviewer",
        command,
        path: p + "/decision",
        receipt: await json(reviewer, p + "/decision", command),
      });
    }
    assert.equal((await json(owner, p)).outcome, "Reviewed");
    const html = Buffer.from(
        await (
          await request(owner, `estimating/quotes/${quote.id}/file?kind=html`)
        ).arrayBuffer(),
      ),
      pdf = Buffer.from(
        await (
          await request(owner, `estimating/quotes/${quote.id}/file?kind=pdf`)
        ).arrayBuffer(),
      );
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "original.html"), html);
    await writeFile(path.join(directory, "original.pdf"), pdf);
    await writeFile(
      file,
      JSON.stringify(
        {
          id: input.id,
          quote: quote.id,
          receipts,
          rows: await snapshot(input.id),
          html: sha(html),
          pdf: sha(pdf),
          postmaster: (
            await database().query(
              "SELECT pg_postmaster_start_time()::text AS started",
            )
          ).rows[0].started,
        },
        null,
        2,
      ),
    );
    console.log(
      "ES04 retained reviewed estimate, four original review receipts and exact Draft HTML/PDF before restart.",
    );
  } else if (process.argv[2] === "verify") {
    const data = JSON.parse(await readFile(file, "utf8"));
    assert.notEqual(
      (
        await database().query(
          "SELECT pg_postmaster_start_time()::text AS started",
        )
      ).rows[0].started,
      data.postmaster,
      "Restart the actual PostgreSQL instance before verification",
    );
    assert.deepEqual(await snapshot(data.id), data.rows);
    assert.equal(
      (await json(owner, `estimating/estimates/${data.id}/review`)).outcome,
      "Reviewed",
    );
    for (const item of data.receipts) {
      const cookie = item.actor === "owner" ? owner : reviewer;
      assert.deepEqual(
        await json(cookie, `operations/${item.command.operation_id}`),
        item.receipt,
      );
      assert.deepEqual(
        await json(cookie, item.path, item.command),
        item.receipt,
      );
    }
    for (const kind of ["html", "pdf"]) {
      const bytes = Buffer.from(
        await (
          await request(
            owner,
            `estimating/quotes/${data.quote}/file?kind=${kind}`,
          )
        ).arrayBuffer(),
      );
      assert.equal(sha(bytes), data[kind]);
      assert.deepEqual(
        bytes,
        await readFile(path.join(directory, `original.${kind}`)),
      );
    }
    assert.deepEqual(await snapshot(data.id), data.rows);
    console.log(
      "ES04 application/PostgreSQL restart: all stored rows, four exact replays and original HTML/PDF unchanged.",
    );
  } else throw Error("Use write or verify");
} finally {
  await closeDatabase();
}
