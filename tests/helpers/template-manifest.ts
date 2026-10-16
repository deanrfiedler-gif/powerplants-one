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

// Every file a legacy, DK06-OUT09-1 or DK06-OUT09-2 manifest reads. A disposable
// mirror lets one byte change without touching the checkout.
const files = [
  "src/documents/publication/definition.ts",
  "src/documents/publication/render.ts",
  "src/documents/publication/dk06-out09-2.ts",
  "src/documents/render.ts",
  "src/documents/validation.ts",
  "src/documents/drafts/validation.ts",
  "src/documents/p11-template.ts",
  "src/documents/p11-render.ts",
  "src/reports/render.ts",
  "src/finance/render.ts",
  "src/shared/validation.ts",
  "src/platform/operations.ts",
  "src/platform/browser.ts",
  "public/brand/Roboto-variable.woff",
  "public/brand/Roboto-variable.ttf",
  "public/brand/Roboto-output-provenance.json",
  "public/brand/powerplants-logo-green-white.png",
  "package-lock.json",
];
export type Change = (bytes: Buffer) => Buffer;
export const note: Change = (bytes) =>
  Buffer.concat([bytes, Buffer.from("\n// Unrelated maintenance note.\n")]);
export const lockVersion =
  (name: string, version: string): Change =>
  (bytes) => {
    const lock = JSON.parse(bytes.toString("utf8"));
    lock.packages[`node_modules/${name}`].version = version;
    return Buffer.from(`${JSON.stringify(lock, null, 2)}\n`);
  };
// Changes that say nothing about the rendered output.
export const unrelated: Record<string, Change> = {
  "package-lock.json": lockVersion("prettier", "3.9.7"),
  "src/platform/operations.ts": note,
  "src/shared/validation.ts": note,
  "src/platform/browser.ts": note,
  "src/documents/drafts/validation.ts": note,
  "src/documents/publication/definition.ts": note,
};
export async function mirror(changes: Record<string, Change>) {
  const root = await mkdtemp(join(tmpdir(), "ppo-template-manifest-"));
  for (const file of files) {
    await mkdir(dirname(join(root, file)), { recursive: true });
    await copyFile(join(process.cwd(), file), join(root, file));
  }
  for (const [file, change] of Object.entries(changes)) {
    const before = await readFile(join(root, file)),
      after = change(before);
    if (after.equals(before)) throw Error(`${file} did not change`);
    await writeFile(join(root, file), after);
  }
  return root;
}
// Runs with the mirror as the working directory, then restores it and removes
// the mirror.
export async function within<T>(root: string, run: () => Promise<T>) {
  const original = process.cwd();
  process.chdir(root);
  try {
    return await run();
  } finally {
    process.chdir(original);
    await rm(root, { recursive: true, force: true });
  }
}
