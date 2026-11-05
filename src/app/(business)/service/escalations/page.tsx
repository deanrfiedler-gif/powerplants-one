import { Suspense } from "react";
import { EscalationsScreen } from "../../../../components/service-escalations";
export default function EscalationsPage() { return <Suspense fallback={<p>Loading permitted cases… Current results unconfirmed.</p>}><EscalationsScreen/></Suspense>; }
