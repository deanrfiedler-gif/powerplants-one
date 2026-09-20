import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { contextFixture, seedStage, PJ, C } from "./acceptance";
import type { Data } from "../../src/projects/acceptance/workspace";
import type { Action, Fields } from "../../src/projects/acceptance/validation";
import type { OperationReceipt } from "../../src/platform/operations";
export function httpAcceptance(origin: string) {
  const cookies = new Map<string, string>();
  async function cookie(profile: string) {
    if (!cookies.has(profile)) {
      const r = await fetch(origin + "/api/v1/local-session", {
        method: "POST",
        headers: { origin, "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      assert.equal(r.status, 200);
      cookies.set(profile, r.headers.get("set-cookie")!.split(";")[0]);
    }
    return cookies.get(profile)!;
  }
  async function call(profile: string, path: string, body?: unknown) {
    const r = await fetch(origin + "/api/v1/" + path, {
      method: body ? "POST" : "GET",
      headers: {
        cookie: await cookie(profile),
        origin,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    assert.equal(r.headers.get("cache-control"), "private, no-store");
    return { status: r.status, body: await r.json() };
  }
  const read = async (project: string, stage?: string): Promise<Data> => {
    const r = await call(
      "coordinator",
      "projects/acceptance?project=" +
        project +
        (stage ? "&stage=" + stage : ""),
    );
    assert.equal(r.status, 200);
    return r.body;
  };
  async function act(
    profile: string,
    project: string,
    stage: string | null,
    action: Action,
    fields: Fields = {},
  ) {
    const d = await read(project, stage ?? undefined),
      body = {
        operation_id: randomUUID(),
        schema_version: 1,
        reason: "SYN connected HTTP journey: " + action,
        action,
        project_id: project,
        stage_id: stage,
        expected_version: stage ? d.selected!.stage.version : d.project.version,
        facts_hash: stage ? d.selected!.facts_hash : d.project_facts_hash,
        fields,
      },
      r = await call(profile, "projects/acceptance", body);
    assert.equal(r.status, 201, action + ": " + JSON.stringify(r.body));
    await call(profile, "projects/acceptance/intents/" + body.operation_id, {
      disposition: "Seen",
    });
    return { body, receipt: r.body as OperationReceipt };
  }
  async function readyJourney() {
    await contextFixture();
    const project = randomUUID();
    const created = await call("coordinator", "projects", {
      operation_id: randomUUID(),
      schema_version: 1,
      reason: "SYN connected acceptance proof",
      id: project,
      title: "SYN connected acceptance proof",
      company_id: C,
      organisation_id: PJ.organisation,
      site_id: PJ.site,
      coordinator_id: PJ.coordinator,
      target_date: null,
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const s = await seedStage(
        project,
        "http",
        "SYN blocked to closeout HTTP journey",
        "Blocked",
      ),
      stage = s.stage;
    assert.equal(
      (
        await call("coordinator", "projects/acceptance", {
          operation_id: randomUUID(),
          schema_version: 1,
          reason: "SYN wrong duty",
          action: "technical",
          project_id: project,
          stage_id: stage,
          expected_version: 1,
          facts_hash: null,
          fields: {},
        })
      ).status,
      404,
    );
    const source = (await read(project, stage)).selected!.requirements.find(
      (r) => r.gate === "Technical",
    )!.source;
    await act("coordinator", project, null, "source", {
      id: source.id,
      title: source.title,
      kind: "Technical",
      outcome: "Satisfied",
      availability: "Current",
      public_reference: source.reference,
      source_version: "r02",
      source_expected_version: source.version,
      details: {
        evidence: "SYN reviewed corrective evidence",
        tests_required: 12,
        tests_accepted: 12,
        release: "SYN technical release r02",
      },
    });
    await act("coordinator", project, stage, "return", { owner_id: PJ.sam });
    await act("coordinator", project, stage, "successor");
    await act("coordinator", project, stage, "submit");
    await act("materials-reviewer", project, stage, "technical");
    async function pack(audience: "Customer" | "Service") {
      const id = randomUUID();
      await act("coordinator", project, stage, "prepare", {
        id,
        audience,
        recipient_id: audience === "Customer" ? PJ.person : PJ.receiver,
        purpose: "SYN exact stage acceptance and continuing support",
      });
      await act("materials-release", project, stage, "issue", { id });
      const m = (await read(project, stage)).selected!.manifests.find(
        (m) => m.id === id,
      )!;
      const request = randomUUID();
      await act("coordinator", project, stage, "request", {
        id: request,
        issue_id: m.issue_id!,
        due: null,
      });
      return { id, request };
    }
    const returned = await pack("Service");
    await act("changes-service", project, stage, "receive", {
      request_id: returned.request,
      outcome: "Returned",
      owner_id: PJ.sam,
      evidence: "SYN clarify backup version and resubmit exact successor",
    });
    await act("coordinator", project, stage, "successor");
    await act("coordinator", project, stage, "submit");
    await act("materials-reviewer", project, stage, "technical");
    const service = await pack("Service"),
      customer = await pack("Customer");
    await act("changes-service", project, stage, "receive", {
      request_id: service.request,
      outcome: "Received",
      evidence: "SYN original bytes received",
    });
    await act("changes-service", project, stage, "receive", {
      request_id: service.request,
      outcome: "Accepted",
      evidence: "SYN independent receiving review",
    });
    const response = randomUUID();
    await act("coordinator", project, stage, "response", {
      id: response,
      request_id: customer.request,
      respondent_id: PJ.person,
      authority_basis: "Unknown pending independent validation",
      method: "Synthetic signed response evidence",
      evidence: "SYN incoming exact response retained",
      outcome: "Accepted",
      response_time: "2026-09-21",
      time_precision: "Date",
      unit_ids: [s.unit],
    });
    assert.equal(
      (await read(project, stage)).selected!.outcomes.customer,
      "Validation needed",
    );
    await act("materials-reviewer", project, stage, "validate", {
      id: response,
      authority_basis:
        "SYN independently verified scoped appointment AP-HTTP-01",
    });
    const commercial = (await read(project, stage)).selected!.requirements.find(
      (r) => r.gate === "Commercial",
    )!.source;
    await act("finance-reviewer", project, stage, "commercial", {
      source_id: commercial.id,
      outcome: "Complete",
      evidence: "SYN commercial disposition independently reviewed",
    });
    assert.deepEqual((await read(project, stage)).selected!.closeout_gates, []);
    return {
      project,
      stage,
      service,
      customer,
      returned,
      commercial,
      unit: s.unit,
    };
  }
  return { cookie, call, read, act, readyJourney };
}
