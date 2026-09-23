import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { developmentRequest } from "../../../development/access";
import { buildCatalog } from "../../../development/catalog";
import { DesignSystem } from "../../../development/design-system";
export const dynamic = "force-dynamic";
export default async function ThemePage() {
  if (!developmentRequest(await headers())) notFound();
  const catalog = await buildCatalog(process.cwd());
  return (
    <DesignSystem
      tokens={catalog.tokens}
      consumers={catalog.entries
        .filter((e) => e.kind === "route")
        .map((e) => ({ key: e.key, title: e.title, path: e.path }))}
    />
  );
}
