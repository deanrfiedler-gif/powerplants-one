import { extendedCases } from "../tests/helpers/acceptance-journey";
// Explicit local synthetic scenario. Creates new identities; preserves existing sources, outputs and receipts.
import {
  contextFixture,
  PJ,
  seedStage,
  stable,
  handover,
  act,
} from "../tests/helpers/acceptance";
import { closeDatabase, database } from "../src/platform/database";
import {
  seedCommissioningScenario,
  commissioningScenarioIds,
} from "../tests/helpers/engineering-commissioning";
import {
  principalOf,
  directSignIn as changeSignIn,
} from "../tests/helpers/engineering-changes-direct";
import {
  packageCommand,
  basisCommand,
  inspectionCommand,
  configurationCommand,
  releaseCommand,
  handoverCommand,
} from "../src/engineering/commissioning/commands";
import { readRegister, readView } from "../src/engineering/commissioning/reads";
import { AppError } from "../src/platform/errors";
import type { Call, SignIn } from "../tests/helpers/engineering-materials";
import type { Principal } from "../src/platform/identity";
import { readWorkspace } from "../src/projects/acceptance/reads";
import { localConfig } from "../src/platform/config";
const commands: Record<
  string,
  (
    p: Principal,
    id: string,
    value: unknown,
  ) => Promise<{ receipt: unknown; replayed: boolean }>
> = {
  "": packageCommand,
  basis: basisCommand,
  results: inspectionCommand,
  configuration: configurationCommand,
  releases: releaseCommand,
  handovers: handoverCommand,
};
const signIn: SignIn = async (profile) => {
  const parent = await changeSignIn(profile),
    p = await principalOf(profile);
  const call: Call = async (target, body) => {
    const [path, q = ""] = target.split("?"),
      m =
        /^engineering\/([^/]+)\/commissioning(?:\/(basis|results|configuration|releases|handovers))?$/.exec(
          path,
        );
    if (!m) return parent(target, body);
    try {
      if (body !== undefined) {
        const r = await commands[m[2] ?? ""](p, m[1], body);
        return { status: r.replayed ? 200 : 201, body: r.receipt };
      }
      return {
        status: 200,
        body: m[2]
          ? await readView(
              p,
              m[1],
              Object.fromEntries(new URLSearchParams(q)),
              m[2] as "basis",
            )
          : await readRegister(
              p,
              m[1],
              Object.fromEntries(new URLSearchParams(q)),
            ),
      };
    } catch (e) {
      if (e instanceof AppError)
        return {
          status: e.status,
          body: {
            code: e.code,
            message: e.message,
            field_errors: e.field_errors,
          },
        };
      throw e;
    }
  };
  return call;
};
try {
  localConfig();
  await contextFixture();
  const ids = commissioningScenarioIds(true),
    transform = (x: unknown): unknown =>
      typeof x === "string"
        ? stable("en08:" + x)
        : Array.isArray(x)
          ? x.map(transform)
          : x && typeof x === "object"
            ? Object.fromEntries(
                Object.entries(x).map(([k, v]) => [k, transform(v)]),
              )
            : x;
  ids.changes.materials = transform(
    ids.changes.materials,
  ) as typeof ids.changes.materials;
  ids.changes.materials.organisation = PJ.organisation;
  ids.changes.materials.site = PJ.site;
  ids.changes.materials.project = PJ.project;
  ids.changes.materials.op = (step) => stable("mat-op:" + step);
  ids.changes.named = (key) => stable("change:" + key);
  ids.changes.op = (step) => stable("change-op:" + step);
  ids.named = (key) => stable("en08:" + key);
  ids.op = (step) => stable("en08-op:" + step);
  console.log(
    "Building independently owned EN-08 source evidence for Project 000701…",
  );
  const built = await seedCommissioningScenario(signIn, ids);
  console.log("EN-08 sources retained for", built.package_id);
  const specs = [
    ["A", "Greenhouse 01 acceptance", "Outstanding"],
    ["B", "Propagation handover", "Satisfied"],
    ["C", "Irrigation block A", "Satisfied"],
    ["D", "Greenhouse 02 acceptance", "Blocked"],
    ["E", "Controls handover", "Satisfied"],
    ["F", "Pack room closeout", "Satisfied"],
    ["H", "Pump station handover", "Cannot assess"],
    ["I", "Growing area B", "Satisfied"],
    ["G", "Two-compartment acceptance", "Satisfied"],
    ["J", "Interrupted closeout review", "Satisfied"],
    ["K", "Previously accepted area", "Satisfied"],
  ] as const;
  for (const [key, title, state] of specs) {
    const r = await seedStage(
      PJ.project,
      key,
      title,
      state,
      key === "A" ? built.records["001"] : undefined,
      key === "A" ? "gh01-irrigation" : undefined,
    );
    console.log("Stage", key, title, r.stage);
  }
  const p = await principalOf("coordinator");
  const data = await readWorkspace(p, { project: PJ.project });
  for (const d of data.items.filter(
    (d) =>
      !["A", "D", "H"].some(
        (k) => d.stage.id === stable(`${PJ.project}:${k}:stage`),
      ),
  )) {
    const key = specs.find(
      ([k]) => stable(`${PJ.project}:${k}:stage`) === d.stage.id,
    )![0];
    if (["B", "E", "F", "I"].includes(key)) {
      const cm = await handover(
        PJ.project,
        d.stage.id,
        "Customer",
        "customer-1",
      );
      const sm = await handover(PJ.project, d.stage.id, "Service", "service-1");
      if (
        !(
          await database().query(
            "SELECT 1 FROM ppo.acceptance_decisions WHERE subject_id=$1 AND kind='Service'",
            [sm.request_id],
          )
        ).rowCount
      ) {
        await act("changes-service", PJ.project, d.stage.id, "receive", {
          request_id: sm.request_id!,
          outcome: key === "E" ? "Returned" : "Received",
          evidence:
            key === "E"
              ? "SYN missing backup reference; issue a corrected successor."
              : "SYN exact manifest received",
          owner_id: PJ.sam,
        });
        if (key !== "E")
          await act("changes-service", PJ.project, d.stage.id, "receive", {
            request_id: sm.request_id!,
            outcome: "Accepted",
            evidence: "SYN independent support receiving review",
          });
      }
      if (
        ["F", "I"].includes(key) &&
        !(
          await database().query(
            "SELECT 1 FROM ppo.acceptance_responses WHERE request_id=$1",
            [cm.request_id],
          )
        ).rowCount
      ) {
        const rid = stable(d.stage.id + ":customer-response");
        await act("coordinator", PJ.project, d.stage.id, "response", {
          id: rid,
          request_id: cm.request_id!,
          respondent_id: PJ.person,
          authority_basis:
            key === "I"
              ? "Unknown authority"
              : "SYN scoped contract appointment AP-01",
          method: "Recorded from evidence",
          evidence: "SYN exact customer response r01",
          outcome: "Accepted",
          response_time: "2026-09-20",
          time_precision: "Date",
          unit_ids: d.units
            .filter((u) => u.disposition === "Included")
            .map((u) => u.id),
        });
        if (key === "F")
          await act("materials-reviewer", PJ.project, d.stage.id, "validate", {
            id: rid,
            authority_basis: "SYN independently verified AP-01 appointment",
          });
      }
    }
  }
  await extendedCases();
  console.log(
    "Open http://127.0.0.1:" + localConfig().port + "/projects/acceptance",
  );
} finally {
  await closeDatabase();
}
