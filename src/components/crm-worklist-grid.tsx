"use client";
import Link from "next/link";
import {
  Fragment,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { dealWorkspaceHref } from "./deal-workspace-link";
import { ProductIcon } from "./product-icons";
import { dealAmount, dealClose, useDesktopCRM } from "./crm-deal-controls";
import { WorklistMenu } from "./crm-worklist-tools";
import { Stamp } from "./business-ui";
import { RegisterChip, RegisterTable } from "./ui/register-table";
import { actionLabels, activityDueLabel } from "../crm/worklist-presentation";
import { valueSummary } from "../crm/value-summary";
import {
  dealColumns,
  defaultDealColumns,
  dealColumnValue,
  type DealColumnId,
} from "../crm/worklist-columns";
import type { listOpportunities, WorklistItem } from "../crm/worklist";
type Results = Awaited<ReturnType<typeof listOpportunities>>;
type Scroll = {
  read: () => { top: number; left: number };
  save: (top: number, left: number) => void;
};

export function DealColumnSettings({
  columns,
  onChange,
}: {
  columns: DealColumnId[];
  onChange: (columns: DealColumnId[]) => void;
}) {
  const move = (id: DealColumnId, step: number) => {
    const next = [...columns],
      from = next.indexOf(id),
      to = from + step;
    if (from <= 0 || to <= 0 || to >= next.length) return;
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };
  return (
    <WorklistMenu
      label="Column settings"
      icon="settings"
      className="crm-column-settings"
    >
      <p>Shown, in this order. Selection and settings stay fixed.</p>
      {[
        ...columns,
        ...dealColumns.map((c) => c.id).filter((id) => !columns.includes(id)),
      ].map((id) => {
        const c = dealColumns.find((c) => c.id === id)!,
          shown = columns.includes(id),
          i = columns.indexOf(id);
        return (
          <div key={id} className="crm-column-option">
            <label>
              <input
                type="checkbox"
                checked={shown}
                disabled={id === "title"}
                onChange={() =>
                  onChange(
                    shown ? columns.filter((x) => x !== id) : [...columns, id],
                  )
                }
              />
              {c.label}
            </label>
            {shown && id !== "title" && (
              <span>
                <button
                  className="secondary"
                  aria-label={`Move ${c.label} earlier`}
                  disabled={i <= 1}
                  onClick={() => move(id, -1)}
                >
                  ↑
                </button>
                <button
                  className="secondary"
                  aria-label={`Move ${c.label} later`}
                  disabled={i === columns.length - 1}
                  onClick={() => move(id, 1)}
                >
                  ↓
                </button>
              </span>
            )}
          </div>
        );
      })}
      <button
        className="secondary crm-menu-choice"
        onClick={() => onChange([...defaultDealColumns])}
      >
        Reset columns
      </button>
      <p>
        Column choice is for this workspace visit. Resize dividers with the
        pointer or arrow keys.
      </p>
    </WorklistMenu>
  );
}

function Cell({
  item,
  column,
  asOf,
}: {
  item: WorklistItem;
  column: DealColumnId;
  asOf: string;
}): ReactNode {
  if (column === "title")
    return (
      <Link
        className="crm-opportunity-title"
        href={dealWorkspaceHref(item.id)}
        title={item.title}
      >
        {item.title}
      </Link>
    );
  if (column === "value") return dealAmount(item.value_amount);
  if (column === "close") return dealClose(item.expected_close_date);
  if (column === "stage")
    return <RegisterChip tone="neutral">{item.stage_id}</RegisterChip>;
  if (column === "activity")
    return (
      <span
        className={`crm-cell-activity crm-cell-summary crm-action-text state-${item.next_action_state}`}
      >
        {item.next_action_state === "Needed"
          ? "Nothing scheduled"
          : (item.next_action_summary ?? actionLabels[item.next_action_state])}
      </span>
    );
  if (column === "due")
    return (
      <span
        className={`crm-cell-activity crm-cell-due crm-action-text state-${item.next_action_state}`}
      >
        {item.next_action_state === "Needed" ? (
          "Schedule a follow-up"
        ) : item.next_action_state === "Unavailable" ? (
          "Unavailable"
        ) : item.due_at ? (
          <span title={item.due_at}>{activityDueLabel(item, asOf)}</span>
        ) : (
          "Due date needed"
        )}
      </span>
    );
  if (column === "updated") return <Stamp value={item.updated_at} />;
  return dealColumnValue(item, column) ?? "Not recorded";
}

export function Grid({
  data,
  scroll,
  onOpen,
  columns: suppliedColumns,
  onColumnsChange,
  selection: suppliedSelection,
  onSelectionChange,
  archive = false,
  selecting = false,
}: {
  data: Results;
  scroll: Scroll;
  onOpen: (id: string) => void;
  columns?: DealColumnId[];
  onColumnsChange?: (columns: DealColumnId[]) => void;
  selection?: string[];
  onSelectionChange?: (ids: string[]) => void;
  archive?: boolean;
  selecting?: boolean;
}) {
  const desktop = useDesktopCRM();
  const ref = useRef<HTMLDivElement>(null),
    all = useRef<HTMLInputElement>(null);
  const [localColumns, setLocalColumns] = useState([...defaultDealColumns]),
    [localSelection, setLocalSelection] = useState<string[]>([]);
  const columns = suppliedColumns ?? localColumns,
    changeColumns = onColumnsChange ?? setLocalColumns;
  const selection = suppliedSelection ?? localSelection,
    select = onSelectionChange ?? setLocalSelection;
  const [widths, setWidths] = useState<Record<string, number>>(
    Object.fromEntries(dealColumns.map((c) => [c.id, c.width])),
  );
  const toggle = (id: string) =>
    select(
      selection.includes(id)
        ? selection.filter((x) => x !== id)
        : [...selection, id],
    );
  useLayoutEffect(() => {
    if (ref.current) {
      const saved = scroll.read();
      ref.current.scrollTop = saved.top;
      ref.current.scrollLeft = saved.left;
    }
  }, [desktop, scroll]);
  useLayoutEffect(() => {
    if (all.current)
      all.current.indeterminate =
        selection.length > 0 && selection.length < data.items.length;
  }, [desktop, selection.length, data.items.length]);
  const groups = archive
    ? ["Won", "Lost"]
        .map((outcome) => ({
          label: outcome,
          items: data.items.filter((i) => i.close_outcome === outcome),
        }))
        .filter((g) => g.items.length)
    : [{ label: "", items: data.items }];
  const band = (label: string, items: WorklistItem[]) => (
    <>
      <strong>{label}</strong>
      <span>
        {items.length} deals · {valueSummary(items).formatted} known ·{" "}
        {valueSummary(items).unknown} not estimated · this page
      </span>
    </>
  );
  return (
    <>
      {!desktop && (
        <div className="crm-phone-list" aria-label="Deals compact List">
          {groups.map((group) => (
            <Fragment key={group.label}>
              {group.label && (
                <div className="crm-outcome-band">
                  {band(group.label, group.items)}
                </div>
              )}
              {group.items.map((item) => (
                <article
                  key={item.id}
                  className="crm-phone-deal"
                  data-opportunity-id={item.id}
                  data-selected={selection.includes(item.id) || undefined}
                >
                  {(selecting || selection.length > 0) && (
                    <label className="crm-phone-select">
                      <input
                        type="checkbox"
                        aria-label={`Select ${item.title}`}
                        checked={selection.includes(item.id)}
                        onChange={() => toggle(item.id)}
                      />
                    </label>
                  )}
                  <Link
                    href={dealWorkspaceHref(item.id)}
                    className="crm-phone-deal-title"
                  >
                    {item.title}
                  </Link>
                  <span>{item.organisation_name}</span>
                  <span>
                    {item.close_outcome === "Open"
                      ? item.stage_id
                      : item.close_outcome}{" "}
                    · {dealAmount(item.value_amount)}
                  </span>
                  <span
                    className={`crm-cell-activity crm-action-text state-${item.next_action_state}`}
                  >
                    {item.next_action_state === "Needed" ? (
                      <>
                        Nothing scheduled
                        <br />
                        Schedule a follow-up
                      </>
                    ) : (
                      <>
                        {item.next_action_summary ??
                          actionLabels[item.next_action_state]}
                        <br />
                        {item.due_at ? (
                          <span title={item.due_at}>
                            {activityDueLabel(item, data.window.as_of)}
                          </span>
                        ) : (
                          actionLabels[item.next_action_state]
                        )}
                      </>
                    )}
                  </span>
                </article>
              ))}
            </Fragment>
          ))}
        </div>
      )}
      {desktop && (
        <div
          ref={ref}
          className="crm-grid-scroll crm-accepted-grid-scroll crm-accepted-grid"
          style={
            {
              "--crm-table-width": `${88 + columns.reduce((sum, id) => sum + widths[id], 0)}px`,
            } as CSSProperties
          }
          role="region"
          aria-label="Deals List — scroll for all columns"
          tabIndex={0}
          onScroll={(e) =>
            scroll.save(e.currentTarget.scrollTop, e.currentTarget.scrollLeft)
          }
        >
          <RegisterTable
            caption={`Permitted deals on this page · ${data.items.length} rows · ${data.sort} order. Tick to select; title opens the deal; eye opens its snapshot.`}
          >
            <colgroup>
              <col style={{ width: 44 }} />
              {columns.map((id) => (
                <col key={id} style={{ width: widths[id] }} />
              ))}
              <col style={{ width: 44 }} />
            </colgroup>
            <thead>
              <tr>
                <th className="crm-fixed-select">
                  <input
                    ref={all}
                    type="checkbox"
                    aria-label="Select all deals on this page"
                    checked={
                      data.items.length > 0 &&
                      selection.length === data.items.length
                    }
                    onChange={(e) =>
                      select(
                        e.target.checked ? data.items.map((i) => i.id) : [],
                      )
                    }
                  />
                </th>
                {columns.map((id) => {
                  const column = dealColumns.find((c) => c.id === id)!;
                  return (
                    <th key={id} scope="col" aria-label={column.label}>
                      {column.label}
                      <button
                        className="crm-column-resize"
                        aria-label={`Resize ${column.label} column`}
                        onKeyDown={(e) => {
                          if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
                            e.preventDefault();
                            setWidths((old) => ({
                              ...old,
                              [id]: Math.max(
                                110,
                                Math.min(
                                  600,
                                  old[id] + (e.key === "ArrowRight" ? 20 : -20),
                                ),
                              ),
                            }));
                          }
                        }}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.currentTarget.setPointerCapture(e.pointerId);
                          e.currentTarget.dataset.startX = String(e.clientX);
                          e.currentTarget.dataset.startWidth = String(
                            widths[id],
                          );
                        }}
                        onPointerMove={(e) => {
                          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                            const width = Math.max(
                              110,
                              Math.min(
                                600,
                                Number(e.currentTarget.dataset.startWidth) +
                                  e.clientX -
                                  Number(e.currentTarget.dataset.startX),
                              ),
                            );
                            setWidths((old) => ({ ...old, [id]: width }));
                          }
                        }}
                        onPointerUp={(e) => {
                          if (e.currentTarget.hasPointerCapture(e.pointerId))
                            e.currentTarget.releasePointerCapture(e.pointerId);
                        }}
                      />
                    </th>
                  );
                })}
                <th className="crm-fixed-settings">
                  <DealColumnSettings
                    columns={columns}
                    onChange={changeColumns}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.label}>
                  {group.label && (
                    <tr className="crm-outcome-group">
                      <th colSpan={columns.length + 2}>
                        <div className="crm-outcome-band">
                          {band(group.label, group.items)}
                        </div>
                      </th>
                    </tr>
                  )}
                  {group.items.map((item) => (
                    <tr
                      key={item.id}
                      data-opportunity-id={item.id}
                      data-selected={selection.includes(item.id) || undefined}
                    >
                      <td className="crm-fixed-select">
                        <input
                          type="checkbox"
                          aria-label={`Select ${item.title}`}
                          checked={selection.includes(item.id)}
                          onChange={() => toggle(item.id)}
                        />
                      </td>
                      {columns.map((id) => (
                        <td
                          key={id}
                          className={id === "value" ? "crm-numeric" : undefined}
                        >
                          <Cell
                            item={item}
                            column={id}
                            asOf={data.window.as_of}
                          />
                        </td>
                      ))}
                      <td className="crm-fixed-settings">
                        <button
                          className="secondary crm-list-snapshot"
                          aria-label={`Snapshot: ${item.title}`}
                          onClick={() => onOpen(item.id)}
                        >
                          <ProductIcon name="eye" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </RegisterTable>
        </div>
      )}
    </>
  );
}
