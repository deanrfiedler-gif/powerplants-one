import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { assignUse } from "../../src/documents/use/service";
import {
  publicationReadiness,
  readPublication,
} from "../../src/documents/publication/service";
import { definition as retainedDefinition } from "../../src/documents/publication/definition";
import { parseDefinition } from "../../src/documents/publication/contracts";
import { createPack } from "../../src/documents/packs";
import { processRenderJob, readBundle } from "../../src/documents/worker";
import { digest } from "../../src/documents/store";
import { rendererVersion } from "../../src/documents/render";
import { assignmentFixture } from "../helpers/template-use";
import { reviewedDraft } from "../helpers/template-publication";
import {
  base,
  confirmed,
  content,
  principal,
  queued,
  rows,
} from "../helpers/packs";
import { mirror, note, unrelated, within } from "../helpers/template-manifest";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);

test("G5: an assigned DK06-OUT09-2 definition prepares and issues through unrelated file changes; a rendering change still fails closed", async () => {
  await reset();
  const f = await assignmentFixture();
  await assignUse(f.publisher, f.use);
  const pub = await readPublication(f.publisher, f.command.id);
  assert.equal(JSON.parse(pub.publication.definition).renderer, "DK06-OUT09-2");
  assert.equal(pub.runtime_support, "Supported");
  // Before the correction, each of these edits refused preparation with
  // TemplateUnavailable at every assigned site.
  const issued = await within(await mirror(unrelated), async () => {
    assert.equal(
      (await readPublication(f.publisher, f.command.id)).runtime_support,
      "Supported",
    );
    const q = await queued(),
      output = await processRenderJob(q.pack.jobs[0].id);
    assert.ok("issue_id" in output, JSON.stringify(output));
    return { q, output };
  });
  const issue = (
    await rows("SELECT * FROM ppo.pack_issues WHERE id=$1", [
      issued.output.issue_id,
    ])
  )[0];
  assert.equal(issue.manifest.template.use_assignment_id, f.use.id);
  const bytes = await readBundle(issued.q.p, issue.manifest);
  assert.ok(
    bytes.html.includes(
      '<meta name="ppo-output-template" content="DK06-OUT09-2">',
    ),
  );
  assert.ok(bytes.html.includes(f.input.body.title));
  const p = await principal(),
    a = await confirmed(10),
    command = () => ({
      ...base(),
      id: randomUUID(),
      appointment_id: a.id,
      expected_appointment_version: a.version,
      content: content(),
    });
  await within(await mirror({ "src/documents/render.ts": note }), async () => {
    assert.equal(
      (await readPublication(f.publisher, f.command.id)).runtime_support,
      "DefinitionChanged",
    );
    await assert.rejects(createPack(p, command()), {
      code: "TemplateUnavailable",
    });
  });
  assert.ok(await createPack(p, command()));
});

test("Migration 0103 refuses a new DK06-OUT09-1 publication and accepts the same reviewed revision as DK06-OUT09-2", async () => {
  await reset();
  const f = await reviewedDraft(),
    v = await publicationReadiness(f.publisher, f.input.id);
  const current = parseDefinition(v.definition);
  assert.equal(current.renderer, "DK06-OUT09-2");
  // The identical reviewed revision built under the retained contract.
  const old = await retainedDefinition(
    v.runtime_version,
    current.body,
    current.origin,
  );
  const attempt = async (text: string) => {
    const c = await database().connect();
    try {
      await c.query("BEGIN");
      const template = randomUUID();
      await c.query(
        "INSERT INTO ppo.pack_templates(id,workspace_id,version,name,renderer_version,definition,content_hash) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          template,
          f.publisher.workspace_id,
          v.runtime_version,
          f.input.body.title,
          rendererVersion,
          text,
          digest(text),
        ],
      );
      // The publication service's own insert; deferred evidence never runs.
      return await c.query(
        `INSERT INTO ppo.template_publications(id,workspace_id,proposal_id,revision_id,review_id,proposal_version,template_id,runtime_version,definition,definition_hash,publisher_id,operation_id,reason,approval_note,command_hash,proposal_snapshot,review_snapshot)
      SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,to_jsonb(d),to_jsonb(r)
      FROM ppo.template_proposals d JOIN ppo.template_proposal_reviews r ON r.workspace_id=d.workspace_id AND r.proposal_id=d.id
      WHERE d.workspace_id=$2 AND d.id=$3 AND r.id=$5 RETURNING id`,
        [
          randomUUID(),
          f.publisher.workspace_id,
          v.proposal_id,
          v.revision_id,
          v.review_id,
          v.expected_version,
          template,
          v.runtime_version,
          text,
          digest(text),
          f.publisher.actor_id,
          randomUUID(),
          "SYN guard check",
          "SYN guard check",
          "0".repeat(64),
        ],
      );
    } finally {
      await c.query("ROLLBACK");
      c.release();
    }
  };
  await assert.rejects(attempt(old), {
    code: "23514",
    message: "Independent exact reviewed supported publication required",
  });
  assert.equal((await attempt(v.definition)).rowCount, 1);
  assert.deepEqual(await rows("SELECT * FROM ppo.template_publications"), []);
});
