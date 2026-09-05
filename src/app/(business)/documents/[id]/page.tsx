import { DocumentScreen } from "../../../../components/pack-screens";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <DocumentScreen id={id}/>;}
