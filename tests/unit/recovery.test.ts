import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mkdtemp,
  mkdir,
  writeFile,
  symlink,
  link,
  rm,
  chmod,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createCheckpoint,
  distinctPaths,
  inventory,
  privatePath,
  recoveryConnection,
} from "../../scripts/recovery";

test("P12 refuses live/remote/ambiguous recovery targets and missing stopped acknowledgement before database access", async () => {
  const env = { ...process.env };
  try {
    Object.assign(process.env, {
      PPO_ENV: "local-synthetic",
      PPO_EXPOSURE: "loopback",
      PPO_IDENTITY: "synthetic",
    });
    for (const url of [
      "postgres://x:y@example.com/ppo_synthetic_test",
      "postgres://x:y@127.0.0.1/production",
      "postgres://x:y@127.0.0.1/ppo_synthetic",
      "postgres://x:y@127.0.0.1/ppo_synthetic_test?sslmode=disable",
    ])
      assert.throws(() => recoveryConnection(url));
    assert.equal(
      recoveryConnection("postgres://x:y@127.0.0.1:5433/ppo_synthetic_test")
        .endpoint,
      "127.0.0.1:5433/ppo_synthetic_test",
    );
    await assert.rejects(
      createCheckpoint({
        sourceUrl: "",
        directory: "",
        documents: "",
        stopped: false,
      }),
      /stopped/,
    );
    process.env.PPO_ENV = "azure-demo";
    assert.throws(() =>
      recoveryConnection("postgres://x:y@127.0.0.1/ppo_synthetic_test"),
    );
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
  }
});

test("P12 separates checkpoint/source/destination and refuses Git paths, symlinks, hardlinks and non-private roots", async () => {
  const root = await mkdtemp(join(tmpdir(), "ppo-p12-guard-"));
  try {
    distinctPaths([join(root, "a"), join(root, "ab")]);
    distinctPaths([join(root, "a"), join(root, "..sibling")]);
    for (const paths of [
      [root, root],
      [root, join(root, "child")],
      [join(root, "child"), root],
      [root, join(root, "..still-a-child")],
      [join(root, "..still-a-child"), root],
    ])
      assert.throws(() => distinctPaths(paths));
    await mkdir(join(root, "repo"), { mode: 0o700 });
    await writeFile(join(root, "repo", ".git"), "gitdir: elsewhere");
    await assert.rejects(
      privatePath(join(root, "repo", "backup"), false),
      /outside Git/,
    );
    await mkdir(join(root, "files"), { mode: 0o700 });
    await writeFile(join(root, "files", "original"), "exact bytes");
    const before = await inventory(join(root, "files"));
    assert.equal(before.length, 1);
    assert.equal(before[0].bytes, 11);
    await symlink(join(root, "files"), join(root, "alias"));
    await assert.rejects(
      privatePath(join(root, "alias", "child"), false),
      /Unsafe/,
    );
    await symlink(
      join(root, "files", "original"),
      join(root, "files", "SingletonLock"),
    );
    await assert.rejects(inventory(join(root, "files")), /browser lock/);
    await rm(join(root, "files", "SingletonLock"));
    await link(join(root, "files", "original"), join(root, "hardlink"));
    await assert.rejects(inventory(join(root, "files")), /independent regular/);
    await rm(join(root, "hardlink"));
    await chmod(join(root, "files"), 0o755);
    await assert.rejects(privatePath(join(root, "files"), true), /owner-only/);
    await chmod(join(root, "files"), 0o700);
    assert.deepEqual(await inventory(join(root, "files")), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
