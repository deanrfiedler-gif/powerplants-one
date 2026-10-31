import { Suspense } from "react";
import { ProposalRecord } from "../../../../../../documents/templates/proposal";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Suspense><ProposalRecord id={id}/></Suspense>;}
