import { EmailCalendar } from "../../../components/email-screens";
export default async function Page({searchParams}:{searchParams:Promise<{day?:string}>}){const q=await searchParams;const day=q.day&&/^\d{4}-\d{2}-\d{2}$/.test(q.day)&&Number.isFinite(Date.parse(q.day))?q.day:"2026-09-08";return <EmailCalendar initialDay={day}/>;}
