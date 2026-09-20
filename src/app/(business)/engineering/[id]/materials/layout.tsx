import { Suspense } from "react";
import { MaterialsShell } from "../../../../../engineering/materials/components/client/materials-shell";
// EN-06 Released Materials & Substitutions. The six destinations of one Engineering package share this secondary
// menu, context row and scroll surface. /engineering and /engineering/:id sit outside it and are unchanged.
export default async function MaterialsLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <MaterialsShell packageId={id}>{children}</MaterialsShell>
    </Suspense>
  );
}
