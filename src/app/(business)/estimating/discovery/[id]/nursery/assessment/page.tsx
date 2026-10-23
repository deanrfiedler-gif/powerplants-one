import { AssessmentScreen } from "../../../../../../../estimating/nursery-automation/assessment-screen";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AssessmentScreen id={id} />;
}
