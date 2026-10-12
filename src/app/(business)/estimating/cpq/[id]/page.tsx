import { CpqConfigure } from "../../../../../components/cpq-configure";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CpqConfigure id={id} />;
}
