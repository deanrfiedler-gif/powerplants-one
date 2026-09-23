// Request-time adapters keep filesystem/Git reads local and immutable build data hosted.
import { buildCatalog, guideDocument, readGuides, readReference } from "./catalog";
import { buildComponentLibrary, readComponentManifest } from "./component-catalog";
import { readDevelopmentSnapshot, type DevelopmentSnapshot } from "./snapshot";
let hosted: Promise<DevelopmentSnapshot> | undefined;
function snapshot() {
  hosted ??= readDevelopmentSnapshot(process.cwd(), process.env.PPO_BUILD_COMMIT).catch(error => {
    hosted = undefined;
    throw error;
  });
  return hosted;
}
export async function developmentCatalog() {
  if (process.env.PPO_ENV !== "azure-demo") return buildCatalog(process.cwd());
  const value = (await snapshot()).catalog;
  return { ...value, live_base: process.env.PPO_DEMO_ORIGIN! };
}
export async function developmentComponents(catalog: Awaited<ReturnType<typeof developmentCatalog>>) {
  return process.env.PPO_ENV === "azure-demo" ? (await snapshot()).components : buildComponentLibrary(process.cwd(), catalog);
}
export async function developmentGuide(key: string) {
  if (process.env.PPO_ENV === "azure-demo") return (await snapshot()).guides.find(g => g.guide_key === key);
  const guide = (await readGuides(process.cwd())).find(g => g.guide_key === key);
  return guide ? guideDocument(process.cwd(), guide) : undefined;
}
export async function developmentPreview() {
  if (process.env.PPO_ENV === "azure-demo") {
    const value = await snapshot();
    return { entries: value.components.entries, tokens: value.catalog.tokens };
  }
  const css = (await readReference(process.cwd(), "src/app/globals.css")).toString();
  const tokens = [...(css.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? "").matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(m => ({ name: m[1], value: m[2].trim() }));
  return { entries: (await readComponentManifest(process.cwd())).entries, tokens };
}
