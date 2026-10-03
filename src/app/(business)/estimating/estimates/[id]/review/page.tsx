import { EstimateReview } from "../../../../../../components/estimate-review";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <EstimateReview id={id}/>;}
