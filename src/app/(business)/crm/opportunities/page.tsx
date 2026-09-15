import { SalesWorklist } from "../../../../components/crm-screens";
import { Suspense } from "react";
export default function Page() {return <Suspense fallback={<p role="status">Loading sales worklist…</p>}><SalesWorklist/></Suspense>;}
