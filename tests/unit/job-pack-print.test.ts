import test from "node:test";
import assert from "node:assert/strict";
import { printHeaderCss } from "../../src/documents/print-view";
test("print reference cannot terminate a CSS string or its style element", () => {
  const input = 'SYN \"; } </style><script>alert(1)</script>\n';
  const css = printHeaderCss(input, "r02", "NOT ISSUED");
  assert.ok(!css.includes("</style>"));
  assert.ok(!css.includes("<script>"));
  const encoded = css.match(/content: "([^"]*)";/)![1];
  assert.equal(
    encoded.replace(/\\([0-9a-f]+) /g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    ),
    `${input} · r02 · NOT ISSUED · Synthetic prototype`,
  );
});
