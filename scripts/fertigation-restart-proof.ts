import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import {
  fertigationFixture,
  fertigationBase,
  saveCommand,
} from "../tests/helpers/fertigation";
import { png } from "../tests/helpers/field";
import { localConfig } from "../src/platform/config";
import { closeDatabase, database } from "../src/platform/database";
import { saveScope } from "../src/estimating/fertigation/service";
import { readScope } from "../src/estimating/fertigation/reads";
import { attachEvidence } from "../src/estimating/fertigation/evidence";
import {
  prepareOutput,
  readOutput,
} from "../src/estimating/fertigation/artifacts";
import { digest } from "../src/documents/store";

const manifestPath = "verification-evidence/fertigation-restart/manifest.json";
const mode = process.argv[2],
  origin = process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3042";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Isolated ppo_synthetic_test only");
if (!["write", "verify"].includes(mode))
  throw Error(
    "Use write or verify; process/database restart is an explicit caller step",
  );
try {
  if (mode === "write") {
    const f = await fertigationFixture(),
      attachment = {
        ...fertigationBase(),
        expected_version: 1,
        revision_id: f.detail.revision.id,
        label: "SYN restart evidence",
        filename: "SYN-restart.png",
        source_revision: "SYN r01",
        attribution: "Synthetic proof",
        applicability: "Original valve evidence bytes only",
      },
      bytes = png();
    await attachEvidence(f.p, f.create.id, attachment, bytes);
    const change = saveCommand(f.detail);
    change.proposal.evidence = [
      {
        id: attachment.operation_id,
        label: attachment.label,
        kind: "document_reference",
        reference: `ppo-file:${attachment.operation_id}`,
        source_revision: attachment.source_revision,
        sha256: digest(bytes),
        captured_date: null,
        attribution: attachment.attribution,
        applicability: attachment.applicability,
        notes: "",
      },
    ];
    change.proposal.valves[0].evidence_ids = [attachment.operation_id];
    const saved = await saveScope(f.p, f.create.id, change),
      detail = await readScope(f.p, f.create.id),
      output = {
        ...fertigationBase(),
        expected_version: 2,
        revision_id: detail.revision.id,
        audience: "customer",
        format: "html",
      };
    await prepareOutput(f.p, f.create.id, output);
    const retained = await readOutput(f.p, f.create.id, output.operation_id);
    const manifest = {
      synthetic: true,
      database_started_at: (
        await database().query(
          "SELECT pg_postmaster_start_time() AS started_at",
        )
      ).rows[0].started_at.toISOString(),
      scope_id: f.create.id,
      revision_id: detail.revision.id,
      content_hash: detail.revision.content_hash,
      source_revision_id: f.revisionId,
      valve_id: detail.revision.proposal.valves[0].id,
      master_id: detail.revision.proposal.masters[0].id,
      operation_id: change.operation_id,
      receipt: saved.receipt,
      evidence_id: attachment.operation_id,
      evidence_hash: digest(bytes),
      output_id: output.operation_id,
      output_hash: retained.hash,
    };
    await mkdir("verification-evidence/fertigation-restart", {
      recursive: true,
    });
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(
      "Prepared synthetic exact revision, saved receipt, original PNG and retained HTML for external process/database restart.",
    );
  } else {
    const m = JSON.parse(await readFile(manifestPath, "utf8"));
    const databaseStartedAt = (
      await database().query("SELECT pg_postmaster_start_time() AS started_at")
    ).rows[0].started_at.toISOString();
    if (process.env.PPO_REQUIRE_RESTART === "1") {
      assert.equal(
        typeof m.database_started_at,
        "string",
        "Write must retain the actual database start time",
      );
      assert.notEqual(
        databaseStartedAt,
        m.database_started_at,
        "The PostgreSQL process must actually restart",
      );
    }
    const login = await fetch(origin + "/api/v1/local-session", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify({ profile: "coordinator" }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie")!.split(";")[0];
    const get = async (path: string) => {
      const response = await fetch(origin + "/api/v1/" + path, {
        headers: { Cookie: cookie, Origin: origin },
      });
      assert.equal(response.status, 200, path);
      return response;
    };
    const path = `estimating/fertigation/${m.scope_id}`,
      exact = await (await get(`${path}?revision_id=${m.revision_id}`)).json();
    assert.equal(exact.revision.content_hash, m.content_hash);
    assert.equal(exact.revision.source_revision_id, m.source_revision_id);
    assert.equal(exact.revision.proposal.valves[0].id, m.valve_id);
    assert.equal(exact.revision.proposal.valves[0].master_id, m.master_id);
    assert.deepEqual(
      await (await get(`operations/${m.operation_id}`)).json(),
      m.receipt,
    );
    assert.equal(
      digest(
        Buffer.from(
          await (await get(`${path}/evidence/${m.evidence_id}`)).arrayBuffer(),
        ),
      ),
      m.evidence_hash,
    );
    assert.equal(
      digest(
        Buffer.from(
          await (await get(`${path}/outputs/${m.output_id}`)).arrayBuffer(),
        ),
      ),
      m.output_hash,
    );
    console.log(
      "PASS: new authenticated HTTP session reads exact revision, master/valve linkage, receipt, original PNG and retained HTML hashes.",
    );
    await writeFile(
      "verification-evidence/fertigation-restart/verified.json",
      JSON.stringify(
        {
          synthetic: true,
          revision_id: m.revision_id,
          content_hash: m.content_hash,
          database_started_before: m.database_started_at ?? null,
          database_started_after: databaseStartedAt,
          database_restart_required: process.env.PPO_REQUIRE_RESTART === "1",
          new_authenticated_http_session: true,
          exact_revision_master_valve_receipt_png_html_hashes: "passed",
        },
        null,
        2,
      ),
    );
  }
} finally {
  await closeDatabase();
}
