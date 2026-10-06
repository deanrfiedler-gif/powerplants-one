import { Suspense } from "react";
import { SupplyWorkspacePage } from "../../../../supply/components/workspace";
export default function Page() {
  return (
    <Suspense fallback={<p>Loading Supply Chain…</p>}>
      <SupplyWorkspacePage slug="returns" />
    </Suspense>
  );
}
