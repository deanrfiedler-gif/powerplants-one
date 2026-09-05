import { TicketDetail } from "../../../../../components/intake-screens";
export default async function Page({params}:{params:Promise<{id:string}>}){return <TicketDetail id={(await params).id}/>;}
