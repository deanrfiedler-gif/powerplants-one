import type { ReactNode } from "react";

// The house register table: EN-06's owner-refined register as one shared component (ADR-0051, group 2).
// It owns the table's frame, header, sorting control, row states, empty message, footer and state chip.
// The host keeps its data, columns, rows and cells, and marks rows with data-inspected, data-selected and
// data-removed. Styles are in register-table.css. They hold their own values, so the register looks the
// same in every workspace.

export type RegisterTone = "neutral" | "attention" | "positive" | "negative";

export function RegisterTable({
  caption,
  variant = "register",
  stale = false,
  wide = false,
  footer,
  empty,
  children,
}: {
  /** Read by assistive technology only: say what the rows are and what activating or ticking one does. */
  caption: ReactNode;
  /** "register": the flush worklist a page is built around. "panel": a table inside a bordered panel. */
  variant?: "register" | "panel";
  /** Rows from an earlier read stay visible, faded, while the next read is outstanding. */
  stale?: boolean;
  /** Gives wrapping columns (`ppo-register-wrap`) more room. */
  wide?: boolean;
  /** Rendered after the table, inside the scroll area, e.g. a RegisterEmpty message. */
  empty?: ReactNode;
  /** Rendered after the scroll area, e.g. a RegisterFooter. */
  footer?: ReactNode;
  /** The table's thead and tbody. */
  children: ReactNode;
}) {
  return (
    <>
      <div className="ppo-register" data-variant={variant} data-stale={stale || undefined}>
        <table className="ppo-register-table" data-wide={wide || undefined}>
          <caption className="ppo-register-caption">{caption}</caption>
          {children}
        </table>
        {empty}
      </div>
      {footer}
    </>
  );
}

/** A column header that sorts: the whole cell is the button, and aria-sort names the current direction. */
export function RegisterSortHeader({
  label,
  direction,
  onSort,
  className,
}: {
  label: ReactNode;
  direction?: "ascending" | "descending";
  onSort: () => void;
  className?: string;
}) {
  return (
    <th scope="col" className={className} aria-sort={direction}>
      <button type="button" className="ppo-register-sort" onClick={onSort}>
        {label}
      </button>
    </th>
  );
}

/** No rows to show. Say why, and what would bring rows back; absence is never shown as a failure. */
export function RegisterEmpty({ title, children }: { title?: ReactNode; children?: ReactNode }) {
  return (
    <div className="ppo-register-empty">
      {title && <strong>{title}</strong>}
      {children}
    </div>
  );
}

/** The count, selection and paging row under the register. */
export function RegisterFooter({ children }: { children: ReactNode }) {
  return <footer className="ppo-register-foot">{children}</footer>;
}

/**
 * A row's state in words. Show a check only for a completed positive state and a warning only where someone
 * must act; everything in progress is plain words. The host supplies the icon from its own icon set.
 */
export function RegisterChip({ tone, icon, children }: { tone: RegisterTone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={`ppo-register-chip ppo-register-chip--${tone}`}>
      {icon && (
        <span className="ppo-register-chip-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
