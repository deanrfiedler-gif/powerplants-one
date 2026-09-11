import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { canonical } from "../platform/operations";
import { digest } from "./store";
import { templateDefinition } from "./render";
import { currentReportTemplate } from "../reports/template";
import { currentFinanceTemplate } from "../finance/render";

export type OutputFamily = "OUT-09" | "OUT-10" | "OUT-14";
export const completionInstructions =
  "Use My Jobs to record your personal work and unresolved items. Wait for each local save to complete. Offline saves still need server acceptance; keep uncertain originals for unchanged retry. Submit the exact completion draft for factual review. Pack acknowledgement, attendance acceptance, customer response and Finance approval are separate decisions.";
export async function supportedTemplateDefinition(
  family: OutputFamily,
  version: number,
): Promise<string | null> {
  if (version === 1)
    return family === "OUT-09"
      ? templateDefinition
      : family === "OUT-10"
        ? currentReportTemplate()
        : currentFinanceTemplate();
  if (version !== 2) return null;
  const paths = [
    "src/documents/render.ts",
    "src/reports/render.ts",
    "src/finance/render.ts",
    "src/documents/p11-template.ts",
    "src/documents/p11-render.ts",
    "public/brand/Roboto-variable.ttf",
    "public/brand/Roboto-variable.woff",
    "public/brand/Roboto-output-provenance.json",
    "public/brand/powerplants-logo-green-white.png",
  ];
  const bytes = await Promise.all([
    readFile(join(process.cwd(), "src/documents/render.ts")),
    readFile(join(process.cwd(), "src/reports/render.ts")),
    readFile(join(process.cwd(), "src/finance/render.ts")),
    readFile(join(process.cwd(), "src/documents/p11-template.ts")),
    readFile(join(process.cwd(), "src/documents/p11-render.ts")),
    readFile(join(process.cwd(), "public/brand/Roboto-variable.ttf")),
    readFile(join(process.cwd(), "public/brand/Roboto-variable.woff")),
    readFile(join(process.cwd(), "public/brand/Roboto-output-provenance.json")),
    readFile(
      join(process.cwd(), "public/brand/powerplants-logo-green-white.png"),
    ),
  ]);
  const sources = paths.map((path, i) => ({
    path,
    sha256: digest(bytes[i]),
    byte_count: bytes[i].length,
  }));
  return canonical({
    family,
    version: 2,
    definition:
      "P11 self-contained branded semantic HTML and A4; complete original Roboto and intact logo; navy/green/white; exact original source and review; reserved preparation distinct from release; no external requests, operational use or customer distribution; tagged PDF requested, no PDF/UA claim",
    completion_instructions:
      family === "OUT-09" ? completionInstructions : null,
    sources,
  });
}
