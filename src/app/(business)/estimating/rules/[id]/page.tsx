import { CpqRules } from "../../../../../components/cpq-rules";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CpqRules id={id} />;
}
