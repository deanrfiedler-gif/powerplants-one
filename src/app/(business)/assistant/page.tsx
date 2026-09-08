import { AssistantScreen } from '../../../components/assistant-screen';
export default async function Page({searchParams}:{searchParams:Promise<{proposal?:string}>}) {
  const params = await searchParams;
  return <AssistantScreen initialProposal={params.proposal ?? ''} />;
}
