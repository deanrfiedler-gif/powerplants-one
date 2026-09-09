import { EmailCalendar } from "../../../components/email-screens";
import { isHostedDemo } from "../../../platform/demo-config";

export default async function Page({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const q = await searchParams;
  const defaultDay = isHostedDemo()
    ? new Date(Date.now() + 10 * 3600000).toISOString().slice(0, 10)
    : "2026-09-08";
  const day = q.day && /^\d{4}-\d{2}-\d{2}$/.test(q.day) && Number.isFinite(Date.parse(q.day)) ? q.day : defaultDay;
  return <EmailCalendar initialDay={day} />;
}
