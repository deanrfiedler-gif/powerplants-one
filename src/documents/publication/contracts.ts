import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { AppError } from "../../platform/errors";
import { canonical } from "../../platform/operations";
import type { QueryClient } from "../../platform/permissions";
import {
  object,
  uuid,
  version as positiveVersion,
} from "../../shared/validation";
import { bodyInput, hashInput, type ProposalBody } from "../drafts/validation";
import type { OutputFamily } from "../p11-template";
import { rendererVersion, type PackSnapshot } from "../render";
import { digest } from "../store";
import * as retained from "./definition";
import * as retainedRender from "./render";
import { renderHtml, renderOutput } from "./dk06-out09-2";

// Renderer contracts for managed (v3+) OUT-09 definitions. DK06-OUT09-1 keeps
// its own modules (./definition, ./render) byte for byte, because its manifest
// fingerprints them; this dispatcher is in no manifest. A DK06-OUT09-2
// definition fingerprints only what shapes the output and names its Playwright
// versions. Its builder needs no fingerprint: support recomputes the exact
// canonical text and re-parses the body. See
// docs/decisions/template-renderer-manifest.md.
export const currentRenderer = "DK06-OUT09-2";
export type Renderer = "DK06-OUT09-1" | typeof currentRenderer;
export type Origin = retained.Origin;
type Snapshot = PackSnapshot & {
  template: PackSnapshot["template"] & { definition?: string };
};

async function sources() {
  const paths = [
    "src/documents/publication/dk06-out09-2.ts",
    "src/documents/render.ts",
    "src/documents/validation.ts",
    "public/brand/Roboto-variable.woff",
    "public/brand/Roboto-output-provenance.json",
    "public/brand/powerplants-logo-green-white.png",
  ];
  // Literal paths keep the Next.js file tracer bounded. No retained path is opened.
  const bytes = await Promise.all([
    readFile(join(process.cwd(), "src/documents/publication/dk06-out09-2.ts")),
    readFile(join(process.cwd(), "src/documents/render.ts")),
    readFile(join(process.cwd(), "src/documents/validation.ts")),
    readFile(join(process.cwd(), "public/brand/Roboto-variable.woff")),
    readFile(join(process.cwd(), "public/brand/Roboto-output-provenance.json")),
    readFile(
      join(process.cwd(), "public/brand/powerplants-logo-green-white.png"),
    ),
  ]);
  return paths.map((path, i) => ({
    path,
    sha256: digest(bytes[i]),
    byte_count: bytes[i].length,
  }));
}
async function dependencies() {
  const lock = JSON.parse(
    await readFile(join(process.cwd(), "package-lock.json"), "utf8"),
  );
  return ["playwright", "playwright-core"].map((name) => {
    const version = lock?.packages?.[`node_modules/${name}`]?.version;
    if (typeof version !== "string" || !version)
      throw Error(`Renderer dependency ${name} is not resolved`);
    return { name, version };
  });
}
// Populated-upgrade fixtures still publish before migration 0103 names the
// current contract; that schema accepts only the retained DK06-OUT09-1.
export async function publicationRenderer(c: QueryClient): Promise<Renderer> {
  if (
    !(
      await c.query(
        "SELECT to_regprocedure('ppo.template_publication_renderer()') AS name",
      )
    ).rows[0].name
  )
    return "DK06-OUT09-1";
  const renderer = (
    await c.query("SELECT ppo.template_publication_renderer() AS renderer")
  ).rows[0].renderer;
  if (renderer !== currentRenderer)
    throw Error("Unsupported publication renderer contract");
  return renderer;
}
export async function definition(
  renderer: Renderer,
  version: number,
  body: ProposalBody,
  origin: Origin,
) {
  if (renderer === "DK06-OUT09-1")
    return retained.definition(version, body, origin);
  if (!Number.isSafeInteger(version) || version < 3)
    throw Error("Managed template version must be at least 3");
  const [manifest, versions] = await Promise.all([sources(), dependencies()]);
  return canonical({
    family: "OUT-09",
    version,
    schema_version: 1,
    renderer: currentRenderer,
    renderer_version: rendererVersion,
    dependencies: versions,
    body: bodyInput(body, "OUT-09"),
    origin,
    sources: manifest,
  });
}
export function parseDefinition(text: string): {
  renderer: Renderer;
  version: number;
  body: ProposalBody;
  origin: Origin;
} {
  const raw: unknown = JSON.parse(text);
  if ((raw as { renderer?: unknown } | null)?.renderer === "DK06-OUT09-1")
    return { renderer: "DK06-OUT09-1", ...retained.parseDefinition(text) };
  const d = object(raw, [
    "family",
    "version",
    "schema_version",
    "renderer",
    "renderer_version",
    "dependencies",
    "body",
    "origin",
    "sources",
  ]);
  if (
    d.family !== "OUT-09" ||
    d.schema_version !== 1 ||
    d.renderer !== currentRenderer ||
    d.renderer_version !== rendererVersion ||
    positiveVersion(d.version) < 3
  )
    throw Error("Unsupported managed template");
  const o = object(d.origin, ["proposal_id", "revision_id", "content_hash"]);
  return {
    renderer: currentRenderer,
    version: d.version as number,
    body: bodyInput(d.body, "OUT-09"),
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
  text?: string,
): Promise<string | null> {
  if (version < 3 || family !== "OUT-09" || !text)
    return retained.supportedTemplateDefinition(family, version, text);
  let d;
  try {
    d = parseDefinition(text);
  } catch {
    return null;
  }
  if (d.renderer === "DK06-OUT09-1")
    return retained.supportedTemplateDefinition(family, version, text);
  if (d.version !== version) return null;
  return definition(d.renderer, version, d.body, d.origin);
}
// Legacy and DK06-OUT09-1 snapshots go to the retained renderer, which applies
// its own support checks; a DK06-OUT09-2 definition must be exactly supported.
async function current(s: Snapshot) {
  if (s.template.version < 3) return null;
  const text = s.template.definition;
  let renderer: unknown;
  try {
    renderer = text ? JSON.parse(text)?.renderer : undefined;
  } catch {
    renderer = undefined;
  }
  if (renderer === "DK06-OUT09-1") return null;
  if (
    !text ||
    digest(text) !== s.template.hash ||
    (await supportedTemplateDefinition("OUT-09", s.template.version, text)) !==
      text ||
    s.template.renderer_version !== rendererVersion
  )
    throw new AppError(
      409,
      "StaleTemplate",
      "The exact published definition and renderer dependencies are required.",
    );
  return parseDefinition(text);
}
export async function supportedPackHtml(
  s: Snapshot,
  output?: { prepared_at: string; issue_id: string },
) {
  const d = await current(s);
  return d
    ? renderHtml(s, d.body, output)
    : retainedRender.supportedPackHtml(s, output);
}
export async function supportedRenderPack(
  s: Snapshot,
  output: { prepared_at: string; issue_id: string },
) {
  const d = await current(s);
  return d
    ? renderOutput(s, d.body, output)
    : retainedRender.supportedRenderPack(s, output);
}
