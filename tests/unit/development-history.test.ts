import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileHistories } from "../../src/development/history";

test("history distinguishes saved commits, local edits, new files and absent Git", async () => {
  const root = await mkdtemp(join(tmpdir(), "ppo-history-contract-"));
  const run = promisify(execFile);
  const git = (args: string[]) =>
    run("git", args, { cwd: root, windowsHide: true });
  try {
    await mkdir(join(root, "docs"));
    await writeFile(
      join(root, "docs", "living master.md"),
      "# Living master\n",
    );
    const path = "docs/living master.md";
    assert.equal(
      (await fileHistories(root, [path])).get(path)?.state,
      "History unavailable",
    );
    await git(["init"]);
    await git(["add", "docs"]);
    await git([
      "-c",
      "user.name=Test Fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "-m",
      "Test fixture",
    ]);
    const saved = (await fileHistories(root, [path])).get(path)!;
    assert.equal(saved.state, "Committed");
    assert(
      saved.last_changed_at && !Number.isNaN(Date.parse(saved.last_changed_at)),
    );
    assert.match(saved.last_commit!, /^[0-9a-f]{40}$/);
    assert(
      saved.source_url?.includes(
        `/blob/${saved.last_commit}/docs/living%20master.md`,
      ),
    );
    assert(saved.history_url?.includes(`/commits/${saved.last_commit}/`));
    await writeFile(
      join(root, "docs", "living master.md"),
      "# Updated master\n",
    );
    await writeFile(join(root, "docs", "new.md"), "# New\n");
    const local = await fileHistories(root, [path, "docs/new.md"]);
    assert.equal(local.get(path)?.state, "Uncommitted changes");
    assert.equal(local.get(path)?.last_commit, saved.last_commit);
    assert.equal(local.get("docs/new.md")?.state, "Uncommitted changes");
    assert.equal(local.get("docs/new.md")?.last_changed_at, null);
    assert.equal(local.get("docs/new.md")?.history_url, null);
  } finally {
    assert(root.startsWith(join(tmpdir(), "ppo-history-contract-")));
    await rm(root, { recursive: true, force: true });
  }
});
