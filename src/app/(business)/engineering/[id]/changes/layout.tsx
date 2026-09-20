import { Suspense } from "react";
import { ChangesShell } from "../../../../../engineering/changes/components/client/changes-shell";
// EN-07 Engineering Change-Impact Review. The six destinations of one Engineering package share this secondary
// menu, context row and scroll surface. /engineering, /engineering/:id and EN-06 sit outside it and are unchanged.
export default async function ChangesLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <ChangesShell packageId={id}>{children}</ChangesShell>
    </Suspense>
  );
}
