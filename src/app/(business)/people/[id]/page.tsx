import { Suspense } from "react";
import { ContactWorkspacePage } from "../../../../components/contact-workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <Suspense fallback={<p>Loading contact…</p>}><ContactWorkspacePage id={(await params).id} /></Suspense>;
}
