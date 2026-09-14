import { DiscoveryCosting } from "../../../../../../components/discovery-costing";
export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  return <DiscoveryCosting id={id}/>;
}
