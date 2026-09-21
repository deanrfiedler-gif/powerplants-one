import { AcceptanceWorkspace } from "../../../../../../projects/acceptance/workspace";
export default async function Page({params}:{params:Promise<{id:string}>}){return <AcceptanceWorkspace recordId={(await params).id}/>;}
