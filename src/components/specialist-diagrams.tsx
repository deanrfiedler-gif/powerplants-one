"use client";
import { useState } from "react";
import type {
  Calculation,
  DraftProposal,
} from "../estimating/specialist/types";
export function SpecialistDiagrams({
  calculation,
  proposal,
  stale,
}: {
  calculation: Calculation | null;
  proposal: DraftProposal;
  stale: boolean;
}) {
  const [view, setView] = useState("Plan"),
    [open, setOpen] = useState(false);
  if (!calculation || calculation.state !== "Current")
    return <p>Valid geometry is needed for a schematic.</p>;
  const f = (key: string) =>
      Number(calculation.facts.find((f) => f.key === key)?.value.display ?? 0),
    w = f("width"),
    len = f("length"),
    scale = 280 / Math.max(w, len),
    dw = w * scale,
    dl = len * scale,
    count = f("drives"),
    marks = Math.min(60, count),
    height = proposal.inputs.height.raw;
  return (
    <section className="es08-diagrams" aria-label="Screen Systems schematics">
      <div className="es08-toolbar">
        <label>
          Drawing
          <select value={view} onChange={(e) => setView(e.target.value)}>
            {["Plan", "Screen cut", "Cross section", "Bay section"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={open}
            onChange={(e) => setOpen(e.target.checked)}
          />{" "}
          Open illustration
        </label>
      </div>
      <p>
        {stale ? "Stale reference geometry · " : ""}Schematic only · nominal
        roof geometry; vertical exaggeration in sections
      </p>
      <svg
        viewBox="0 0 380 350"
        role="img"
        aria-label={`${view}: ${w} m wide, ${len} m long; ${count} drive positions; screen height ${height} m`}
      >
        <title>{view} · Screen Systems synthetic review</title>
        {view === "Plan" ? (
          <g transform="translate(44 34)">
            <rect width={dw} height={dl} fill="#edf0f5" stroke="#526078" />
            {Array.from(
              { length: Math.min(40, Number(proposal.inputs.bays.raw)) },
              (_, i) => (
                <line
                  key={i}
                  x1="0"
                  y1={(i * dl) / Math.min(40, Number(proposal.inputs.bays.raw))}
                  x2={dw}
                  y2={(i * dl) / Math.min(40, Number(proposal.inputs.bays.raw))}
                  stroke="#cbd2dc"
                />
              ),
            )}
            {Array.from({ length: marks }, (_, i) => {
              const down = Number(proposal.inputs.down.raw),
                perGroup = count / down,
                ordinal = Math.floor((i * count) / marks),
                group = Math.floor(ordinal / perGroup),
                across = ordinal % perGroup;
              return (
                <line
                  key={i}
                  x1={((across + 0.5) * dw) / perGroup}
                  x2={((across + 0.5) * dw) / perGroup}
                  y1={(group * dl) / down}
                  y2={((group + 1) * dl) / down}
                  stroke="#355b80"
                  strokeDasharray="3 2"
                />
              );
            })}
            {Array.from(
              {
                length: Math.min(
                  60,
                  Number(proposal.inputs.across.raw) *
                    Number(proposal.inputs.down.raw),
                ),
              },
              (_, i) => {
                const across = Number(proposal.inputs.across.raw),
                  down = Number(proposal.inputs.down.raw);
                return (
                  <circle
                    key={i}
                    cx={(((i % across) + 0.5) * dw) / across}
                    cy={((Math.floor(i / across) + 0.5) * dl) / down}
                    r="3"
                    fill="#80530e"
                  />
                );
              },
            )}
            <text x={dw / 2} y={dl + 24} textAnchor="middle">
              {w} m physical width
            </text>
            <text x="0" y="-12">
              {len} m length · {proposal.inputs.across.raw} ×{" "}
              {proposal.inputs.down.raw} motor groups
            </text>
            {Number(proposal.inputs.wallSpans.raw) > 0 && (
              <path
                d={`M${dw + 5},0 v${dl}`}
                stroke="#80530e"
                strokeDasharray="5 4"
              />
            )}
          </g>
        ) : view === "Screen cut" ? (
          <g transform="translate(25 45)">
            <rect
              y="40"
              width="320"
              height="100"
              fill="#edf5e9"
              stroke="#416d33"
            />
            <path
              d="M20 25v130 M300 25v130"
              stroke="#80530e"
              strokeDasharray="4 3"
            />
            <text x="160" y="88" textAnchor="middle">
              Cut {f("cut")} m × cloth {f("clothWidth")} m
            </text>
            <text y="185">Coverage {f("groupWidth")} m</text>
            <text y="211">
              Shrink {proposal.inputs.shrink.raw}% · overhang{" "}
              {proposal.inputs.overhang.raw} m each
            </text>
            <text y="237">Standard: add overhang, then round up to 0.1 m</text>
            <text y="263">Additional: round up first, then add overhang</text>
          </g>
        ) : (
          <g transform="translate(25 45)">
            <path
              d={
                proposal.inputs.roof.raw === "Arch"
                  ? "M0 100 Q160 -90 320 100"
                  : proposal.inputs.roof.raw === "Venlo"
                    ? "M0 100 L80 20 L160 100 L240 20 L320 100"
                    : "M0 100 L160 10 L320 100"
              }
              fill="none"
              stroke="#526078"
              strokeWidth="2"
            />
            <path
              d="M0 100v150 M320 100v150 M0 250h320"
              fill="none"
              stroke="#526078"
            />
            <path
              d={open ? "M0 140h60 M260 140h60" : "M0 140h320"}
              stroke="#416d33"
              strokeWidth="4"
            />
            <text y="282">
              Height to screen {height} m · {proposal.inputs.edge.raw}
            </text>
            {view === "Bay section" ? (
              <>
                <text x="15" y="190">
                  {proposal.inputs.truss.raw} truss ·{" "}
                  {proposal.inputs.chordHeight.raw} mm chord
                </text>
                <text x="15" y="216">
                  {proposal.inputs.leading.raw} · {proposal.inputs.drive.raw}
                </text>
                <text x="15" y="240">
                  {proposal.inputs.bed.raw} · odd bay {proposal.inputs.odd.raw}
                </text>
              </>
            ) : (
              <text x="15" y="190">
                {proposal.inputs.roof.raw} · {proposal.inputs.across.raw} screen
                groups
              </text>
            )}
          </g>
        )}
      </svg>
      <p>
        {count} exact drive positions;{" "}
        {marks < count
          ? `visual marks thinned to ${marks}; quantities unchanged.`
          : "all position marks shown."}{" "}
        Floor area {f("area")} m²; standard cloth {f("cloth")} m². Wall spans{" "}
        {proposal.inputs.wallSpans.raw} affect calculation width only.
      </p>
    </section>
  );
}
