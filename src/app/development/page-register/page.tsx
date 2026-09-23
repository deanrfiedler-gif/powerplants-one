import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { developmentRequest } from "../../../development/access";
import { developmentCatalog } from "../../../development/runtime";
import { DevelopmentWorkspace } from "../../../development/workspace";
export const dynamic = "force-dynamic";
export default async function DevelopmentRegister({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; entry?: string }>;
}) {
  if (!(await developmentRequest(await headers()))) notFound();
  const params = await searchParams;
  return (
    <DevelopmentWorkspace
      key={(params.view || "") + ":" + (params.entry || "")}
      initial={await developmentCatalog()}
      initialView={params.view}
      initialEntry={params.entry}
    />
  );
}
