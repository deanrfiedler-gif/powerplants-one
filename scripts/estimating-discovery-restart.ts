import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Page } from "@playwright/test";
import { database } from "../src/platform/database";
import { digest } from "../src/documents/store";
import type { OperationReceipt } from "../src/platform/operations";
import type { readDiscoveryWorkspace } from "../src/estimating/discovery-workspaces";
import type { DiscoveryRevision } from "../src/estimating/discovery-workspace-context";
import { crmCreate, crmBase, CRM } from "../tests/helpers/crm";
import { discoveryInput } from "../tests/helpers/estimating-discovery";

type Detail = Awaited<ReturnType<typeof readDiscoveryWorkspace>>;
type Call = (path: string, body?: unknown) => Promise<unknown>;
type Accepted = {
  path: string;
  body: Record<string, unknown>;
  receipt: OperationReceipt;
};
type Proof = {
  id: string;
  opportunity_id: string;
  detail: Detail;
  revisions: DiscoveryRevision[];
  accepted: Accepted[];
  application_pids: number[];
  database_starts: string[];
};
// Invoked inside the retained E1 three-process harness. Its original manual
// schema-1/schema-2 receipts and interrupted output proof remain independent.
export async function discoveryRestart({
  phase,
  root,
  evidence,
  call,
  page,
  pid,
  databaseStart,
}: {
  phase: string;
  root: string;
  evidence: string;
  call: Call;
  page: Page;
  pid: number;
  databaseStart: string;
}) {
  const file = join(root, "e2-proof.json");
  let proof: Proof;
  if (phase === "write") {
    const accepted: Accepted[] = [],
      o = crmCreate();
    await call("crm/opportunities", o);
    const id = randomUUID(),
      optionId = randomUUID(),
      revisionId = randomUUID(),
      path = `estimating/workspaces/${id}`;
    async function accept(path: string, fields: Record<string, unknown>) {
      const body = { ...crmBase(), ...fields },
        receipt = (await call(path, body)) as OperationReceipt;
      accepted.push({ path, body, receipt });
      return receipt;
    }
    const discovery = discoveryInput(),
      firstPreview = (await call("estimating/workspaces/preview", {
        opportunity_id: o.id,
        discovery,
      })) as {
        expected_opportunity_version: number;
        context_hash: string;
        required_confirmation_ids: string[];
      };
    await accept("estimating/workspaces", {
      id,
      option_id: optionId,
      revision_id: revisionId,
      opportunity_id: o.id,
      discovery,
      expected_opportunity_version: firstPreview.expected_opportunity_version,
      context_hash: firstPreview.context_hash,
      confirmed_question_ids: firstPreview.required_confirmation_ids,
    });
    const successorId = randomUUID(),
      successor = {
        ...discovery,
        answers: discovery.answers.map((a) =>
          a.question_id === "Q01"
            ? {
                ...a,
                value: "SYN saved successor through real process restarts",
              }
            : a,
        ),
      };
    const save = {
      kind: "Save",
      option_id: optionId,
      expected_version: 1,
      expected_revision_id: revisionId,
      discovery: successor,
    };
    const savePreview = (await call(path + "/preview", save)) as {
      context_hash: string;
      comparison_hash: string;
      required_confirmation_ids: string[];
    };
    await accept(path, {
      ...save,
      revision_id: successorId,
      context_hash: savePreview.context_hash,
      comparison_hash: savePreview.comparison_hash,
      confirmed_question_ids: savePreview.required_confirmation_ids,
    });
    const branch = {
      kind: "Branch",
      branch_mode: "CopyDiscovery",
      option_id: optionId,
      expected_version: 2,
      expected_revision_id: successorId,
      copy_follow_up: {
        owner_id: CRM.owner,
        reason: "SYN recheck copied scope after restart",
      },
    };
    const branchPreview = (await call(path + "/preview", branch)) as {
        context_hash: string;
        comparison_hash: string;
        required_confirmation_ids: string[];
      },
      branchId = randomUUID(),
      branchRevision = randomUUID();
    await accept(path, {
      ...branch,
      new_option_id: branchId,
      revision_id: branchRevision,
      label: "B",
      context_hash: branchPreview.context_hash,
      comparison_hash: branchPreview.comparison_hash,
      confirmed_question_ids: [],
    });
    await accept(path + "/options", {
      action: "Select",
      option_id: branchId,
      expected_version: 3,
      expected_revision_id: branchRevision,
      expected_selected_option_id: optionId,
    });
    await accept(path + "/options", {
      action: "Archive",
      option_id: optionId,
      expected_version: 4,
      expected_revision_id: successorId,
      expected_selected_option_id: branchId,
    });
    const detail = (await call(path)) as Detail,
      revisions = [];
    for (const revision of [revisionId, successorId, branchRevision])
      revisions.push(
        (await call(
          path + `/revisions?revision_id=${revision}`,
        )) as DiscoveryRevision,
      );
    assert.equal(detail.workspace.version, 5);
    assert.equal(detail.workspace.selected_option_id, branchId);
    assert.equal(
      detail.options.find((x) => x.option.id === optionId)!.option.state,
      "Archived",
    );
    assert.equal(
      detail.options.find((x) => x.option.id === branchId)!.revision
        .scope_readiness,
      "Incomplete",
    );
    proof = {
      id,
      opportunity_id: o.id,
      detail,
      revisions,
      accepted,
      application_pids: [pid],
      database_starts: [databaseStart],
    };
  } else {
    proof = JSON.parse(await readFile(file, "utf8"));
    assert.ok(!proof.application_pids.includes(pid));
    assert.ok(!proof.database_starts.includes(databaseStart));
    assert.deepEqual(
      await call(`estimating/workspaces/${proof.id}`),
      proof.detail,
    );
    for (const revision of proof.revisions)
      assert.deepEqual(
        await call(
          `estimating/workspaces/${proof.id}/revisions?revision_id=${revision.id}`,
        ),
        revision,
      );
    for (const original of proof.accepted) {
      assert.deepEqual(
        await call(`operations/${original.receipt.operation_id}`),
        original.receipt,
      );
      assert.deepEqual(
        await call(original.path, original.body),
        original.receipt,
      );
    }
    proof.application_pids.push(pid);
    proof.database_starts.push(databaseStart);
  }
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int n FROM ppo.estimation_revisions WHERE estimating_workspace_id=$1",
        [proof.id],
      )
    ).rows[0].n,
    3,
  );
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int n FROM ppo.estimates WHERE opportunity_id=$1",
        [proof.opportunity_id],
      )
    ).rows[0].n,
    0,
  );
  await page.goto(`http://127.0.0.1:3000/estimating/discovery/${proof.id}`);
  await expect(
    page.getByRole("button", { name: /Option A · Alternative · Archived/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Option B · Selected basis · Active/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Saved revision 1 · Incomplete",
      exact: true,
    }),
  ).toBeVisible();
  const screenshot = await page.screenshot({
      path: `${evidence}/e2-${phase}.png`,
      fullPage: true,
    }),
    checkout = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
  await writeFile(file, JSON.stringify(proof));
  await writeFile(
    `${evidence}/e2-${phase}.json`,
    JSON.stringify(
      {
        phase,
        scenario:
          "E2 immutable scope and archived original receipts through actual process restarts",
        source_head: process.env.PPO_SOURCE_HEAD ?? checkout,
        executed_checkout: checkout,
        tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
          encoding: "utf8",
        }).trim(),
        run_id: process.env.GITHUB_RUN_ID,
        run_attempt: process.env.GITHUB_RUN_ATTEMPT,
        viewport: page.viewportSize(),
        byte_count: screenshot.length,
        sha256: digest(screenshot),
        application_pids: proof.application_pids,
        database_starts: proof.database_starts,
        workspace_id: proof.id,
        workspace_version: proof.detail.workspace.version,
        selected_option_id: proof.detail.workspace.selected_option_id,
        original_receipts: proof.accepted.map((x) => x.receipt),
        revisions: proof.revisions.map((r) => ({
          id: r.id,
          scope_snapshot_id: r.scope_snapshot_id,
          answer_snapshot_id: r.answer_snapshot_id,
          content_hash: r.content_hash,
          context_hash: r.context_hash,
        })),
      },
      null,
      2,
    ),
  );
  console.log(
    `E2 ${phase}: exact three revisions, selected/archived options and five original receipts verified; no costing import.`,
  );
}
