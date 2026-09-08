"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ProductIcon, type ProductIconName } from "./product-icons";

const service = [
  ["/schedule", "Service planner"], ["/service/tickets", "Service requests"],
  ["/service/work-orders", "Work orders"], ["/service/packs", "Job packs"],
  ["/service/reports", "Service review"], ["/my-jobs", "My Jobs"],
];
const customers = [["/customers", "Customers"], ["/sites", "Sites"], ["/equipment", "Equipment"]];
const matches = (path: string, href: string) => path === href || (href !== "/" && path.startsWith(href + "/"));
function moduleFor(path: string) {
  if (matches(path, "/service") || service.some(([href]) => matches(path, href))) return { name: "Service", tabs: service };
  if (customers.some(([href]) => matches(path, href))) return { name: "Customers", tabs: customers };
  if (path.startsWith("/crm/")) return { name: "CRM Sales", tabs: [] };
  if (matches(path, "/estimating")) return { name: "Estimating", tabs: [] };
  if (matches(path, "/finance")) return { name: "Finance", tabs: [] };
  if (matches(path, "/people")) return { name: "Contacts", tabs: [] };
  if (matches(path, "/work")) return { name: "My Work", tabs: [] };
  if (matches(path, "/admin")) return { name: "Exceptions and recovery", tabs: [] };
  if (matches(path, "/documents")) return { name: "Documents", tabs: [] };
  return { name: path === "/" ? "Overview" : "Foundation checks", tabs: [] };
}
const subscribe = (changed: () => void) => {
  const media = window.matchMedia("(min-width: 781px)");
  media.addEventListener("change", changed);
  return () => media.removeEventListener("change", changed);
};
export function ProductNavigation() {
  const path = usePathname(), current = moduleFor(path).name;
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia("(min-width: 781px)").matches, () => true);
  const [expanded, setExpanded] = useState(false);
  const items: { label: string; icon: ProductIconName; href?: string; divider?: boolean }[] = [
    { label: "Overview", icon: "home", href: "/" }, { label: "My Work", icon: "work", href: "/work" },
    { label: "CRM Sales", icon: "sales", href: "/crm/opportunities", divider: true },
    { label: "Estimating", icon: "estimate", href: "/estimating" },
    { label: "Engineering", icon: "engineering" }, { label: "Projects", icon: "projects" },
    { label: "Service", icon: "service", href: "/schedule" }, { label: "Supply Chain", icon: "supply" },
    { label: "Finance", icon: "finance", href: "/finance/handoffs" },
    { label: "Customers", icon: "customers", href: "/customers", divider: true },
    { label: "Contacts", icon: "person", href: "/people" },
    { label: "Exceptions and recovery", icon: "warning", href: "/admin" },
    { label: "Foundation checks", icon: "settings", href: "/foundation" },
  ];
  return <aside className="sidebar" onKeyDown={(e) => { if (e.key === "Escape" && expanded) { setExpanded(false); document.getElementById("navigation-toggle")?.focus(); } }}>
    <Link href="/" className="brand" aria-label="Powerplants One home" onClick={() => setExpanded(false)}>
      <Image src="/brand/powerplants-logo-green-white.png" alt="Powerplants Australia" width={66} height={66} unoptimized className="brand-logo" />
    </Link>
    <button id="navigation-toggle" className="navigation-toggle secondary" aria-label="Menu" aria-expanded={wide || expanded} aria-controls="product-navigation" onClick={() => setExpanded(!expanded)}><ProductIcon name={expanded ? "close" : "menu"} /><span>Menu</span></button>
    <div id="product-navigation" hidden={!wide && !expanded}>
      <nav aria-label="Main navigation">
        {items.map((item) => <div key={item.label} className={item.divider ? "product-nav-divider" : undefined}>
          {item.href ? <Link href={item.href} className="product-nav-item" aria-current={current === item.label ? "page" : undefined} onClick={() => setExpanded(false)} title={item.label}><ProductIcon name={item.icon} /><span>{item.label}</span></Link>
            : <span className="product-nav-item planned-nav" aria-disabled="true" title={`${item.label} — planned`}><ProductIcon name={item.icon} /><span>{item.label}</span></span>}
        </div>)}
      </nav>
    </div>
  </aside>;
}
export function ProductHeader() {
  const path = usePathname(), current = moduleFor(path);
  return <>
    <header className="topbar"><div className="product-heading"><span>Powerplants One</span><span aria-hidden="true">/</span><strong>{current.name}</strong></div><span className="prototype-label">Synthetic data only</span></header>
    {!!current.tabs.length && <nav className="module-navigation" aria-label={`${current.name} navigation`}>{current.tabs.map(([href, label]) => <Link key={href} href={href} aria-current={matches(path, href) || (href === "/schedule" && matches(path, "/service/appointments")) ? "page" : undefined}>{label}</Link>)}</nav>}
  </>;
}
