import { ProjectSchedulePage } from "../../../../components/projects-screens";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ProjectSchedulePage key={(await params).id} id={(await params).id} />;
}
