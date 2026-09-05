import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalSyntheticDocumentStore, digest } from "../../src/documents/store";
test("P06 private adapter is write-once by original operation and verifies exact retrieved hashes", async () => {
  const root = await mkdtemp(join(tmpdir(), "ppo-store-"));
  try {
    const s = new LocalSyntheticDocumentStore(root),
      c = {
        workspace_id: randomUUID(),
        actor_id: randomUUID(),
        operation_id: randomUUID(),
      },
      bytes = Buffer.from("Synthetic prototype — not for operational use");
    const key = await s.store(c, bytes, digest(bytes));
    assert.deepEqual(await s.store(c, bytes, digest(bytes)), key);
    assert.deepEqual(Buffer.from(await s.read(c, key)), bytes);
    await assert.rejects(s.store(c, Buffer.from("changed"), digest("changed")));
    await assert.rejects(s.read(c, { ...key, item_id: "../../etc/passwd" }));
    await writeFile(join(root, c.workspace_id, c.operation_id), "corrupt");
    await assert.rejects(s.read(c, key));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("P06 source lookup never substitutes a latest version; symlink and in-repository stores are refused", async () => {
  const root = await mkdtemp(join(tmpdir(), "ppo-store-"));
  try {
    const c = {
        workspace_id: randomUUID(),
        actor_id: randomUUID(),
        operation_id: randomUUID(),
      },
      s = new LocalSyntheticDocumentStore(root);
    await assert.rejects(
      new LocalSyntheticDocumentStore(process.cwd()).store(
        c,
        Buffer.from("x"),
        digest("x"),
      ),
    );
    const key = await s.store(c, Buffer.from("v1"), digest("v1"));
    await assert.rejects(s.read(c, { ...key, version_id: digest("v2") }));
    const link = join(root, "alias");
    await symlink(root, link);
    await assert.rejects(
      new LocalSyntheticDocumentStore(link).store(
        c,
        Buffer.from("x"),
        digest("x"),
      ),
    );
    assert.equal(
      await readFile(join(root, c.workspace_id, c.operation_id), "utf8"),
      "v1",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
