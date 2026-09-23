import { ReviewWorkspace } from "../../../../../components/review-workspace";
import { Suspense } from "react";
import "../../../../styles/sh-platform.css";
export default function Page() { return <Suspense fallback={<p role="status">Loading reviews…</p>}><ReviewWorkspace /></Suspense>; }
