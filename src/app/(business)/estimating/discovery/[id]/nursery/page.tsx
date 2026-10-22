import { NurseryScreen } from "../../../../../../estimating/nursery-automation/screen";
export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  return <NurseryScreen id={id}/>;
}
