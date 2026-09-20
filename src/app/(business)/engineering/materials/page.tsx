import { Suspense } from "react";
import { EntryView } from "../../../../engineering/materials/components/client/entry-view";
// Entry to EN-06: choose a permitted Engineering package. No fixture is named here.
export default function Page() {
  return (
    <Suspense>
      <EntryView />
    </Suspense>
  );
}
