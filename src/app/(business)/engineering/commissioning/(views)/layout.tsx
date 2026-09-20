import { Suspense } from "react";
import { CommissioningShell } from "../../../../../engineering/commissioning/components/client/commissioning-shell";
// EN-08 Commissioning Basis & As-Built Release. Six route-backed destinations at static addresses share this secondary
// menu, context row and scroll surface. /engineering, /engineering/:id, EN-06 and EN-07 sit outside it and are unchanged.
export default function CommissioningLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <CommissioningShell>{children}</CommissioningShell>
    </Suspense>
  );
}
