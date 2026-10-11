import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { closeDatabase, database } from "../../src/platform/database";
import {
  productActor,
  productInput,
  productContentFixture,
  relationshipFixture,
} from "../helpers/products";
import { productCapabilities } from "../../src/products/model";
import { crmBase, CRM } from "../helpers/crm";
import { sourceInput } from "../helpers/estimating-sources";
const origin = process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000";
after(closeDatabase);
async function request(cookie: string, path: string, body?: unknown) {
  return fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      Origin: origin,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
async function ok(cookie: string, path: string, body?: unknown, status = 200) {
  const response = await request(cookie, path, body);
  const value = await response.json();
  assert.equal(response.status, status, JSON.stringify(value));
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  return value;
}
test("PD every native read/command route, exact receipt, independent review, denied and unavailable scope", async () => {
  const author = await productActor([
      ...productCapabilities,
      "estimating.read",
      "estimating.edit",
    ]),
    reviewer = await productActor(),
    denied = await productActor([]),
    other = await productActor(productCapabilities, CRM.companyB),
    input = productInput();
  const created = await ok(author.cookie, "products", input, 201);
  assert.deepEqual(
    await ok(author.cookie, `operations/${input.operation_id}`),
    created,
  );
  assert.deepEqual(await ok(author.cookie, "products", input), created);
  assert.equal(
    (
      await request(author.cookie, "products", {
        ...input,
        reason: "Changed replay",
      })
    ).status,
    409,
  );
  let d = await ok(author.cookie, `products/${input.id}`);
  await ok(author.cookie, "products?q=SYN");
  await ok(author.cookie, `products/${input.id}`, {
    ...crmBase(),
    expected_version: 1,
    content: { ...input.content, title: "SYN HTTP successor" },
  });
  d = await ok(author.cookie, `products/${input.id}`);
  await ok(author.cookie, `products/${input.id}/review`, {
    ...crmBase(),
    expected_version: 2,
    revision_id: d.revision.id,
    action: "Submit",
  });
  await ok(reviewer.cookie, `products/${input.id}/review`, {
    ...crmBase(),
    expected_version: 3,
    revision_id: d.revision.id,
    action: "Reviewed",
  });
  await ok(author.cookie, `products/${input.id}/review`, {
    ...crmBase(),
    expected_version: 4,
    revision_id: d.revision.id,
    action: "Published",
    purpose: "SYN catalogue",
    audience: "Internal",
    effective_on: "2026-09-25",
  });
  const cost = sourceInput();
  await ok(author.cookie, "estimating/cost-sources", cost, 201);
  const source = await ok(author.cookie, `estimating/cost-sources/${cost.id}`);
  await ok(author.cookie, `products/${input.id}/pricing`, {
    ...crmBase(),
    expected_version: 5,
    revision_id: d.revision.id,
    source_id: cost.id,
    source_revision_id: source.revision.id,
    status: "Mapped",
    evidence: "SYN exact each mapping",
  });
  await ok(author.cookie, `products/${input.id}/pricing`);
  const second = productInput();
  await ok(author.cookie, "products", second, 201);
  const sd = await ok(author.cookie, `products/${second.id}`),
    relationshipId = randomUUID();
  await ok(
    author.cookie,
    "products/relationships",
    {
      ...crmBase(),
      id: relationshipId,
      from: { product_id: input.id, revision_id: d.revision.id },
      to: { product_id: second.id, revision_id: sd.revision.id },
      predecessor_id: null,
      content: relationshipFixture(),
    },
    201,
  );
  const rels = await ok(
      author.cookie,
      `products/relationships?product_id=${input.id}`,
    ),
    relationship = rels.items.find(
      (r: { id: string }) => r.id === relationshipId,
    );
  await ok(reviewer.cookie, `products/relationships/${relationshipId}/review`, {
    ...crmBase(),
    expected_version: 1,
    content_hash: relationship.content_hash,
    outcome: "Unresolved",
  });
  const assets = await database().query(
    "SELECT id,version FROM ppo.assets WHERE workspace_id=$1 AND company_id=$2 ORDER BY id LIMIT 1",
    [CRM.workspace, CRM.company],
  );
  const asset = assets.rows[0];
  const preview = await ok(
    author.cookie,
    `products/${input.id}/uses/preview?kind=Asset&target_id=${asset.id}`,
  );
  await ok(author.cookie, `products/${input.id}/uses`, {
    ...crmBase(),
    expected_version: 6,
    revision_id: d.revision.id,
    kind: "Asset",
    target_id: asset.id,
    target_version: preview.target.version,
    evidence: "SYN installed product observation",
  });
  const uses = await ok(author.cookie, `products/${input.id}/uses`);
  assert.equal(uses.items[0].target_version, asset.version);
  const batchId = randomUUID(),
    row = {
      external_key: `SYN-HTTP-${randomUUID()}`,
      kind: "Family",
      parent_id: null,
      reference: `SYN-HTTP-${randomUUID()}`,
      content: productContentFixture({ title: "SYN HTTP imported family" }),
    };
  await ok(
    author.cookie,
    "products/imports",
    {
      ...crmBase(),
      id: batchId,
      company_id: CRM.company,
      filename: "http.json",
      source_description: "SYN HTTP source",
      provider: "Synthetic catalogue",
      source_time: null,
      raw_content: JSON.stringify({
        format: "PPO synthetic catalogue 1",
        rows: [row],
      }),
    },
    201,
  );
  await ok(author.cookie, "products/imports");
  await ok(author.cookie, `products/imports/${batchId}`);
  await ok(author.cookie, `products/imports/${batchId}/map`, {
    ...crmBase(),
    expected_version: 1,
    mappings: [
      {
        row_number: 1,
        action: "New",
        target_id: null,
        reason: "SYN distinct exact source identity",
      },
    ],
  });
  const batch = await ok(author.cookie, `products/imports/${batchId}`),
    plan = {
      plan_id: batch.current.id,
      comparison_hash: batch.current.comparison_hash,
    };
  await ok(reviewer.cookie, `products/imports/${batchId}/review`, {
    ...crmBase(),
    ...plan,
    expected_version: 2,
    action: "Reviewed",
  });
  const apply = { ...crmBase(), ...plan, expected_version: 3, action: "Apply" },
    result = await ok(
      author.cookie,
      `products/imports/${batchId}/review`,
      apply,
    );
  assert.deepEqual(
    await ok(author.cookie, `operations/${apply.operation_id}`),
    result,
  );
  assert.deepEqual(
    await ok(author.cookie, `products/imports/${batchId}/review`, apply),
    result,
  );
  for (const path of [
    "products",
    `products/${input.id}`,
    `products/${input.id}/pricing`,
    "products/relationships",
    "products/imports",
    `products/imports/${batchId}`,
    `products/${input.id}/uses`,
    `products/${input.id}/uses/preview?kind=Asset&target_id=${asset.id}`,
  ])
    assert.ok(
      [403, 404].includes((await request(denied.cookie, path)).status),
      path,
    );
  for (const path of [
    `products/${input.id}`,
    `products/${input.id}/pricing`,
    `products/imports/${batchId}`,
    `products/${input.id}/uses`,
  ])
    assert.equal((await request(other.cookie, path)).status, 404, path);
  assert.equal(
    (await request(author.cookie, `products/${randomUUID()}`)).status,
    404,
  );
  assert.equal(
    (await request(author.cookie, "products?unsupported=1")).status,
    422,
  );
  for (const [path, body] of [
    ["products", productInput()],
    [
      `products/${input.id}`,
      { ...crmBase(), expected_version: 7, content: input.content },
    ],
    [
      `products/${input.id}/review`,
      {
        ...crmBase(),
        expected_version: 7,
        revision_id: d.revision.id,
        action: "Withdrawn",
      },
    ],
    [
      `products/${input.id}/pricing`,
      {
        ...crmBase(),
        expected_version: 7,
        revision_id: d.revision.id,
        source_id: cost.id,
        source_revision_id: source.revision.id,
        status: "Mapped",
        evidence: "SYN",
      },
    ],
    [
      "products/relationships",
      {
        ...crmBase(),
        id: randomUUID(),
        from: { product_id: input.id, revision_id: d.revision.id },
        to: { product_id: second.id, revision_id: sd.revision.id },
        content: relationshipFixture(),
        predecessor_id: null,
      },
    ],
    [
      `products/relationships/${relationshipId}/review`,
      {
        ...crmBase(),
        expected_version: 1,
        content_hash: relationship.content_hash,
        outcome: "Unresolved",
      },
    ],
    [
      `products/imports/${batchId}/map`,
      { ...crmBase(), expected_version: 4, mappings: [] },
    ],
    [`products/imports/${batchId}/review`, { ...apply, ...crmBase() }],
  ] as const)
    assert.equal((await request(other.cookie, path, body)).status, 404, path);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='products.import.apply'",
    [author.p.actor_id],
  );
  assert.equal(
    (await request(author.cookie, `operations/${apply.operation_id}`)).status,
    404,
  );
});
