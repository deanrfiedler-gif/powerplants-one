import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  commercialFixture,
  commercialAction,
  variation,
} from "../helpers/project-commercial";
import { recordFinding } from "../../src/library/commands";
import { readDocument } from "../../src/library/reads";
import { grantLibrary } from "../helpers/library";
import { crmBase } from "../helpers/crm";
import { httpAcceptance } from "../helpers/acceptance-http";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
after(closeDatabase);
const h = httpAcceptance(localConfig().origin);
test("PJ05-HTTP01 compiled exact basis, independent variation, Finance, concurrent submit and original recovery", async () => {
  const f = await commercialFixture(),
    route = `projects/${f.project.id}/commercial`;
  const saved = await h.call("coordinator", route, f.create);
  assert.equal(saved.status, 201, JSON.stringify(saved.body));
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
  assert.equal((await h.call("coordinator", route, decision)).status, 409);
  assert.equal(
    (await h.call("estimating-source-reviewer", route, decision)).status,
    201,
  );
  const v = variation(f, "0.11", "0.10");
  assert.equal((await h.call("coordinator", route, v)).status, 201);
  const results = await Promise.all(
    [1, 2].map(() =>
      h.call("coordinator", route, commercialAction(v.id, 1, "Submit")),
    ),
  );
  assert.deepEqual(results.map((x) => x.status).sort(), [201, 409]);
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
  assert.equal(finance.status, 200);
  assert.equal(finance.body.adjusted_control_value, "350.10");
  assert.equal(finance.body.breakdown[0].priced_amount, "0.10");
  assert.deepEqual(
    (await h.call("coordinator", `operations/${f.create.operation_id}`)).body,
    saved.body,
  );
  assert.deepEqual(
    (await h.call("coordinator", route, f.create)).body,
    saved.body,
  );
  assert.equal(
    (
      await h.call("coordinator", route, {
        ...f.create,
        note: "SYN changed original",
      })
    ).status,
    409,
  );
});
test("PJ05-HTTP02 schema, exact precision, unknown input, source and cross-company refusals", async () => {
  const f = await commercialFixture(),
    route = `projects/${f.project.id}/commercial`;
  assert.equal((await h.call("second-company", route)).status, 404);
  assert.equal(
    (await h.call("coordinator", route, { ...f.create, approved: true }))
      .status,
    422,
  );
  assert.equal(
    (
      await h.call("coordinator", route, {
        ...f.create,
        source: { ...f.create.source, document_review_id: randomUUID() },
      })
    ).status,
    404,
  );
  assert.equal(
    (await h.call("coordinator", route, { ...variation(f, "1.001", null) }))
      .status,
    422,
  );
  assert.equal(
    (await h.call("coordinator", route + "?cursor=forged")).status,
    422,
  );
  assert.equal(
    (
      await h.call(
        "coordinator",
        route + "?id=" + f.create.id + "&before_version=99999999999999999999",
      )
    ).status,
    422,
  );
  assert.equal(
    (await h.call("coordinator", route + "/finance?as_of=2025")).status,
    422,
  );
});

test("PJ05-HTTP03 outdated document reviews and proposed owners cannot grant new authority", async () => {
  const f = await commercialFixture(),
    route = `projects/${f.project.id}/commercial`;
  await grantLibrary(f.reviewer, ["project.commercial.prepare"]);
  assert.equal(
    (
      await h.call("estimating-source-reviewer", route, {
        ...f.create,
        content: { ...f.create.content, owner_id: f.reviewer.actor_id },
      })
    ).status,
    404,
  );
  const finding_id = randomUUID();
  for (const [index, action] of ["Open", "Respond", "Accept"].entries()) {
    await recordFinding(
      action === "Accept" ? f.reviewer : f.owner,
      f.document.id,
      {
        ...crmBase(),
        revision_id: f.document.revision_id,
        expected_version: index + 2,
        finding_id,
        action,
        text: "SYN later finding evidence",
        ...(action === "Open"
          ? { owner_id: f.owner.actor_id, due_date: "2031-10-01" }
          : {}),
      },
    );
  }
  const document = await readDocument(f.owner, f.document.id);
  assert.equal(document.review_state, "ReviewOutdated");
  const query = new URLSearchParams({
    handover_id: f.handover,
    quote_revision_id: f.release.id,
    document_id: f.document.id,
  });
  assert.equal(
    (await h.call("coordinator", `${route}/basis-options?${query}`)).status,
    409,
  );
  assert.equal(
    (
      await h.call("coordinator", route, {
        ...f.create,
        source: {
          ...f.create.source,
          document_version: document.document.version,
        },
      })
    ).status,
    409,
  );
});
