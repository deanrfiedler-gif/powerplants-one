import { test } from "node:test";
import assert from "node:assert/strict";
import {
  catalogueHref,
  catalogueQuery,
  readCatalogueReturn,
} from "../../src/products/catalogue-navigation";

test("catalogue return state cannot widen API filters or redirect outside Products", () => {
  const query = catalogueQuery(
    new URLSearchParams(
      "q=VC+20&kind=Variant&state=Published&lifecycle=Supported&revision_id=secret&return_to=https://example.com",
    ),
  );
  assert.equal(
    query,
    "q=VC+20&kind=Variant&state=Published&lifecycle=Supported",
  );
  assert.equal(catalogueHref("return_to=https://example.com"), "/products");
  assert.equal(catalogueHref(query), `/products?${query}`);
});
test("catalogue return is bound to actor/company and validates retained state", () => {
  const entry = {
    scope: "workspace:actor:company",
    query: "q=VC&kind=Variant",
    selected: "11111111-1111-4111-8111-111111111111",
    scroll: 400,
  };
  assert.deepEqual(
    readCatalogueReturn(JSON.stringify(entry), entry.scope),
    entry,
  );
  for (const scope of ["workspace:other:company", "workspace:actor:other"])
    assert.equal(readCatalogueReturn(JSON.stringify(entry), scope), null);
  for (const patch of [
    { query: "q=x&secret=y" },
    { selected: '"] a' },
    { scroll: -1 },
    { scroll: Infinity },
  ])
    assert.equal(
      readCatalogueReturn(JSON.stringify({ ...entry, ...patch }), entry.scope),
      null,
    );
  assert.equal(readCatalogueReturn("broken", entry.scope), null);
});
