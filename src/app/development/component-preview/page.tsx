import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { developmentRequest } from "../../../development/access";
import { developmentPreview } from "../../../development/runtime";
import { ExampleDocument } from "../../../development/component-examples";
export const dynamic = "force-dynamic";
export default async function ComponentPreview({
  searchParams,
}: {
  searchParams: Promise<{ component?: string; state?: string }>;
}) {
  if (!(await developmentRequest(await headers()))) notFound();
  const catalog = await developmentPreview(),
    query = await searchParams,
    entry = catalog.entries.find(
      (e) => e.id === query.component,
    );
  if (
    !entry?.example ||
    !entry.states.some((s) => s.id === (query.state ?? entry.states[0]?.id))
  )
    notFound();
  return (
    <ExampleDocument
      id={entry.example}
      state={query.state ?? entry.states[0].id}
      tokens={catalog.tokens}
    />
  );
}
