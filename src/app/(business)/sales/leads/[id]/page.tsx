import { Suspense } from "react";
import { LeadsWorkspace } from "../../../../../components/leads-workspace";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Suspense fallback={<p>Loading lead…</p>}><LeadsWorkspace leadId={id}/></Suspense>;}
