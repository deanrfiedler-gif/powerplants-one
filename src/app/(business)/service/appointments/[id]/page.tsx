import { AppointmentScreen } from "../../../../../scheduling";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AppointmentScreen id={id} />;
}
