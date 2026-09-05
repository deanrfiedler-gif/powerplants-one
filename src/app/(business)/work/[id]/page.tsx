import { ActivityDetail } from "../../../../components/activity-screens";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ActivityDetail id={(await params).id} />;
}
