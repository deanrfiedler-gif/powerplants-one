import { NewPackScreen } from "../../../../../components/pack-screens";
export default async function Page({searchParams}:{searchParams:Promise<{appointment_id:string}>}){const {appointment_id}=await searchParams;return <NewPackScreen appointmentId={appointment_id}/>;}
