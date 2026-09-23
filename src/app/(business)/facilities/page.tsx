import { Suspense } from "react";
import { FacilityRegister } from "../../../components/facility-register";
export default function Page(){return <Suspense fallback={<p>Loading facilities…</p>}><FacilityRegister/></Suspense>;}
