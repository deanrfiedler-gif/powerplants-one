import { HandoverDetail } from "../../../../../../components/sales-handover";
export default async function Page({params}:{params:Promise<{id:string}>}){return <HandoverDetail id={(await params).id}/>;}
