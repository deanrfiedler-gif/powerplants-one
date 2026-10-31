import { Suspense } from "react";
import { CustomerMessages } from "../../../../../components/customer-messages";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p>Loading customer message…</p>}>
      <CustomerMessages id={id} />
    </Suspense>
  );
}
