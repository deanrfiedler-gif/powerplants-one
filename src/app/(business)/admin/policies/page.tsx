import { BusinessPoliciesRegister } from "../../../../admin/settings-screen";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  return (
    <BusinessPoliciesRegister waitingOnly={state === "waiting-to-publish"} />
  );
}
