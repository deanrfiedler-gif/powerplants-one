import { ContextDetail } from "../../../../components/context-screens";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ContextDetail kind="Asset" id={(await params).id} />;
}
