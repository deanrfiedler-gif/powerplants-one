import { Suspense } from "react";
import { ExcelImport } from "../../../../components/excel-import";
export default function Page() {
  return (
    <Suspense fallback={<p>Loading Excel import…</p>}>
      <ExcelImport />
    </Suspense>
  );
}
