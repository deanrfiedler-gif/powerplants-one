import { TicketRecord } from "../../../../../service/components/client/ticket-record";
export default async function Page({params}:{params:Promise<{id:string}>}) {return <TicketRecord id={(await params).id}/>;}
