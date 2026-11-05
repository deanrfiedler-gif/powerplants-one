import { mkdir, writeFile } from "node:fs/promises";
import { excelImportSetup } from "./excel-import";
import { nativeWorkbook, setCell } from "./excel-review";
import { workbookBytes } from "./excel-workbook";
import { changedWorkbook } from "./excel-reimport";
import { fxSetup } from "./excel-fx";
import { pricingSource } from "./excel-source-pricing";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
try {
  if (process.argv.includes("--pricing")) {
    const fx = await fxSetup(3);
    await mkdir("tmp/excel-import-ui", { recursive: true });
    await writeFile(
      "tmp/excel-import-ui/pricing-fixture.json",
      JSON.stringify(
        {
          route: `/estimating/import?estimate=${fx.e.id}&version=${fx.e.saved.id}&mode=pricing`,
          source: fx.source.reference,
          source_id: fx.source.id,
          source_revision_id: fx.source.revision.id,
        },
        null,
        2,
      ),
    );
  } else {
    const setup = await excelImportSetup();
    const source = await pricingSource(setup.p, "ea");
    const blocked = nativeWorkbook(setup.context.target);
    setCell(blocked, 5, "G6", null);
    const revised = nativeWorkbook(setup.context.target);
    changedWorkbook(revised);
    await mkdir("tmp/excel-import-ui", { recursive: true });
    await writeFile(
      "tmp/excel-import-ui/ready.xlsx",
      Buffer.from(setup.upload.file.base64, "base64"),
    );
    await writeFile("tmp/excel-import-ui/blocked.xlsx", workbookBytes(blocked));
    await writeFile(
      "tmp/excel-import-ui/damaged.xlsx",
      Buffer.from("Synthetic invalid ZIP package", "utf8"),
    );
    await writeFile("tmp/excel-import-ui/revised.xlsx", workbookBytes(revised));
    await writeFile(
      "tmp/excel-import-ui/fixture.json",
      JSON.stringify(
        {
          route: `/estimating/import?${new URLSearchParams({ workspace: setup.input.id, option: setup.input.option_id, revision: setup.input.revision_id })}`,
          wizard: `/estimating/discovery/${setup.input.id}`,
          source: source.source.reference,
          source_id: source.source.id,
          source_revision_id: source.source.revision.id,
          lines: setup.review.lines.map((l) => l.description),
        },
        null,
        2,
      ),
    );
    console.log("Synthetic Excel browser fixture ready");
  }
} finally {
  await closeDatabase();
}
