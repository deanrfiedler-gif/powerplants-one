"use client";
// Accepted CPQ Figma frames 486:641 and 488:1029 (Rules studio · Rule editor, Applies when):
// CPQ / Group header 467:272 and CPQ / Condition row 467:207. Groups are a 2 px rule with a joined
// ALL / ANY / NOT control, inline + Condition / + Group and a group menu. Rows hold a drag handle,
// a typed field, an operator allowed for that type, a value with its unit and Move up / Move down /
// Remove. Changing the field to an incompatible type clears operator and value and says why.
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { Condition, Fact } from "../cpq/types";
import { ProductIcon } from "./product-icons";

type Leaf = Extract<Condition, { fact: string }>;
type Group = Extract<Condition, { op: "ALL" | "ANY" | "NOT" }>;
type Family = "Number" | "Text" | "Choice" | "Yes/No";

const isGroup = (c: Condition): c is Group =>
  c.op === "ALL" || c.op === "ANY" || c.op === "NOT";
const childrenOf = (g: Group) => (g.op === "NOT" ? [g.item] : g.items);
const leafCount = (c: Condition): number =>
  isGroup(c) ? childrenOf(c).reduce((n, x) => n + leafCount(x), 0) : c.op === "ALWAYS" ? 0 : 1;
const family = (fact: Fact | undefined): Family | null =>
  !fact
    ? null
    : fact.type === "Decimal" || fact.type === "Integer"
      ? "Number"
      : fact.type === "Boolean"
        ? "Yes/No"
        : fact.type;
const numeric = /^-?\d+(\.\d+)?$/;
export const emptyCondition = (fact: Fact | undefined): Condition =>
  ({ op: "", fact: fact?.key ?? "", value: null }) as unknown as Condition;

