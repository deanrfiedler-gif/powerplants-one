import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { canonical } from "../../platform/operations";
import { digest } from "../store";
import { rendererVersion } from "../render";
import {
  supportedTemplateDefinition as legacy,
  type OutputFamily,
} from "../p11-template";
import { bodyInput, hashInput, type ProposalBody } from "../drafts/validation";
import {
  object,
  uuid,
  version as positiveVersion,
} from "../../shared/validation";

export type Origin = {
  proposal_id: string;
  revision_id: string;
  content_hash: string;
};
export function publicationBody(value: unknown): ProposalBody {
  return bodyInput(value, "OUT-09");
}
export async function definition(
  version: number,
  body: ProposalBody,
  origin: Origin,
) {
  if (!Number.isSafeInteger(version) || version < 3)
    throw Error("Managed template version must be at least 3");
  const paths = [
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
  // Literal paths keep the Next.js file tracer bounded. No retained path is opened.
  const bytes = await Promise.all([
    readFile(join(process.cwd(), "src/documents/publication/definition.ts")),
    readFile(join(process.cwd(), "src/documents/publication/render.ts")),
    readFile(join(process.cwd(), "src/documents/render.ts")),
    readFile(join(process.cwd(), "src/documents/validation.ts")),
    readFile(join(process.cwd(), "src/documents/drafts/validation.ts")),
    readFile(join(process.cwd(), "src/shared/validation.ts")),
    readFile(join(process.cwd(), "src/platform/operations.ts")),
    readFile(join(process.cwd(), "src/platform/browser.ts")),
    readFile(join(process.cwd(), "public/brand/Roboto-variable.woff")),
    readFile(join(process.cwd(), "public/brand/Roboto-output-provenance.json")),
    readFile(
      join(process.cwd(), "public/brand/powerplants-logo-green-white.png"),
    ),
    readFile(join(process.cwd(), "package-lock.json")),
  ]);
  return canonical({
    family: "OUT-09",
    version,
    schema_version: 1,
    renderer: "DK06-OUT09-1",
    renderer_version: rendererVersion,
    body: publicationBody(body),
    origin,
    sources: paths.map((path, i) => ({
      path,
      sha256: digest(bytes[i]),
      byte_count: bytes[i].length,
    })),
  });
}
export function parseDefinition(text: string) {
  const d = object(JSON.parse(text), [
    "family",
    "version",
    "schema_version",
    "renderer",
    "renderer_version",
    "body",
    "origin",
    "sources",
  ]);
  if (
    d.family !== "OUT-09" ||
    d.schema_version !== 1 ||
    d.renderer !== "DK06-OUT09-1" ||
    d.renderer_version !== rendererVersion ||
    positiveVersion(d.version) < 3
  )
    throw Error("Unsupported managed template");
  const o = object(d.origin, ["proposal_id", "revision_id", "content_hash"]);
  return {
    version: d.version as number,
    body: publicationBody(d.body),
    origin: {
      proposal_id: uuid(o.proposal_id, "proposal_id"),
      revision_id: uuid(o.revision_id, "revision_id"),
      content_hash: hashInput(o.content_hash),
    },
  };
}
export async function supportedTemplateDefinition(
  family: OutputFamily,
  version: number,
  retained?: string,
): Promise<string | null> {
  if (version < 3) return legacy(family, version);
  if (family !== "OUT-09" || !retained) return null;
  let d;
  try {
    d = parseDefinition(retained);
  } catch {
    return null;
  }
  if (d.version !== version) return null;
  return definition(version, d.body, d.origin);
}
