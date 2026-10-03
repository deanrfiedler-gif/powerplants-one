import { QuotationConversion } from "../../../../../../components/quotation-conversion";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QuotationConversion id={id} />;
}
