import { Suspense } from "react";
import { NewWorkOrder } from "../../../../../components/work-order-screens";
export default function Page(){return <Suspense fallback={<p>Loading draft context…</p>}><NewWorkOrder/></Suspense>;}
