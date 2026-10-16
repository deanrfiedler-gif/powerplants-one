import { EmailCalendar } from "../../../components/email-screens";
import { calendarToday } from "../../../email/service";

export default async function Page({ searchParams }: { searchParams: Promise<{ day?: string; scope?: string }> }) {
  const q = await searchParams;
  // Without a requested day the calendar opens on today in Brisbane, locally as in the hosted demo.
  const day = q.day && /^\d{4}-\d{2}-\d{2}$/.test(q.day) && Number.isFinite(Date.parse(q.day)) ? q.day : await calendarToday();
  return <EmailCalendar key={`${day}:${q.scope}`} initialDay={day} sales={q.scope === "sales"} />;
}
