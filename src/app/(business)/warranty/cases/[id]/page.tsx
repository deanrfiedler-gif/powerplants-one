import { Suspense } from "react";
import { MaintenanceRecord } from "../../../../../components/maintenance-workspace";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Suspense fallback={<p>Loading record?</p>}><MaintenanceRecord family="cases" id={id} /></Suspense>;}
