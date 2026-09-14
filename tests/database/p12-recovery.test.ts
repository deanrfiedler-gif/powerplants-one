import assert from "node:assert/strict";
import { test, after } from "node:test";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer, connect, type Socket } from "node:net";
import pg from "pg";
import { localConfig } from "../../src/platform/config";
import { database, closeDatabase } from "../../src/platform/database";
import { reset } from "../../scripts/database";
import {
  createCheckpoint,
  restoreCheckpoint,
  inspectCheckpoint,
  fingerprint,
} from "../../scripts/recovery";
import {
  processedFinance,
  readFinance,
  base,
  principal,
} from "../helpers/finance";
import {
  recordFinanceOutcome,
  reconcileFinance,
} from "../../src/finance/service";
import { presentationBytes } from "../../src/reports/service";
import { attachmentBytes } from "../../src/field/attachments";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate, prepareQuote } from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import {
  runQuoteJob,
  readQuoteJob,
  draftBytes,
  QuoteWorkerInterrupted,
} from "../../src/estimating/worker";
import { documentStore, digest } from "../../src/documents/store";
import { crmCreate } from "../helpers/crm";
import { estimateInput, quoteCommand } from "../helpers/estimating";
import { prepareOwnerDemo } from "../../scripts/prepare-owner-demo";
import {
  prepareOfflineRecovery,
  verifyOfflineRecovery,
} from "../helpers/p12-offline";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required.");
after(closeDatabase);
const execute = promisify(execFile);
async function docker(args: string[], env = process.env) {
  try {
    return (
      await execute("docker", args, {
        env,
        timeout: 120000,
        maxBuffer: 1024 * 1024,
      })
    ).stdout.trim();
  } catch {
    throw Error(
      "P12 disposable PostgreSQL container operation failed; no private process details are logged.",
    );
  }
}

