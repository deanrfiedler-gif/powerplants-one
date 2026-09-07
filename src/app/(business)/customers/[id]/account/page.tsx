import { AccountScreen } from "../../../../../components/finance-screens";
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{account_id?:string}>}){return <AccountScreen customerId={(await params).id} accountId={(await searchParams).account_id??""}/>;}
