import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { launchDocumentBrowser } from "../../src/platform/browser";
import { httpAcceptance } from "../helpers/acceptance-http";
import { importedForQuote } from "../helpers/excel-quotation";
import { excelQuoteConfirmations } from "../../src/estimating/import/quotation";
import { digest } from "../../src/documents/store";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);
const origin = localConfig().origin,
  h = httpAcceptance(origin);
test(
  "XI06/07 compiled HTTP and browser: reviewed exact Draft, output safety, access and original recovery",
  { timeout: 120000 },
  async () => {
    const s = await importedForQuote(),
      base = `estimating/estimates/${s.e.id}/excel-quote`,
      cookie = await h.cookie("coordinator");
    for (const path of [base, base + "/review"]) {
      for (const [headers, status] of [
        [{ origin }, 401],
        [{ cookie, origin: "https://invalid.example" }, 403],
      ] as const) {
        const r = await fetch(origin + "/api/v1/" + path, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: "{}",
        });
        assert.equal(r.status, status);
      }
    }
    const proposal = await h.call("coordinator", base + "/review", {
      estimate_version_id: s.e.saved.id,
    });
    assert.equal(proposal.status, 200, JSON.stringify(proposal.body));
    const choices = proposal.body.choices.map(
      (
        c: { line_id: string; included: boolean; print: boolean },
        i: number,
      ) => ({ ...c, included: i !== 2 && i !== 3, print: i !== 1 && i !== 3 }),
    );
    const reviewed = await h.call("coordinator", base + "/review", {
      estimate_version_id: s.e.saved.id,
      choices,
    });
    assert.equal(reviewed.status, 200);
    const command = {
      schema_version: 1,
      operation_id: randomUUID(),
      id: randomUUID(),
      reason: "SYN verified HTTP customer continuation",
      estimate_version_id: s.e.saved.id,
      expected_version: s.e.version,
      expected_quote_version: reviewed.body.expected_quote_version,
      choices,
      review_hash: reviewed.body.review_hash,
      confirmations: [...excelQuoteConfirmations],
    };
    assert.equal(
      (await h.call("coordinator", base, { ...command, confirmations: [] }))
        .status,
      422,
    );
    const accepted = await h.call("coordinator", base, command);
    assert.equal(accepted.status, 200, JSON.stringify(accepted.body));
    const path = `estimating/quotes/${command.id}`;
    const evidence = await h.call("coordinator", path + "/excel-import");
    assert.equal(evidence.status, 200);
    assert.equal(
      evidence.body.evidence.review.review_hash,
      command.review_hash,
    );
    for (const profile of ["observer", "second-company"]) {
      assert.equal((await h.call(profile, path + "/excel-import")).status, 404);
      assert.equal(
        (
          await h.call(profile, base + "/review", {
            estimate_version_id: s.e.saved.id,
          })
        ).status,
        404,
      );
      assert.equal((await h.call(profile, base, command)).status, 404);
    }
    assert.deepEqual(
      (await h.call("coordinator", "operations/" + command.operation_id)).body,
      accepted.body.receipt,
    );
    assert.equal(
      (await h.call("coordinator", base, command)).body.replayed,
      true,
    );
    const rendered = await h.call("coordinator", path + "/render", {});
    assert.equal(rendered.status, 200, JSON.stringify(rendered.body));
    assert.equal(rendered.body.job.state, "Ready");
    const root = "verification-evidence/excel-quotation";
    await mkdir(root, { recursive: true });
    const hashes: Record<string, string> = {};
    const forbidden = [
      s.upload.file.name,
      ...choices
        .filter(
          (c: { included: boolean; print: boolean }) => !c.included || !c.print,
        )
        .map(
          (c: { line_id: string }) =>
            s.e.saved.lines.find((l) => l.id === c.line_id)!.description,
        ),
      ...s.e.saved.lines.map((l) => l.source),
    ];
    for (const kind of ["html", "pdf"]) {
      const r = await fetch(origin + "/api/v1/" + path + "/file?kind=" + kind, {
        headers: { cookie },
      });
      assert.equal(r.status, 200);
      assert.equal(r.headers.get("cache-control"), "private, no-store");
      const bytes = Buffer.from(await r.arrayBuffer());
      hashes[kind] = digest(bytes);
      await writeFile(join(root, "exact." + kind), bytes);
      if (kind === "html")
        for (const value of forbidden)
          assert.ok(!bytes.toString("utf8").includes(value));
      else assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
    }
    const browser = await launchDocumentBrowser();
    try {
      const context = await browser.newContext();
      const [name, ...value] = cookie.split("=");
      await context.addCookies([{ name, value: value.join("="), url: origin }]);
      const page = await context.newPage();
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 960 });
        await page.goto(origin + "/api/v1/" + path + "/file?kind=html");
        assert.equal(
          await page.locator(".total").innerText(),
          "Draft total AUD " + reviewed.body.customer_content.total,
        );
        assert.ok(
          (await page.locator("body").innerText()).includes(
            "Included scope allowance",
          ),
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        for (const value of forbidden)
          assert.ok(!(await page.locator("body").innerText()).includes(value));
        await page.screenshot({
          path: join(root, `draft-${width}.png`),
          fullPage: true,
        });
      }
      await writeFile(
        join(root, "result.json"),
        JSON.stringify(
          {
            status: "passed",
            browser: browser.version(),
            hashes,
            quote_total: reviewed.body.customer_content.total,
            forbidden,
            exact_version: s.e.saved.id,
            viewports: [1440, 390, 320],
          },
          null,
          2,
        ),
      );
    } finally {
      await browser.close();
    }
  },
);
