import { Suspense } from "react";
import { EquipmentRegister } from "../../../components/equipment-workspace";
export default function Page() {
  return <Suspense fallback={<p>Loading equipment…</p>}><EquipmentRegister /></Suspense>;
}
