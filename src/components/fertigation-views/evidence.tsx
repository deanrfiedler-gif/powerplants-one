"use client";
import { viewEyebrow } from "../fertigation-frame";
import { Button, Columns, Facts, PageHead, Panel, Token } from "../fertigation-ui";
import { RegisterTabs } from "./registers";
import type { ViewContext } from "./context";

/* 08 · Evidence, installation & delivery. The prepared-file panel is mounted by the workspace below. */

const fact = (value: string, missing = "Not recorded") =>
  value?.trim() ? value : <Token>{missing}</Token>;

export function EvidenceView({ ctx }: { ctx: ViewContext }) {
  const { proposal: s, canEdit } = ctx;
  return (
    <>
      <PageHead
        eyebrow={viewEyebrow("evidence")}
        title="Evidence, installation & delivery"
        lede="Retain the documents, photographs and named responsibilities behind the scope."
      />
      <RegisterTabs ctx={ctx} view="evidence" />
      <Columns>
        <Panel
          title="Shed, power, communications & access"
          subtitle={`${[s.services.shed, s.services.power, s.services.communications, s.services.access].filter((v) => v?.trim()).length} of 4 site services recorded`}
          actions={
            <Button variant="secondary" size="sm" icon="edit" disabled={!canEdit} onClick={() => ctx.edit("services", s.services)}>
              Edit services & access
            </Button>
          }
        >
          <Facts
            rows={[
              ["Installation location", fact(s.services.shed, "To confirm")],
              ["Electrical supply", fact(s.services.power)],
              ["Field communications", fact(s.services.communications, "To confirm")],
              ["Service access", fact(s.services.access, "To confirm")],
            ]}
          />
        </Panel>
        <Panel
          title="Alarms, fallback & responsibilities"
          subtitle="Detection, action and agreed continuity for each failure condition"
          actions={
            <Button variant="secondary" size="sm" icon="edit" disabled={!canEdit} onClick={() => ctx.edit("resilience", s.resilience)}>
              Edit alarms & responsibilities
            </Button>
          }
        >
          <Facts
            rows={[
              ["Alarm register", fact(s.resilience.alarms, "Not agreed")],
              ["Fallback", fact(s.resilience.fallback, "Not agreed")],
              ["Responsibilities", fact(s.resilience.responsibilities, "Unassigned")],
            ]}
          />
        </Panel>
      </Columns>
    </>
  );
}
