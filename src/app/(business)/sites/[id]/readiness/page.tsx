import { Suspense } from "react";
import { CsLanding } from "../../../../../components/cs-workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p>Loading Site readiness…</p>}>
      <CsLanding kind="Readiness" contextId={id} />
    </Suspense>
  );
}
