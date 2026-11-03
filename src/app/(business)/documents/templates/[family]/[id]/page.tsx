import { notFound } from "next/navigation";
import { DefinitionRecord } from "../../../../../../documents/templates/definition";
import { familyOf } from "../../../../../../documents/templates/types";
export default async function Page({params,searchParams}:{params:Promise<{family:string;id:string}>;searchParams:Promise<{tab?:string}>}){const p=await params,q=await searchParams,family=familyOf(p.family);if(!family)notFound();return <DefinitionRecord key={`${p.id}:${q.tab??""}`} family={family} id={p.id} initialTab={q.tab}/>;}
