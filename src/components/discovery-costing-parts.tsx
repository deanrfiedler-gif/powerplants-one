"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { CostLine } from "../estimating/math";
import type { SourceBinding } from "../estimating/sources/bindings";
import { parseLines } from "../estimating/validation";
import { Button } from "./ui/button";
import {
  Field,
  SelectField,
  ErrorNotice,
  ValidationFields,
} from "./business-ui";
import { Icon, TableScroll } from "./estimation-wizard-ui";
import { ProductIcon } from "./product-icons";
import {
  allowanceTotal,
  amountText,
  money,
  proposalAmounts,
  retainedSource,
} from "./discovery-costing-model";

// Page-local composition of the wizard dialog contract; native modal focus and return.
export function CostingDialog({
  title,
  subtitle,
  children,
  footer,
  close,
  frozen = false,
  lineEditor = false,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  close: () => void;
  frozen?: boolean;
  lineEditor?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!,
      opener = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      opener?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dc-dialog${lineEditor ? " dc-line-editor" : ""}`}
      aria-label={title}
      aria-busy={frozen || undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (!frozen) close();
      }}
    >
      <header>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <Button aria-label={`Close ${title}`} disabled={frozen} onClick={close}>
          <Icon name="close" />
        </Button>
      </header>
      <div className="dc-dialog-body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </dialog>
  );
}
export function CostingBanner({
  children,
  warning = false,
}: {
  children: ReactNode;
  warning?: boolean;
}) {
  return (
    <div
      className={`dc-banner${warning ? " dc-warning" : ""}`}
      role={warning ? "alert" : undefined}
    >
      <Icon name={warning ? "warning" : "info"} />
      <div>{children}</div>
    </div>
  );
}
export function CostingLoading() {
  return (
    <section
      className="dc-loading"
      aria-label="Loading saved costing basis"
      aria-busy="true"
    >
      <p>
        Costing uses the exact saved discovery revision of the selected option.
        Discovery does not generate prices.
      </p>
      <p role="status">Loading the saved scope and estimate…</p>
      {[1, 2, 3, 4].map((n) => (
        <div className="dc-skeleton" key={n} aria-hidden="true">
          <span />
          <span />
        </div>
      ))}
    </section>
  );
}
export function CostingTotals({
  lines,
  saved,
  version,
}: {
  lines: CostLine[];
  saved?: CostLine[];
  version?: number;
}) {
  const totals = proposalAmounts(lines),
    old = saved ? proposalAmounts(saved) : null;
  return (
    <section className="dc-totals" aria-label="Proposal totals">
      <div>
        <small>Cost total</small>
        <strong>{money(totals?.cost)}</strong>
        <small>
          Internal{old ? ` · v${version} was ${money(old.cost)}` : ""}
        </small>
      </div>
      <div>
        <small>Sell total</small>
        <strong>{money(totals?.sell)}</strong>
        <small>
          {old ? `v${version} was ${money(old.sell)}` : "Excluding tax"}
        </small>
      </div>
      <div>
        <small>Margin</small>
        <strong>
          {totals?.margin_percent == null
            ? "Unknown"
            : `${totals.margin_percent}%`}
        </strong>
        <small>Calculated. Not an approval gate.</small>
      </div>
      <div>
        <small>Allowances</small>
        <strong>{money(allowanceTotal(lines))}</strong>
        <small>
          {lines.filter((line) => line.allowance).length} allowance lines · sell
        </small>
      </div>
      <div className="dc-phone-total">
        <strong>Sell {money(totals?.sell)}</strong>
        <small>
          {old
            ? `v${version} was ${money(old.sell)} · calculated`
            : "Calculated · excluding tax"}
        </small>
      </div>
      <div className="dc-phone-total">
        <strong>
          Cost {money(totals?.cost)} · margin{" "}
          {totals?.margin_percent == null
            ? "Unknown"
            : `${totals.margin_percent}%`}
        </strong>
        <small>Internal · not an approval gate</small>
      </div>
    </section>
  );
}
function Source({
  line,
  saved,
  bindings,
}: {
  line: CostLine;
  saved: CostLine[];
  bindings: SourceBinding[];
}) {
  const source = retainedSource(line, saved, bindings),
    text = `${line.source || "Source required"} · ${line.effective_date || "Date required"}`;
  return source ? (
    <Link
      href={`/estimating/cost-sources/${source.source_id}?revision_id=${source.source_revision_id}`}
      title="Review this exact cost source"
    >
      {text}
    </Link>
  ) : (
    <span>{text}</span>
  );
}
export function CostingLines({
  lines,
  saved,
  bindings,
  changed,
  disabled,
  edit,
  add,
}: {
  lines: CostLine[];
  saved: CostLine[];
  bindings: SourceBinding[];
  changed: CostLine[];
  disabled: boolean;
  edit: (line: CostLine) => void;
  add: () => void;
}) {
  const [search, setSearch] = useState("");
  const shown = lines.filter((line) =>
    `${line.description} ${line.category} ${line.source}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  return (
    <>
      <div className="dc-line-toolbar">
        <div className="dc-view-switch">
          <span aria-current="true">Line items</span>
          <span
            title="Cost-types view is not specified for this page"
            aria-disabled="true"
          >
            Cost types
          </span>
        </div>
        <label className="dc-search">
          <Icon name="search" />
          <span className="sr-only">Search lines</span>
          <input
            aria-label="Search lines"
            placeholder="Search lines"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <Button disabled={disabled || lines.length >= 100} onClick={add}>
          <Icon name="plus" />
          Add manual line
        </Button>
      </div>
      <TableScroll label="Cost lines" className="dc-grid">
        <table>
          <colgroup>
            {[
              "description",
              "category",
              "quantity",
              "unit",
              "amount",
              "amount",
              "amount",
              "amount",
              "source",
              "allowance",
            ].map((name, i) => (
              <col key={i} className={`dc-col-${name}`} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {[
                "Description",
                "Category",
                "Qty",
                "Unit",
                "Unit cost",
                "Cost total",
                "Unit sell",
                "Sell total",
                "Source · effective",
                "Allowance",
              ].map((label) => (
                <th scope="col" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((line) => {
              const amounts = proposalAmounts([line])?.items[0],
                differs = changed.some((item) => item.id === line.id);
              return (
                <tr key={line.id}>
                  <th scope="row">
                    <Button
                      variant="quiet"
                      disabled={disabled}
                      onClick={() => edit(line)}
                      aria-label={`Edit ${line.description || "untitled line"}`}
                    >
                      {differs && (
                        <span title="Differs from saved cost version">
                          <ProductIcon name="edit" />
                          <span className="sr-only">Changed: </span>
                        </span>
                      )}
                      {line.description || "Untitled line"}
                    </Button>
                  </th>
                  <td>{line.category}</td>
                  <td>{line.quantity || "Unknown"}</td>
                  <td>{line.unit || "Unknown"}</td>
                  <td>{amountText(line.unit_cost || null)}</td>
                  <td>{amountText(amounts?.cost_total)}</td>
                  <td>{amountText(line.unit_sell || null)}</td>
                  <td>{amountText(amounts?.sell_total)}</td>
                  <td>
                    <Source line={line} saved={saved} bindings={bindings} />
                  </td>
                  <td>
                    {line.allowance === undefined
                      ? "Not recorded"
                      : line.allowance
                        ? "Yes"
                        : "No"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>
      <div className="dc-phone-lines">
        {shown.map((line) => {
          const amounts = proposalAmounts([line])?.items[0];
          return (
            <article key={line.id}>
              {changed.some((item) => item.id === line.id) ? (
                <ProductIcon name="edit" />
              ) : (
                <Icon name="check" />
              )}
              <div>
                <strong>
                  {line.description || "Untitled line"}
                  {line.allowance ? " · allowance" : ""}
                </strong>
                <small>
                  {line.quantity || "Unknown"} {line.unit}
                  <span className="dc-phone-cost">
                    {" "}
                    · cost {amountText(amounts?.cost_total)}
                  </span>{" "}
                  · sell {amountText(amounts?.sell_total)}
                </small>
              </div>
              <Button
                variant="quiet"
                disabled={disabled}
                aria-label={`Edit ${line.description || "untitled line"}`}
                onClick={() => edit(line)}
              >
                Edit
              </Button>
            </article>
          );
        })}
      </div>
      {!shown.length && (
        <p className="dc-empty" role="status">
          {lines.length
            ? "No cost lines match this search."
            : "No proposal lines. Add a manual line to enter costs."}
        </p>
      )}
      <div className="dc-grid-foot">
        <span>
          {lines.length} lines · {changed.length} differ from the saved version
          (pen marker) · {lines.filter((line) => line.allowance).length}{" "}
          allowances
        </span>
        <span>AUD · excluding tax · tax not calculated</span>
      </div>
    </>
  );
}
export function CostingLineEditor({
  line,
  index,
  saved,
  bindings,
  save,
  remove,
  close,
}: {
  line: CostLine;
  index: number;
  saved: CostLine[];
  bindings: SourceBinding[];
  save: (line: CostLine) => void;
  remove: () => void;
  close: () => void;
}) {
  const [value, setValue] = useState(line),
    [error, setError] = useState<unknown>(null);
  const patch = (next: Partial<CostLine>) => {
    setValue({ ...value, ...next });
    setError(null);
  };
  return (
    <CostingDialog
      title={`Edit cost line ${index + 1}`}
      subtitle="Manual AUD · source and date are retained with the line"
      close={close}
      lineEditor
      footer={
        <>
          <Button variant="danger" onClick={remove}>
            Remove line
          </Button>
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" type="submit" form="dc-line-form">
            Keep line in proposal
          </Button>
        </>
      }
    >
      <form
        id="dc-line-form"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            parseLines([value], 2);
            save(value);
          } catch (e) {
            setError(e);
          }
        }}
      >
        <ValidationFields error={error}>
          <ErrorNotice error={error} />
          <div className="dc-line-fields">
            <Field
              label="Description"
              name="lines.0.description"
              value={value.description}
              onChange={(description) => patch({ description })}
              required
              maxLength={300}
            />
            <SelectField
              label="Category"
              name="lines.0.category"
              value={value.category}
              onChange={(category) =>
                patch({ category: category as CostLine["category"] })
              }
              options={[
                "Product",
                "Labour",
                "Freight",
                "Engineering",
                "Subcontract",
              ].map((id) => ({ id, display_name: id }))}
              required
            />
            <Field
              label="Quantity"
              name="lines.0.quantity"
              value={value.quantity}
              onChange={(quantity) => patch({ quantity })}
              hint="Up to 3 decimal places"
              required
            />
            <Field
              label="Unit"
              name="lines.0.unit"
              value={value.unit}
              onChange={(unit) => patch({ unit })}
              maxLength={40}
              required
            />
            <Field
              label="Unit cost AUD"
              name="lines.0.unit_cost"
              value={value.unit_cost}
              onChange={(unit_cost) => patch({ unit_cost })}
              required
            />
            <Field
              label="Unit sell AUD"
              name="lines.0.unit_sell"
              value={value.unit_sell}
              onChange={(unit_sell) => patch({ unit_sell })}
              required
            />
            <Field
              label="Source"
              name="lines.0.source"
              value={value.source}
              onChange={(source) => patch({ source })}
              required
              maxLength={500}
              multiline
            />
            <Field
              label="Source date"
              name="lines.0.effective_date"
              value={value.effective_date}
              onChange={(effective_date) => patch({ effective_date })}
              type="date"
              required
            />
            <SelectField
              label="Allowance"
              name="lines.0.allowance"
              value={
                value.allowance === undefined
                  ? ""
                  : value.allowance
                    ? "Yes"
                    : "No"
              }
              onChange={(allowance) =>
                patch({
                  allowance: allowance === "" ? undefined : allowance === "Yes",
                })
              }
              options={["Yes", "No"].map((id) => ({ id, display_name: id }))}
              required
            />
          </div>
          <p>
            <Source line={value} saved={saved} bindings={bindings} />
          </p>
          <p className="dc-note">
            Changing a reviewed source's quantity, unit, cost, source or date
            leaves a manual proposal; it does not review a new price. No
            automatic pricing.
          </p>
        </ValidationFields>
      </form>
    </CostingDialog>
  );
}
