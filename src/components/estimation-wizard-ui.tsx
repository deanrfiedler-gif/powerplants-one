"use client";
import type { ReactNode } from "react";
import { FontAwesomeGlyph } from "./font-awesome";
import { estimationWizardFontAwesome } from "./font-awesome-icons";

// ES-02 presentation primitives, from design board r01 "In the app · ES-02 r04"
// (board 10, Components & spec) drawn in the runtime tokens. Every status carries a
// word as well as a colour, every icon has a local outline drawing until the owner's
// Font Awesome Kit is running (ADR-0050), and nothing here holds business state.

// Outline drawings on a 24px grid at 1.7 stroke, the family the shell's secondary
// menu and My Work already use, so the wizard's icons match the shell's with or
// without the Kit.
const paths = {
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.4-4.4" />
    </>
  ),
  columns: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M9.5 4.5v15M15 4.5v15" />
    </>
  ),
  more: (
    <>
      <circle cx="6" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="18" cy="12" r="1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  "chevron-right": <path d="m10 6 6 6-6 6" />,
  "chevron-left": <path d="m14 6-6 6 6 6" />,
  "chevron-down": <path d="m6 10 6 6 6-6" />,
  "arrow-left": <path d="M19 12H5m6-6-6 6 6 6" />,
  "arrow-right": <path d="M5 12h14m-6-6 6 6-6 6" />,
  external: (
    <>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M18 13v6H5V6h6" />
    </>
  ),
  document: (
    <>
      <path d="M7 3.5h7l4 4v13H7z" />
      <path d="M14 3.5v4h4M10 12h5M10 15.5h5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8v.5" />
    </>
  ),
  warning: (
    <>
      <path d="M12 4 3.5 19h17z" />
      <path d="M12 10v4M12 16.5v.5" />
    </>
  ),
  summary: <path d="M5 7h14M5 12h14M5 17h9" />,
  save: (
    <>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M8 4v5h7V4M8 20v-6h8v6" />
    </>
  ),
  compare: <path d="M4 8h13m-3-3 3 3-3 3M20 16H7m3-3-3 3 3 3" />,
  history: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4 4v4.5h4.5M12 8v4.5l3 2" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  eye: (
    <>
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  archive: (
    <>
      <rect x="3.5" y="4.5" width="17" height="4" rx="1" />
      <path d="M5 8.5V19h14V8.5M10 12.5h4" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  plug: (
    <>
      <path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0z" />
      <path d="M12 17v4" />
    </>
  ),
  filter: <path d="M4 6h16l-6 7v5l-4 2v-7z" />,
  family: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M8 10h8M8 14h5" />
    </>
  ),
  climate: (
    <>
      <path d="M10 4.5a2 2 0 0 1 4 0v9.3a3.5 3.5 0 1 1-4 0z" />
      <path d="M12 9v6" />
    </>
  ),
  controls: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M7 9h10M7 12.5h10M7 16h6" />
    </>
  ),
  water: <path d="M12 3.5s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />,
  automation: (
    <>
      <rect x="3.5" y="13" width="17" height="5" rx="2.5" />
      <circle cx="7" cy="15.5" r="1" />
      <circle cx="12" cy="15.5" r="1" />
      <circle cx="17" cy="15.5" r="1" />
      <path d="M7 10h4v3H7zM13 7h4v6h-4z" />
    </>
  ),
  structures: (
    <>
      <path d="M3.5 20V9l8.5-5 8.5 5v11" />
      <path d="M8 20v-7h8v7M3.5 20h17" />
    </>
  ),
  services: (
    <>
      <path d="m14.5 6 3.5 3.5-9.5 9.5L5 15.5z" />
      <path d="M17 4.5 19.5 7M5 15.5 3 20l4.5-2" />
    </>
  ),
  infrastructure: (
    <>
      <rect x="9" y="3.5" width="6" height="5" rx="1" />
      <rect x="3.5" y="15.5" width="6" height="5" rx="1" />
      <rect x="14.5" y="15.5" width="6" height="5" rx="1" />
      <path d="M12 8.5V12M6.5 15.5V12h11v3.5" />
    </>
  ),
  other: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5M12 16.5v.5" />
    </>
  ),
  added: (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="2" />
      <path d="M12 8.5v7M8.5 12h7" />
    </>
  ),
  changed: (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="2" />
      <path d="m9 15 .6-2.4 4.8-4.8 1.8 1.8-4.8 4.8z" />
    </>
  ),
  removed: (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="2" />
      <path d="M8.5 12h7" />
    </>
  ),
  unchanged: (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="2" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </>
  ),
  incomparable: (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="2" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
} as const;
export type WizardIconName = keyof typeof paths;

