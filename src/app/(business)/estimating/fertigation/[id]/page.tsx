import { FertigationWorkspace } from "../../../../../components/fertigation-workbench";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <FertigationWorkspace id={id} />; }
