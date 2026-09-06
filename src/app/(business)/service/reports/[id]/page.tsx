import { ReportScreen } from "../../../../../components/report-screens";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ReportScreen id={id}/>;}
