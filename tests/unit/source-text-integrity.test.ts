import assert from "node:assert/strict";
import { test } from "node:test";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// A non-UTF-8 write turns "…", "—" and "·" into "?" or U+FFFD, and both then
// reach the screen. The audit of 15 October 2026 found 14 Maintenance and
// Warranty fallbacks reading "Loading permitted records?" and two U+FFFD
// separators; these checks keep that class of damage out of src/.
const root = fileURLToPath(new URL("../../src/", import.meta.url));
async function sources(dir = root): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await sources(path)));
    else found.push(path);
  }
  return found;
}
const texts = async (extension: RegExp) =>
  Promise.all(
    (await sources())
      .filter((path) => extension.test(path))
      .map(async (path) => ({ path, text: await readFile(path, "utf8") })),
  );
const where = (path: string, text: string, index: number) =>
  `${relative(root, path)}:${text.slice(0, index).split("\n").length}`;

test("source text carries no U+FFFD replacement character", async () => {
  const damaged = (await texts(/\.(ts|tsx|css)$/)).flatMap(({ path, text }) =>
    [...text.matchAll(/\uFFFD/g)].map((match) => where(path, text, match.index)),
  );
  assert.deepEqual(damaged, []);
});

test("loading messages end in an ellipsis, not a question mark", async () => {
  const damaged = (await texts(/\.tsx$/)).flatMap(({ path, text }) =>
    [...text.matchAll(/>\s*Loading [^<{}]*\?\s*</g)].map(
      (match) => `${where(path, text, match.index)} ${match[0].trim()}`,
    ),
  );
  assert.deepEqual(damaged, []);
});
