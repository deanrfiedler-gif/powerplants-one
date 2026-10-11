import { AccessRoleComparisonScreen } from "../../../../../../access/role-screens";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AccessRoleComparisonScreen id={id} />;
}
