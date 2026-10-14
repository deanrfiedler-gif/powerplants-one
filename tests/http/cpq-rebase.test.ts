import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { createSession } from "../../src/platform/identity";
import { decisionBodyBytes, rebaseInputBytes } from "../../src/cpq/http-limits";
import { crmBase } from "../helpers/crm";
import { cpqInput } from "../helpers/cpq";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { cpqHttp } from "../helpers/cpq-products";
import { cpqRebaseHttpScenario } from "../helpers/cpq-rebase-http";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);

test("compiled decision routes accept bounded multibyte envelopes and reject oversized bodies or calculation inputs", async () => {
  const session = await createSession("coordinator"),
    cookie = `ppo_local_session=${session.token}`,
    endpoint = `cpq/runs/${randomUUID()}`,
    reason = "界".repeat(500),
    receiving = {
      decisions: Array.from({ length: 200 }, () => ({
        line_id: randomUUID(),
        action: "Remove",
        reason,
      })),
    },
    proposal = {
      revision_id: randomUUID(),
      input: cpqInput(),
      decisions: Array.from({ length: 100 }, (_, i) => ({
        source_target: `${i}`.padEnd(200, "界"),
        kind: "Quantity",
        action: "Remap",
        target: "界".repeat(200),
        value: null,
        reason,
      })),
    },
    adoption = {
      ...crmBase(),
      estimate_id: randomUUID(),
      preview_hash: "a".repeat(64),
      result_hash: "b".repeat(64),
      title: "SYN request bounds",
      scope: { included: "SYN", excluded: "SYN", assumptions: "SYN" },
      resolution: receiving,
    },
    command = {
      ...crmBase(),
      ...proposal,
      id: randomUUID(),
      preview_hash: "a".repeat(64),
    };
  for (const [suffix, body] of [
    ["/adoption/preview", receiving],
    ["/adoption", adoption],
    ["/rebase/preview", proposal],
    ["/rebase", command],
  ] as const) {
    assert.ok(Buffer.byteLength(JSON.stringify(body)) > 65536);
    assert.ok(Buffer.byteLength(JSON.stringify(body)) < decisionBodyBytes);
    // Parsing succeeds and reaches source lookup. The intentionally absent run
    // must remain inaccessible; this transport proof does not accept a command.
    await cpqHttp(cookie, endpoint + suffix, body, 404);
    const rejected = await cpqHttp<{ code: string }>(
      cookie,
      endpoint + suffix,
      { ...body, padding: "x".repeat(decisionBodyBytes) },
      422,
    );
    assert.equal(rejected.code, "PayloadTooLarge");
  }
  for (const [suffix, body] of [
    ["/rebase/preview", proposal],
    ["/rebase", command],
  ] as const) {
    const rejected = await cpqHttp<{
      code: string;
      field_errors: { field: string }[];
    }>(
      cookie,
      endpoint + suffix,
      {
        ...body,
        input: { text: "界".repeat(Math.ceil(rebaseInputBytes / 3)) },
      },
      422,
    );
    assert.equal(rejected.code, "InvalidData");
    assert.equal(rejected.field_errors[0].field, "input");
  }
});
test("compiled rebase and receiving decisions retain exact history and original-operation recovery after source changes", async () => {
  const s = await cpqRebaseHttpScenario();
  for (const [path, command, receipt] of [
    [s.parentEndpoint + "/rebase", s.command, s.rebaseReceipt],
    [`cpq/runs/${s.run.id}/adoption`, s.adoption, s.adoptionReceipt],
  ] as const) {
    assert.deepEqual(await cpqHttp(s.cookie, path, command), receipt);
    assert.deepEqual(
      await cpqHttp(s.cookie, `operations/${command.operation_id}`),
      receipt,
    );
    await cpqHttp(
      s.cookie,
      path,
      { ...command, reason: "SYN changed accepted request" },
      409,
    );
  }
  assert.deepEqual(await cpqHttp(s.cookie, `cpq/runs/${s.run.id}`), s.run);
  assert.deepEqual(await cpqHttp(s.cookie, s.provenancePath), s.provenance);
  assert.equal(
    (
      await cpqHttp<{ code: string }>(
        s.cookie,
        `cpq/runs/${s.run.id}/adoption`,
        undefined,
        409,
      )
    ).code,
    "CpqCostSourceChanged",
  );
  await cpqHttp(
    "",
    `cpq/runs/${s.run.id}/adoption/preview`,
    { decisions: [] },
    401,
  );
  await cpqHttp(
    s.cookie,
    s.parentEndpoint + "/rebase/preview",
    { ...s.command, computed_total: "0" },
    422,
  );
});
