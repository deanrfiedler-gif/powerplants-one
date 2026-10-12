"use client";
import { severityCounts } from "../../estimating/fertigation/guidance";
import { FindingsReview } from "../fertigation-cockpit";
import { viewEyebrow } from "../fertigation-frame";
import {
  BasisTag,
  Button,
  ButtonLink,
  Chip,
  Notice,
  PageHead,
  Panel,
  Tile,
  Tiles,
} from "../fertigation-ui";
import type { ViewContext } from "./context";

/* 09 · Scope review & handover: the left column. The review, handover and report panels sit beside it. */

export function ReviewView({ ctx }: { ctx: ViewContext }) {
  const { proposal: s, calculation: calc, data, canEdit } = ctx;
  const counts = severityCounts((calc ?? data.calculation).findings);
  return (
    <div className="fn-review-main">
      <PageHead
        eyebrow={viewEyebrow("review")}
        title="Scope review & handover"
        lede="Resolve open checks, record a review against this exact revision, then hand the scope to Discovery."
        actions={
          <Button variant="secondary" size="sm" icon="calculate" disabled={ctx.previewBusy || ctx.pending} onClick={ctx.calculate}>
            {ctx.previewBusy ? "Calculating…" : "Validate & calculate draft"}
          </Button>
        }
      />
      <Tiles>
        <Tile
          label="Conflicts"
          value={counts.conflict}
          tone={counts.conflict ? "conflict" : undefined}
          tag={counts.conflict ? <Chip tone="conflict" icon="conflict">Conflict</Chip> : <BasisTag basis="calculated" />}
          foot="Resolve before relying on sizing"
        />
        <Tile label="Incomplete" value={counts.incomplete} tag={<BasisTag basis="calculated" />} foot="A required input is missing" />
        <Tile label="Review" value={counts.review} tag={<BasisTag basis="calculated" />} foot="Evidence or specialist judgement" />
        <Tile
          label="Calculation edition"
          size="sm"
          value={(calc ?? data.calculation).edition}
          tag={<BasisTag basis="entered" />}
          foot={calc ? ctx.guidanceBasis : "Saved revision; draft not recalculated"}
        />
      </Tiles>
      <Panel
        title="Open checks"
        count={counts.total}
        subtitle="Grouped by the section that resolves them · each has a default responsible role"
        actions={
          canEdit && (
            <Button variant="secondary" size="sm" icon="plus" onClick={() => ctx.edit("actions")}>
              Add action
            </Button>
          )
        }
        foot="Engineering approval is not configured. Review notes retain outstanding conditions; technical suitability and automatic costing remain held."
      >
        {!calc ? (
          <Notice tone="warning">Recalculate the changed draft to see current findings.</Notice>
        ) : (
          <FindingsReview
            scope={s}
            calculation={calc}
            onOpenRecord={ctx.openRecord}
            onView={ctx.changeView}
            canResolve={(id) => canEdit && ctx.resolveList.some((r) => r.key === id)}
            onResolve={(id) => ctx.resolveFor((key) => key === id)}
          />
        )}
      </Panel>
      <Panel
        title="Revision & output"
        subtitle={`Outputs refer to saved revision ${data.revision.version}; draft edits are not included.`}
      >
        <div className="fn-actions">
          <Button variant="secondary" icon="history" onClick={ctx.openHistory}>
            History & exact revisions
          </Button>
          <ButtonLink
            variant="secondary"
            icon="download"
            href={`/api/v1/estimating/fertigation/${ctx.scopeId}/export?revision_id=${data.revision.id}&format=json`}
            download
          >
            Export exact saved scope
          </ButtonLink>
          <ButtonLink
            variant="secondary"
            icon="download"
            href={`/api/v1/estimating/fertigation/${ctx.scopeId}/export?revision_id=${data.revision.id}&format=valves`}
            download
          >
            Export valve CSV
          </ButtonLink>
          <ButtonLink
            variant="secondary"
            icon="external"
            href={`/api/v1/estimating/fertigation/${ctx.scopeId}/report?revision_id=${data.revision.id}&audience=internal`}
            target="_blank"
            rel="noreferrer"
          >
            Open saved internal report
          </ButtonLink>
        </div>
      </Panel>
    </div>
  );
}
