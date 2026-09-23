import { Suspense } from "react";
import { StakeholderWorkspace } from "../../../../../components/contact-workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p>Loading relationships…</p>}>
      <StakeholderWorkspace id={(await params).id} />
    </Suspense>
  );
}
