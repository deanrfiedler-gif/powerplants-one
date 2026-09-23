import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { developmentRequest } from "../../../development/access";
import { developmentCatalog, developmentComponents } from "../../../development/runtime";
import { ComponentCatalogue } from "../../../development/component-catalogue";
export const dynamic = "force-dynamic";
export default async function ThemePage({
  searchParams,
}: {
  searchParams: Promise<{ component?: string; state?: string; width?: string }>;
}) {
  if (!(await developmentRequest(await headers()))) notFound();
  const catalog = await developmentCatalog(),
    params = await searchParams;
  return (
    <ComponentCatalogue
      key={params.component ?? "sales-table"}
      library={await developmentComponents(catalog)}
      catalog={catalog}
      initialId={params.component}
      initialState={params.state}
      initialWidth={params.width}
    />
  );
}