export function Icon({
  name,
  className = "es02-icon",
}: {
  name: WizardIconName;
  className?: string;
}) {
  return (
    <FontAwesomeGlyph
      icon={estimationWizardFontAwesome[name]}
      className={className}
      fallback={
        <svg
          className={className}
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          {paths[name]}
        </svg>
      }
    />
  );
}

// Status tags. The tone is a hint for the surface; the text is the status.
export type Tone = "neutral" | "success" | "warning" | "danger" | "info";
export function Tag({
  tone = "neutral",
  dot = false,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`es02-tag es02-tag-${tone}${className ? ` ${className}` : ""}`}
      data-dot={dot || undefined}
    >
      {children}
    </span>
  );
}

// The tone a scope state, readiness or confirmation word takes on the board.
export const toneFor = (word: string): Tone =>
  /^(Confirmed|Complete|Included|Selected|Active|Current|Matches)/.test(word)
    ? "success"
    : /^(Incomplete|Confirm |Assumed|Reconfirm|Not verified|Unsaved|Allowance|Deferred|Needs|Unknown|Price pending|Stale)/.test(
          word,
        )
      ? "warning"
      : /^(Render failed|Refused|Denied|Archived|Excluded|Removed)/.test(word)
        ? "danger"
        : /^(Optional|Proposal|Added)/.test(word)
          ? "info"
          : "neutral";

export function StateTag({ value }: { value: string }) {
  return <Tag tone={toneFor(value)}>{value}</Tag>;
}

// Change markers for comparisons: a glyph and a word, never colour alone (board P6).
const changes = {
  Added: { icon: "added", tone: "success" },
  Changed: { icon: "changed", tone: "warning" },
  Removed: { icon: "removed", tone: "danger" },
  Unchanged: { icon: "unchanged", tone: "neutral" },
  "Not comparable": { icon: "incomparable", tone: "neutral" },
} as const satisfies Record<string, { icon: WizardIconName; tone: Tone }>;
export type ChangeWord = keyof typeof changes;
export function ChangeMarker({ change }: { change: string }) {
  const known = (change in changes ? change : "Not comparable") as ChangeWord;
  return (
    <span className={`es02-change es02-change-${changes[known].tone}`}>
      <Icon name={changes[known].icon} className="es02-icon es02-icon-sm" />
      {change}
    </span>
  );
}

// A labelled value row for the summary and the review tiles.
export function Row({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="es02-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// Text with a leading amber or neutral dot, for the working-copy state.
export function Dot({ tone = "warning" }: { tone?: Tone }) {
  return <span className={`es02-dot es02-dot-${tone}`} aria-hidden="true" />;
}

// Every table that can scroll sideways is a labelled, focusable region (board B6,
// WCAG 2.2 SC 2.1.1), so a keyboard reaches its hidden columns.
export function TableScroll({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`es02-table-scroll${className ? ` ${className}` : ""}`}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

export const pad = (n: number) => String(n).padStart(2, "0");
export const plural = (n: number, word: string, none = `No ${word}s`) =>
  n === 0 ? none : `${n} ${word}${n === 1 ? "" : "s"}`;
