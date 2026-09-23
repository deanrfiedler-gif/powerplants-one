import { Suspense } from "react";
import { CsWorkspace } from "../../../../components/cs-workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p>Loading survey…</p>}>
      <CsWorkspace kind="Survey" id={id} />
    </Suspense>
  );
}
