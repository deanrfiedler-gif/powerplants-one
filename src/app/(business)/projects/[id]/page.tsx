import { ProjectSchedulePage } from "../../../../components/projects-screens";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  return <ProjectSchedulePage key={(await params).id} id={(await params).id} programme={(await searchParams).view === "programme"} />;
}
