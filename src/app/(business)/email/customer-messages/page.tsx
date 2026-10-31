import { Suspense } from "react";
import { CustomerMessages } from "../../../../components/customer-messages";
export default function Page() {
  return (
    <Suspense fallback={<p>Loading customer messages…</p>}>
      <CustomerMessages />
    </Suspense>
  );
}
