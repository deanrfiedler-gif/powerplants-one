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
test("Step 4 registers only the intended online guarded routes; offline registration and activation bypass remain absent", async () => {
  const allowed = new Set([
    "src/app/api/v1/schedule/policy-family/route.ts",
    "src/app/api/v1/schedule/policy-proposals/route.ts",
    "src/app/api/v1/schedule/policy-proposals/[id]/route.ts",
    "src/app/api/v1/schedule/policy-reviews/route.ts",
    "src/app/api/v1/schedule/policy-reviews/[id]/route.ts",
    "src/app/api/v1/schedule/policy-publications/route.ts",
    "src/app/api/v1/schedule/policy-publications/[id]/route.ts",
    "src/app/api/v1/schedule/policy-impacts/[id]/route.ts",
    "src/app/api/v1/schedule/policy-impacts/[id]/resolve/route.ts",
  ]);
  for (const name of [
    ...(await files("src/app")),
    ...(await files("src/offline")),
  ].filter((x) => /\.[cm]?[jt]sx?$/.test(x))) {
    const text = await readFile(name, "utf8");
    const key = name.replaceAll("\\", "/");
    if (allowed.has(key)) {
      assert.match(text, /scheduling\/policy-http/);
      allowed.delete(key);
      continue;
    }
    assert.doesNotMatch(
      text,
      /policy-(commands|http|resolution)|(?:publishSchedulingPolicy|resolveSchedulingPolicyImpact)/,
      name,
    );
  }
  assert.equal(
    allowed.size,
    0,
    "All coordinated online registrations must exist",
  );
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
