"use client";
import { families } from "../../estimating/fertigation/definition";
import { candidateFailures } from "../../estimating/fertigation/guidance";
import type {
  Candidate,
  Family,
  Result,
} from "../../estimating/fertigation/types";
import { FertigationCandidateDetails } from "../fertigation-candidate-details";
import { EnvelopeAxis, EnvelopeBar } from "../fertigation-charts";
import { newRecord } from "../fertigation-fields";
import { viewEyebrow } from "../fertigation-frame";
import {
  BasisTag,
  Button,
  Chip,
  Legend,
  Notice,
  PageHead,
  Panel,
  Tile,
  Tiles,
  Token,
  fmt,
  known,
} from "../fertigation-ui";
import type { ViewContext } from "./context";

/* 07 · Priva fertigation unit configurator: one comparison over the configured candidates (D5). */

const value = (r: Result | undefined) =>
  r && r.state === "known" && known(r.value) ? r.value : null;

export function ConfiguratorView({ ctx }: { ctx: ViewContext }) {
  const { proposal: s, calculation: calc, canEdit } = ctx;
  const unitFlows = (calc?.group_flows ?? [])
    .map((g) => value(g.unit))
    .filter(known);
  const requiredMin = unitFlows.length ? Math.min(...unitFlows) : null,
    requiredMax = unitFlows.length ? Math.max(...unitFlows) : null;
  const recipes = new Set(s.groups.map((g) => g.recipe_id).filter(Boolean));
  const channels = new Set(
    s.stocks
      .filter(
        (x) =>
          x.recipe_id &&
          recipes.has(x.recipe_id) &&
          x.function !== "spare" &&
          x.phase !== "excluded",
      )
      .map((x) => x.function),
  );
  const controller = s.controllers.find((c) => c.phase !== "excluded");
  const shortlisted = s.candidates.filter(
    (c) => c.shortlisted && c.phase !== "excluded",
  );
  const failures = calc ? candidateFailures(s, calc) : [];
  const axisMax = Math.max(
    ...s.candidates.flatMap((c) => [c.maximum_m3h ?? 0, c.minimum_m3h ?? 0]),
    requiredMax ?? 0,
    20,
  );
  const axis = Math.ceil((axisMax * 1.1) / 10) * 10;
  const configure = (family: Family, candidate?: Candidate) =>
    ctx.edit("candidates", candidate ?? { ...newRecord("candidates"), family });
  const toggleShortlist = (candidate: Candidate) =>
    ctx.update({
      ...s,
      candidates: s.candidates.map((c) =>
        c.id === candidate.id ? { ...c, shortlisted: !c.shortlisted } : c,
      ),
    });
  return (
    <>
      <PageHead
        eyebrow={viewEyebrow("configurator")}
        title="Priva fertigation unit configurator"
        lede="Compare configured candidates, then validate the exact supplier configuration against the active scenario."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon="calculate"
            disabled={ctx.previewBusy || ctx.pending}
            onClick={ctx.calculate}
          >
            {ctx.previewBusy ? "Calculating…" : "Validate & compare candidates"}
          </Button>
        }
      />
      <Tiles>
        <Tile
          label="Required operating range"
          value={
            known(requiredMin) && known(requiredMax) ? (
              `${fmt(requiredMin)}–${fmt(requiredMax)}`
            ) : (
              <Token>Not assessed</Token>
            )
          }
          unit={known(requiredMin) ? "m³/h" : undefined}
          tag={<BasisTag basis="calculated" />}
          foot="Final delivered flow through the unit"
        />
        <Tile
          label="Recipe channels required"
          value={channels.size}
          tag={<BasisTag basis="entered" />}
          foot={
            channels.size
              ? [...channels].join(", ")
              : "No stock bound to a scheduled recipe"
          }
        />
        <Tile
          label="Control architecture"
          value={
            controller && controller.family !== "unknown" ? (
              controller.family
            ) : (
              <Token>Not recorded</Token>
            )
          }
          tag={<BasisTag basis="entered" />}
          foot="Exact versions and licences to confirm"
        />
        <Tile
          label="Shortlisted family"
          value={
            shortlisted.length ? (
              shortlisted.map((c) => c.family).join(", ")
            ) : (
              <Token>Not selected</Token>
            )
          }
          tag={<BasisTag basis="declared" />}
          foot="Selection is a scope proposal"
        />
      </Tiles>
      <Notice tone="info">
        Published family descriptions guide the shortlist. The capacity engine
        uses only the exact configuration limits entered below. Missing evidence
        stays &ldquo;Verification required&rdquo;; broad catalogue figures are
        never treated as project approval.
      </Notice>
      <Panel
        title="Priva Nutri-Line families against the active scenario"
        subtitle="Entered envelopes are user-entered and unverified · project fit uses exact configuration limits only"
        actions={
          <Legend
            items={[
              { swatch: "fn-swatch-entered", label: "Entered envelope" },
              { swatch: "fn-swatch-open", label: "Maximum not entered" },
              {
                swatch: "fn-swatch-required",
                label:
                  known(requiredMin) && known(requiredMax)
                    ? `Required ${fmt(requiredMin)}–${fmt(requiredMax)} m³/h`
                    : "Required range not assessed",
              },
            ]}
          />
        }
        foot={
          failures.length ? (
            <span>
              <Chip tone="conflict" icon="conflict">
                Stated once
              </Chip>{" "}
              {failures
                .map((f) => `${f.label}: ${f.failures.join(" ")}`)
                .join(" · ")}
            </span>
          ) : (
            "Exact configuration, verified flow envelope and configured channel count are missing until a candidate is configured and evidenced."
          )
        }
      >
        <ul className="fn-families">
          {families.map((family) => {
            const candidates = s.candidates.filter(
              (c) => c.family === family && c.phase !== "excluded",
            );
            if (!candidates.length)
              return (
                <li key={family} className="fn-family fn-family-empty">
                  <div className="fn-family-name">
                    <strong>{family}</strong>
                    <small>No configured candidate</small>
                  </div>
                  <div className="fn-family-bar">
                    <EnvelopeBar
                      min={null}
                      max={null}
                      requiredMin={requiredMin}
                      requiredMax={requiredMax}
                      axisMax={axis}
                    />
                    <small>
                      Enter the exact configuration limits from a dated supplier
                      schedule
                    </small>
                  </div>
                  <div className="fn-family-read">
                    <Chip tone="unknown">Not assessable</Chip>
                  </div>
                  <div className="fn-family-actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!canEdit}
                      onClick={() => configure(family)}
                    >
                      Configure
                    </Button>
                  </div>
                </li>
              );
            return candidates.map((c) => {
              const status = calc?.candidates.find((x) => x.id === c.id);
              return (
                <li key={c.id} className="fn-family">
                  <div className="fn-family-name">
                    <strong>{c.label || family}</strong>
                    <small>
                      {[
                        c.label && c.label !== family ? family : "",
                        c.variant,
                        c.arrangement,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Variant and arrangement not recorded"}
                    </small>
                  </div>
                  <div className="fn-family-bar">
                    <EnvelopeBar
                      min={c.minimum_m3h}
                      max={c.maximum_m3h}
                      requiredMin={requiredMin}
                      requiredMax={requiredMax}
                      axisMax={axis}
                    />
                    <small>
                      {known(c.minimum_m3h) && known(c.maximum_m3h)
                        ? `${fmt(c.minimum_m3h)}–${fmt(c.maximum_m3h)} m³/h entered`
                        : "Flow envelope not entered"}
                      {known(c.minimum_pressure_bar) &&
                      known(c.maximum_pressure_bar)
                        ? ` · ${fmt(c.minimum_pressure_bar)}–${fmt(c.maximum_pressure_bar)} bar at ${c.pressure_boundary.replaceAll("_", " ")}`
                        : ""}
                      {c.capability_evidence_id
                        ? " · evidence linked"
                        : " · envelope unverified"}
                    </small>
                  </div>
                  <div className="fn-family-read">
                    {!status ? (
                      <Chip tone="unknown">Not assessed</Chip>
                    ) : status.status === "outside_entered_limits" ? (
                      <Chip tone="conflict" icon="conflict">
                        Outside entered limits
                      </Chip>
                    ) : status.status === "not_assessable" ? (
                      <Chip tone="unknown">Not assessable</Chip>
                    ) : (
                      <Chip tone="incomplete">
                        Within entered checks · confirmation pending
                      </Chip>
                    )}
                    {status && status.unknowns.length > 0 && (
                      <small>
                        {status.unknowns.length}{" "}
                        {status.unknowns.length === 1 ? "input" : "inputs"}{" "}
                        unresolved
                      </small>
                    )}
                  </div>
                  <div className="fn-family-actions">
                    {c.shortlisted ? (
                      <span className="fn-shortlisted">
                        <Chip tone="success">Shortlisted</Chip>
                        {canEdit && (
                          <Button
                            variant="quiet"
                            size="sm"
                            aria-label={`Remove ${c.label} from shortlist`}
                            onClick={() => toggleShortlist(c)}
                          >
                            Remove
                          </Button>
                        )}
                      </span>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!canEdit}
                        onClick={() => toggleShortlist(c)}
                      >
                        Shortlist
                      </Button>
                    )}
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() => configure(family, c)}
                    >
                      {canEdit ? "Configure" : "View"}
                    </Button>
                  </div>
                </li>
              );
            });
          })}
        </ul>
        <EnvelopeAxis axisMax={axis} unit="m³/h" />
      </Panel>
      {calc && <FertigationCandidateDetails scope={s} calculation={calc} />}
      {!calc && (
        <Notice tone="warning">
          Recalculate the draft to compare the configured candidates against the
          active scenario.
        </Notice>
      )}
    </>
  );
}
