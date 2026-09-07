import { FinanceDetail } from "../../../../../components/finance-screens";
export default async function Page({params}:{params:Promise<{id:string}>}){return <FinanceDetail id={(await params).id}/>;}
