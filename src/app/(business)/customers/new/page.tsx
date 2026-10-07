import { SharedCreateForm } from "../../../../components/shared-create-form";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const initial = await searchParams;
  return (
    <SharedCreateForm
      key={`${initial.kind ?? "customer"}:${initial.lead ?? ""}:${initial.person ?? ""}`}
      initial={initial}
    />
  );
}
