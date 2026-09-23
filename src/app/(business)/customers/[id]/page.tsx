import { Suspense } from "react";
import { CustomerWorkspace } from "../../../../components/customer-workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <Suspense fallback={<p>Loading Customer 360…</p>}><CustomerWorkspace id={(await params).id} /></Suspense>;
}
