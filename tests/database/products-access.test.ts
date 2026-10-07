import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { localConfig } from "../../src/platform/config";
import { createProduct, decideProduct } from "../../src/products/commands";
import {
  listProducts,
  readProduct,
  productPricing,
} from "../../src/products/reads";
import { productInput } from "../helpers/products";
import { crmBase } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
test("named local Products duties complete independent publication without granting existing or hosted identities access", async () => {
  const author = (await createSession("products-author")).principal,
    reviewer = (await createSession("products-reviewer")).principal,
    publisher = (await createSession("products-publisher")).principal,
    reader = (await createSession("products-reader")).principal;
  const input = productInput();
  await createProduct(author, input);
  const d = await readProduct(reader, input.id);
  assert.equal(
    (await listProducts(reader, { q: input.reference })).items.length,
    1,
  );
  await assert.rejects(createProduct(reader, productInput()));
  await assert.rejects(productPricing(reader, input.id));
  const decision = (version: number, action: string) => ({
    ...crmBase(),
    expected_version: version,
    revision_id: d.revision.id,
    action,
  });
  await decideProduct(author, input.id, decision(1, "Submit"));
  await assert.rejects(
    decideProduct(author, input.id, decision(2, "Reviewed")),
  );
  await decideProduct(reviewer, input.id, decision(2, "Reviewed"));
  const publish = {
    ...decision(3, "Published"),
    purpose: "SYN controlled catalogue",
    audience: "Synthetic local readers",
    effective_on: "2026-10-07",
  };
  await assert.rejects(decideProduct(reviewer, input.id, publish));
  await decideProduct(publisher, input.id, publish);
  assert.equal(
    (await readProduct(reader, input.id)).published?.id,
    d.revision.id,
  );
  await assert.rejects(
    listProducts((await createSession("coordinator")).principal),
  );
  assert.equal(
    (
      await database().query(
        "SELECT 1 FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id) WHERE g.capability LIKE 'products.%' AND (u.issuer<>'PPO-LocalSynthetic' OR u.subject_id NOT IN ('products-reader','products-author','products-reviewer','products-publisher'))",
      )
    ).rowCount,
    0,
  );
});
