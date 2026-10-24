import { Suspense } from "react";
import { OutputsRegisterScreen } from "../../../../components/output-register";
export default function Page() { return <Suspense fallback={<p role="status">Loading Outputs…</p>}><OutputsRegisterScreen/></Suspense>; }
