import { TicketCreate } from "../../../../../components/intake-screens";
export default async function Page({searchParams}:{searchParams:Promise<{site?:string}>}){return <TicketCreate siteId={(await searchParams).site}/>;}
