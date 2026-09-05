import { ContextDetail } from "../../../../components/context-screens";
export default async function Page({params}:{params:Promise<{id:string}>}){return <ContextDetail kind="Person" id={(await params).id}/>;}
