import { Suspense } from "react";
import { LibraryRegister } from "../../../components/library-register";
export default function Page() { return <Suspense fallback={<p>Loading document library…</p>}><LibraryRegister /></Suspense>; }
