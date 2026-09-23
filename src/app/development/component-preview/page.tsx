import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { developmentRequest } from "../../../development/access";
import { readComponentManifest } from "../../../development/component-catalog";
import { readReference } from "../../../development/catalog";
import { ExampleDocument } from "../../../development/component-examples";
export const dynamic = "force-dynamic";
export default async function ComponentPreview({
  searchParams,
}: {
  searchParams: Promise<{ component?: string; state?: string }>;
}) {
  if (!developmentRequest(await headers())) notFound();
  const query = await searchParams,
    entry = (await readComponentManifest(process.cwd())).entries.find(
      (e) => e.id === query.component,
    );
  if (
    !entry?.example ||
    !entry.states.some((s) => s.id === (query.state ?? entry.states[0]?.id))
  )
    notFound();
  const css = (
    await readReference(process.cwd(), "src/app/globals.css")
  ).toString();
  const tokens = [
    ...(css.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? "").matchAll(
      /(--[\w-]+)\s*:\s*([^;]+);/g,
    ),
  ].map((m) => ({ name: m[1], value: m[2].trim() }));
  return (
    <ExampleDocument
      id={entry.example}
      state={query.state ?? entry.states[0].id}
      tokens={tokens}
    />
  );
}
