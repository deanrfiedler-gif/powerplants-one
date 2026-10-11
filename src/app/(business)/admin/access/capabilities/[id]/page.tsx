import { AccessCapabilityScreen } from "../../../../../../access/catalogue-screens";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <AccessCapabilityScreen capability={(await params).id} />;
}
