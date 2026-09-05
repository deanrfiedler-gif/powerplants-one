import { SharedCreateForm } from "../../../../components/shared-create-form";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  return <SharedCreateForm initial={await searchParams} />;
}
