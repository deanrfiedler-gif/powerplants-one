import { Suspense } from "react";
import { TicketRegister } from "../../../../service/components/client/ticket-register";
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Loading permitted requests…</p>}>
      <TicketRegister />
    </Suspense>
  );
}
