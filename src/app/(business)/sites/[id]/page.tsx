import "../../../styles/sites.css";
import { SiteWorkspace } from "../../../../components/site-workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <SiteWorkspace id={(await params).id} />;
}
