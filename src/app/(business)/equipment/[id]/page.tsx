import { Suspense } from "react";
import { EquipmentWorkspace } from "../../../../components/equipment-workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <Suspense fallback={<p>Loading equipment…</p>}><EquipmentWorkspace id={(await params).id} /></Suspense>;
}
