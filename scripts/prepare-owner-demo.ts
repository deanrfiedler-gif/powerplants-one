import { randomUUID, createHash } from "node:crypto";
import { mkdir, readFile, writeFile, open, rename, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { localConfig } from "../src/platform/config";
import { database, closeDatabase } from "../src/platform/database";
import { createSession } from "../src/platform/identity";
import { createOpportunity } from "../src/crm/opportunities";
import { changeDealStage } from "../src/crm/refinements";
import { readOpportunity } from "../src/crm/reads";
import { ACTIVE_PIPELINE_ID } from "../src/crm/stages";
import { activityCommand } from "../src/activities/activities";
import { createEstimate, prepareQuote } from "../src/estimating/service";
import { readEstimate } from "../src/estimating/reads";
import {
  runQuoteJob,
  readQuoteJob,
  draftBytes,
} from "../src/estimating/worker";
import { privatePath } from "./recovery";

const dataset = "DEMO-02-r03-explicit-line-format-2";
const execute = promisify(execFile);
const sha = (s: string | Buffer) =>
  createHash("sha256").update(s).digest("hex");
const common = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason:
    "SYN DEMO-02 deterministic owner walkthrough preparation; no operational authority",
});
const stages = ["Discovery", "Scoping", "Quoting", "Negotiation", "Closing"];
const scenarios = [
  [
    "O1",
    "Irrigation controls enquiry",
    "Discovery",
    "CustomerContact",
    "Confirm the fictional controls scope",
    1,
  ],
  [
    "O2",
    "Controls package for draft estimating",
    "Scoping",
    "RelationshipReview",
    "Review the fictional estimate assumptions",
    2,
  ],
  [
    "O3",
    "Sensor follow-up overdue",
    "Discovery",
    "CustomerContact",
    "Follow up the fictional sensor enquiry",
    -2,
  ],
  [
    "O4",
    "Quotation scope needs its next action",
    "Quoting",
    "CustomerContact",
    "Discuss the fictional quotation requirements",
    1,
  ],
  [
    "O5",
    "Site meeting date to be agreed",
    "Negotiation",
    "CustomerContact",
    "Agree the fictional site meeting date",
    null,
  ],
  [
    "O6",
    "Propagation greenhouse controls and irrigation review with a deliberately long opportunity title",
    "Closing",
    "RelationshipReview",
    "Review the fictional greenhouse controls proposal",
    0,
  ],
] as const;
type Plan = {
  format: 1;
  dataset: string;
  epoch: string;
  database_epoch: string;
  date: string;
  timezone: "Australia/Brisbane";
  release: {
    source_head: string;
    executed_checkout: string;
    executed_tree: string;
    node: string;
    run_id: string | null;
    run_attempt: string | null;
  };
  schema_versions: number[];
  scenarios: {
    key: string;
    stage: string;
    id: string;
    activity_id: string;
    create: Record<string, unknown>;
    moves: Record<string, unknown>[];
    complete?: Record<string, unknown>;
  }[];
  estimate: Record<string, unknown> & {
    id: string;
    lines: { id: string; category: string }[];
  };
  quote: { id: string; operation_id: string };
};
async function save(path: string, value: unknown, exclusive = false) {
  const temp = exclusive ? path : `${path}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + "\n", {
    mode: 0o600,
    flag: "wx",
  });
  const handle = await open(temp, "r+");
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
  if (!exclusive) await rename(temp, path);
}
export async function prepareOwnerDemo(directory: string, date: string) {
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error(
      "Owner preparation requires an isolated disposable test epoch.",
    );
  const instant = Date.parse(`${date}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(instant) ||
    new Date(instant).toISOString().slice(0, 10) !== date
  )
    throw Error(
      "Supply the actual preparation date in Australia/Brisbane as YYYY-MM-DD.",
    );
  await privatePath(directory, false);
  await mkdir(directory, { mode: 0o700, recursive: true });
  await privatePath(directory, true);
  const lock = join(directory, "preparation.lock");
  await mkdir(lock, { mode: 0o700 });
  try {
    const ledger = (
      await database().query(
        "SELECT version,sha256,applied_at FROM public.ppo_migrations ORDER BY version",
      )
    ).rows;
    const database_epoch = sha(JSON.stringify(ledger));
    const path = join(directory, "plan.json");
    let plan: Plan;
    try {
      plan = JSON.parse(await readFile(path, "utf8")) as Plan;
      if (
        plan.format !== 1 ||
        plan.dataset !== dataset ||
        plan.database_epoch !== database_epoch ||
        plan.date !== date
      )
        throw Error(
          "Demo dataset/date/database epoch mismatch. Preserve the old plan; never replay it into a reset database.",
        );
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      const existing = (
        await database().query(
          "SELECT count(*)::int n FROM ppo.opportunities WHERE pipeline_definition_id=$1",
          [ACTIVE_PIPELINE_ID],
        )
      ).rows[0].n;
      if (existing)
        throw Error(
          "Prepare a new isolated epoch with an empty current pipeline. Existing opportunities are retained.",
        );
      const owner = "30000000-0000-4000-8000-000000000001";
      const planned = scenarios.map(
        ([key, title, stage, kind, summary, offset]) => {
          const id = randomUUID(),
            activity_id = randomUUID();
          return {
            key,
            stage,
            id,
            activity_id,
            create: {
              ...common(),
              id,
              company_id: "20000000-0000-4000-8000-000000000001",
              organisation_id: "50000000-0000-4000-8000-000000000001",
              site_id: "70000000-0000-4000-8000-000000000001",
              primary_person_id: "60000000-0000-4000-8000-000000000001",
              site_unknown_reason: null,
              contact_unknown_reason: null,
              owner_id: owner,
              pipeline_definition_id: ACTIVE_PIPELINE_ID,
              title: `SYN DEMO — ${title}`,
              need_summary: `SYN ${summary}; establish the stated scope without purchase or delivery authority.`,
              source_channel: "Meeting",
              source_basis:
                "SYN internal demonstration scenario; no customer request",
              qualification_note:
                "SYN known organisation/site/contact; suitable for a fictional scoping discussion; no purchase authority asserted",
              initial_action: {
                id: activity_id,
                owner_id: owner,
                kind,
                summary: `SYN ${summary}`,
                due_at:
                  offset === null
                    ? null
                    : new Date(instant + offset * 86400000).toISOString(),
                due_needed: offset === null,
              },
            },
            moves: stages
              .slice(1, stages.indexOf(stage) + 1)
              .map((stage_id, i) => ({
                ...common(),
                expected_version: i + 1,
                stage_id,
              })),
            ...(key === "O4"
              ? {
                  complete: {
                    ...common(),
                    expected_version: 1,
                    outcome:
                      "SYN requirements discussed; next review not yet planned",
                  },
                }
              : {}),
          };
        },
      );
      const lines = [
        {
          description: "SYN Controls package",
          category: "Product",
          allowance: false,
          quantity: "1.000",
          unit: "each",
          unit_cost: "8000.00",
          unit_sell: "10000.50",
        },
        {
          description: "SYN Installation labour",
          category: "Labour",
          allowance: false,
          quantity: "10.000",
          unit: "hour",
          unit_cost: "100.00",
          unit_sell: "150.00",
        },
        {
          description: "SYN Freight allowance",
          category: "Freight",
          allowance: true,
          quantity: "1.000",
          unit: "lot",
          unit_cost: "900.00",
          unit_sell: "1250.00",
        },
      ].map((l) => ({
        ...l,
        id: randomUUID(),
        source: "SYN manual demonstration assumption",
        effective_date: date,
      }));
      plan = {
        format: 1,
        dataset,
        epoch: randomUUID(),
        database_epoch,
        date,
        timezone: "Australia/Brisbane",
        release: {
          source_head:
            process.env.PPO_SOURCE_HEAD ||
            (await execute("git", ["rev-parse", "HEAD"])).stdout.trim(),
          executed_checkout: (
            await execute("git", ["rev-parse", "HEAD"])
          ).stdout.trim(),
          executed_tree: (
            await execute("git", ["rev-parse", "HEAD^{tree}"])
          ).stdout.trim(),
          node: process.version,
          run_id: process.env.GITHUB_RUN_ID ?? null,
          run_attempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
        },
        schema_versions: ledger.map((r) => r.version),
        scenarios: planned,
        estimate: {
          ...common(),
          schema_version: 2,
          id: randomUUID(),
          opportunity_id: planned[1].id,
          owner_id: owner,
          title: "SYN DEMO — Controls package fallback estimate",
          scope: {
            included:
              "SYN supply one controls package, installation labour and freight to the fictional site",
            excluded: "Civil works and electrical upgrades",
            assumptions:
              "Fictional prices; access and technical suitability require later review",
          },
          lines,
          policy: "SYN-EST-ARITHMETIC-01",
        },
        quote: { id: randomUUID(), operation_id: randomUUID() },
      };
      await save(path, plan, true); // Original operation identities reach disk before dispatch.
    }
    const { principal } = await createSession("coordinator"); // Current scoped server grants remain authoritative.
    const receipts: unknown[] = [];
    for (const s of plan.scenarios) {
      receipts.push((await createOpportunity(principal, s.create)).receipt);
      for (const cmd of s.moves)
        receipts.push((await changeDealStage(principal, s.id, cmd)).receipt);
      if (s.complete)
        receipts.push(
          (
            await activityCommand(
              principal,
              s.activity_id,
              s.complete,
              "complete",
            )
          ).receipt,
        );
    }
    receipts.push((await createEstimate(principal, plan.estimate)).receipt);
    const e = await readEstimate(principal, plan.estimate.id);
    const quotePath = join(directory, "quote-original.json");
    let quote: Record<string, unknown>;
    try {
      quote = JSON.parse(await readFile(quotePath, "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      if (e.version !== 1)
        throw Error(
          "The demonstration estimate changed before its fallback was prepared; retain the original plan for review.",
        );
      quote = {
        ...common(),
        ...plan.quote,
        estimate_version_id: e.saved.id,
        expected_version: 1,
        expected_quote_version: 0,
        choices: plan.estimate.lines.map((l) => ({
          line_id: l.id,
          included: true,
          print: l.category !== "Labour",
        })),
      };
      await save(quotePath, quote, true);
    }
    receipts.push((await prepareQuote(principal, e.id, quote)).receipt);
    const job = (await readQuoteJob(principal, plan.quote.id)).j;
    await runQuoteJob(job.id);
    const output = await draftBytes(principal, plan.quote.id);
    const records = await Promise.all(
      plan.scenarios.map(async (s) => {
        const o = await readOpportunity(principal, s.id);
        if (
          o.stage_id !== s.stage ||
          o.close_outcome !== "Open" ||
          o.owner_id !== principal.actor_id ||
          o.actions.length !== 1 ||
          o.events.length !== s.moves.length + 1
        )
          throw Error(
            "Prepared scenario differs from its declared original; no record was overwritten.",
          );
        return {
          key: s.key,
          id: o.id,
          display_number: o.display_number,
          stage: o.stage_id,
          owner_id: o.owner_id,
          action_id: o.actions[0].id,
          action_status: o.actions[0].status,
          action_due_at: o.actions[0].due_at,
          next_action_state: o.next_action_state,
          events: o.events.length,
        };
      }),
    );
    const summary = {
      format: 1,
      dataset,
      epoch: plan.epoch,
      database_epoch,
      date,
      timezone: plan.timezone,
      release: plan.release,
      schema_versions: plan.schema_versions,
      records,
      stages: Object.fromEntries(
        stages.map((stage) => [
          stage,
          records.filter((r) => r.stage === stage).length,
        ]),
      ),
      active_activities: records.filter((r) => r.action_status === "Open")
        .length,
      completed_activities: records.filter(
        (r) => r.action_status === "Completed",
      ).length,
      estimate: {
        id: e.id,
        version: e.saved.version,
        cost: e.saved.cost_total,
        sell: e.saved.sell_total,
      },
      quote: {
        id: plan.quote.id,
        state: "Ready Draft",
        html_sha256: sha(output.html),
        pdf_sha256: sha(output.pdf),
        html_bytes: Buffer.byteLength(output.html),
        pdf_bytes: output.pdf.length,
      },
      receipts,
    };
    if (
      summary.active_activities !== 5 ||
      summary.completed_activities !== 1 ||
      summary.estimate.cost !== "9900.00" ||
      summary.estimate.sell !== "12750.50" ||
      records.find((r) => r.key === "O4")?.next_action_state !== "Needed" ||
      records.find((r) => r.key === "O5")?.next_action_state !== "DueNeeded"
    )
      throw Error("Prepared Activity counts or explicit unknown state differ.");
    await save(join(directory, "prepared.json"), summary);
    return summary;
  } finally {
    await rm(lock, { recursive: true });
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const [directory, date, ...extra] = process.argv.slice(2);
    if (!directory || !date || extra.length)
      throw Error(
        "Use prepare-owner-demo.ts /absolute/private/new-epoch YYYY-MM-DD.",
      );
    const result = await prepareOwnerDemo(directory, date);
    console.log(
      JSON.stringify({
        epoch: result.epoch,
        date: result.date,
        stages: result.stages,
        active_activities: result.active_activities,
        completed_activities: result.completed_activities,
        quote: result.quote,
      }),
    );
  } catch {
    console.error(
      "Demo preparation stopped. Preserve the private plan and originals; inspect the dataset/date/epoch, current permissions and saved receipts before retrying.",
    );
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}
