import { Suspense } from "react";
import { FieldReadinessScreen } from "../../../../components/field-readiness-screen";
export default function Page() {
  return <Suspense fallback={<p>Loading Site readiness…</p>}><FieldReadinessScreen /></Suspense>;
}
