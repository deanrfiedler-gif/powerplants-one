import { Suspense } from "react";
import { TicketCreatePage } from "../../../../../service/components/client/ticket-create";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; site_id?:string }>;
}) {
  const query=await searchParams;
  return (
    <Suspense fallback={<p>Loading Service intake…</p>}>
      <TicketCreatePage siteId={query.site_id??query.site} />
    </Suspense>
  );
}
