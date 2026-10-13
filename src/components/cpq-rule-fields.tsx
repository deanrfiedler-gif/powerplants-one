"use client";
import type {
  Condition,
  Definition,
  Fact,
  DesignContract,
  Scalar,
} from "../cpq/types";
import { Button } from "./ui/button";
import { ProductIcon } from "./product-icons";
import { CpqField, CpqNotice } from "./cpq-ui";
const operators = [
  ["EQ", "equals"],
  ["NE", "does not equal"],
  ["IN", "is one of"],
  ["GT", "is greater than"],
  ["GTE", "is at least"],
  ["LT", "is less than"],
  ["LTE", "is at most"],
  ["KNOWN", "is known"],
  ["NOT_APPLICABLE", "is not applicable"],
] as const;
const emptyCondition = (fact: Fact | undefined): Condition =>
  ({ op: "", fact: fact?.key ?? "", value: null }) as unknown as Condition;
export function ConditionEditor({
  value,
  facts,
  onChange,
  disabled = false,
  depth = 0,
}: {
  value: Condition;
  facts: Fact[];
  onChange: (c: Condition) => void;
  disabled?: boolean;
  depth?: number;
}) {
  if (value.op === "ALWAYS")
    return (
      <div className="cpq-conditions">
        <strong>Always applies</strong>
        <Button
          disabled={disabled}
          onClick={() => onChange(emptyCondition(facts[0]))}
        >
          Add a condition
        </Button>
      </div>
    );
  if (value.op === "ALL" || value.op === "ANY" || value.op === "NOT") {
    const items = "items" in value ? value.items : [value.item];
    const replace = (index: number, next: Condition) =>
      onChange(
        value.op === "NOT"
          ? { op: "NOT", item: next }
          : {
              op: value.op,
              items: items.map((c, i) => (i === index ? next : c)),
            },
      );
    return (
      <div className="cpq-conditions">
        <div className="cpq-section-head">
          <div className="cpq-actions">
            <Button
              disabled={disabled}
              onClick={() => onChange({ op: "ALWAYS" })}
            >
              Always
            </Button>
            {(["ALL", "ANY", "NOT"] as const).map((op) => (
              <Button
                key={op}
                disabled={disabled}
                variant={value.op === op ? "primary" : "secondary"}
                onClick={() =>
                  onChange(
                    op === "NOT"
                      ? { op, item: items[0] ?? emptyCondition(facts[0]) }
                      : { op, items },
                  )
                }
              >
                {op}
              </Button>
            ))}
          </div>
          <small>
            {value.op === "ALL"
              ? "All of these conditions are true"
              : value.op === "ANY"
                ? "Any condition is true"
                : "This condition is not true"}
          </small>
        </div>
        {items.map((c, i) => (
          <div className="cpq-stack-tight" key={i}>
            <ConditionEditor
              value={c}
              facts={facts}
              onChange={(next) => replace(i, next)}
              disabled={disabled}
              depth={depth + 1}
            />
            {value.op !== "NOT" && (
              <div className="cpq-actions">
                <Button
                  variant="quiet"
                  aria-label={`Move condition ${i + 1} up`}
                  disabled={disabled || i === 0}
                  onClick={() => {
                    const n = [...items];
                    [n[i - 1], n[i]] = [n[i], n[i - 1]];
                    onChange({ ...value, items: n });
                  }}
                >
                  ↑
                </Button>
                <Button
                  variant="quiet"
                  aria-label={`Move condition ${i + 1} down`}
                  disabled={disabled || i === items.length - 1}
                  onClick={() => {
                    const n = [...items];
                    [n[i + 1], n[i]] = [n[i], n[i + 1]];
                    onChange({ ...value, items: n });
                  }}
                >
                  ↓
                </Button>
                <Button
                  variant="quiet"
                  aria-label={`Remove condition ${i + 1}`}
                  disabled={disabled}
                  onClick={() =>
                    onChange({
                      ...value,
                      items: items.filter((_, n) => n !== i),
                    })
                  }
                >
                  <ProductIcon name="trash" />
                </Button>
              </div>
            )}
          </div>
        ))}
        {value.op !== "NOT" && (
          <div className="cpq-actions">
            <Button
              variant="quiet"
              disabled={disabled || items.length >= 20}
              onClick={() =>
                onChange({
                  ...value,
                  items: [...items, emptyCondition(facts[0])],
                })
              }
            >
              + Condition
            </Button>
            <Button
              variant="quiet"
              disabled={disabled || depth >= 6 || items.length >= 20}
              onClick={() =>
                onChange({
                  ...value,
                  items: [
                    ...items,
                    { op: "ALL", items: [emptyCondition(facts[0])] },
                  ],
                })
              }
            >
              + Group
            </Button>
          </div>
        )}
        {!items.length && (
          <CpqNotice tone="warning">
            An empty group is incomplete. Add a condition; it never means
            “always”.
          </CpqNotice>
        )}
      </div>
    );
  }
  const leaf = value as Extract<Condition, { fact: string }>,
    fact = facts.find((f) => f.key === leaf.fact),
    numeric = fact && ["Decimal", "Integer"].includes(fact.type);
  const literal = "value" in leaf ? leaf.value : null;
  function update(op: string, v: unknown = literal) {
    onChange(
      (op === "IN"
        ? { op, fact: leaf.fact, values: [] }
        : ["KNOWN", "NOT_APPLICABLE"].includes(op)
          ? { op, fact: leaf.fact }
          : { op, fact: leaf.fact, value: v }) as Condition,
    );
  }
  return (
    <div className="cpq-condition-row">
      <select
        aria-label="Condition field"
        disabled={disabled}
        value={leaf.fact}
        onChange={(e) =>
          onChange(emptyCondition(facts.find((f) => f.key === e.target.value)))
        }
      >
        <option value="">Choose a field</option>
        {facts.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label} · {f.type}
          </option>
        ))}
      </select>
      <select
        aria-label="Condition operator"
        disabled={disabled || !fact}
        value={leaf.op}
        onChange={(e) => update(e.target.value, null)}
      >
        <option value="">Choose operator</option>
        {operators
          .filter(([op]) =>
            numeric
              ? op !== "IN"
              : ["EQ", "NE", "IN", "KNOWN", "NOT_APPLICABLE"].includes(op),
          )
          .map(([op, label]) => (
            <option key={op} value={op}>
              {label}
            </option>
          ))}
      </select>
      {leaf.op === "IN" ? (
        fact?.type === "Text" ? (
          <input
            aria-label="Condition values, comma separated"
            disabled={disabled}
            value={leaf.values.join(",")}
            onChange={(e) =>
              onChange({ ...leaf, values: e.target.value.split(",") })
            }
          />
        ) : (
          <select
            multiple
            aria-label="Condition values"
            disabled={disabled}
            value={leaf.values.map(String)}
            onChange={(e) =>
              onChange({
                ...leaf,
                values: Array.from(e.target.selectedOptions).map((o) =>
                  fact?.type === "Boolean" ? o.value === "true" : o.value,
                ),
              })
            }
          >
            {(fact?.type === "Boolean"
              ? ["true", "false"]
              : (fact?.choices ?? [])
            ).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        )
      ) : ["KNOWN", "NOT_APPLICABLE"].includes(leaf.op) ? (
        <small>No literal value</small>
      ) : fact?.type === "Boolean" ? (
        <select
          aria-label="Condition value"
          disabled={disabled || !leaf.op}
          value={literal === null ? "" : String(literal)}
          onChange={(e) =>
            update(
              leaf.op,
              e.target.value === "" ? null : e.target.value === "true",
            )
          }
        >
          <option value="">Choose value</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      ) : fact?.type === "Choice" ? (
        <select
          aria-label="Condition value"
          disabled={disabled || !leaf.op}
          value={String(literal ?? "")}
          onChange={(e) => update(leaf.op, e.target.value || null)}
        >
          <option value="">Choose value</option>
          {fact.choices.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      ) : (
        <input
          aria-label="Condition value"
          disabled={disabled || !leaf.op}
          inputMode={numeric ? "decimal" : "text"}
          value={String(literal ?? "")}
          placeholder={fact?.unit ?? "Value"}
          onChange={(e) => update(leaf.op, e.target.value || null)}
        />
      )}
      <small>{fact?.unit}</small>
    </div>
  );
}
export function FactEditor({
  d,
  change,
  disabled,
}: {
  d: Definition;
  change: (d: Definition) => void;
  disabled: boolean;
}) {
  const edit = (index: number, values: Partial<Fact>) =>
    change({
      ...d,
      facts: d.facts.map((f, i) => (i === index ? { ...f, ...values } : f)),
    });
  return (
    <div className="cpq-stack">
      <div className="cpq-section-head">
        <div>
          <h2>Fact dictionary</h2>
          <small>
            Typed inputs and source bindings · versioned with each release
          </small>
        </div>
        <Button
          disabled={disabled || d.facts.length >= 40}
          onClick={() =>
            change({
              ...d,
              facts: [
                ...d.facts,
                {
                  key: `fact_${d.facts.length + 1}`,
                  label: "New fact",
                  type: "Decimal",
                  unit: "each",
                  required: true,
                  choices: [],
                  scope: "System",
                  source: "CPQ configuration",
                  minimum: null,
                  maximum: null,
                  binding: null,
                },
              ],
            })
          }
        >
          + Fact
        </Button>
      </div>
      {d.facts.map((f, i) => (
        <details className="cpq-line-group" key={i}>
          <summary>
            {f.label}
            <small>
              {f.key} · {f.type} · {f.unit} · {f.source ?? "Release definition"}
            </small>
          </summary>
          <div className="cpq-card cpq-stack">
            <div className="cpq-grid">
              <CpqField label="Stable key">
                <input
                  disabled={disabled}
                  value={f.key}
                  onChange={(e) => edit(i, { key: e.target.value })}
                />
              </CpqField>
              <CpqField label="Label">
                <input
                  disabled={disabled}
                  value={f.label}
                  onChange={(e) => edit(i, { label: e.target.value })}
                />
              </CpqField>
              <CpqField label="Type">
                <select
                  disabled={disabled}
                  value={f.type}
                  onChange={(e) =>
                    edit(i, {
                      type: e.target.value as Fact["type"],
                      choices: [],
                      minimum: null,
                      maximum: null,
                      binding: null,
                    })
                  }
                >
                  {["Decimal", "Integer", "Boolean", "Choice", "Text"].map(
                    (t) => (
                      <option key={t}>{t}</option>
                    ),
                  )}
                </select>
              </CpqField>
              <CpqField label="Unit">
                <input
                  disabled={disabled}
                  value={f.unit}
                  onChange={(e) => edit(i, { unit: e.target.value })}
                />
              </CpqField>
              <CpqField label="Scope">
                <select
                  disabled={disabled}
                  value={f.scope ?? "System"}
                  onChange={(e) =>
                    edit(i, { scope: e.target.value as Fact["scope"] })
                  }
                >
                  {["System", "Global", "Shared"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </CpqField>
              <CpqField label="Source description">
                <input
                  disabled={disabled}
                  value={f.source ?? ""}
                  onChange={(e) => edit(i, { source: e.target.value })}
                />
              </CpqField>
              {["Decimal", "Integer"].includes(f.type) && (
                <>
                  <CpqField label="Minimum">
                    <input
                      disabled={disabled}
                      inputMode="decimal"
                      value={f.minimum ?? ""}
                      onChange={(e) =>
                        edit(i, { minimum: e.target.value || null })
                      }
                    />
                  </CpqField>
                  <CpqField label="Maximum">
                    <input
                      disabled={disabled}
                      inputMode="decimal"
                      value={f.maximum ?? ""}
                      onChange={(e) =>
                        edit(i, { maximum: e.target.value || null })
                      }
                    />
                  </CpqField>
                </>
              )}
              {f.type === "Choice" && (
                <CpqField label="Choices" help="One choice per line.">
                  <textarea
                    disabled={disabled}
                    value={f.choices.join("\n")}
                    onChange={(e) =>
                      edit(i, { choices: e.target.value.split("\n") })
                    }
                  />
                </CpqField>
              )}
              <CpqField
                label="Discovery question binding"
                help="A registered question ID makes the value read only in CPQ. Blank means entered in the configuration."
              >
                <input
                  disabled={disabled}
                  value={f.binding?.question_id ?? ""}
                  onChange={(e) =>
                    edit(i, {
                      binding: e.target.value
                        ? { question_id: e.target.value }
                        : null,
                    })
                  }
                />
              </CpqField>
              <CpqField label="Description">
                <textarea
                  disabled={disabled}
                  value={f.description ?? ""}
                  onChange={(e) => edit(i, { description: e.target.value })}
                />
              </CpqField>
            </div>
            <label>
              <input
                disabled={disabled}
                type="checkbox"
                checked={f.required}
                onChange={(e) => edit(i, { required: e.target.checked })}
              />{" "}
              Required
            </label>
            <Button
              disabled={disabled}
              variant="quiet"
              onClick={() =>
                change({ ...d, facts: d.facts.filter((_, n) => i !== n) })
              }
            >
              Remove fact
            </Button>
          </div>
        </details>
      ))}
      <CpqNotice>
        Changing a type invalidates incompatible conditions and formulas.
        Revalidate the whole draft before creating a version.
      </CpqNotice>
    </div>
  );
}
export function PartsEditor({
  d,
  change,
  disabled,
}: {
  d: Definition;
  change: (d: Definition) => void;
  disabled: boolean;
}) {
  const edit = (index: number, patch: Partial<Definition["parts"][number]>) =>
    change({
      ...d,
      parts: d.parts.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    });
  return (
    <div className="cpq-stack">
      <div className="cpq-section-head">
        <div>
          <h2>Parts, labour and price sources</h2>
          <small>
            Explicit frozen synthetic prices; currency AUD, excluding tax
          </small>
        </div>
        <Button
          disabled={disabled || d.parts.length >= 100}
          onClick={() =>
            change({
              ...d,
              parts: [
                ...d.parts,
                {
                  key: `part_${d.parts.length + 1}`,
                  description: "New part",
                  category: "Product",
                  unit: "each",
                  resolver: "SUM",
                  source: "",
                  effective_from: "",
                  effective_to: "",
                  tiers: [{ minimum: "0.001", unit_cost: "", unit_sell: "" }],
                },
              ],
            })
          }
        >
          + Part or labour
        </Button>
      </div>
      {d.parts.map((p, i) => (
        <details className="cpq-line-group" key={i}>
          <summary>
            {p.description}
            <small>
              {p.key} · {p.category} · {p.resolver}
            </small>
          </summary>
          <div className="cpq-card cpq-stack">
            <div className="cpq-grid">
              <CpqField label="Stable key">
                <input
                  disabled={disabled}
                  value={p.key}
                  onChange={(e) => edit(i, { key: e.target.value })}
                />
              </CpqField>
              <CpqField label="Description">
                <input
                  disabled={disabled}
                  value={p.description}
                  onChange={(e) => edit(i, { description: e.target.value })}
                />
              </CpqField>
              <CpqField label="Category">
                <select
                  disabled={disabled}
                  value={p.category}
                  onChange={(e) =>
                    edit(i, { category: e.target.value as typeof p.category })
                  }
                >
                  {[
                    "Product",
                    "Labour",
                    "Freight",
                    "Engineering",
                    "Subcontract",
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </CpqField>
              <CpqField label="Resolution policy">
                <select
                  disabled={disabled}
                  value={p.resolver}
                  onChange={(e) =>
                    edit(i, { resolver: e.target.value as typeof p.resolver })
                  }
                >
                  {["SUM", "MAX", "UNIQUE", "PRIORITY"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </CpqField>
              <CpqField label="Unit">
                <input
                  disabled={disabled}
                  value={p.unit}
                  onChange={(e) => edit(i, { unit: e.target.value })}
                />
              </CpqField>
              <CpqField label="Cost source">
                <input
                  disabled={disabled}
                  value={p.source}
                  onChange={(e) => edit(i, { source: e.target.value })}
                />
              </CpqField>
              <CpqField label="Effective from">
                <input
                  disabled={disabled}
                  type="date"
                  value={p.effective_from}
                  onChange={(e) => edit(i, { effective_from: e.target.value })}
                />
              </CpqField>
              <CpqField label="Valid to">
                <input
                  disabled={disabled}
                  type="date"
                  value={p.effective_to}
                  onChange={(e) => edit(i, { effective_to: e.target.value })}
                />
              </CpqField>
            </div>
            <h3>Quantity price breaks</h3>
            <div className="cpq-grid">
              <CpqField label="Output scope">
                <select
                  disabled={disabled}
                  value={p.scope?.kind ?? "System"}
                  onChange={(e) =>
                    edit(i, {
                      scope: {
                        kind: e.target.value as
                          "System" | "Shared" | "Configuration",
                        group_fact: e.target.value === "Shared" ? "" : null,
                      },
                    })
                  }
                >
                  <option value="System">Each system</option>
                  <option value="Shared">Once per shared group</option>
                  <option value="Configuration">Once per configuration</option>
                </select>
              </CpqField>
              {p.scope?.kind === "Shared" && (
                <CpqField label="Group fact">
                  <select
                    disabled={disabled}
                    value={p.scope.group_fact ?? ""}
                    onChange={(e) =>
                      edit(i, {
                        scope: { kind: "Shared", group_fact: e.target.value },
                      })
                    }
                  >
                    <option value="">Choose group</option>
                    {d.facts
                      .filter((f) => ["Text", "Choice"].includes(f.type))
                      .map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                  </select>
                </CpqField>
              )}
            </div>
            <label>
              <input
                type="checkbox"
                disabled={disabled}
                checked={!!p.price_context}
                onChange={(e) => {
                  if (e.target.checked)
                    edit(i, {
                      price_context: {
                        book: "",
                        policy:
                          "Frozen source price converted to AUD per unit; half up to cents",
                        source_currency: "AUD",
                        currency_per_aud: "1",
                        recorded_at: new Date().toISOString(),
                      },
                      tiers: p.tiers.map((t) => ({
                        ...t,
                        source_unit_cost: t.unit_cost,
                      })),
                    });
                  else {
                    const { price_context: removed, ...part } = p;
                    void removed;
                    change({
                      ...d,
                      parts: d.parts.map((x, n) =>
                        n === i
                          ? {
                              ...part,
                              tiers: part.tiers.map((t) => {
                                const { source_unit_cost: removed, ...tier } =
                                  t;
                                void removed;
                                return tier;
                              }),
                            }
                          : x,
                      ),
                    });
                  }
                }}
              />{" "}
              Record price book and conversion evidence
            </label>
            {p.price_context && (
              <div className="cpq-grid">
                {(
                  [
                    "book",
                    "policy",
                    "source_currency",
                    "currency_per_aud",
                    "recorded_at",
                  ] as const
                ).map((k) => (
                  <CpqField
                    key={k}
                    label={k.replaceAll("_", " ")}
                    help={
                      k === "currency_per_aud"
                        ? "Source currency units per 1 AUD. Converted cost must match the frozen AUD unit cost."
                        : undefined
                    }
                  >
                    <input
                      disabled={disabled}
                      value={p.price_context![k]}
                      onChange={(e) =>
                        edit(i, {
                          price_context: {
                            ...p.price_context!,
                            [k]: e.target.value,
                          },
                        })
                      }
                    />
                  </CpqField>
                ))}
              </div>
            )}
            {p.tiers.map((t, n) => (
              <div className="cpq-grid" key={n}>
                {p.price_context && (
                  <CpqField
                    label={`Source unit cost (${p.price_context.source_currency})`}
                  >
                    <input
                      disabled={disabled}
                      inputMode="decimal"
                      value={t.source_unit_cost ?? ""}
                      onChange={(e) =>
                        edit(i, {
                          tiers: p.tiers.map((x, index) =>
                            index === n
                              ? { ...x, source_unit_cost: e.target.value }
                              : x,
                          ),
                        })
                      }
                    />
                  </CpqField>
                )}
                {(["minimum", "unit_cost", "unit_sell"] as const).map((k) => (
                  <CpqField key={k} label={k.replaceAll("_", " ")}>
                    <input
                      disabled={disabled}
                      inputMode="decimal"
                      value={t[k]}
                      onChange={(e) =>
                        edit(i, {
                          tiers: p.tiers.map((t, index) =>
                            n === index ? { ...t, [k]: e.target.value } : t,
                          ),
                        })
                      }
                    />
                  </CpqField>
                ))}
                <Button
                  disabled={disabled || p.tiers.length === 1}
                  onClick={() =>
                    edit(i, {
                      tiers: p.tiers.filter((_, index) => index !== n),
                    })
                  }
                >
                  Remove break
                </Button>
              </div>
            ))}
            <div className="cpq-actions">
              <Button
                disabled={disabled || p.tiers.length >= 10}
                onClick={() =>
                  edit(i, {
                    tiers: [
                      ...p.tiers,
                      { minimum: "", unit_cost: "", unit_sell: "" },
                    ],
                  })
                }
              >
                + Price break
              </Button>
              <Button
                disabled={disabled}
                variant="quiet"
                onClick={() =>
                  change({ ...d, parts: d.parts.filter((_, n) => n !== i) })
                }
              >
                Remove part
              </Button>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
export function DesignEditor({
  d,
  change,
  disabled,
  view,
}: {
  d: Definition;
  change: (d: Definition) => void;
  disabled: boolean;
  view: string;
}) {
  const design = d.design!;
  const update = (patch: Partial<DesignContract>) =>
    change({ ...d, design: { ...design, ...patch } });
  if (view === "Milestone proposals")
    return (
      <div className="cpq-stack">
        <div className="cpq-section-head">
          <h2>Milestone proposals</h2>
          <Button
            disabled={disabled || (design.milestones?.length ?? 0) >= 30}
            onClick={() =>
              update({
                milestones: [
                  ...(design.milestones ?? []),
                  {
                    key: `milestone_${(design.milestones?.length ?? 0) + 1}`,
                    label: "New milestone",
                    when: { op: "ALWAYS" },
                    anchor: "Installation complete",
                    offset_days: 0,
                    calendar: "BusinessDays",
                  },
                ],
              })
            }
          >
            + Proposal
          </Button>
        </div>
        <CpqNotice>
          Dates stay unresolved. These proposals accompany the saved evaluation
          and estimate handover; project scheduling determines actual dates.
        </CpqNotice>
        {(design.milestones ?? []).map((m, i) => {
          const edit = (patch: Partial<typeof m>) =>
            update({
              milestones: design.milestones!.map((x, n) =>
                n === i ? { ...x, ...patch } : x,
              ),
            });
          return (
            <section className="cpq-card cpq-stack" key={i}>
              <div className="cpq-grid">
                {(["key", "label", "anchor"] as const).map((k) => (
                  <CpqField key={k} label={k}>
                    <input
                      disabled={disabled}
                      value={m[k]}
                      onChange={(e) => edit({ [k]: e.target.value })}
                    />
                  </CpqField>
                ))}
                <CpqField
                  label="Offset in days"
                  help="Negative is before the anchor; positive is after."
                >
                  <input
                    type="number"
                    min={-365}
                    max={365}
                    disabled={disabled}
                    value={m.offset_days}
                    onChange={(e) =>
                      edit({ offset_days: Number(e.target.value) })
                    }
                  />
                </CpqField>
                <CpqField label="Calendar">
                  <select
                    disabled={disabled}
                    value={m.calendar}
                    onChange={(e) =>
                      edit({ calendar: e.target.value as typeof m.calendar })
                    }
                  >
                    <option value="BusinessDays">Business days</option>
                    <option value="CalendarDays">Calendar days</option>
                  </select>
                </CpqField>
              </div>
              <ConditionEditor
                value={m.when}
                facts={d.facts}
                disabled={disabled}
                onChange={(when) => edit({ when })}
              />
              <Button
                disabled={disabled}
                onClick={() =>
                  update({
                    milestones: design.milestones!.filter((_, n) => n !== i),
                  })
                }
              >
                Remove proposal
              </Button>
            </section>
          );
        })}
      </div>
    );
  if (view === "Product structures")
    return (
      <div className="cpq-stack">
        <div className="cpq-section-head">
          <h2>Product structures</h2>
          <Button
            disabled={disabled || design.structure.length >= 40}
            onClick={() =>
              update({
                structure: [
                  ...design.structure,
                  {
                    key: `assembly_${design.structure.length + 1}`,
                    label: "New assembly",
                    parent: null,
                    option_sets: [],
                  },
                ],
              })
            }
          >
            + Component
          </Button>
        </div>
        {design.structure.map((s, i) => (
          <section className="cpq-card cpq-stack" key={i}>
            <div className="cpq-grid">
              {(["key", "label"] as const).map((k) => (
                <CpqField key={k} label={k === "key" ? "Stable key" : "Label"}>
                  <input
                    disabled={disabled}
                    value={s[k]}
                    onChange={(e) =>
                      update({
                        structure: design.structure.map((x, n) =>
                          n === i ? { ...x, [k]: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </CpqField>
              ))}
              <CpqField label="Parent">
                <select
                  disabled={disabled}
                  value={s.parent ?? ""}
                  onChange={(e) =>
                    update({
                      structure: design.structure.map((x, n) =>
                        n === i ? { ...x, parent: e.target.value || null } : x,
                      ),
                    })
                  }
                >
                  <option value="">Root assembly</option>
                  {design.structure
                    .filter((p) => p.key !== s.key)
                    .map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                </select>
              </CpqField>
            </div>
            <h3>Option sets</h3>
            {design.option_sets.map((set) => (
              <label key={set.key}>
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={s.option_sets.includes(set.key)}
                  onChange={(e) =>
                    update({
                      structure: design.structure.map((x, n) =>
                        n === i
                          ? {
                              ...x,
                              option_sets: e.target.checked
                                ? [...x.option_sets, set.key]
                                : x.option_sets.filter((k) => k !== set.key),
                            }
                          : x,
                      ),
                    })
                  }
                />{" "}
                {set.label}
              </label>
            ))}
            <div className="cpq-actions">
              <Button
                disabled={disabled || i === 0}
                onClick={() => {
                  const next = [...design.structure];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  update({ structure: next });
                }}
              >
                Move up
              </Button>
              <Button
                disabled={disabled || i === design.structure.length - 1}
                onClick={() => {
                  const next = [...design.structure];
                  [next[i + 1], next[i]] = [next[i], next[i + 1]];
                  update({ structure: next });
                }}
              >
                Move down
              </Button>
              <Button
                disabled={disabled}
                onClick={() =>
                  update({
                    structure: design.structure.filter((_, n) => n !== i),
                  })
                }
              >
                Remove
              </Button>
            </div>
          </section>
        ))}
      </div>
    );
  if (view === "Option sets")
    return (
      <div className="cpq-stack">
        <div className="cpq-section-head">
          <h2>Option sets</h2>
          <Button
            disabled={disabled || design.option_sets.length >= 20}
            onClick={() =>
              update({
                option_sets: [
                  ...design.option_sets,
                  {
                    key: `options_${design.option_sets.length + 1}`,
                    label: "New option set",
                    fact: "",
                    options: [],
                  },
                ],
              })
            }
          >
            + Option set
          </Button>
        </div>
        {design.option_sets.map((s, i) => {
          const edit = (patch: Partial<typeof s>) =>
            update({
              option_sets: design.option_sets.map((x, n) =>
                n === i ? { ...x, ...patch } : x,
              ),
            });
          return (
            <section className="cpq-card cpq-stack" key={i}>
              <div className="cpq-grid">
                <CpqField label="Stable key">
                  <input
                    disabled={disabled}
                    value={s.key}
                    onChange={(e) => edit({ key: e.target.value })}
                  />
                </CpqField>
                <CpqField label="Label">
                  <input
                    disabled={disabled}
                    value={s.label}
                    onChange={(e) => edit({ label: e.target.value })}
                  />
                </CpqField>
                <CpqField label="Choice fact">
                  <select
                    disabled={disabled}
                    value={s.fact}
                    onChange={(e) =>
                      edit({ fact: e.target.value, options: [] })
                    }
                  >
                    <option value="">Choose a choice fact</option>
                    {d.facts
                      .filter((f) => f.type === "Choice")
                      .map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                  </select>
                </CpqField>
              </div>
              {s.options.map((o, n) => (
                <div className="cpq-conditions" key={n}>
                  <div className="cpq-grid">
                    <CpqField label="Choice">
                      <select
                        disabled={disabled}
                        value={o.value}
                        onChange={(e) =>
                          edit({
                            options: s.options.map((o, j) =>
                              j === n ? { ...o, value: e.target.value } : o,
                            ),
                          })
                        }
                      >
                        <option value="">Choose a value</option>
                        {d.facts
                          .find((f) => f.key === s.fact)
                          ?.choices.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                      </select>
                    </CpqField>
                    <CpqField label="Option label">
                      <input
                        disabled={disabled}
                        value={o.label}
                        onChange={(e) =>
                          edit({
                            options: s.options.map((o, j) =>
                              j === n ? { ...o, label: e.target.value } : o,
                            ),
                          })
                        }
                      />
                    </CpqField>
                  </div>
                  <h3>Available when</h3>
                  <ConditionEditor
                    value={o.available_when}
                    facts={d.facts}
                    disabled={disabled}
                    onChange={(c) =>
                      edit({
                        options: s.options.map((o, j) =>
                          j === n ? { ...o, available_when: c } : o,
                        ),
                      })
                    }
                  />
                  <CpqField label="Unavailable reason">
                    <input
                      disabled={disabled}
                      value={o.reason}
                      onChange={(e) =>
                        edit({
                          options: s.options.map((o, j) =>
                            j === n ? { ...o, reason: e.target.value } : o,
                          ),
                        })
                      }
                    />
                  </CpqField>
                  <Button
                    disabled={disabled}
                    onClick={() =>
                      edit({ options: s.options.filter((_, j) => j !== n) })
                    }
                  >
                    Remove option
                  </Button>
                </div>
              ))}
              <div className="cpq-actions">
                <Button
                  disabled={disabled || s.options.length >= 30}
                  onClick={() =>
                    edit({
                      options: [
                        ...s.options,
                        {
                          value: "",
                          label: "New option",
                          available_when: emptyCondition(d.facts[0]),
                          reason: "",
                        },
                      ],
                    })
                  }
                >
                  + Option
                </Button>
                <Button
                  disabled={disabled}
                  onClick={() =>
                    update({
                      option_sets: design.option_sets.filter((_, j) => j !== i),
                    })
                  }
                >
                  Remove set
                </Button>
              </div>
            </section>
          );
        })}
      </div>
    );
  if (view === "Decision tables")
    return (
      <div className="cpq-stack">
        <div className="cpq-section-head">
          <h2>Decision tables</h2>
          <Button
            disabled={disabled || design.decision_tables.length >= 20}
            onClick={() =>
              update({
                decision_tables: [
                  ...design.decision_tables,
                  {
                    key: `table_${design.decision_tables.length + 1}`,
                    label: "New decision table",
                    hit_policy: "UNIQUE",
                    required: true,
                    columns: [],
                    rows: [],
                  },
                ],
              })
            }
          >
            + Table
          </Button>
        </div>
        {design.decision_tables.map((t, i) => {
          const edit = (patch: Partial<typeof t>) =>
            update({
              decision_tables: design.decision_tables.map((x, n) =>
                n === i ? { ...x, ...patch } : x,
              ),
            });
          return (
            <section className="cpq-card cpq-stack" key={i}>
              <div className="cpq-grid">
                <CpqField label="Stable key">
                  <input
                    disabled={disabled}
                    value={t.key}
                    onChange={(e) => edit({ key: e.target.value })}
                  />
                </CpqField>
                <CpqField label="Label">
                  <input
                    disabled={disabled}
                    value={t.label}
                    onChange={(e) => edit({ label: e.target.value })}
                  />
                </CpqField>
                <CpqField label="Hit policy">
                  <select
                    disabled={disabled}
                    value={t.hit_policy}
                    onChange={(e) =>
                      edit({
                        hit_policy: e.target.value as typeof t.hit_policy,
                      })
                    }
                  >
                    <option>UNIQUE</option>
                    <option>PRIORITY</option>
                  </select>
                </CpqField>
                <label>
                  <input
                    disabled={disabled}
                    type="checkbox"
                    checked={t.required}
                    onChange={(e) => edit({ required: e.target.checked })}
                  />{" "}
                  Require a matching row
                </label>
              </div>
              <h3>Input columns</h3>
              <div className="cpq-grid">
                {d.facts.map((f) => (
                  <label key={f.key}>
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={t.columns.includes(f.key)}
                      onChange={(e) =>
                        edit({
                          columns: e.target.checked
                            ? [...t.columns, f.key]
                            : t.columns.filter((k) => k !== f.key),
                        })
                      }
                    />{" "}
                    {f.label}
                  </label>
                ))}
              </div>
              {t.rows.map((row, n) => (
                <section className="cpq-conditions" key={n}>
                  <div className="cpq-grid">
                    <CpqField label="Row key">
                      <input
                        disabled={disabled}
                        value={row.key}
                        onChange={(e) =>
                          edit({
                            rows: t.rows.map((r, j) =>
                              j === n ? { ...r, key: e.target.value } : r,
                            ),
                          })
                        }
                      />
                    </CpqField>
                    <CpqField label="Priority">
                      <input
                        disabled={disabled}
                        type="number"
                        min={0}
                        max={1000}
                        value={row.priority}
                        onChange={(e) =>
                          edit({
                            rows: t.rows.map((r, j) =>
                              j === n
                                ? { ...r, priority: Number(e.target.value) }
                                : r,
                            ),
                          })
                        }
                      />
                    </CpqField>
                  </div>
                  <ConditionEditor
                    value={row.when}
                    facts={d.facts.filter((f) => t.columns.includes(f.key))}
                    disabled={disabled}
                    onChange={(c) =>
                      edit({
                        rows: t.rows.map((r, j) =>
                          j === n ? { ...r, when: c } : r,
                        ),
                      })
                    }
                  />
                  <h3>Rules to apply</h3>
                  {d.rules.map((rule) => (
                    <label key={rule.key}>
                      <input
                        disabled={disabled}
                        type="checkbox"
                        checked={row.rules.includes(rule.key)}
                        onChange={(e) =>
                          edit({
                            rows: t.rows.map((r, j) =>
                              j === n
                                ? {
                                    ...r,
                                    rules: e.target.checked
                                      ? [...r.rules, rule.key]
                                      : r.rules.filter((k) => k !== rule.key),
                                  }
                                : r,
                            ),
                          })
                        }
                      />{" "}
                      {rule.description}
                    </label>
                  ))}
                  <Button
                    disabled={disabled}
                    onClick={() =>
                      edit({ rows: t.rows.filter((_, j) => j !== n) })
                    }
                  >
                    Remove row
                  </Button>
                </section>
              ))}
              <div className="cpq-actions">
                <Button
                  disabled={disabled || t.rows.length >= 50}
                  onClick={() =>
                    edit({
                      rows: [
                        ...t.rows,
                        {
                          key: `row_${t.rows.length + 1}`,
                          when: emptyCondition(
                            d.facts.find((f) => t.columns.includes(f.key)),
                          ),
                          rules: [],
                          priority: 1,
                        },
                      ],
                    })
                  }
                >
                  + Row
                </Button>
                <Button
                  disabled={disabled}
                  onClick={() =>
                    update({
                      decision_tables: design.decision_tables.filter(
                        (_, j) => j !== i,
                      ),
                    })
                  }
                >
                  Remove table
                </Button>
              </div>
            </section>
          );
        })}
        <CpqNotice>
          Run the test bench to check known-value coverage, gaps, overlaps and
          equal priorities. Large tables must be split into at most 256
          comparison partitions.
        </CpqNotice>
      </div>
    );
  return (
    <div className="cpq-stack">
      <div className="cpq-section-head">
        <h2>Compatibility and shared capacity</h2>
        <Button
          disabled={disabled}
          onClick={() =>
            change({
              ...d,
              constraints: [
                ...d.constraints,
                {
                  key: `constraint_${d.constraints.length + 1}`,
                  when: emptyCondition(d.facts[0]),
                  require: emptyCondition(d.facts[0]),
                  message: "",
                },
              ],
            })
          }
        >
          + Compatibility rule
        </Button>
      </div>
      {d.constraints.map((c, i) => (
        <section key={i} className="cpq-card cpq-stack">
          <CpqField label="Stable key">
            <input
              disabled={disabled}
              value={c.key}
              onChange={(e) =>
                change({
                  ...d,
                  constraints: d.constraints.map((x, n) =>
                    n === i ? { ...x, key: e.target.value } : x,
                  ),
                })
              }
            />
          </CpqField>
          <h3>When</h3>
          <ConditionEditor
            value={c.when}
            facts={d.facts}
            disabled={disabled}
            onChange={(when) =>
              change({
                ...d,
                constraints: d.constraints.map((x, n) =>
                  n === i ? { ...x, when } : x,
                ),
              })
            }
          />
          <h3>Require</h3>
          <ConditionEditor
            value={c.require}
            facts={d.facts}
            disabled={disabled}
            onChange={(require) =>
              change({
                ...d,
                constraints: d.constraints.map((x, n) =>
                  n === i ? { ...x, require } : x,
                ),
              })
            }
          />
          <CpqField label="Message">
            <input
              disabled={disabled}
              value={c.message}
              onChange={(e) =>
                change({
                  ...d,
                  constraints: d.constraints.map((x, n) =>
                    n === i ? { ...x, message: e.target.value } : x,
                  ),
                })
              }
            />
          </CpqField>
          <Button
            disabled={disabled}
            onClick={() =>
              change({
                ...d,
                constraints: d.constraints.filter((_, n) => n !== i),
              })
            }
          >
            Remove constraint
          </Button>
        </section>
      ))}
      <div className="cpq-section-head">
        <h2>Shared capacity</h2>
        <Button
          disabled={disabled || design.shared_capacity.length >= 20}
          onClick={() =>
            update({
              shared_capacity: [
                ...design.shared_capacity,
                {
                  key: `capacity_${design.shared_capacity.length + 1}`,
                  label: "Shared capacity",
                  group_fact: "",
                  demand_fact: "",
                  capacity_fact: "",
                  message: "",
                },
              ],
            })
          }
        >
          + Shared capacity
        </Button>
      </div>
      {design.shared_capacity.map((c, i) => {
        const edit = (patch: Partial<typeof c>) =>
          update({
            shared_capacity: design.shared_capacity.map((x, n) =>
              n === i ? { ...x, ...patch } : x,
            ),
          });
        return (
          <section key={i} className="cpq-card cpq-grid">
            {(["key", "label", "message"] as const).map((k) => (
              <CpqField key={k} label={k}>
                <input
                  disabled={disabled}
                  value={c[k]}
                  onChange={(e) => edit({ [k]: e.target.value })}
                />
              </CpqField>
            ))}
            {(["group_fact", "demand_fact", "capacity_fact"] as const).map(
              (k) => (
                <CpqField key={k} label={k.replaceAll("_", " ")}>
                  <select
                    disabled={disabled}
                    value={c[k]}
                    onChange={(e) => edit({ [k]: e.target.value })}
                  >
                    <option value="">Choose a fact</option>
                    {d.facts
                      .filter((f) =>
                        k === "group_fact"
                          ? ["Choice", "Text"].includes(f.type)
                          : ["Decimal", "Integer"].includes(f.type),
                      )
                      .map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                  </select>
                </CpqField>
              ),
            )}
            <Button
              disabled={disabled}
              onClick={() =>
                update({
                  shared_capacity: design.shared_capacity.filter(
                    (_, n) => n !== i,
                  ),
                })
              }
            >
              Remove
            </Button>
          </section>
        );
      })}
    </div>
  );
}

export function FixtureEditor({
  d,
  change,
  disabled,
}: {
  d: Definition;
  change: (d: Definition) => void;
  disabled: boolean;
}) {
  const edit = (i: number, patch: Partial<Definition["fixtures"][number]>) =>
    change({
      ...d,
      fixtures: d.fixtures.map((f, n) => (n === i ? { ...f, ...patch } : f)),
    });
  const valueControl = (
    f: Fact,
    value: Scalar,
    onChange: (v: Scalar) => void,
  ) =>
    f.type === "Boolean" ? (
      <select
        disabled={disabled}
        value={value == null ? "" : String(value)}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : e.target.value === "true")
        }
      >
        <option value="">Unknown</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    ) : f.type === "Choice" ? (
      <select
        disabled={disabled}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">Unknown</option>
        {f.choices.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
    ) : (
      <input
        disabled={disabled}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="Unknown"
      />
    );
  return (
    <div className="cpq-stack">
      <div className="cpq-section-head">
        <h2>Test scenarios</h2>
        <Button
          disabled={disabled || d.fixtures.length >= 12}
          onClick={() =>
            change({
              ...d,
              fixtures: [
                ...d.fixtures,
                {
                  name: "New scenario",
                  input: {
                    pricing_date: new Date().toISOString().slice(0, 10),
                    instances: [
                      {
                        id: crypto.randomUUID(),
                        label: "Test system",
                        facts: Object.fromEntries(
                          d.facts.map((f) => [f.key, null]),
                        ),
                        not_applicable: [],
                      },
                    ],
                    overrides: [],
                    pricing: null,
                  },
                  expected: {
                    ready: false,
                    cost: null,
                    sell: null,
                    diagnostic_codes: [],
                  },
                },
              ],
            })
          }
        >
          + Scenario
        </Button>
      </div>
      {d.fixtures.map((f, i) => (
        <details className="cpq-line-group" key={i}>
          <summary>
            {f.name}
            <small>
              {f.input.instances.length} systems · expects{" "}
              {f.expected.ready ? "Ready" : "Blocked"}
            </small>
          </summary>
          <div className="cpq-card cpq-stack">
            <CpqField label="Scenario name">
              <input
                disabled={disabled}
                value={f.name}
                onChange={(e) => edit(i, { name: e.target.value })}
              />
            </CpqField>
            <CpqField label="Pricing date">
              <input
                type="date"
                disabled={disabled}
                value={f.input.pricing_date}
                onChange={(e) =>
                  edit(i, {
                    input: { ...f.input, pricing_date: e.target.value },
                  })
                }
              />
            </CpqField>
            {f.input.instances.map((instance, n) => (
              <section className="cpq-conditions" key={instance.id}>
                <h3>{instance.label}</h3>
                <div className="cpq-grid">
                  {d.facts.map((fact) => (
                    <CpqField key={fact.key} label={fact.label}>
                      {valueControl(fact, instance.facts[fact.key], (value) =>
                        edit(i, {
                          input: {
                            ...f.input,
                            instances: f.input.instances.map((x, j) =>
                              j === n
                                ? {
                                    ...x,
                                    facts: { ...x.facts, [fact.key]: value },
                                  }
                                : x,
                            ),
                          },
                        }),
                      )}
                    </CpqField>
                  ))}
                </div>
                <Button
                  disabled={disabled || f.input.instances.length === 1}
                  onClick={() =>
                    edit(i, {
                      input: {
                        ...f.input,
                        instances: f.input.instances.filter((_, j) => j !== n),
                      },
                    })
                  }
                >
                  Remove system
                </Button>
              </section>
            ))}
            <Button
              disabled={disabled || f.input.instances.length >= 20}
              onClick={() =>
                edit(i, {
                  input: {
                    ...f.input,
                    instances: [
                      ...f.input.instances,
                      {
                        id: crypto.randomUUID(),
                        label: `Test system ${f.input.instances.length + 1}`,
                        facts: Object.fromEntries(
                          d.facts.map((f) => [f.key, null]),
                        ),
                        not_applicable: [],
                      },
                    ],
                  },
                })
              }
            >
              + Test system
            </Button>
            <h3>Independent expected result</h3>
            <label>
              <input
                type="checkbox"
                disabled={disabled}
                checked={f.expected.ready}
                onChange={(e) =>
                  edit(i, {
                    expected: { ...f.expected, ready: e.target.checked },
                  })
                }
              />{" "}
              Ready for use
            </label>
            <div className="cpq-grid">
              {(["cost", "sell"] as const).map((k) => (
                <CpqField
                  key={k}
                  label={`Expected ${k} (AUD)`}
                  help="Blank means no known total."
                >
                  <input
                    disabled={disabled}
                    inputMode="decimal"
                    value={f.expected[k] ?? ""}
                    onChange={(e) =>
                      edit(i, {
                        expected: {
                          ...f.expected,
                          [k]: e.target.value || null,
                        },
                      })
                    }
                  />
                </CpqField>
              ))}
            </div>
            <CpqField
              label="Expected diagnostic codes"
              help="Comma separated; leave blank when none are expected."
            >
              <input
                disabled={disabled}
                value={f.expected.diagnostic_codes.join(", ")}
                onChange={(e) =>
                  edit(i, {
                    expected: {
                      ...f.expected,
                      diagnostic_codes: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  })
                }
              />
            </CpqField>
            <Button
              disabled={disabled || d.fixtures.length === 1}
              onClick={() =>
                change({ ...d, fixtures: d.fixtures.filter((_, n) => n !== i) })
              }
            >
              Remove scenario
            </Button>
          </div>
        </details>
      ))}
    </div>
  );
}
