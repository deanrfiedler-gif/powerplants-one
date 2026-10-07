import { Suspense } from "react";
import { NewOpportunity } from "../../../../../components/crm-screens";
export default function Page() {return <Suspense fallback={<p>Loading Deal capture…</p>}><NewOpportunity/></Suspense>;}
