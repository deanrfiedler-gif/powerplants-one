"use client";
import { Button } from "../../../components/ui/button";
import type { BasisContent } from "../model";
import type { ControlRead } from "../reads";
import { TextField, Pick, People, Sources, Choices } from "./fields";
export function BasisEditor({
  data,
  value,
  onChange,
  view,
}: {
  data: ControlRead;
  value: BasisContent;
  onChange: (v: BasisContent) => void;
  view: string;
}) {
  const put = <K extends keyof BasisContent>(key: K, next: BasisContent[K]) =>
    onChange({ ...value, [key]: next });
  const deliverables = data.records.deliverable.map((d) => ({
    id: d.id,
    label: `${d.reference} · ${d.title}`,
  }));
  return (
    <>
      {view === "basis" && (
        <>
          <TextField
            label="Design basis and scope"
            area
            value={value.summary}
            onChange={(v) => put("summary", v)}
            required
          />
          <TextField
            label="Exclusions and limits"
            area
            value={value.exclusions}
            onChange={(v) => put("exclusions", v)}
            required
          />
          <Pick
            label="Review purpose"
            value={value.purpose}
            onChange={(v) => put("purpose", v as BasisContent["purpose"])}
            options={[
              { id: "InformationOnly", label: "Information only" },
              { id: "DesignPreparation", label: "Design preparation" },
              {
                id: "TechnicalReleaseForProcurement",
                label: "Technical release for procurement",
              },
            ]}
          />
          <Choices
            label="Facility / growing-area applicability"
            options={data.facilities.map((f) => ({
              id: f.id,
              label: f.display_name,
            }))}
            value={value.facility_ids}
            onChange={(v) => put("facility_ids", v)}
          />
        </>
      )}
      {view === "requirements" && (
        <>
          {value.requirements.map((item, index) => (
            <fieldset className="ec-edit-row" key={item.id}>
              <legend>Requirement {index + 1}</legend>
              <TextField
                label="Requirement"
                value={item.title}
                onChange={(v) =>
                  put(
                    "requirements",
                    value.requirements.map((r) =>
                      r.id === item.id ? { ...r, title: v } : r,
                    ),
                  )
                }
                required
              />
              <People
                data={data}
                label="Requirement owner"
                value={item.owner_id}
                onChange={(v) =>
                  put(
                    "requirements",
                    value.requirements.map((r) =>
                      r.id === item.id ? { ...r, owner_id: v } : r,
                    ),
                  )
                }
              />
              <TextField
                label="Acceptance criterion"
                area
                value={item.criterion}
                onChange={(v) =>
                  put(
                    "requirements",
                    value.requirements.map((r) =>
                      r.id === item.id ? { ...r, criterion: v } : r,
                    ),
                  )
                }
                required
              />
              <Sources
                data={data}
                value={item.source_ids}
                onChange={(v) =>
                  put(
                    "requirements",
                    value.requirements.map((r) =>
                      r.id === item.id ? { ...r, source_ids: v } : r,
                    ),
                  )
                }
              />
              <Choices
                label="Affected deliverables"
                options={deliverables}
                value={item.deliverable_ids}
                onChange={(v) =>
                  put(
                    "requirements",
                    value.requirements.map((r) =>
                      r.id === item.id ? { ...r, deliverable_ids: v } : r,
                    ),
                  )
                }
              />
              <Button
                variant="quiet"
                onClick={() =>
                  put(
                    "requirements",
                    value.requirements.filter((r) => r.id !== item.id),
                  )
                }
              >
                Remove draft requirement
              </Button>
            </fieldset>
          ))}
          <Button
            onClick={() =>
              put("requirements", [
                ...value.requirements,
                {
                  id: crypto.randomUUID(),
                  title: "",
                  criterion: "",
                  owner_id: data.actor_id,
                  source_ids: [],
                  deliverable_ids: [],
                },
              ])
            }
          >
            Add requirement
          </Button>
        </>
      )}
      {view === "assumptions" && (
        <>
          {value.inputs.map((item, index) => {
            const update = (patch: Partial<typeof item>) =>
              put(
                "inputs",
                value.inputs.map((r) =>
                  r.id === item.id ? { ...r, ...patch } : r,
                ),
              );
            return (
              <fieldset className="ec-edit-row" key={item.id}>
                <legend>Input {index + 1}</legend>
                <Pick
                  label="Input type"
                  value={item.kind}
                  onChange={(v) => update({ kind: v as typeof item.kind })}
                  options={["Assumption", "Constraint", "Question"].map(
                    (id) => ({ id, label: id }),
                  )}
                />
                <TextField
                  label="Assumption, constraint or question"
                  value={item.title}
                  onChange={(v) => update({ title: v })}
                  required
                />
                <People
                  data={data}
                  label="Input owner"
                  value={item.owner_id}
                  onChange={(v) => update({ owner_id: v })}
                />
                <TextField
                  label="Response due"
                  type="date"
                  value={item.due_date}
                  onChange={(v) => update({ due_date: v || null })}
                />
                <Pick
                  label="Input certainty"
                  value={item.state}
                  onChange={(v) => update({ state: v as typeof item.state })}
                  options={["Unknown", "Unconfirmed", "Supported"].map(
                    (id) => ({ id, label: id }),
                  )}
                />
                <label>
                  <input
                    type="checkbox"
                    checked={item.blocking}
                    onChange={(e) => update({ blocking: e.target.checked })}
                  />{" "}
                  Blocks positive review until supported
                </label>
                <TextField
                  label="Response or decision evidence"
                  area
                  value={item.response}
                  onChange={(v) => update({ response: v || null })}
                />
                <Sources
                  data={data}
                  value={item.source_ids}
                  onChange={(v) => update({ source_ids: v })}
                />
                <Choices
                  label="Affected deliverables"
                  options={deliverables}
                  value={item.deliverable_ids}
                  onChange={(v) => update({ deliverable_ids: v })}
                />
                <Button
                  variant="quiet"
                  onClick={() =>
                    put(
                      "inputs",
                      value.inputs.filter((r) => r.id !== item.id),
                    )
                  }
                >
                  Remove draft input
                </Button>
              </fieldset>
            );
          })}
          <Button
            onClick={() =>
              put("inputs", [
                ...value.inputs,
                {
                  id: crypto.randomUUID(),
                  kind: "Assumption",
                  title: "",
                  owner_id: data.actor_id,
                  due_date: null,
                  blocking: true,
                  state: "Unknown",
                  response: null,
                  source_ids: [],
                  deliverable_ids: [],
                },
              ])
            }
          >
            Add assumption or question
          </Button>
        </>
      )}
      {view === "interfaces" && (
        <>
          {value.interfaces.map((item, index) => {
            const update = (patch: Partial<typeof item>) =>
              put(
                "interfaces",
                value.interfaces.map((r) =>
                  r.id === item.id ? { ...r, ...patch } : r,
                ),
              );
            return (
              <fieldset className="ec-edit-row" key={item.id}>
                <legend>Interface {index + 1}</legend>
                <TextField
                  label="Interface"
                  value={item.title}
                  onChange={(v) => update({ title: v })}
                  required
                />
                <People
                  data={data}
                  label="Providing owner"
                  value={item.provider_id}
                  onChange={(v) => update({ provider_id: v })}
                />
                <People
                  data={data}
                  label="Receiving owner"
                  value={item.receiver_id}
                  onChange={(v) => update({ receiver_id: v })}
                />
                <TextField
                  label="Required input"
                  area
                  value={item.required_input}
                  onChange={(v) => update({ required_input: v })}
                  required
                />
                <TextField
                  label="Expected output"
                  area
                  value={item.expected_output}
                  onChange={(v) => update({ expected_output: v })}
                  required
                />
                <TextField
                  label="Agreement criterion"
                  area
                  value={item.criterion}
                  onChange={(v) => update({ criterion: v })}
                  required
                />
                <Sources
                  data={data}
                  value={item.source_ids}
                  onChange={(v) => update({ source_ids: v })}
                />
                <p>
                  Both named parties confirm the saved interface separately.
                  Changed interface or adopted sources require new
                  confirmations.
                </p>
                <Button
                  variant="quiet"
                  onClick={() =>
                    put(
                      "interfaces",
                      value.interfaces.filter((r) => r.id !== item.id),
                    )
                  }
                >
                  Remove draft interface
                </Button>
              </fieldset>
            );
          })}
          <Button
            onClick={() =>
              put("interfaces", [
                ...value.interfaces,
                {
                  id: crypto.randomUUID(),
                  title: "",
                  provider_id: data.actor_id,
                  receiver_id: "",
                  required_input: "",
                  expected_output: "",
                  criterion: "",
                  source_ids: [],
                },
              ])
            }
          >
            Add interface
          </Button>
        </>
      )}
      {view === "sources" && (
        <>
          <Sources
            data={data}
            value={value.source_ids}
            onChange={(v) => put("source_ids", v)}
          />
          {value.calculations.map((item, index) => {
            const update = (patch: Partial<typeof item>) =>
              put(
                "calculations",
                value.calculations.map((r) =>
                  r.id === item.id ? { ...r, ...patch } : r,
                ),
              );
            return (
              <fieldset className="ec-edit-row" key={item.id}>
                <legend>Calculation / model {index + 1}</legend>
                <TextField
                  label="Calculation label"
                  value={item.title}
                  onChange={(v) => update({ title: v })}
                  required
                />
                <TextField
                  label="Native calculation or model reference"
                  value={item.model_reference}
                  onChange={(v) => update({ model_reference: v })}
                  required
                />
                <TextField
                  label="Exact model version"
                  value={item.model_version}
                  onChange={(v) => update({ model_version: v })}
                  required
                />
                <TextField
                  label="Check evidence (unknown until recorded)"
                  area
                  value={item.check_evidence}
                  onChange={(v) => update({ check_evidence: v || null })}
                />
                <Sources
                  data={data}
                  value={item.source_ids}
                  onChange={(v) => update({ source_ids: v })}
                />
                <Button
                  variant="quiet"
                  onClick={() =>
                    put(
                      "calculations",
                      value.calculations.filter((r) => r.id !== item.id),
                    )
                  }
                >
                  Remove draft calculation reference
                </Button>
              </fieldset>
            );
          })}
          <Button
            onClick={() =>
              put("calculations", [
                ...value.calculations,
                {
                  id: crypto.randomUUID(),
                  title: "",
                  model_reference: "",
                  model_version: "",
                  check_evidence: null,
                  source_ids: [],
                },
              ])
            }
          >
            Add calculation reference
          </Button>
        </>
      )}
    </>
  );
}