test(
  "P12 real isolated restore retains all database/files, fences unknown Finance and recovers the original durable quote lease",
  { timeout: 600000 },
  async () => {
    const original = {
      url: process.env.DATABASE_URL!,
      documents: process.env.PPO_DOCUMENT_DIRECTORY,
      allow: process.env.PPO_ALLOW_RESET,
      reset: process.env.PPO_RESET_DATABASE,
    };
    const root = await mkdtemp(join(tmpdir(), "ppo-p12-restore-")),
      sourceDocs = join(root, "source-documents"),
      directory = join(root, "checkpoint"),
      targetDocs = join(root, "restored-documents"),
      name = `ppo-p12-${randomUUID()}`,
      password = randomUUID();
    let containerStarted = false;
    try {
      process.env.PPO_DOCUMENT_DIRECTORY = sourceDocs;
      process.env.PPO_ALLOW_RESET = "dispose-synthetic";
      process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
      await closeDatabase();
      await reset();
      const finance = await processedFinance("AcceptedThenTimeout");
      const unknown = await readFinance(finance.processor, finance.id);
      assert.equal(unknown.handoff.status, "OutcomeUnknown");
      const reportPresentation = finance.q.report.presentations.find(
        (item: { kind: string }) => item.kind === "IssuedReport",
      );
      assert.ok(reportPresentation, "The fixture has an original issued presentation");
      const issued = await presentationBytes(
        finance.q.reviewer,
        finance.q.report.id,
        reportPresentation.id,
      );
      assert.ok(issued.pdf, "The original issued presentation includes its PDF");
      const photo = await attachmentBytes(finance.q.p, finance.q.photo.id);
      const p = await principal("coordinator"),
        opportunity = crmCreate();
      await createOpportunity(p, opportunity);
      const input = estimateInput(opportunity.id);
      await createEstimate(p, input);
      const estimate = await readEstimate(p, input.id),
        quote = quoteCommand(estimate.saved);
      const quoteReceipt = await prepareQuote(p, input.id, quote);
      const job = (await readQuoteJob(p, quote.id)).j;
      await assert.rejects(
        runQuoteJob(job.id, {
          afterStore: async () => {
            throw new QuoteWorkerInterrupted();
          },
        }),
        QuoteWorkerInterrupted,
      );
      // Clock/lease fixture only. No blanket state reset or removal of the original claim.
      await database().query(
        "UPDATE ppo.estimate_quote_jobs SET lease_until=clock_timestamp()-interval '1 second' WHERE id=$1",
        [job.id],
      );
      const stored = await documentStore().locate({
        ...p,
        operation_id: job.id,
      });
      assert.ok(stored);
      const originalQuote = JSON.parse(stored.bytes.toString("utf8")) as {
        html: string;
        pdf_base64: string;
      };
      await database().query(
        "CREATE SEQUENCE ppo.p12_restore_sequence START 37",
      );
      await database().query("SELECT nextval('ppo.p12_restore_sequence')");
      const observer = await principal("observer");
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=clock_timestamp()-interval '1 minute' WHERE user_id=$1",
        [observer.actor_id],
      );
      await closeDatabase();

      const offline = await prepareOfflineRecovery(root);
      const extra = new pg.Client({ connectionString: original.url });
      await extra.connect();
      try {
        await assert.rejects(
          createCheckpoint({
            sourceUrl: original.url,
            directory,
            documents: sourceDocs,
            stopped: true,
            backend: "docker",
          }),
          /Stop the source/,
        );
      } finally {
        await extra.end();
      }
      const checkpoint = await createCheckpoint({
        sourceUrl: original.url,
        directory,
        documents: sourceDocs,
        profile: offline.profile,
        stopped: true,
        backend: "docker",
      });
      assert.deepEqual(await inspectCheckpoint(directory), checkpoint);
      const sockets = new Set<Socket>();
      const alias = createServer((socket) => {
        const upstream = connect(
          Number(new URL(original.url).port || "5432"),
          "127.0.0.1",
        );
        sockets.add(socket);
        sockets.add(upstream);
        socket.on("error", () => upstream.destroy());
        upstream.on("error", () => socket.destroy());
        socket.pipe(upstream).pipe(socket);
      });
      await new Promise<void>((resolve, reject) => {
        alias.once("error", reject);
        alias.listen(0, "127.0.0.1", () => resolve());
      });
      try {
        const endpoint = alias.address();
        assert.ok(endpoint && typeof endpoint !== "string");
        const aliasUrl = new URL(original.url);
        aliasUrl.port = String(endpoint.port);
        await assert.rejects(
          restoreCheckpoint({
            directory,
            targetUrl: aliasUrl.toString(),
            documents: targetDocs,
            profile: join(root, "restored-browser-profile"),
            stopped: true,
            backend: "docker",
          }),
          /different PostgreSQL instance/,
        );
      } finally {
        for (const socket of sockets) socket.destroy();
        await new Promise<void>((resolve) => alias.close(() => resolve()));
      }
      await assert.rejects(
        restoreCheckpoint({
          directory,
          targetUrl: original.url,
          documents: targetDocs,
          stopped: true,
          backend: "docker",
        }),
        /original endpoint/,
      );

      await docker(
        [
          "run",
          "--detach",
          "--name",
          name,
          "--label",
          "ppo.synthetic=p12-disposable-restore",
          "--publish",
          "127.0.0.1::5432",
          "--env",
          "POSTGRES_PASSWORD",
          "--env",
          "POSTGRES_USER=ppo_local",
          "--env",
          "POSTGRES_DB=ppo_synthetic_test",
          "postgres:16.15",
        ],
        { ...process.env, POSTGRES_PASSWORD: password },
      );
      containerStarted = true;
      let ready = false;
      for (let attempt = 0; attempt < 60; attempt++) {
        try {
          await docker([
            "exec",
            name,
            "pg_isready",
            "-h",
            "127.0.0.1",
            "-U",
            "ppo_local",
            "-d",
            "ppo_synthetic_test",
          ]);
          ready = true;
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 250));
        }
      }
      assert.ok(ready, "Second disposable PostgreSQL instance became ready");
      const ports = JSON.parse(
        await docker([
          "inspect",
          "--format",
          "{{json .NetworkSettings.Ports}}",
          name,
        ]),
      ) as Record<string, { HostIp: string; HostPort: string }[]>;
      assert.equal(ports["5432/tcp"][0].HostIp, "127.0.0.1");
      const target = new URL(original.url);
      target.port = ports["5432/tcp"][0].HostPort;
      target.username = "ppo_local";
      target.password = password;
      const targetUrl = target.toString(),
        opts = {
          directory,
          targetUrl,
          documents: targetDocs,
          profile: join(root, "restored-browser-profile"),
          stopped: true,
          backend: "docker" as const,
        };
      const destination = new pg.Client({ connectionString: targetUrl });
      await destination.connect();
      try {
        await destination.query("CREATE TABLE public.p12_occupied(id integer)");
      } finally {
        await destination.end();
      }
      await assert.rejects(restoreCheckpoint(opts), /not empty/);
      const clear = new pg.Client({ connectionString: targetUrl });
      await clear.connect();
      try {
        await clear.query("DROP TABLE public.p12_occupied");
      } finally {
        await clear.end();
      }
      const member = checkpoint.roots[0].files[0],
        memberPath = join(directory, "documents", member.path);
      const originalBytes = await readFile(memberPath);
      await writeFile(memberPath, Buffer.from("corrupted checkpoint"));
      await assert.rejects(restoreCheckpoint(opts), /hash or size mismatch/);
      await writeFile(memberPath, originalBytes);
      await rename(memberPath, `${memberPath}.missing`);
      await assert.rejects(
        restoreCheckpoint(opts),
        /membership, hash or size mismatch/,
      );
      await rename(`${memberPath}.missing`, memberPath);
      const manifestPath = join(directory, "checkpoint.json"),
        manifestBytes = await readFile(manifestPath);
      await writeFile(
        manifestPath,
        JSON.stringify({
          ...checkpoint,
          database: {
            ...checkpoint.database,
            migrations: [{ version: 999, sha256: "0".repeat(64) }],
          },
        }),
      );
      await assert.rejects(restoreCheckpoint(opts), /incompatible/);
      await writeFile(manifestPath, manifestBytes);

      const restored = await restoreCheckpoint(opts);
      assert.notEqual(
        restored.target.system_identifier,
        checkpoint.source.system_identifier,
      );
      assert.equal(restored.exact_database_and_file_comparison, true);
      assert.equal(restored.workers_started, false);
      assert.equal(restored.outbound_enabled, false);
      process.env.DATABASE_URL = targetUrl;
      process.env.PPO_DOCUMENT_DIRECTORY = targetDocs;
      assert.equal(
        (
          await database().query(
            "SELECT last_value::text FROM ppo.p12_restore_sequence",
          )
        ).rows[0].last_value,
        "37",
      );
      assert.deepEqual(
        await presentationBytes(
          finance.q.reviewer,
          finance.q.report.id,
          reportPresentation.id,
        ),
        issued,
      );
      assert.deepEqual(
        (await attachmentBytes(finance.q.p, finance.q.photo.id)).bytes,
        photo.bytes,
      );
      const restoredUnknown = await readFinance(finance.processor, finance.id);
      assert.equal(restoredUnknown.handoff.status, "OutcomeUnknown");
      await assert.rejects(
        recordFinanceOutcome(finance.processor, finance.id, {
          ...base(),
          expected_version: restoredUnknown.handoff.version,
          attempt_id: restoredUnknown.handoff.active_attempt_id,
          action: "Dispatch",
        }),
        (e: unknown) =>
          (e as { code: string }).code === "OriginalLookupRequired",
      );
      const lookup = {
        ...base(),
        expected_version: restoredUnknown.handoff.version,
        attempt_id: restoredUnknown.handoff.active_attempt_id,
        action: "LookupOriginal",
      };
      const found = await recordFinanceOutcome(
        finance.processor,
        finance.id,
        lookup,
      );
      assert.deepEqual(
        (await recordFinanceOutcome(finance.processor, finance.id, lookup))
          .receipt,
        found.receipt,
      );
      const afterLookup = await readFinance(finance.reconciler, finance.id);
      const outcome = (
        await database().query(
          "SELECT id FROM ppo.finance_outcomes WHERE handoff_id=$1 AND method='OriginalLookup'",
          [finance.id],
        )
      ).rows[0];
      await reconcileFinance(finance.reconciler, finance.id, {
        ...base(),
        expected_version: afterLookup.handoff.version,
        outcome_id: outcome.id,
        basis:
          "P12 isolated synthetic restore: original target, unchanged 60 MIN and 2 EA, original 30 MIN non-billable disposition; no operational posting.",
      });
      assert.equal(
        (await readFinance(finance.reconciler, finance.id)).handoff.status,
        "Reconciled",
      );
      assert.equal(
        (
          await database().query(
            "SELECT count(*)::int n FROM ppo.finance_simulator_targets WHERE handoff_id=$1",
            [finance.id],
          )
        ).rows[0].n,
        1,
      );
      await runQuoteJob(job.id, {
        render: async () => {
          throw Error("Restored durable original must not render again");
        },
      });
      const bytes = await draftBytes(p, quote.id);
      assert.equal(bytes.html, originalQuote.html);
      assert.deepEqual(
        bytes.pdf,
        Buffer.from(originalQuote.pdf_base64, "base64"),
      );
      assert.deepEqual(
        (await prepareQuote(p, input.id, quote)).receipt,
        quoteReceipt.receipt,
      );
      assert.equal(
        (
          await database().query(
            "SELECT count(*)::int n FROM ppo.estimate_quote_jobs WHERE revision_id=$1",
            [quote.id],
          )
        ).rows[0].n,
        1,
      );
      await assert.rejects(readEstimate(observer, input.id));
      await closeDatabase();
      const offlineRestored = await verifyOfflineRecovery(opts.profile);
      const demoDirectory = join(root, "owner-demo-epoch");
      const demoDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Australia/Brisbane",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
      const demo = await prepareOwnerDemo(demoDirectory, demoDate);
      assert.deepEqual(demo.stages, {
        Discovery: 2,
        Scoping: 1,
        Quoting: 1,
        Negotiation: 1,
        Closing: 1,
      });
      assert.equal(demo.estimate.cost, "9900.00");
      assert.equal(demo.estimate.sell, "12750.50");
      assert.equal(demo.receipts.length, 19);
      assert.deepEqual(await prepareOwnerDemo(demoDirectory, demoDate), demo);
      const planPath = join(demoDirectory, "plan.json"),
        planBytes = await readFile(planPath);
      const plan = JSON.parse(planBytes.toString("utf8"));
      await writeFile(
        planPath,
        JSON.stringify({ ...plan, database_epoch: "different-reset-epoch" }),
      );
      await assert.rejects(
        prepareOwnerDemo(demoDirectory, demoDate),
        /epoch mismatch/,
      );
      await writeFile(planPath, planBytes);
      await closeDatabase();
      // The source is still an independent, unchanged comparison environment.
      const source = new pg.Client({ connectionString: original.url });
      await source.connect();
      try {
        await source.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
        assert.deepEqual(await fingerprint(source), checkpoint.database);
        await source.query("COMMIT");
      } finally {
        await source.end();
      }
      const evidence = "verification-evidence/p12-recovery";
      await mkdir(evidence, { recursive: true });
      const demoOutput = await draftBytes(p, demo.quote.id);
      assert.equal(digest(demoOutput.html), demo.quote.html_sha256);
      assert.equal(digest(demoOutput.pdf), demo.quote.pdf_sha256);
      await writeFile(
        join(evidence, "owner-demo-original-draft.html"),
        demoOutput.html,
      );
      await writeFile(
        join(evidence, "owner-demo-original-draft.pdf"),
        demoOutput.pdf,
      );
      await writeFile(
        join(evidence, "database-restore.json"),
        JSON.stringify(
          {
            ...restored,
            source_head:
              process.env.PPO_SOURCE_HEAD || checkpoint.release.commit,
            executed_checkout: checkpoint.release.commit,
            executed_tree: checkpoint.release.tree,
            run_id: process.env.GITHUB_RUN_ID ?? null,
            run_attempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
            database_dump_sha256: checkpoint.dump.sha256,
            database_dump_bytes: checkpoint.dump.bytes,
            table_fingerprints: checkpoint.database.tables,
            sequence_states: checkpoint.database.sequences,
            structure_sha256: checkpoint.database.structure_sha256,
            migrations: checkpoint.database.migrations,
            files: checkpoint.roots.map((r) => ({
              kind: r.kind,
              originals: r.files,
            })),
            report_original_retained: true,
            png_sha256: digest(photo.bytes),
            original_quote_pdf_sha256: digest(bytes.pdf),
            original_quote_html_sha256: digest(bytes.html),
            finance_original_lookup_replayed: true,
            finance_target_count: 1,
            original_quote_job_count: 1,
            source_unchanged: true,
            demo_epoch: demo,
            offline_originals: offlineRestored,
            limits: [
              "Synthetic same-platform PostgreSQL 16 restore only",
              "Restored browser/profile originals verified on this platform; full policy-change PT-28/PT-30 remain separate",
              "Measured checkpoint age is not an RPO/RTO promise",
              "No live outbound integration or owner acceptance",
            ],
          },
          null,
          2,
        ),
      );
    } finally {
      await closeDatabase();
      process.env.DATABASE_URL = original.url;
      for (const [key, value] of [
        ["PPO_DOCUMENT_DIRECTORY", original.documents],
        ["PPO_ALLOW_RESET", original.allow],
        ["PPO_RESET_DATABASE", original.reset],
      ]) {
        if (value === undefined) delete process.env[key!];
        else process.env[key!] = value;
      }
      if (containerStarted) await docker(["rm", "--force", name]);
      // Private checkpoint/source files are retained outside the public review artifact.
    }
  },
);
