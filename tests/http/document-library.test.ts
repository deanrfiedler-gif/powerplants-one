import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import {
  librarySetup,
  libraryInput,
  base,
  successor,
  CRM,
} from "../helpers/library";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
after(closeDatabase);
const origin = localConfig().origin,
  h = httpAcceptance(origin);
test("DK-HTTP01 compiled register, review, revision, history, links and receipts with scoped refusal", async () => {
  const { p } = await librarySetup(),
    input = libraryInput(p.actor_id),
    path = "document-library/" + input.id;
  const created = await h.call("coordinator", "document-library", input);
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const replay = await h.call("coordinator", "document-library", input);
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, created.body);
  assert.equal((await h.call("second-company", path)).status, 404);
  assert.equal(
    (await h.call("coordinator", path + "?unexpected=1")).status,
    422,
  );
  assert.equal(
    (await h.call("coordinator", "document-library?limit=51")).status,
    422,
  );
  const decision = {
    ...base(),
    revision_id: input.revision_id,
    expected_version: 1,
    outcome: "Reviewed",
    purpose: "SYN internal reference",
    rationale: "SYN exact content checked",
  };
  assert.equal(
    (await h.call("coordinator", path + "/review", decision)).status,
    409,
  );
  assert.equal(
    (await h.call("cs-reviewer", path + "/review", decision)).status,
    201,
  );
  assert.equal(
    (await h.call("observer", path)).body.eligible_for_current_use,
    true,
  );
  const link = {
    ...base(),
    revision_id: input.revision_id,
    expected_version: 2,
    action: "Add",
    link_id: randomUUID(),
    target_kind: "Site",
    target_id: CRM.site,
    purpose: "SYN compiled link",
  };
  assert.equal(
    (await h.call("coordinator", path + "/links", link)).status,
    201,
  );
  const next = successor(input, 3);
  assert.equal(
    (await h.call("coordinator", path + "/revisions", next)).status,
    201,
  );
  assert.equal(
    (await h.call("coordinator", path + "/usage")).body.items[0].revision_id,
    input.revision_id,
  );
  assert.equal(
    (await h.call("coordinator", path + "?revision_id=" + input.revision_id))
      .body.review_state,
    "Reviewed",
  );
  assert.equal(
    (await h.call("coordinator", path)).body.review_state,
    "Unreviewed",
  );
  const linked = await h.call(
    "coordinator",
    "document-library/linked?target_kind=Site&target_id=" + CRM.site,
  );
  assert.equal(linked.status, 200);
  assert.equal(
    linked.body.items.find(
      (x: { document: { id: string } }) => x.document.id === input.id,
    ).revision.id,
    input.revision_id,
  );

  assert.equal(
    (await h.call("coordinator", path + "/history?limit=2")).body.items.length,
    2,
  );
  assert.deepEqual(
    (await h.call("coordinator", "operations/" + input.operation_id)).body,
    created.body,
  );
  assert.equal(
    (
      await h.call("coordinator", path + "/withdraw", {
        ...base(),
        revision_id: next.revision_id,
        expected_version: 4,
      })
    ).status,
    201,
  );
});
test("DK-HTTP02 compiled exact download headers and unknown payloads; content cannot be requested by latest", async () => {
  const { p } = await librarySetup(),
    input = libraryInput(p.actor_id),
    path = "document-library/" + input.id;
  assert.equal(
    (
      await h.call("coordinator", "document-library", {
        ...input,
        source: { kind: "SharePoint", url: "https://invalid.example/" },
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await h.call("coordinator", "document-library", {
        ...input,
        reviewer_id: p.actor_id,
      })
    ).status,
    422,
  );
  assert.equal(
    (await h.call("coordinator", "document-library", input)).status,
    201,
  );
  assert.equal((await h.call("coordinator", path + "/content")).status, 422);
  const session = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile: "coordinator" }),
  });
  const response = await fetch(
    origin + "/api/v1/" + path + "/content?revision_id=" + input.revision_id,
    { headers: { cookie: session.headers.get("set-cookie")!.split(";")[0] } },
  );
  assert.equal(response.status, 200);
  assert.equal(await response.text(), input.source.text);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(
    response.headers.get("content-disposition")!,
    /^attachment; filename="SYN-PPO-DOC-/,
  );
  assert.match(response.headers.get("content-security-policy")!, /sandbox/);
});
