import { RecoveryScreen } from "../../../../../components/exception-screens";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <RecoveryScreen id={(await params).id} />;
}
