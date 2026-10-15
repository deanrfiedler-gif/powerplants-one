import assert from "node:assert/strict";
import { after, test } from "node:test";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { reset } from "../../scripts/database";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { assignUse } from "../../src/documents/use/service";
import { readPublication } from "../../src/documents/publication/service";
import { assignmentFixture } from "../helpers/template-use";
import { createPack } from "../../src/documents/packs";
import {
  base,
  confirmed,
  content,
  prepared,
  principal,
} from "../helpers/packs";
import { randomUUID } from "node:crypto";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);

// Every file the DK06-OUT09-1 manifest reads, copied into a disposable mirror so
// one byte can change without touching the checkout.
const manifest = [
  "src/documents/publication/definition.ts",
  "src/documents/publication/render.ts",
  "src/documents/render.ts",
  "src/documents/validation.ts",
  "src/documents/drafts/validation.ts",
  "src/shared/validation.ts",
  "src/platform/operations.ts",
  "src/platform/browser.ts",
  "public/brand/Roboto-variable.woff",
  "public/brand/Roboto-output-provenance.json",
  "public/brand/powerplants-logo-green-white.png",
  "package-lock.json",
];
const comment = (text: string) => `${text}\n// Unrelated maintenance note.\n`;
const changes: [string, (text: string) => string][] = [
  [
    "package-lock.json",
    (text) => text.replace('"version": "3.9.6"', '"version": "3.9.7"'),
  ],
  ["src/platform/operations.ts", comment],
  ["src/shared/validation.ts", comment],
  ["src/platform/browser.ts", comment],
];
async function mirror(path: string, change: (text: string) => string) {
  const root = await mkdtemp(join(tmpdir(), "ppo-dk06-drift-"));
  for (const file of manifest) {
    await mkdir(dirname(join(root, file)), { recursive: true });
    await copyFile(join(process.cwd(), file), join(root, file));
  }
  const before = await readFile(join(root, path), "utf8"),
    after = change(before);
  assert.notEqual(after, before);
  await writeFile(join(root, path), after);
  return root;
}
async function within<T>(root: string, run: () => Promise<T>) {
  const original = process.cwd();
  process.chdir(root);
  try {
    return await run();
  } finally {
    process.chdir(original);
  }
}

test("G5 reproduction: an unrelated generic-file change refuses Job pack preparation at an assigned site", async () => {
  await reset();
  const f = await assignmentFixture();
  await assignUse(f.publisher, f.use);
  assert.equal(
    (await readPublication(f.publisher, f.command.id)).runtime_support,
    "Supported",
  );
  // Control: the unchanged checkout prepares a pack with the assigned definition.
  assert.ok((await prepared(9)).id);
  const p = await principal(),
    a = await confirmed(10),
    command = () => ({
      ...base(),
      id: randomUUID(),
      appointment_id: a.id,
      expected_appointment_version: a.version,
      content: content(),
    });
  for (const [path, change] of changes) {
    const root = await mirror(path, change);
    try {
      assert.equal(
        (await within(root, () => readPublication(f.publisher, f.command.id)))
          .runtime_support,
        "DefinitionChanged",
        path,
      );
      await assert.rejects(
        within(root, () => createPack(p, command())),
        { code: "TemplateUnavailable" },
        path,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
  // The same appointment prepares once the original bytes are back.
  assert.ok(await createPack(p, command()));
});
