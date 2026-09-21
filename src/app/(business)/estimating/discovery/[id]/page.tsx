import { DiscoveryDetail } from "../../../../../components/estimation-wizard";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <DiscoveryDetail id={id}/>;}
