import { ResourceWorkspaceScreen } from "../../../../../scheduling/components/client/resource-workspace.client";
export default async function Page({ params }: {params:Promise<{id:string}>}) { const {id}=await params; return <ResourceWorkspaceScreen id={id}/>; }
