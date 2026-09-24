import { Suspense } from "react";
import { ControlWorkspace } from "../../../../../../engineering/control/components/workspace";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Suspense><ControlWorkspace packageId={id} module="drawings" view="deliverables"/></Suspense>;}
