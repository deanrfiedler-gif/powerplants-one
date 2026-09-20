import { Suspense } from "react";
import { EntryView } from "../../../../engineering/changes/components/client/entry-view";
// Entry to EN-07: choose a permitted Engineering package. No fixture is named here.
export default function Page() {
  return (
    <Suspense>
      <EntryView />
    </Suspense>
  );
}
