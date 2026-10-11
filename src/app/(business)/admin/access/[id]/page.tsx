import { AccessPersonScreen } from "../../../../../access/screens";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AccessPersonScreen id={id} />;
}
