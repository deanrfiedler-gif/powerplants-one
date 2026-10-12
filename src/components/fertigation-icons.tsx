"use client";
import type { ReactNode } from "react";
import { FontAwesomeGlyph } from "./font-awesome";
import { fertigationFontAwesome } from "./font-awesome-icons";

/**
 * The fertigation workbench's icons: the nine section glyphs the design board
 * draws on its rail, and the action glyphs its header, panels and tables use.
 * Each is Font Awesome Classic Light once the Kit is running (ADR-0050) and the
 * outline drawing below until then. Icons are visual only; words stand beside
 * them, or an aria-label does where a control is icon-only.
 */
export type FertigationIconName =
  | "conflict"
  | "overview"
  | "growing"
  | "water"
  | "recipes"
  | "controls"
  | "operating"
  | "configurator"
  | "evidence"
  | "review"
  | "history"
  | "report"
  | "save"
  | "plus"
  | "search"
  | "edit"
  | "download"
  | "chevron-down"
  | "chevron-up"
  | "info"
  | "check"
  | "back"
  | "list"
  | "leaf"
  | "compare"
  | "lock"
  | "user"
  | "file"
  | "flask"
  | "upload"
  | "swap"
  | "calculate"
  | "external";

const paths: Record<FertigationIconName, ReactNode> = {
  conflict: (
    <>
      <path d="M12 4 2.5 20h19z" />
      <path d="M12 10v4" />
    </>
  ),
  overview: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  growing: (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </>
  ),
  water: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  recipes: (
    <>
      <path d="M9 3h6" />
      <path d="M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3" />
      <path d="M7.5 15h9" />
    </>
  ),
  controls: (
    <>
      <path d="M4 7h9" />
      <path d="M17 7h3" />
      <circle cx="15" cy="7" r="2" />
      <path d="M4 17h3" />
      <path d="M11 17h9" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  operating: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  configurator: (
    <>
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  evidence: (
    <>
      <path d="M14 3H6v18h12V7z" />
      <path d="M14 3v4h4" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </>
  ),
  review: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1" />
      <path d="m9 13 2 2 4-4" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4h4" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  report: (
    <>
      <path d="M7 9V3h10v6" />
      <path d="M7 17H4v-7h16v7h-3" />
      <path d="M7 14h10v7H7z" />
    </>
  ),
  save: (
    <>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M8 4v5h7V4" />
      <path d="M8 20v-6h8v6" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z" />
      <path d="m13 8 3 3" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 19h16" />
    </>
  ),
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-up": <path d="m6 15 6-6 6 6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </>
  ),
  check: <path d="m5 12 4 4 10-10" />,
  back: (
    <>
      <path d="M10 6 4 12l6 6" />
      <path d="M4 12h16" />
    </>
  ),
  list: (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h10" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" />
      <path d="m5 19 8-8" />
    </>
  ),
  compare: (
    <>
      <path d="M8 4v16" />
      <path d="M16 4v16" />
      <path d="m5 7 3-3 3 3" />
      <path d="m13 17 3 3 3-3" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H6v18h12V7z" />
      <path d="M14 3v4h4" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6" />
      <path d="M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V5" />
      <path d="m7 10 5-5 5 5" />
      <path d="M4 19h16" />
    </>
  ),
  swap: (
    <>
      <path d="M4 8h13" />
      <path d="m14 5 3 3-3 3" />
      <path d="M20 16H7" />
      <path d="m10 13-3 3 3 3" />
    </>
  ),
  calculate: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8" />
      <path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M18 13v6H5V6h6" />
    </>
  ),
};

export function FertigationIcon({
  name,
  className = "fn-icon",
  selected = false,
}: {
  name: FertigationIconName;
  className?: string;
  selected?: boolean;
}) {
  return (
    <FontAwesomeGlyph
      icon={fertigationFontAwesome[name]}
      selected={selected}
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
