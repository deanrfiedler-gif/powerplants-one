import { performance } from "node:perf_hooks";
import { mkdir, writeFile } from "node:fs/promises";
import { capacityWorkbook } from "../tests/helpers/excel-capacity";
import { unitTarget, nativeWorkbook } from "../tests/helpers/excel-review";
import { workbookBytes } from "../tests/helpers/excel-workbook";
import { readWorkbook } from "../src/estimating/import/reader";
import { reviewWorkbook } from "../src/estimating/import/review";
const samples = [];
for (const count of [100, 250, 500, 501]) {
  const target = unitTarget(),
    parts = nativeWorkbook(target);
  capacityWorkbook(parts, count);
  const bytes = workbookBytes(parts);
  for (let run = 0; run < 3; run++) {
    const start = performance.now();
    try {
      const book = await readWorkbook(bytes, "SYN-capacity.xlsx");
      const parsed = performance.now();
      const review = reviewWorkbook(book, target, "2026-10-14");
      samples.push({
        count,
        run,
        bytes: bytes.length,
        parse_ms: Math.round(parsed - start),
        review_ms: Math.round(performance.now() - parsed),
        receiver_bytes: review.receiver_bytes_upper_bound,
        review_bytes: Buffer.byteLength(JSON.stringify(review)),
        valid: review.validation_passed,
        issues: review.issues
          .filter((i) => i.severity === "Error")
          .map((i) => i.code),
        rss: process.memoryUsage().rss,
      });
    } catch (e) {
      samples.push({
        count,
        run,
        bytes: bytes.length,
        ms: Math.round(performance.now() - start),
        refused: (e as Error).message,
        rss: process.memoryUsage().rss,
      });
    }
  }
}
await mkdir("verification-evidence/excel-capacity", { recursive: true });
await writeFile(
  `verification-evidence/excel-capacity/${process.argv[2] ?? "profile"}.json`,
  JSON.stringify({ node: process.version, samples }, null, 2),
);
console.log(JSON.stringify(samples, null, 2));
