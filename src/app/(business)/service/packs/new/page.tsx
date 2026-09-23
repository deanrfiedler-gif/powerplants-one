import { NewJobPackScreen } from "../../../../../documents/components/client/job-pack-screen";
export default async function Page({searchParams}:{searchParams:Promise<{appointment_id:string}>}){const {appointment_id}=await searchParams;return <NewJobPackScreen appointmentId={appointment_id}/>;}
