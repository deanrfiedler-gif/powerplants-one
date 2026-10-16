import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import {
  definition,
  supportedPackHtml,
} from "../../src/documents/publication/contracts";
import {
  escapeHtml,
  rendererVersion,
  type PackSnapshot,
} from "../../src/documents/render";
import { digest } from "../../src/documents/store";

const fixture = JSON.parse(
  readFileSync("tests/fixtures/job-pack-read.json", "utf8"),
).items[0];
const saved = fixture.revisions.find(
  (r: { id: string }) => r.id === fixture.current_revision_id,
).snapshot as PackSnapshot;

// String.replace reads "$&", "$`", "$'" and "$$" in a replacement string as patterns.
// A published title, label or source value carrying them must still appear literally.
for (const renderer of ["DK06-OUT09-1", "DK06-OUT09-2"] as const)
  test(`${renderer} inserts published text literally, never as replacement patterns`, async () => {
    const patterns = "$& $` $' $$ $1",
      title = `SYN pack ${patterns}`,
      label = `SYN site ${patterns}`,
      site = `SYN Banksia ${patterns}`;
    const text = await definition(
      renderer,
      3,
      {
        schema_version: 1,
        title,
        audience: "Internal",
        fields: [{ key: "site", label, binding: "site.name", required: true }],
      },
      {
        proposal_id: randomUUID(),
        revision_id: randomUUID(),
        content_hash: "a".repeat(64),
      },
    );
    const html = await supportedPackHtml({
      ...saved,
      site: { ...saved.site, name: site },
      template: {
        ...saved.template,
        version: 3,
        definition: text,
        hash: digest(text),
        renderer_version: rendererVersion,
      },
    });
    assert.equal(html.match(/<h1>/g)?.length, 1);
    assert.ok(html.includes(`<h1>${escapeHtml(title)}</h1>`));
    assert.ok(
      html.includes(
        `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(site)}</dd>`,
      ),
    );
  });
