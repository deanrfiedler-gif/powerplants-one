import { Suspense } from "react";
import { EquipmentEvidencePortfolio } from "../../../../components/equipment-evidence";
export default function Page() { return <Suspense fallback={<p>Loading Equipment evidence…</p>}><EquipmentEvidencePortfolio kind="backups"/></Suspense>; }
