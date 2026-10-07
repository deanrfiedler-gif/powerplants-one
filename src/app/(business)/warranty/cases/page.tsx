import { Suspense } from "react";
import { MaintenanceRegister } from "../../../../components/maintenance-workspace";
export default function Page(){return <Suspense fallback={<p>Loading permitted records?</p>}><MaintenanceRegister family="cases" /></Suspense>;}
