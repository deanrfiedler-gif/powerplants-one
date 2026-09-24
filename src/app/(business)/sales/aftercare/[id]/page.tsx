import {AftercareDetail} from "../../../../../components/sales-aftercare";
export default async function Page({params}:{params:Promise<{id:string}>}){return <AftercareDetail id={(await params).id}/>;}
