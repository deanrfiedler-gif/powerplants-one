import { PackScreen } from "../../../../../components/pack-screens";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <PackScreen id={id}/>;}
