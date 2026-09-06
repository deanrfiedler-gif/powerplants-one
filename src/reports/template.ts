import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { canonical } from "../platform/operations";
import { digest } from "../documents/store";
import { reportTemplateDefinition } from "./render";

// The private prototype executes from its documented source checkout. Template
// identity covers the actual renderer/projection/escaping source bytes, not
// just a descriptive version label. Re-read at request and final release.
export async function currentReportTemplate() {
  const sources = [];
  for (const path of ["src/reports/render.ts", "src/documents/render.ts"]) {
    const bytes = await readFile(join(process.cwd(), path));
    sources.push({ path, sha256: digest(bytes), byte_count: bytes.length });
  }
  return canonical({ definition: reportTemplateDefinition, sources });
}
