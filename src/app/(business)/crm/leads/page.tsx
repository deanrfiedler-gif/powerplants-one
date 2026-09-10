import { Suspense } from "react";
import { LeadsWorkspace } from "../../../../components/leads-workspace";
export default function Page(){return <Suspense fallback={<p>Loading leads…</p>}><LeadsWorkspace/></Suspense>;}
