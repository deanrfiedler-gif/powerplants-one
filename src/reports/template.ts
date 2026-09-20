import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { canonical } from "../platform/operations";
import { digest } from "../documents/store";
import { reportTemplateDefinition } from "./render";

// The private prototype executes from its documented source checkout. Template
// identity covers the actual renderer/projection/escaping source bytes, not
// just a descriptive version label. Re-read at request and final release.
export async function currentReportTemplate() {
  // Keep the two paths literal so the compiler does not trace every file in
  // the checkout (including ignored worktrees). Order and hashed bytes remain
  // identical to the original template contract.
  const bytes = await Promise.all([
    readFile(join(process.cwd(), "src/reports/render.ts")),
    readFile(join(process.cwd(), "src/documents/render.ts")),
  ]);
  const sources = ["src/reports/render.ts", "src/documents/render.ts"].map(
    (path, i) => ({
      path,
      sha256: digest(bytes[i]),
      byte_count: bytes[i].length,
    }),
  );
  return canonical({ definition: reportTemplateDefinition, sources });
}
