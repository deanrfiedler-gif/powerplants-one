import { Suspense } from "react";
import { EquipmentWorkspace } from "../../../../components/equipment-workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p>Loading equipment…</p>}>
      <EquipmentWorkspace key={id} id={id} />
    </Suspense>
  );
}
