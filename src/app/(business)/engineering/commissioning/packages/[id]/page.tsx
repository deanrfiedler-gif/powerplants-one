import { Suspense } from "react";
import { RecordView } from "../../../../../../../../engineering/commissioning/components/client/record-view";
// The full record of one commissioning package, with section deep links (#basis, #results, #configuration, #release,
// #handover, #history). The address names the commissioning package only; its Engineering package is resolved on the
// server behind the same access check as every other read.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <RecordView id={id} />
    </Suspense>
  );
}
