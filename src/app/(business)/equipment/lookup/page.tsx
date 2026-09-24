import { Suspense } from "react";
import { EquipmentLookup } from "../../../../components/equipment-lookup";
export default function Page() { return <Suspense fallback={<p>Loading lookup…</p>}><EquipmentLookup /></Suspense>; }
