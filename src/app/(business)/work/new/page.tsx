import { ActivityCreate } from "../../../../components/activity-screens";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string>>}){return <ActivityCreate initial={await searchParams}/>;}
