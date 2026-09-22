import { ProductIcon, type ProductIconName } from "./product-icons";
import { NavigationIcon, isNavigationIcon } from "./navigation-icons";

// Exact SVG geometry from the retained Application Shell r17 reference.
const shapes = {
  "info": <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
  "search": <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  "plus": <><path d="M12 5v14M5 12h14"/></>,
  "help": <><circle cx="12" cy="12" r="9"/><path d="M9.5 8a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1-1.5 3M12 17h.01"/></>,
  "bell": <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  "close": <><path d="m6 6 12 12M18 6 6 18"/></>,
  "more": <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  "sales": <><rect x="3" y="6" width="18" height="15" rx="2"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M3 11l9 5 9-5M9 14h6"/></>,
  "estimate": <><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 10h1m3 0h1m3 0h.01M8 14h1m3 0h1m3 0h.01M8 18h1m3 0h1m3 0h.01"/></>,
  "engineering": <><path d="m15 3 6 6L9 21l-6-6L15 3Z M12 6l3 3M9 9l2 2M6 12l3 3M15 12l2 2"/></>,
  "projects": <><path d="M3 7V5a1 1 0 0 1 1-1h5l2 3h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z"/></>,
  "service": <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 11h18M7 15h4M7 18h7"/></>,
  "supply": <><path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z M3 7l9 5 9-5M12 12v10M7.5 4.5l9 5V15"/></>,
  "finance": <><path d="M6 2 8 4l2-2 2 2 2-2 2 2 2-2v20l-2-2-2 2-2-2-2 2-2-2-2 2V2Z M9 8h6M9 12h6M9 16h4"/></>,
  "work": <><rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h3"/></>,
  "customers": <><path d="M3 21V7h12v14M15 12h6v9M7 11h1m3 0h1M7 15h1m3 0h1M8 21v-3h4v3M6 7V3h6v4"/></>,
  "contacts": <><circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/></>,
  "sites": <><path d="M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
  "equipment": <><path d="m14 3 3 3-4 4-3-3 4-4Z M10 7l-6 6 7 7 6-6M4 13l-2 2 7 7 2-2M17 6l4-4M17 14l3 3"/></>,
  "products": <><path d="m12 2 10 5-10 5L2 7Z M2 12l10 5 10-5M2 17l10 5 10-5"/></>,
  "documents": <><path d="M14 2H5v20h14V7l-5-5Z M14 2v5h5M8 12h8M8 16h8"/></>,
  "reports": <><path d="M3 3v18h18M7 16v-5M12 16V6M17 16V9"/></>,
  "settings": <><path d="m9 3 1-1h4l1 3 3 1 3 2-1 3v2l1 3-3 2-3 1-1 3h-4l-1-3-3-1-3-2 1-3v-2L3 8l3-2 3-1V3Z"/><circle cx="12" cy="12" r="3"/></>,
  "recovery": <><path d="m12 3 10 18H2L12 3Z M12 9v5M12 17h.01"/></>,
  "overview": <><path d="m3 10 9-7 9 7v11H3V10Z M9 21v-8h6v8"/></>,
  "mail": <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></>,
  "calendar": <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
  // The Sales phone bar (mobile r07), drawn as one family on the r17 grid and stroke, each filling the same
  // optical box: a clipboard for My Work, a dollar in a circle for Opportunities, a calendar with one marked
  // date for Activities, and a person with no frame for Contacts. The r17 shapes above are left as issued.
  "bar-work": <><path d="M9 4.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2h-2"/><rect x="9" y="2.5" width="6" height="4" rx="1"/><path d="M9 11h6M9 14.5h6M9 18h3"/></>,
  "bar-opportunities": <><circle cx="12" cy="12" r="9"/><path d="M15 8.4h-4.2a1.8 1.8 0 0 0 0 3.6h2.4a1.8 1.8 0 0 1 0 3.6H9M12 6.4v11.2"/></>,
  "bar-activities": <><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/><rect x="14" y="14" width="3.4" height="3.4" rx=".8" fill="currentColor" stroke="none"/></>,
  "bar-contacts": <><circle cx="12" cy="8" r="3.8"/><path d="M4.8 20.5a7.2 7.2 0 0 1 14.4 0"/></>,
  "bar-more": <><circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none"/></>,
  "down": <><path d="m6 9 6 6 6-6"/></>,
  "check": <><path d="m5 12 4 4L19 6"/></>,
  "chevron-right": <><path d="m9 5 7 7-7 7"/></>,
};
export type ShellIconName = ProductIconName | keyof typeof shapes;
export function ShellIcon({ name, active = false }: { name: ShellIconName; active?: boolean }) {
  if (isNavigationIcon(name)) return <NavigationIcon name={name} active={active} />;
  const mapped = ({ home: "overview", person: "contacts", warning: "recovery" } as Record<string, string>)[name] ?? name;
  if (!(mapped in shapes)) return <ProductIcon name={name as ProductIconName} />;
  return <svg className="product-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[mapped as keyof typeof shapes]}</svg>;
}
