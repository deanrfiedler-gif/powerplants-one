// Compiles every guide in docs/guides, checks them against the development register and writes the guides that
// general users may see to .ppo-guides/released.json (ADR-0065, decision 8). `npm run build` runs this first, and any
// error fails the build, so the production image never holds a guide that does not compile.
import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { readMaster } from "../src/development/catalog";
import { awaitingRewrite, readGuideLibrary, releasedFile } from "../src/guides/library";
import { releasedGuides } from "../src/guides/released";

const root = process.cwd();
for (const path of awaitingRewrite) {
  const present = await access(resolve(root, path)).then(
    () => true,
    () => false,
  );
  if (present) console.log(`Skipped until rewritten (plan Task 5): ${path}`);
}

const { entries } = await readMaster(root);
const library = await readGuideLibrary(root, entries);
if (library.errors.length > 0) {
  for (const error of library.errors) console.error(`${error.path}:${error.line} ${error.message}`);
  console.error(`${library.errors.length} guide error${library.errors.length === 1 ? "" : "s"}: fix them and run the build again.`);
  process.exitCode = 1;
} else {
  const released = releasedGuides(library, entries);
  await mkdir(resolve(root, dirname(releasedFile)), { recursive: true });
  await writeFile(resolve(root, releasedFile), JSON.stringify(released));
  console.log(`Guides compiled: ${library.guides.length}. Guides released: ${released.guides.length} (${releasedFile}).`);
}
