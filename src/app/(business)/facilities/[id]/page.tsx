import { FacilityDetail } from "../../../../components/facility-detail";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <FacilityDetail id={id}/>;}
