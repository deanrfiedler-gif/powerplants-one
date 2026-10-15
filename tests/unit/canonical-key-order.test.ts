import assert from "node:assert/strict";
import { test } from "node:test";
import { canonical as server } from "../../src/platform/operations";
import { canonical as offline } from "../../src/offline/protocol";

// PLAT-8 (audit 15 October 2026): both canonical() functions sorted keys with
// localeCompare and no locale, so the order, and every hash over it, followed the
// runtime's default locale. A browser in Estonian, Danish or Lithuanian reorders
// even plain snake_case keys and would disagree with the server.
test("canonical key order does not follow the runtime's default locale", () => {
  const original = String.prototype.localeCompare;
  // A runtime whose default locale is Estonian, where "zone" sorts before "type".
  String.prototype.localeCompare = function (
    this: string,
    that: string,
    locales?: string | string[],
    options?: Intl.CollatorOptions,
  ) {
    return original.call(this, that, locales ?? "et", options);
  };
  try {
    for (const canonical of [server, offline])
      assert.equal(
        canonical({ zone: "Australia/Brisbane", type: "Visit", aa_ref: 1 }),
        '{"aa_ref":1,"type":"Visit","zone":"Australia/Brisbane"}',
      );
  } finally {
    String.prototype.localeCompare = original;
  }
});

// Code-unit order would differ from English on mixed case and on "_" beside a digit.
// ES-08 specialist envelopes store hashes over camelCase keys and verify them on
// read, so the English order existing hashes were made in is kept exactly.
test("canonical keeps the English key order existing hashes were made in", () => {
  for (const canonical of [server, offline]) {
    assert.equal(
      canonical({ dropWire: 2, droppers: 1 }),
      '{"droppers":1,"dropWire":2}',
    );
    assert.equal(canonical({ line1: 1, line_2: 2 }), '{"line_2":2,"line1":1}');
  }
});
