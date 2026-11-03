import { Suspense } from "react";
import { LibraryRecord } from "../../../../../components/library-record";
export default async function Page({params}:{params:Promise<{id:string}>}) { const {id}=await params; return <Suspense fallback={<p>Loading document…</p>}><LibraryRecord id={id}/></Suspense>; }