const labels: Record<Family, Record<string, string>> = {
  Number: {
    EQ: "equals",
    NE: "does not equal",
    GT: "is greater than",
    GTE: "is at least",
    LT: "is less than",
    LTE: "is at most",
    KNOWN: "is known",
    NOT_APPLICABLE: "is not applicable",
  },
  Text: { EQ: "is", NE: "is not", IN: "is one of", KNOWN: "is known", NOT_APPLICABLE: "is not applicable" },
  Choice: { EQ: "is", NE: "is not", IN: "is one of", KNOWN: "is known", NOT_APPLICABLE: "is not applicable" },
  "Yes/No": {
    "EQ:true": "is true",
    "EQ:false": "is false",
    KNOWN: "is known",
    NOT_APPLICABLE: "is not applicable",
  },
};
// The operator box's value. Yes/No folds its literal into the operator, as the design draws it.
function operatorKey(leaf: Leaf, kind: Family | null) {
  if (!leaf.op) return "";
  if (kind === "Yes/No" && (leaf.op === "EQ" || leaf.op === "NE") && typeof leaf.value === "boolean")
    return `${leaf.op}:${leaf.value}`;
  return leaf.op;
}
function operatorChoices(leaf: Leaf, kind: Family | null) {
  if (!kind) return [];
  const choices = Object.entries(labels[kind]).map(([value, label]) => ({ value, label }));
  const current = operatorKey(leaf, kind);
  // A saved operator outside the type's usual set (for example NE true) stays visible, never lost.
  if (current && !choices.some((c) => c.value === current))
    choices.push({ value: current, label: operatorLabel(leaf, kind) });
  return choices;
}
function operatorLabel(leaf: Leaf, kind: Family | null) {
  const key = operatorKey(leaf, kind);
  if (kind && labels[kind][key]) return labels[kind][key];
  if (kind === "Yes/No" && leaf.op === "NE" && "value" in leaf)
    return `is not ${leaf.value === true ? "true" : leaf.value === false ? "false" : "set"}`;
  return labels.Number[leaf.op] ?? labels.Text[leaf.op] ?? leaf.op;
}
function valueText(leaf: Leaf, fact: Fact | undefined) {
  if (leaf.op === "IN") return leaf.values.map((v) => (v === true ? "Yes" : v === false ? "No" : v)).join(", ");
  if (!("value" in leaf) || leaf.value === null || leaf.value === undefined) return "";
  if (typeof leaf.value === "boolean") return leaf.value ? "Yes" : "No";
  return family(fact) === "Number" && fact?.unit ? `${leaf.value} ${fact.unit}` : String(leaf.value);
}
function summary(leaf: Leaf, fact: Fact | undefined) {
  const kind = family(fact),
    value = kind === "Yes/No" && leaf.op !== "IN" ? "" : valueText(leaf, fact);
  return [operatorLabel(leaf, kind), value].filter(Boolean).join(" ");
}
// What still has to be chosen. Raw text such as "-" or "1." stays incomplete; it is never zero.
export function conditionIssue(leaf: Leaf, fact: Fact | undefined): string | null {
  if (!fact) return "Choose a field.";
  const kind = family(fact);
  if (!leaf.op) return kind === "Yes/No" ? "Choose an operator." : "Choose an operator and a value.";
  if (leaf.op === "KNOWN" || leaf.op === "NOT_APPLICABLE") return null;
  if (leaf.op === "IN")
    return leaf.values.some((v) => typeof v === "boolean" || String(v).trim())
      ? null
      : "Choose at least one value.";
  const value = "value" in leaf ? leaf.value : null;
  if (value === null || value === undefined || value === "") return kind === "Choice" ? "Choose a value." : "Enter a value.";
  if (kind === "Number" && !numeric.test(String(value).trim())) return "Enter a complete number.";
  return null;
}
export type ConditionIssue = { number: number; part: "field" | "operator" | "value" | null; text: string };
// Every incomplete condition, numbered in reading order, for the editor's error summary.
export function conditionIssues(c: Condition, facts: Fact[], start = 1): ConditionIssue[] {
  if (c.op === "ALWAYS") return [];
  if (isGroup(c)) {
    const items = childrenOf(c);
    if (!items.length) return [{ number: start, part: null, text: "an empty group needs a condition; it never means “always”" }];
    return items.flatMap((item, i) =>
      conditionIssues(item, facts, start + items.slice(0, i).reduce((n, x) => n + leafCount(x), 0)),
    );
  }
  const fact = facts.find((f) => f.key === c.fact),
    issue = conditionIssue(c, fact);
  if (!issue) return [];
  const text = issue.charAt(0).toLowerCase() + issue.slice(1, -1);
  return [{ number: start, part: !fact ? "field" : !c.op ? "operator" : "value", text: fact ? `${text} for ${fact.label}` : text }];
}

