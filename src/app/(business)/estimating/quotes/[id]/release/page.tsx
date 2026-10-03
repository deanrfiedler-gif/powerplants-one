import {QuotationRelease} from "../../../../../../components/quotation-release";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <QuotationRelease id={id}/>;}
