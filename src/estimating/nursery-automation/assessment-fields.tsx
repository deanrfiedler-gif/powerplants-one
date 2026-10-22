"use client";
import { useId } from "react";
import { Field } from "../../components/business-ui";
import { Button } from "../../components/ui/button";
import { FactFields, Pick } from "./fields";
import { catalogue } from "./catalogue";
import {
  roles,
  dispositions,
  type Review,
  type Check,
  type Stage,
  type StageCase,
} from "./assessment-model";
function Text({
  label,
  value,
  change,
  max = 500,
}: {
  label: string;
  value: string | null;
  change: (v: string | null) => void;
  max?: number;
}) {
  const id = useId();
  return (
    <Field
      name={id}
      label={label}
      maxLength={max}
      value={value ?? ""}
      onChange={(v) => change(v || null)}
    />
  );
}
export { Text };
export function ReviewFields({
  label,
  value,
  change,
}: {
  label: string;
  value: Review;
  change: (v: Review) => void;
}) {
  return (
    <div className="nac-grid">
      <Pick
        label={label + " review"}
        value={value.state}
        values={["Pending", "Reviewed", "Rejected"]}
        change={(v) => change({ ...value, state: v as Review["state"] })}
      />
      <Text
        label={label + " reviewer"}
        max={120}
        value={value.reviewer}
        change={(reviewer) => change({ ...value, reviewer })}
      />
    </div>
  );
}
export function CheckFields({
  value,
  change,
}: {
  value: Check;
  change: (v: Check) => void;
}) {
  return (
    <fieldset className="nac-card">
      <legend>{value.aspect}</legend>
      <Pick
        label={value.aspect + " result"}
        value={value.state}
        values={["Unknown", "Compatible", "Incompatible", "NotApplicable"]}
        change={(v) => change({ ...value, state: v as Check["state"] })}
      />
      <Text
        label={value.aspect + " evidence or applicability reason"}
        value={value.source}
        change={(source) => change({ ...value, source })}
      />
      <ReviewFields
        label={value.aspect}
        value={value.review}
        change={(review) => change({ ...value, review })}
      />
      <Text
        label={value.aspect + " clarification owner"}
        value={value.owner}
        max={120}
        change={(owner) => change({ ...value, owner })}
      />
      <Text
        label={value.aspect + " next action"}
        value={value.action}
        change={(action) => change({ ...value, action })}
      />
    </fieldset>
  );
}
export function StageFields({
  value: s,
  change,
}: {
  value: Stage;
  change: (v: Stage) => void;
}) {
  return (
    <>
      <Text
        label="Stage name"
        value={s.name}
        max={120}
        change={(name) => change({ ...s, name: name ?? "" })}
      />
      <div className="nac-grid">
        <Pick
          label="Process role"
          value={s.role}
          values={roles}
          change={(v) => change({ ...s, role: v as Stage["role"] })}
        />
        <Pick
          label="Stage phase"
          value={s.phase}
          values={["Current", "Future", "Both"]}
          change={(v) => change({ ...s, phase: v as Stage["phase"] })}
        />
        <Pick
          label="Equipment disposition"
          value={s.disposition}
          values={dispositions}
          change={(v) =>
            change({ ...s, disposition: v as Stage["disposition"] })
          }
        />
        <Pick
          label="Equipment selection"
          value={s.selection}
          values={["Base", "Selected", "Offered", "Excluded", "Parked"]}
          change={(v) => change({ ...s, selection: v as Stage["selection"] })}
        />
      </div>
      <label className="nac-field">
        Equipment candidate
        <select
          value={s.candidate_id ?? ""}
          onChange={(e) =>
            change({ ...s, candidate_id: e.target.value || null })
          }
        >
          <option value="">No candidate binding</option>
          {catalogue.entries.map((e) => (
            <option key={e.id} value={e.id}>
              {e.supplier} {e.model}
            </option>
          ))}
        </select>
      </label>
      <Text
        label="Exact regional model and options"
        value={s.configuration}
        change={(configuration) => change({ ...s, configuration })}
      />
      <CheckFields
        value={s.configuration_evidence}
        change={(configuration_evidence) =>
          change({ ...s, configuration_evidence })
        }
      />
      <details>
        <summary>Equipment, installation and purchasing quantities</summary>
        {(
          [
            "technical_count",
            "installation_count",
            "spare_count",
            "waste_count",
            "pack_size",
          ] as const
        ).map((k) => (
          <FactFields
            key={k}
            label={k.replaceAll("_", " ")}
            unit="units"
            fact={s[k]}
            change={(f) => change({ ...s, [k]: f })}
          />
        ))}
        <ReviewFields
          label="Pack conversion"
          value={s.quantity_review}
          change={(quantity_review) => change({ ...s, quantity_review })}
        />
      </details>
    </>
  );
}
export function CaseFields({
  value: c,
  change,
}: {
  value: StageCase;
  change: (v: StageCase) => void;
}) {
  return (
    <>
      <FactFields
        label="Operators required for manual stage"
        unit="people"
        fact={c.operators}
        change={(operators) => change({ ...c, operators })}
      />
      <FactFields
        label="Complete-stage rate"
        unit="per hour"
        fact={c.rate}
        change={(rate) => change({ ...c, rate })}
      />
      <div className="nac-grid">
        <Pick
          label="Rate unit"
          value={c.rate_unit}
          values={["PotsPerHour", "TraysPerHour"]}
          change={(v) =>
            change({ ...c, rate_unit: v as StageCase["rate_unit"] })
          }
        />
        <Pick
          label="Rate quality basis"
          value={c.rate_basis}
          values={["Gross", "NetGood"]}
          change={(v) =>
            change({ ...c, rate_basis: v as StageCase["rate_basis"] })
          }
        />
      </div>
      <ReviewFields
        label="Stage rate"
        value={c.rate_review}
        change={(rate_review) => change({ ...c, rate_review })}
      />
      {c.rate_unit === "TraysPerHour" && (
        <FactFields
          label="Occupied pots per tray"
          unit="pots"
          fact={c.occupancy}
          change={(occupancy) => change({ ...c, occupancy })}
        />
      )}
      {c.limits.map((l, i) => (
        <details key={l.dimension}>
          <summary>{l.dimension.replaceAll("_", " ")} limits</summary>
          <FactFields
            label="Minimum"
            unit={l.dimension}
            fact={l.minimum}
            change={(minimum) =>
              change({
                ...c,
                limits: c.limits.map((v, j) =>
                  i === j ? { ...v, minimum } : v,
                ),
              })
            }
          />
          <FactFields
            label="Maximum"
            unit={l.dimension}
            fact={l.maximum}
            change={(maximum) =>
              change({
                ...c,
                limits: c.limits.map((v, j) =>
                  i === j ? { ...v, maximum } : v,
                ),
              })
            }
          />
          {(["minimum_inclusive", "maximum_inclusive"] as const).map((k) => (
            <label key={k}>
              <input
                type="checkbox"
                checked={l[k]}
                onChange={(e) =>
                  change({
                    ...c,
                    limits: c.limits.map((v, j) =>
                      i === j ? { ...v, [k]: e.target.checked } : v,
                    ),
                  })
                }
              />
              {k.replaceAll("_", " ")}
            </label>
          ))}
          <ReviewFields
            label={l.dimension}
            value={l.review}
            change={(review) =>
              change({
                ...c,
                limits: c.limits.map((v, j) =>
                  i === j ? { ...v, review } : v,
                ),
              })
            }
          />
        </details>
      ))}
      <details>
        <summary>Geometry, nesting, plant, media and operation checks</summary>
        {c.checks.map((item, i) => (
          <CheckFields
            key={item.aspect}
            value={item}
            change={(v) =>
              change({
                ...c,
                checks: c.checks.map((x, j) => (i === j ? v : x)),
              })
            }
          />
        ))}
      </details>
    </>
  );
}
export function MoveButtons({
  index,
  length,
  move,
  remove,
}: {
  index: number;
  length: number;
  move: (i: number) => void;
  remove: () => void;
}) {
  return (
    <div className="nac-actions">
      <Button
        type="button"
        disabled={index === 0}
        onClick={() => move(index - 1)}
      >
        Move earlier
      </Button>
      <Button
        type="button"
        disabled={index === length - 1}
        onClick={() => move(index + 1)}
      >
        Move later
      </Button>
      <Button type="button" onClick={remove}>
        Remove stage
      </Button>
    </div>
  );
}