// One popover menu (native popover: Escape and light dismiss), positioned under its trigger.
export function CpqMenu({
  label,
  trigger,
  className = "",
  disabled = false,
  role = "menu",
  align = "end",
  children,
}: {
  label: string;
  trigger: ReactNode;
  className?: string;
  disabled?: boolean;
  role?: "menu" | "dialog";
  align?: "start" | "end";
  children: ReactNode;
}) {
  const id = useId(),
    menu = useRef<HTMLDivElement>(null),
    button = useRef<HTMLButtonElement>(null);
  const place = () => {
    const panel = menu.current,
      anchor = button.current;
    if (!panel || !anchor) return;
    const box = anchor.getBoundingClientRect();
    if (align === "start") panel.style.minWidth = `${Math.min(box.width, window.innerWidth - 16)}px`;
    const width = panel.offsetWidth,
      height = panel.offsetHeight,
      left = align === "start" ? box.left : box.right - width;
    panel.style.left = `${Math.max(8, Math.min(left, window.innerWidth - width - 8))}px`;
    // Near the bottom edge the menu opens upward, as frame 488:1029 draws it.
    const below = box.bottom + 4;
    panel.style.top = `${below + height > window.innerHeight - 8 ? Math.max(8, box.top - height - 4) : below}px`;
  };
  return (
    <>
      <button
        ref={button}
        type="button"
        className={`cpq-menu-trigger ${className}`}
        aria-label={label}
        title={label}
        aria-haspopup={role}
        aria-controls={id}
        popoverTarget={id}
        disabled={disabled}
      >
        {trigger}
      </button>
      <div
        id={id}
        ref={menu}
        popover="auto"
        role={role}
        aria-label={label}
        className="cpq-menu"
        onToggle={(e) => {
          if (e.newState !== "open") return;
          place();
          menu.current?.querySelector<HTMLElement>("button:not(:disabled),input:not(:disabled)")?.focus();
        }}
        onKeyDown={(e) => {
          if (role !== "menu" || !["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
          const items = [...(menu.current?.querySelectorAll<HTMLElement>("button:not(:disabled)") ?? [])],
            at = items.indexOf(document.activeElement as HTMLElement),
            next =
              e.key === "Home"
                ? items[0]
                : e.key === "End"
                  ? items.at(-1)
                  : items[(at + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length];
          e.preventDefault();
          next?.focus();
        }}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("[data-menu-close]")) {
            menu.current?.hidePopover();
            button.current?.focus();
          }
        }}
      >
        {children}
      </div>
    </>
  );
}
export function CpqMenuItem({
  children,
  onClick,
  disabled = false,
  danger = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button type="button" role="menuitem" data-menu-close className={danger ? "cpq-menu-danger" : undefined} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

// Joined segmented control: the Applies-when mode and ALL / ANY / NOT.
export function CpqSegmented<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
  className = "",
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  disabled?: boolean;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={`cpq-segmented ${className}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          disabled={disabled}
          onClick={() => o.value !== value && onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
export function AppliesMode({
  value,
  facts,
  disabled,
  onChange,
}: {
  value: Condition;
  facts: Fact[];
  disabled?: boolean;
  onChange: (c: Condition) => void;
}) {
  return (
    <CpqSegmented
      label="Applies when"
      className="cpq-applies-mode"
      value={value.op === "ALWAYS" ? "always" : "conditions"}
      disabled={disabled}
      options={[
        { value: "conditions", label: "When conditions are true" },
        { value: "always", label: "Always applies" },
      ]}
      onChange={(mode) =>
        onChange(mode === "always" ? { op: "ALWAYS" } : { op: "ALL", items: [emptyCondition(facts[0])] })
      }
    />
  );
}

let dragging: { group: string; index: number } | null = null;

// The whole Applies-when builder. With `modeChoice` the editor carries its own Always choice (for
// option, constraint, table and milestone conditions); the rule editor puts it in its section head.
export function ConditionEditor({
  value,
  facts,
  onChange,
  disabled = false,
  modeChoice = true,
}: {
  value: Condition;
  facts: Fact[];
  onChange: (c: Condition) => void;
  disabled?: boolean;
  modeChoice?: boolean;
}) {
  // A single saved condition is shown as the one-item ALL group it is equivalent to; the stored
  // shape changes only when it is edited.
  const root: Group | null = value.op === "ALWAYS" ? null : isGroup(value) ? value : { op: "ALL", items: [value] };
  return (
    <div className="cpq-condition-builder">
      {modeChoice && <AppliesMode value={value} facts={facts} disabled={disabled} onChange={onChange} />}
      {root ? (
        <GroupEditor group={root} facts={facts} disabled={disabled} onChange={onChange} start={1} depth={0} />
      ) : (
        <p className="cpq-always-note">
          Applies to every configuration. Choose “When conditions are true” to add conditions.
        </p>
      )}
    </div>
  );
}

type ItemActions = { index: number; count: number; move: (to: number) => void; remove: () => void; clears?: boolean };

function GroupEditor({
  group,
  facts,
  disabled,
  onChange,
  start,
  depth,
  actions,
}: {
  group: Group;
  facts: Fact[];
  disabled: boolean;
  onChange: (c: Condition) => void;
  start: number;
  depth: number;
  actions?: ItemActions;
}) {
  const id = useId(),
    list = useRef<HTMLDivElement>(null),
    focus = useRef<{ index: number; part: string } | null>(null),
    [over, setOver] = useState<number | null>(null);
  const items = childrenOf(group),
    not = group.op === "NOT";
  useEffect(() => {
    const target = focus.current;
    if (!target) return;
    focus.current = null;
    list.current
      ?.querySelector<HTMLElement>(`:scope > [data-index="${target.index}"] [data-part="${target.part}"]`)
      ?.focus();
  });
  const set = (next: Condition[]) => onChange(not ? { op: "NOT", item: next[0] } : { op: group.op, items: next });
  const move = (from: number, to: number, part?: string) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items],
      [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    if (part) focus.current = { index: to, part };
    set(next);
  };
  const add = (c: Condition) => {
    focus.current = { index: items.length, part: "field" };
    set([...items, c]);
  };
  const logic = (op: "ALL" | "ANY" | "NOT") => {
    const only = items[0];
    if (op === "NOT")
      // NOT takes exactly one child: several conditions are kept together inside it, never dropped.
      onChange({ op: "NOT", item: items.length === 1 ? only : { op: group.op === "ANY" ? "ANY" : "ALL", items } });
    else if (not && isGroup(only) && only.op !== "NOT") onChange({ op, items: childrenOf(only) });
    else onChange({ op, items });
  };
  // Conditions are numbered in reading order across nested groups.
  const starts = items.map((_, i) => start + items.slice(0, i).reduce((n, x) => n + leafCount(x), 0));
  return (
    <div className="cpq-group" data-depth={depth}>
      <div className="cpq-group-head">
        <CpqSegmented
          label={`Group logic, ${depth ? "nested group" : "applies when"}`}
          value={group.op}
          disabled={disabled}
          options={[
            { value: "ALL", label: "ALL" },
            { value: "ANY", label: "ANY" },
            { value: "NOT", label: "NOT" },
          ]}
          onChange={logic}
        />
        <p>
          {group.op === "ALL"
            ? "All of these conditions are true"
            : group.op === "ANY"
              ? "Any of these conditions is true"
              : "This condition is not true (one child)"}
        </p>
        {!not && (
          <>
            <button
              type="button"
              className="cpq-add"
              disabled={disabled || items.length >= 20}
              onClick={() => add(emptyCondition(facts[0]))}
            >
              <ProductIcon name="plus" />
              Condition
            </button>
            <button
              type="button"
              className="cpq-add"
              disabled={disabled || depth >= 6 || items.length >= 20}
              onClick={() => add({ op: "ALL", items: [emptyCondition(facts[0])] })}
            >
              <ProductIcon name="plus" />
              Group
            </button>
          </>
        )}
        <CpqMenu label={depth ? "Nested group actions" : "Condition group actions"} className="cpq-icon-button" trigger={<ProductIcon name="more" />} disabled={disabled}>
          {actions ? (
            <>
              <CpqMenuItem disabled={actions.index === 0} onClick={() => actions.move(actions.index - 1)}>
                Move group up
              </CpqMenuItem>
              <CpqMenuItem disabled={actions.index === actions.count - 1} onClick={() => actions.move(actions.index + 1)}>
                Move group down
              </CpqMenuItem>
              <CpqMenuItem danger onClick={actions.remove}>
                Remove group
              </CpqMenuItem>
            </>
          ) : (
            <CpqMenuItem danger disabled={!items.length} onClick={() => set([])}>
              Clear all conditions
            </CpqMenuItem>
          )}
        </CpqMenu>
      </div>
      <div className="cpq-group-items" ref={list}>
        {items.map((c, i) => {
          const first = starts[i];
          const itemActions: ItemActions = not
            ? // NOT keeps exactly one child, so its row clears rather than removes.
              { index: 0, count: 1, move: () => undefined, remove: () => set([emptyCondition(facts[0])]), clears: true }
            : {
                index: i,
                count: items.length,
                move: (to) => move(i, to),
                remove: () => set(items.filter((_, n) => n !== i)),
              };
          return (
            <div
              key={i}
              data-index={i}
              className="cpq-group-item"
              data-drop={over === i || undefined}
              onDragOver={(e) => {
                if (dragging?.group !== id) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOver(i);
              }}
              onDragLeave={() => setOver((o) => (o === i ? null : o))}
              onDrop={(e) => {
                if (dragging?.group !== id) return;
                e.preventDefault();
                move(dragging.index, i);
                dragging = null;
                setOver(null);
              }}
              onKeyDown={(e) => {
                // Alt + ↑ / ↓ reorders without dragging and keeps focus on the moved control.
                if (!e.altKey || disabled || not || isGroup(c) || !["ArrowUp", "ArrowDown"].includes(e.key)) return;
                e.preventDefault();
                e.stopPropagation();
                move(i, i + (e.key === "ArrowUp" ? -1 : 1), (e.target as HTMLElement).dataset.part ?? "field");
              }}
            >
              {isGroup(c) ? (
                <GroupEditor
                  group={c}
                  facts={facts}
                  disabled={disabled}
                  start={first}
                  depth={depth + 1}
                  actions={not ? undefined : itemActions}
                  onChange={(next) => set(items.map((x, n) => (n === i ? next : x)))}
                />
              ) : (
                <ConditionRow
                  leaf={c as Leaf}
                  number={first}
                  facts={facts}
                  disabled={disabled}
                  actions={itemActions}
                  onDragStart={() => {
                    dragging = { group: id, index: i };
                  }}
                  onChange={(next) => set(items.map((x, n) => (n === i ? next : x)))}
                />
              )}
            </div>
          );
        })}
        {!items.length && (
          <p className="cpq-condition-message" data-tone="warning">
            <ProductIcon name="warning" />
            An empty group is incomplete. Add a condition; it never means “always”.
          </p>
        )}
      </div>
    </div>
  );
}

function ConditionRow({
  leaf,
  number,
  facts,
  disabled,
  actions,
  onChange,
  onDragStart,
}: {
  leaf: Leaf;
  number: number;
  facts: Fact[];
  disabled: boolean;
  actions?: ItemActions;
  onChange: (c: Condition) => void;
  onDragStart: () => void;
}) {
  const [cleared, setCleared] = useState<string | null>(null),
    row = useRef<HTMLDivElement>(null);
  const fact = facts.find((f) => f.key === leaf.fact),
    kind = family(fact),
    issue = conditionIssue(leaf, fact),
    message = cleared ?? issue,
    literal = "value" in leaf ? leaf.value : null,
    name = `Condition ${number}`;
  function field(key: string) {
    const next = facts.find((f) => f.key === key),
      nextKind = family(next);
    setCleared(null);
    if (!leaf.op || nextKind !== kind) {
      if (leaf.op && next)
        setCleared(
          `${next.label} is ${nextKind === "Number" ? "a number" : nextKind === "Yes/No" ? "yes/no" : nextKind?.toLowerCase()}, so “${summary(leaf, fact)}” was cleared. Choose ${nextKind === "Yes/No" ? "a yes/no operator" : `a ${nextKind === "Number" ? "number" : nextKind?.toLowerCase()} operator and a value`}.`,
        );
      return onChange(emptyCondition(next));
    }
    // Same type: the operator stays; choices the new field does not offer are dropped.
    if (leaf.op === "IN")
      return onChange({ ...leaf, fact: key, values: kind === "Choice" ? leaf.values.filter((v) => next?.choices.includes(String(v))) : leaf.values });
    if (kind === "Choice" && "value" in leaf && !next?.choices.includes(String(leaf.value)))
      return onChange({ ...leaf, fact: key, value: null } as unknown as Condition);
    onChange({ ...leaf, fact: key });
  }
  function operator(choice: string) {
    setCleared(null);
    const [op, flag] = choice.split(":");
    if (!op) return onChange(emptyCondition(fact));
    if (flag) return onChange({ op, fact: leaf.fact, value: flag === "true" } as Condition);
    if (op === "KNOWN" || op === "NOT_APPLICABLE") return onChange({ op, fact: leaf.fact });
    if (op === "IN")
      return onChange({ op, fact: leaf.fact, values: literal === null || literal === undefined || literal === "" ? [] : [literal] });
    onChange({ op, fact: leaf.fact, value: leaf.op === "IN" ? (leaf.values[0] ?? null) : literal } as Condition);
  }
  const value = (v: unknown) => onChange({ ...leaf, value: v } as Condition);
  const needsValue = !!leaf.op && kind !== "Yes/No" && leaf.op !== "KNOWN" && leaf.op !== "NOT_APPLICABLE",
    attention = !!message;
  return (
    <div className="cpq-condition" ref={row} data-state={attention ? "incomplete" : "complete"}>
      <div className="cpq-condition-main">
        <span
          className="cpq-grip"
          aria-hidden="true"
          title="Drag to reorder"
          draggable={!disabled && !!actions && !actions.clears}
          onDragStart={(e) => {
            onDragStart();
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", name);
            if (row.current) e.dataTransfer.setDragImage(row.current, 12, 18);
          }}
        >
          <ProductIcon name="grip" />
        </span>
        <strong className="cpq-condition-name" aria-hidden="true">
          {name}
        </strong>
        <label className="cpq-box cpq-box-field" data-empty={!fact || undefined}>
          <span className="cpq-box-label" aria-hidden="true">
            Field
          </span>
          <span className="cpq-box-face" aria-hidden="true">
            <span className="cpq-box-text">{fact?.label ?? "Choose a field"}</span>
            {kind && <small>{kind}</small>}
            <ProductIcon name="chevron" />
          </span>
          <select
            data-part="field"
            aria-label={`${name} field`}
            disabled={disabled}
            value={leaf.fact}
            onChange={(e) => field(e.target.value)}
          >
            <option value="">Choose a field</option>
            {facts.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label} ({family(f)})
              </option>
            ))}
          </select>
        </label>
        <label className="cpq-box cpq-box-operator" data-attention={(attention && !leaf.op) || undefined}>
          <span className="cpq-box-label" aria-hidden="true">
            Operator
          </span>
          <span className="cpq-box-face" aria-hidden="true">
            <span className="cpq-box-text" data-placeholder={!leaf.op || undefined}>
              {leaf.op ? operatorLabel(leaf, kind) : "Choose operator"}
            </span>
            <ProductIcon name="chevron" />
          </span>
          <select
            data-part="operator"
            aria-label={`${name} operator`}
            disabled={disabled || !fact}
            value={operatorKey(leaf, kind)}
            onChange={(e) => operator(e.target.value)}
          >
            <option value="">Choose operator</option>
            {operatorChoices(leaf, kind).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <ValueBox
          leaf={leaf}
          fact={fact}
          kind={kind}
          name={name}
          needsValue={needsValue}
          disabled={disabled}
          attention={attention && (!leaf.op || needsValue)}
          onValue={value}
          onValues={(values) => onChange({ ...leaf, values } as Condition)}
        />
        {actions && (
          <span className="cpq-row-actions">
            <button
              type="button"
              className="cpq-icon-button"
              aria-label={`Move ${name.toLowerCase()} up`}
              title="Move up (Alt + ↑)"
              disabled={disabled || actions.index === 0}
              onClick={() => actions.move(actions.index - 1)}
            >
              <ProductIcon name="arrow-up" />
            </button>
            <button
              type="button"
              className="cpq-icon-button"
              aria-label={`Move ${name.toLowerCase()} down`}
              title="Move down (Alt + ↓)"
              disabled={disabled || actions.index === actions.count - 1}
              onClick={() => actions.move(actions.index + 1)}
            >
              <ProductIcon name="arrow-down" />
            </button>
            <button
              type="button"
              className="cpq-icon-button"
              aria-label={`${actions.clears ? "Clear" : "Remove"} ${name.toLowerCase()}`}
              title={actions.clears ? "Clear condition (NOT keeps one child)" : "Remove condition"}
              disabled={disabled}
              onClick={actions.remove}
            >
              <ProductIcon name="trash" />
            </button>
          </span>
        )}
      </div>
      {message && (
        <p className="cpq-condition-message" data-tone="warning" role={cleared ? "status" : undefined}>
          <ProductIcon name="warning" />
          {message}
        </p>
      )}
    </div>
  );
}

function ValueBox({
  leaf,
  fact,
  kind,
  name,
  needsValue,
  disabled,
  attention,
  onValue,
  onValues,
}: {
  leaf: Leaf;
  fact: Fact | undefined;
  kind: Family | null;
  name: string;
  needsValue: boolean;
  disabled: boolean;
  attention: boolean;
  onValue: (v: unknown) => void;
  onValues: (v: (string | boolean)[]) => void;
}) {
  const literal = "value" in leaf ? leaf.value : null,
    unit = kind === "Number" ? fact?.unit : "",
    label = `${name} value`;
  const shell = (control: ReactNode, face?: ReactNode) => (
    <label className="cpq-box cpq-box-value" data-attention={attention || undefined}>
      <span className="cpq-box-label" aria-hidden="true">
        Value
      </span>
      {face}
      {control}
      {unit && <small className="cpq-box-unit">{unit}</small>}
    </label>
  );
  if (!needsValue && leaf.op)
    // Yes/No carries its value in the operator; Known / Not applicable have none.
    return shell(<input data-part="value" aria-label={label} readOnly disabled value="—" />);
  if (!leaf.op)
    return shell(
      <input
        data-part="value"
        aria-label={label}
        disabled
        value=""
        placeholder={kind === "Number" ? "Enter a number" : kind === "Choice" ? "Choose value" : kind === "Text" ? "Enter text" : "—"}
      />,
    );
  if (leaf.op === "IN" && kind === "Text")
    return shell(
      <input
        data-part="value"
        aria-label={`${label}s, separated by commas`}
        disabled={disabled}
        value={leaf.values.join(", ")}
        placeholder="Values, separated by commas"
        onChange={(e) => onValues(e.target.value.split(",").map((v) => v.trimStart()))}
      />,
    );
  if (leaf.op === "IN") {
    const options = kind === "Yes/No" ? ["true", "false"] : (fact?.choices ?? []),
      chosen = leaf.values.map(String),
      text = (v: string) => (kind === "Yes/No" ? (v === "true" ? "Yes" : "No") : v);
    return (
      <span className="cpq-box cpq-box-value cpq-box-choices" data-attention={attention || undefined}>
        <span className="cpq-box-label" aria-hidden="true">
          Value
        </span>
        <CpqMenu
          label={label}
          role="dialog"
          align="start"
          className="cpq-box-face"
          disabled={disabled}
          trigger={
            <>
              <span className="cpq-box-text" data-placeholder={!chosen.length || undefined}>
                {chosen.length ? chosen.map(text).join(", ") : "Choose values"}
              </span>
              <ProductIcon name="chevron" />
            </>
          }
        >
          <fieldset className="cpq-menu-choices" data-part="value">
            <legend>{fact?.label ?? "Values"} is one of</legend>
            {options.map((v) => (
              <label key={v}>
                <input
                  type="checkbox"
                  checked={chosen.includes(v)}
                  disabled={disabled}
                  onChange={(e) => {
                    const next = e.target.checked ? [...chosen, v] : chosen.filter((x) => x !== v);
                    // Keep the configured order of the choices.
                    onValues(options.filter((o) => next.includes(o)).map((o) => (kind === "Yes/No" ? o === "true" : o)));
                  }}
                />
                {text(v)}
              </label>
            ))}
          </fieldset>
        </CpqMenu>
      </span>
    );
  }
  if (kind === "Choice")
    return shell(
      <select
        data-part="value"
        aria-label={label}
        disabled={disabled}
        value={String(literal ?? "")}
        onChange={(e) => onValue(e.target.value || null)}
      >
        <option value="">Choose value</option>
        {(fact?.choices ?? []).map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>,
      <span className="cpq-box-face" aria-hidden="true">
        <span className="cpq-box-text" data-placeholder={!literal || undefined}>
          {literal ? String(literal) : "Choose value"}
        </span>
        <ProductIcon name="chevron" />
      </span>,
    );
  return shell(
    <input
      data-part="value"
      aria-label={label}
      disabled={disabled}
      inputMode={kind === "Number" ? "decimal" : "text"}
      value={String(literal ?? "")}
      placeholder={kind === "Number" ? "Enter a number" : "Enter text"}
      onChange={(e) => onValue(e.target.value === "" ? null : e.target.value)}
    />,
  );
}
