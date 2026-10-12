"use client";
import { IoBankRow, ioLegend } from "../fertigation-charts";
import { human } from "../fertigation-fields";
import { viewEyebrow } from "../fertigation-frame";
import {
  BasisTag,
  Button,
  Chip,
  Facts,
  Hint,
  Notice,
  PageHead,
  Panel,
  Tile,
  Tiles,
  Token,
  known,
} from "../fertigation-ui";
import { RegisterTabs } from "./registers";
import type { ViewContext } from "./context";

/* 05 · Priva controls & field I/O: audit the existing installation before allocating expansion capacity. */

export function ControlsView({ ctx }: { ctx: ViewContext }) {
  const { proposal: s, calculation: calc, canEdit } = ctx;
  const scenario = s.scenarios.find((x) => x.id === s.selected_scenario_id);
  const active = (phase: string) =>
    phase !== "excluded" && (phase !== "future" || scenario?.include_future === true);
  const banks = s.banks.filter((b) => active(b.phase));
  const short = (calc?.io ?? []).filter(
    (io) => io.spare.state === "known" && known(io.spare.value) && io.spare.value < 0,
  ).length;
  const controllers = s.controllers.filter((c) => active(c.phase));
  return (
    <>
      <PageHead
        eyebrow={viewEyebrow("controls")}
        title="Priva controls & field I/O"
        lede="Audit the existing installation before allocating expansion capacity."
      />
      <Tiles>
        <Tile
          label="Control systems"
          value={controllers.length}
          tag={<BasisTag basis="entered" />}
          foot="Existing and proposed kept separate"
        />
        <Tile
          label="Typed I/O banks"
          value={banks.length}
          tag={<BasisTag basis="entered" />}
          foot="Physical module and location basis"
        />
        <Tile
          label="Banks with a shortfall"
          value={calc ? short : <Token>Not assessed</Token>}
          tag={calc && short ? <Chip tone="conflict" icon="conflict">Conflict</Chip> : <BasisTag basis="calculated" />}
          tone={calc && short ? "conflict" : undefined}
          foot="No pooling across signal types"
        />
        <Tile
          label="Required start strategies"
          value={s.strategies.filter((x) => active(x.phase)).length}
          tag={<BasisTag basis="entered" />}
          foot="Capabilities require evidence"
        />
      </Tiles>
      <Panel
        title="I/O capacity & expansion demand"
        count={banks.length}
        subtitle="Each cell is one physical channel · available = installed − used − reserved − faulty"
        foot="Counts must be mutually exclusive. Universal channels are assigned once; software licences remain a separate check."
      >
        {banks.length ? (
          <>
            {ioLegend}
            <ul className="fn-iobanks">
              {banks.map((bank) => (
                <IoBankRow
                  key={bank.id}
                  bank={bank}
                  io={calc?.io.find((x) => x.bank_id === bank.id)}
                  controller={
                    s.controllers.find((c) => c.id === bank.controller_id)?.label ?? "Controller not linked"
                  }
                />
              ))}
            </ul>
            {!calc && (
              <Notice tone="warning">Recalculate the draft to assess the expansion demand on each bank.</Notice>
            )}
          </>
        ) : (
          <Hint>No I/O bank is recorded for this scenario. Add the physical banks of the existing controller.</Hint>
        )}
      </Panel>
      <RegisterTabs ctx={ctx} view="controls" />
      <Panel
        title="GroScales scope"
        subtitle="Moisture balance needs Compact CC or Connext rather than Compass; exact models, software, licences and hardware require manufacturer confirmation"
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon="edit"
            disabled={!canEdit}
            onClick={() => ctx.edit("groscales", s.groscales)}
          >
            Edit GroScales scope
          </Button>
        }
      >
        <Facts
          rows={[
            ["Required", s.groscales.required === "unknown" ? <Token>Unknown</Token> : human(s.groscales.required)],
            ["Mode", s.groscales.mode === "unknown" ? <Token>Unknown</Token> : human(s.groscales.mode)],
            [
              "Controller",
              s.controllers.find((c) => c.id === s.groscales.controller_id)?.label ?? <Token>Not assigned</Token>,
            ],
            ["Ancillary hardware", s.groscales.ancillary_hardware || <Token>Not recorded</Token>],
          ]}
        />
      </Panel>
    </>
  );
}
