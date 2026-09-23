import { Suspense } from "react";
import { SurveyRegister } from "../../../components/cs-workspace";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ site_id?: string }>;
}) {
  const q = await searchParams;
  return (
    <Suspense fallback={<p>Loading Site surveys…</p>}>
      <SurveyRegister siteId={q.site_id} />
    </Suspense>
  );
}
