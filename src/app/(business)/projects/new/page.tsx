import { Suspense } from "react";
import { NewProject } from "../../../../components/projects-screens";
export default function Page() {
  return (
    <Suspense fallback={<p>Loading project creation…</p>}>
      <NewProject />
    </Suspense>
  );
}
