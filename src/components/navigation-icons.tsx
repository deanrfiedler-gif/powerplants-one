import type { ReactNode } from "react";

// Locally authored geometry from PPO-NAV-ICON-REC r02's semantic descriptions.
// Bodies alone receive fill; detail paths retain contrast. Open symbols specify
// their own selective fill rather than filling every path in an SVG.
type Drawing = { body: ReactNode; detail?: ReactNode; exterior?: ReactNode; open?: boolean; selected?: ReactNode };
const box = <rect x="4" y="4" width="16" height="17" rx="2" />;
const clip = <path d="M9 4V2h6v2M9 4h6" />;
const paper = <path d="M5 2h9l5 5v15H5Z" />;
const fold = <path d="M14 2v5h5" />;
const cube = <path d="m12 3 9 5v9l-9 5-9-5V8Z" />;
const seams = <path d="m3 8 9 5 9-5M12 13v9M7.5 5.5l9 5" />;
const calendar = <rect x="3" y="5" width="18" height="16" rx="2" />;
const bindings = <path d="M7 2v5M17 2v5" />;
const shield = <path d="m12 2 8 3v6c0 5-4 9-8 11-4-2-8-6-8-11V5Z" />;
const tick = <path d="m8 12 3 3 5-6" />;

export const navigationDrawings = {
  "nav-pulse": { body: <path d="M12 21 3.5 12.5C-2 6.5 6 0 12 6c6-6 14 0.5 8.5 6.5Z" />, detail: <path d="M3 12h4l2-4 4 8 2-4h6" /> },
  "nav-leads": { body: <><circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/></>, open: true, selected: <><circle cx="12" cy="12" r="7" strokeWidth="2.8"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/></> },
  "nav-deals": { body: <circle cx="12" cy="12" r="9"/>, detail: <path d="M15 8H10.5a2 2 0 0 0 0 4h3a2 2 0 0 1 0 4H9M12 6v12"/> },
  "nav-activities": { body: calendar, exterior: bindings, detail: <path d="M3 10h18M7 14h1M12 14h1M17 14h.01M7 18h1M12 18h1M17 18h.01"/> },
  "nav-tasks": { body: box, exterior: clip, detail: <path d="m8 13 3 3 5-6"/> },
  "nav-mail": { body: <rect x="3" y="5" width="18" height="14" rx="2"/>, detail: <path d="m3 6 9 7 9-7"/> },
  "nav-contacts": { body: <rect x="2" y="5" width="20" height="14" rx="2"/>, detail: <><circle cx="7" cy="10" r="2"/><path d="M4 16a3 3 0 0 1 6 0M14 9h5M14 13h5M14 16h3"/></> },
  "nav-products": { body: cube, detail: seams },
  "nav-insights": { body: <path d="M3 3v18h18M6 16l5-6 4 3 6-8"/>, open: true, selected: <><path d="M6 16l5-6 4 3 6-8v14H6Z" fill="currentColor" opacity=".25" stroke="none"/><path d="M3 3v18h18M6 16l5-6 4 3 6-8" strokeWidth="2.2"/></> },
  "nav-work": { body: box, exterior: clip, detail: <path d="M8 10h8M8 14h8M8 18h5"/> },
  "nav-inbox": { body: <path d="m3 12 3-8h12l3 8v8H3Z"/>, detail: <path d="M3 12h5l2 3h4l2-3h5"/> },
  "nav-wizard": { body: <path d="M4 3v14h5M4 7h5M13 5h8M13 9h6M13 15h8M13 19h6"/>, open: true, selected: <><path d="M4 3v14h5" strokeWidth="2.8"/><rect x="9" y="5" width="2" height="4" fill="currentColor"/><rect x="9" y="15" width="2" height="4" fill="currentColor"/><path d="M14 5h7M14 9h5M14 15h7M14 19h5"/></> },
  "nav-estimates": { body: <rect x="5" y="2" width="14" height="20" rx="2"/>, detail: <path d="M8 6h8M8 10h1M12 10h1M16 10h.01M8 14h1M12 14h1M16 14h.01M8 18h1M12 18h1M16 18h.01"/> },
  "nav-configurations": { body: <><path d="M3 5h18M3 12h18M3 19h18"/><rect x="6" y="3" width="3" height="4" rx="1"/><rect x="15" y="10" width="3" height="4" rx="1"/><rect x="8" y="17" width="3" height="4" rx="1"/></> },
  "nav-pricing": { body: <><path d="m5 3 7 1 8 8-8 8-9-9Z"/><path d="m16 4 7 8-9 10"/></>, detail: <circle cx="8" cy="8" r="1.5"/> },
  "nav-quotation": { body: paper, detail: <>{fold}<path d="M8 11h8M8 15h8M8 19h5"/></> },
  "nav-approval": { body: <path d="m12 2 3 2 4 .5.5 4 2 3-2 3-.5 4-4 .5-3 2-3-2-4-.5-.5-4-2-3 2-3 .5-4L9 4Z"/>, detail: tick },
  "nav-workload": { body: <><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="3" y="10" width="5" height="5" rx="1"/><rect x="3" y="17" width="5" height="5" rx="1"/></>, detail: <path d="M12 5h9M12 12h9M12 19h9"/> },
  "nav-interfaces": { body: <><rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/></>, detail: <path d="M12 7v5M5 17v-5h14v5"/> },
  "nav-drawings": { body: <path d="m15 3 6 6L9 21l-6-6Z"/>, detail: <path d="m12 6 3 3M9 9l2 2M6 12l3 3M15 12l2 2"/> },
  "nav-materials": { body: <path d="m12 2 10 5-10 5L2 7Z"/>, detail: <path d="m2 12 10 5 10-5M2 17l10 5 10-5"/> },
  "nav-changes": { body: <><circle cx="6" cy="4" r="2"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="20" r="2"/></>, detail: <path d="M6 6v12M18 18V9a5 5 0 0 0-5-5h-1m3-3-3 3 3 3"/> },
  "nav-commissioning": { body: <path d="M3 19a10 10 0 1 1 18 0Z"/>, detail: <><path d="m12 15 5-6M5 13h1M8 7l1 1M12 5v1M19 13h-1"/><circle cx="12" cy="15" r="1.5"/></> },
  "nav-projects": { body: <path d="M3 5h6l3 3h9v13H3Z"/>, detail: <path d="M7 11v6M12 11v4M17 11v7"/> },
  "nav-programme": { body: <><rect x="3" y="4" width="10" height="3" rx="1"/><rect x="8" y="10" width="12" height="3" rx="1"/><rect x="5" y="16" width="10" height="3" rx="1"/></> },
  "nav-readiness": { body: <path d="m3 5 2 2 3-4m-5 9 2 2 3-4m-5 9 2 2 3-4M12 5h9M12 12h9M12 19h9"/>, open: true, selected: <><path d="m3 5 2 2 3-4m-5 9 2 2 3-4m-5 9 2 2 3-4" strokeWidth="3"/><path d="M12 5h9M12 12h9M12 19h9" strokeWidth="2.4"/></> },
  "nav-risks": { body: <path d="m12 3 10 18H2Z"/>, detail: <path d="M12 9v5M12 17h.01"/> },
  "nav-variations": { body: paper, detail: <>{fold}<path d="M8 12h8M12 9v6M8 18h8"/></> },
  "nav-assurance": { body: shield, detail: tick },
  "nav-acceptance": { body: <path d="M5 3h15l-3 5 3 5H5Z"/>, detail: <path d="M5 3v19"/> },
  "nav-requests": { body: <><rect x="3" y="10" width="4" height="8" rx="2"/><rect x="17" y="10" width="4" height="8" rx="2"/></>, detail: <path d="M3 12V10a9 9 0 0 1 18 0v7c0 3-2 4-6 4h-3"/> },
  "nav-orders": { body: <path d="M19 10V4H5v18h8"/>, open: true, selected: <><path d="M19 10V4H5v18h8V11Z" fill="currentColor"/><path d="M9 4V2h6v2M8 10h7" stroke="var(--ppo-icon-cutout, #f0f6ed)"/><path d="m14 20 1-4 5-5 3 3-5 5-4 1ZM8 18h3"/></>, detail: <>{clip}<path d="m14 20 1-4 5-5 3 3-5 5-4 1ZM8 10h7M8 18h3"/></> },
  "nav-schedule": { body: calendar, exterior: bindings, detail: <path d="M3 10h18M7 15h10M7 13v4M17 13v4"/> },
  "nav-team": { body: <><circle cx="9" cy="7" r="3"/><circle cx="18" cy="8" r="2.5"/><path d="M2 21v-3a7 7 0 0 1 14 0v3ZM17 14a5 5 0 0 1 5 5v2"/></> },
  "nav-packs": { body: <path d="M3 20V4h6l3 3h8v4H7l-4 9h15l4-9H7Z"/> },
  "nav-service-review": { body: <path d="M13 22H5V2h9l5 5v7"/>, open: true, selected: <><path d="M13 22H5V2h9l5 5v7l-6 2Z" fill="currentColor"/><path d="M14 2v5h5M8 11h7" stroke="var(--ppo-icon-cutout, #f0f6ed)"/><path d="m14 19 3 3 5-6"/></>, detail: <>{fold}<path d="M8 11h7m-1 8 3 3 5-6"/></> },
  "nav-equipment": { body: <path d="m12 2 4 4-4 4-4-4Zm-6 6 4 4-4 4-4-4Zm12 0 4 4-4 4-4-4Zm-6 6 4 4-4 4-4-4Z"/> },
  "nav-demand": { body: <path d="M3 3h1v4M2 7h4M2 11h4l-4 4h4M2 18h4l-2 2 2 2H2M10 5h11M10 13h11M10 20h11"/>, open: true, selected: <path d="M3 3h1v4M2 7h4M2 11h4l-4 4h4M2 18h4l-2 2 2 2H2M10 5h11M10 13h11M10 20h11" strokeWidth="2.6"/> },
  "nav-purchasing": { body: <path d="M5 5h17l-3 10H7Z"/>, detail: <><path d="M2 2h2l4 16h11"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></> },
  "nav-inbound": { body: <rect x="2" y="5" width="20" height="14" rx="1"/>, exterior: <path d="M4 19v2M20 19v2"/>, detail: <path d="M6 8v8M10 8v8M14 8v8M18 8v8"/> },
  "nav-receiving": { body: <path d="m12 3 9 5v5l-7 9-11-5V8Z"/>, detail: seams, exterior: <path d="m16 18 2 2 4-5"/> },
  "nav-stock": { body: <path d="M2 9 12 3l10 6v13H2Z"/>, detail: <path d="M6 22V11h12v11M6 15h12M6 19h12"/> },
  "nav-dispatch": { body: <path d="M2 5h12v13H2Zm12 5h4l4 5v3h-8Z"/>, exterior: <><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="19" r="2.5"/></>, detail: <path d="M15 10v5h7"/> },
  "nav-returns": { body: <path d="m12 3 9 5v5l-7 9-11-5V8Z"/>, detail: seams, exterior: <path d="m17 16 5 5m0-5-5 5"/> },
  "nav-accounts": { body: <rect x="4" y="2" width="16" height="20" rx="2"/>, exterior: <path d="M2 6h4M2 12h4M2 18h4"/>, detail: <><path d="M7 2v20M10 17a4 4 0 0 1 7 0"/><circle cx="13.5" cy="9" r="2.5"/></> },
  "nav-performance": { body: <><rect x="4" y="12" width="3" height="8"/><rect x="10" y="4" width="3" height="16"/><rect x="16" y="8" width="3" height="12"/></>, detail: <path d="M2 22h20"/> },
  "nav-claims": { body: <path d="M5 2h14v20l-3-2-4 2-4-2-3 2Z"/>, detail: <path d="M8 6h8M8 10h8M8 14h5"/> },
  "nav-cash": { body: <path d="M3 6V4l15-2v4h3v15H3Z"/>, detail: <><path d="M3 6h18M21 11h-6v6h6"/><circle cx="17" cy="14" r=".5"/></> },
  "nav-reconciliation": { body: <><path d="M2 15h8a4 4 0 0 1-8 0Zm12 0h8a4 4 0 0 1-8 0Z"/></>, detail: <path d="M12 2v20M8 22h8M3 6h18M6 6l-4 9m4-9 4 9M18 6l-4 9m4-9 4 9"/> },
  "nav-exceptions": { body: <circle cx="12" cy="12" r="9"/>, detail: <path d="M12 7v7M12 17h.01"/> },
  "nav-people": { body: <><circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3Z"/></> },
  "nav-organisations": { body: <path d="M3 22V3h11v19Zm11-13h7v13h-7"/>, detail: <path d="M6 7h1M10 7h1M6 11h1M10 11h1M6 15h1M10 15h1M8 22v-3M17 13h1M17 17h1"/> },
  "nav-sites": { body: <path d="M19 9c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 14 0Z"/>, detail: <circle cx="12" cy="9" r="2.5"/> },
  "nav-facilities": { body: <path d="m2 15 13-7 7 7-13 7Z"/>, exterior: <path d="M2 15v-5M15 8V3M22 15v-5"/>, detail: <path d="M9 22v-5M8 12l7 7"/> },
  "nav-documents": { body: <path d="M8 2h9l4 4v13H8Z"/>, exterior: <path d="M5 6H3v16h13"/>, detail: <path d="M17 2v5h4M11 11h7M11 15h7"/> },
  "nav-screen": { body: <rect x="3" y="3" width="16" height="15" rx="1"/>, exterior: <path d="M22 3v18M21 21h2"/>, detail: <path d="M3 7h16M3 11h16M3 15h16"/> },
  "nav-fertigation": { body: <><path d="M9 2C7 6 3 9 3 13a6 6 0 0 0 12 0c0-4-4-7-6-11Z"/><path d="M18 10c-1 3-3 4-3 7a3.5 3.5 0 0 0 7 0c0-3-3-5-4-7Z"/></> },
  "nav-service": { body: <path d="m14 3-2 5 4 4 5-2a7 7 0 0 1-8 7l-7 5-4-4 6-7a7 7 0 0 1 6-8Z"/> },
  "nav-engineering": { body: <circle cx="12" cy="5" r="2"/>, detail: <path d="M12 1v2M11 7 4 22M13 7l7 15M7 15c4 2 7 2 10 0"/> },
  "nav-sales": { body: <rect x="3" y="6" width="18" height="15" rx="2"/>, exterior: <path d="M8 6V3h8v3"/>, detail: <path d="M3 11l9 4 9-4M10 13v4h4v-4"/> },
  "nav-handover": { body: <path d="M3 7h17l-4-4M20 7l-4 4M21 17H4l4-4M4 17l4 4"/>, open: true, selected: <path d="M3 7h17l-4-4M20 7l-4 4M21 17H4l4-4M4 17l4 4" strokeWidth="2.6"/> },
  "nav-recovery": { body: <path d="M5 7h10v5a5 5 0 0 1-10 0Z"/>, detail: <path d="M7 3v4M13 3v4M10 17v5M20 3l-3 7h5l-3 7"/> },
} satisfies Record<string, Drawing>;

export type NavigationIconName = keyof typeof navigationDrawings;
// These detail strokes connect filled nodes or sit outside the body. They must
// keep the foreground colour; a cut-out colour would erase them against the tile.
const outsideDetails: ReadonlySet<NavigationIconName> = new Set([
  "nav-workload", "nav-interfaces", "nav-materials", "nav-changes", "nav-acceptance",
  "nav-requests", "nav-purchasing", "nav-performance", "nav-reconciliation", "nav-engineering", "nav-recovery",
]);
export function isNavigationIcon(name: string): name is NavigationIconName {
  return Object.hasOwn(navigationDrawings, name);
}
export function NavigationIcon({ name, active = false }: { name: NavigationIconName; active?: boolean }) {
  const drawing: Drawing = navigationDrawings[name];
  return <svg className="product-icon" data-icon={name} data-variant={active ? "active" : "outline"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {active && drawing.selected ? drawing.selected : <>
      <g fill={active && !drawing.open ? "currentColor" : "none"}>{drawing.body}</g>
      {drawing.detail && <g stroke={active && !drawing.open && !outsideDetails.has(name) ? "var(--ppo-icon-cutout, #f0f6ed)" : "currentColor"}>{drawing.detail}</g>}
      {drawing.exterior && <g fill="none" stroke="currentColor">{drawing.exterior}</g>}
    </>}
  </svg>;
}
