import { AccessPersonScreen } from "../../../../../access/screens";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const value = (key: string) =>
    typeof query[key] === "string" ? query[key] : undefined;
  return (
    <AccessPersonScreen
      id={id}
      initial={{
        capability: value("capability"),
        company_id: value("company_id"),
        site_id: value("site_id"),
      }}
    />
  );
}
