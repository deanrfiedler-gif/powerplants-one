import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";
import path from "node:path";
async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory()
          ? files(path.join(dir, e.name))
          : [path.join(dir, e.name)],
      ),
    )
  ).flat();
}
test("Step 3 mutators have no live application/offline registration or user-selectable activation bypass", async () => {
  for (const name of [
    ...(await files("src/app")),
    ...(await files("src/offline")),
  ].filter((x) => /\.[cm]?[jt]sx?$/.test(x))) {
    const text = await readFile(name, "utf8");
    assert.doesNotMatch(
      text,
      /policy-(commands|http|resolution)|(?:publishSchedulingPolicy|resolveSchedulingPolicyImpact)/,
      name,
    );
  }
  for (const name of [
    "policy-commands.ts",
    "policy-http.ts",
    "policy-resolution.ts",
  ])
    assert.doesNotMatch(
      await readFile(`src/scheduling/${name}`, "utf8"),
      /process\.env|searchParams\.get\(['"](?:enable|bypass)/,
    );
});
