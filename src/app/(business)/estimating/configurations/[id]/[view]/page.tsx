import { notFound } from "next/navigation";
import { views } from "../../../../../../estimating/specialist/definition";
export default async function Page({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  if (!views.includes(view as (typeof views)[number])) notFound();
  return null;
}
