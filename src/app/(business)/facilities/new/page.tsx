import { FacilityFormEntry } from "../../../../components/facility-form";
export default async function Page({searchParams}:{searchParams:Promise<{site_id?:string}>}){const {site_id}=await searchParams;return <FacilityFormEntry siteId={site_id}/>;}
