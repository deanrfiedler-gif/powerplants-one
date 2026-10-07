import { Suspense } from "react";
import { TicketCreate } from "../../../../../components/intake-screens";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>;
}) {
  return (
    <Suspense fallback={<p>Loading Service intake…</p>}>
      <TicketCreate siteId={(await searchParams).site} />
    </Suspense>
  );
}
