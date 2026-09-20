import { JobPackScreen } from "../../../../../documents/components/client/job-pack-screen";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <JobPackScreen id={id}/>;}
