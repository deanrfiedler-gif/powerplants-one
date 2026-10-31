import { CommercialRecord } from "../../../../../../projects/commercial/ui-record";
export default async function Page({params}:{params:Promise<{id:string;entry:string}>}) { const {id,entry}=await params; return <CommercialRecord key={`${id}:${entry}`} project={id} entry={entry}/>; }
