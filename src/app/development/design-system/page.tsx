import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { developmentRequest } from "../../../development/access";
import { buildCatalog } from "../../../development/catalog";
import { buildComponentLibrary } from "../../../development/component-catalog";
import { ComponentCatalogue } from "../../../development/component-catalogue";
export const dynamic = "force-dynamic";
export default async function ThemePage({
  searchParams,
}: {
  searchParams: Promise<{ component?: string; state?: string; width?: string }>;
}) {
  if (!developmentRequest(await headers())) notFound();
  const catalog = await buildCatalog(process.cwd()),
    params = await searchParams;
  return (
    <ComponentCatalogue
      key={params.component ?? "sales-table"}
      library={await buildComponentLibrary(process.cwd(), catalog)}
      catalog={catalog}
      initialId={params.component}
      initialState={params.state}
      initialWidth={params.width}
    />
  );
}
