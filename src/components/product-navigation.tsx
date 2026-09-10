"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ProductIcon, type ProductIconName } from "./product-icons";
import { ShellControls } from "./shell-controls";
import { openShellPanel, shellPanelEvent } from "./shell-events";

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
  if (matches(path, "/email") || matches(path, "/calendar")) return { name: "Email & Calendar", tabs: [] };
  if (matches(path, "/estimating")) return { name: "Estimating", tabs: [] };
  if (matches(path, "/projects")) return { name: "Projects", tabs: [] };
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
  const path = usePathname();
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia("(min-width: 781px)").matches, () => true);
  return <ProductNavigationView key={`${path}:${wide}`} path={path} wide={wide}/>;
}
function ProductNavigationView({ path, wide }: { path: string; wide: boolean }) {
  const current = moduleFor(path).name;
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [more, setMore] = useState(false);
  const [tip, setTip] = useState<{ label: string; top: number } | null>(null);
  const morePanel = useRef<HTMLElement>(null), moreToggle = useRef<HTMLButtonElement>(null);
  const tipTarget = useRef<HTMLElement | null>(null);
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTip = (label: string, target: HTMLElement) => {
    if (tipTimer.current) clearTimeout(tipTimer.current);
    tipTarget.current = target;
    const rect = target.getBoundingClientRect();
    setTip({ label, top: Math.max(8, Math.min(window.innerHeight - 42, rect.top + rect.height / 2 - 18)) });
  };
  const hideTip = () => {
    if (tipTimer.current) clearTimeout(tipTimer.current);
    tipTimer.current = setTimeout(() => {
      if (!tipTarget.current?.matches(":hover,:focus-visible") && !document.getElementById("shell-nav-tooltip")?.matches(":hover")) setTip(null);
    }, 160);
  };
  useEffect(() => {
    if (more) morePanel.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [more]);
  useEffect(() => {
    const dismiss = (event: Event) => {
      if (!(event.target as Element | null)?.closest("[data-shell-navigation]")) setMore(false);
    };
    const other = (event: Event) => { if ((event as CustomEvent).detail !== "navigation") setMore(false); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { setTip(null); if (more) { setMore(false); moreToggle.current?.focus(); setTip(null); } } };
    document.addEventListener("pointerdown", dismiss); document.addEventListener("focusin", dismiss);
    document.addEventListener("keydown", key); window.addEventListener(shellPanelEvent, other);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("focusin", dismiss); document.removeEventListener("keydown", key); window.removeEventListener(shellPanelEvent, other); if (tipTimer.current) clearTimeout(tipTimer.current); };
  }, [more]);
  useEffect(() => {
    if (!wide && expanded) dialog.current?.showModal();
    else dialog.current?.close();
  }, [wide, expanded]);
  const items: { label: string; icon: ProductIconName; href?: string; divider?: boolean }[] = [
    { label: "Overview", icon: "home", href: "/" }, { label: "My Work", icon: "work", href: "/work" },
    { label: "CRM Sales", icon: "sales", href: "/crm/opportunities", divider: true },
    { label: "Email & Calendar", icon: "mail", href: "/email" },
    { label: "Estimating", icon: "estimate", href: "/estimating" },
    { label: "Engineering", icon: "engineering" }, { label: "Projects", icon: "projects", href: "/projects" },
    { label: "Service", icon: "service", href: "/schedule" }, { label: "Supply Chain", icon: "supply" },
    { label: "Finance", icon: "finance", href: "/finance/handoffs" },
    { label: "Customers", icon: "customers", href: "/customers", divider: true },
    { label: "Contacts", icon: "person", href: "/people" },
    { label: "Exceptions and recovery", icon: "warning", href: "/admin" },
    { label: "Foundation checks", icon: "settings", href: "/foundation" },
  ];
  const navigationItems = items.map(item => <div key={item.label} className={item.divider ? "product-nav-divider" : undefined}>
    {item.href ? <Link href={item.href} className="product-nav-item" aria-current={current === item.label ? "page" : undefined} onClick={() => setExpanded(false)} title={item.label}><ProductIcon name={item.icon} /><span>{item.label}</span></Link>
      : <span className="product-nav-item planned-nav" aria-disabled="true" title={`${item.label} — planned`}><ProductIcon name={item.icon} /><span>{item.label} · Planned</span></span>}
  </div>);
  const mobile = items.filter(i=>["My Work","CRM Sales","Service","Contacts"].includes(i.label));
  const primary = items.filter(item => ["CRM Sales", "Estimating", "Engineering", "Projects", "Service", "Supply Chain", "Finance"].includes(item.label));
  const railLabel = (label: string) => label === "CRM Sales" ? "Sales / CRM" : label === "Estimating" ? "Estimating & Quotation" : label;
  const groups: { title: string; links: { label: string; icon: ProductIconName; href?: string }[] }[] = [
    { title: "My workspace", links: items.filter(item => ["My Work", "Email & Calendar"].includes(item.label)) },
    { title: "Customer information", links: [
      { label: "Customers", icon: "customers", href: "/customers" }, { label: "Contacts", icon: "person", href: "/people" },
      { label: "Sites", icon: "sites", href: "/sites" }, { label: "Equipment", icon: "supply", href: "/equipment" },
    ] },
    { title: "Shared resources", links: [{ label: "Documents", icon: "documents" }, { label: "Service reports", icon: "list", href: "/service/reports" }] },
    { title: "Administration & support", links: items.filter(item => ["Exceptions and recovery", "Foundation checks"].includes(item.label)) },
  ];
  const leave = () => { setExpanded(false); setMore(false); setTip(null); };
  return <><aside className="sidebar ppo-rail" data-shell-navigation>
    <Link href="/" className="brand" aria-label="Powerplants One home" aria-describedby={tip?.label === "Overview" ? "shell-nav-tooltip" : undefined} onClick={leave}
      onPointerEnter={event => showTip("Overview", event.currentTarget)} onPointerLeave={hideTip} onFocus={event => showTip("Overview", event.currentTarget)} onBlur={hideTip}>
      <Image src="/brand/powerplants-logo-green-white.png" alt="Powerplants Australia" width={80} height={80} unoptimized loading="eager" className="brand-logo" />
    </Link>
    <div className="ppo-rail-divider" aria-hidden="true"/>
    <nav className="ppo-primary-nav" aria-label="Main navigation" hidden={!wide}>
      {primary.map(item => {
        const label = `${railLabel(item.label)}${item.href ? "" : " — planned"}`;
        const shared = { className: "ppo-rail-item", "aria-label": label, "aria-describedby": tip?.label === label ? "shell-nav-tooltip" : undefined,
          onPointerEnter: (event: React.PointerEvent<HTMLElement>) => showTip(label, event.currentTarget), onPointerLeave: hideTip,
          onFocus: (event: React.FocusEvent<HTMLElement>) => showTip(label, event.currentTarget), onBlur: hideTip };
        return item.href ? <Link key={item.label} {...shared} href={item.href} aria-current={current === item.label ? "page" : undefined} onClick={leave}><ProductIcon name={item.icon}/></Link>
          : <button key={item.label} {...shared} type="button" aria-disabled="true"><ProductIcon name={item.icon}/></button>;
      })}
    </nav>
    <div className="ppo-rail-bottom"><button ref={moreToggle} id="desktop-more-toggle" className="ppo-rail-item" aria-label="More" aria-expanded={more} aria-controls="desktop-more-panel" aria-describedby={tip?.label === "More" ? "shell-nav-tooltip" : undefined}
      onClick={() => { openShellPanel("navigation"); setMore(!more); }} onPointerEnter={event => showTip("More", event.currentTarget)} onPointerLeave={hideTip} onFocus={event => showTip("More", event.currentTarget)} onBlur={hideTip}><ProductIcon name="more"/></button></div>
  </aside>
  <section ref={morePanel} id="desktop-more-panel" className="ppo-more-panel" aria-labelledby="desktop-more-title" hidden={!more || !wide} data-shell-navigation>
    <header><h2 id="desktop-more-title">More</h2><button className="ppo-top-action" aria-label="Close More menu" onClick={() => { setMore(false); moreToggle.current?.focus(); }}><ProductIcon name="close"/></button></header>
    <nav aria-label="More navigation">{groups.map(group => <section className="ppo-menu-group" key={group.title}><h3>{group.title}</h3>{group.links.map(item => item.href ? <Link className="ppo-more-link" key={item.label} href={item.href} aria-current={matches(path, item.href) ? "page" : undefined} onClick={leave}><ProductIcon name={item.icon}/><span>{item.label}</span></Link> : <span className="ppo-more-link" key={item.label} aria-disabled="true"><ProductIcon name={item.icon}/><span>{item.label}</span><small>Planned</small></span>)}</section>)}</nav>
    <footer>Powerplants One · Prototype</footer>
  </section>
  <div id="shell-nav-tooltip" className="ppo-nav-tooltip" role="tooltip" hidden={!tip || !wide} style={{ top: tip?.top }} onPointerEnter={() => { if (tipTimer.current) clearTimeout(tipTimer.current); }} onPointerLeave={hideTip}>{tip?.label}</div>
  <nav className="mobile-navigation" aria-label="Mobile navigation">
    {mobile.map(item=><Link key={item.label} href={item.href!} aria-current={current===item.label?"page":undefined}><ProductIcon name={item.icon}/><span>{item.label==="CRM Sales"?"CRM":item.label}</span></Link>)}
    <button id="navigation-toggle" type="button" aria-label="Menu" aria-haspopup="dialog" aria-expanded={expanded} onClick={()=>setExpanded(true)}><ProductIcon name="menu"/><span>More</span></button>
  </nav>
  <dialog ref={dialog} onKeyDown={e => {
    if(e.key !== "Tab") return;
    const targets = [...e.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')];
    const first = targets[0], last = targets.at(-1);
    if(e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    if(!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }} className="mobile-menu" aria-labelledby="mobile-menu-title" onCancel={()=>setExpanded(false)} onClose={()=>setExpanded(false)}>
    <header><h2 id="mobile-menu-title">Powerplants One</h2><button type="button" aria-label="Close menu" onClick={()=>setExpanded(false)}><ProductIcon name="close"/></button></header>
    <nav aria-label="All modules">{navigationItems}</nav>
  </dialog></>;
}
export function ProductHeader() {
  const path = usePathname(), current = moduleFor(path);
  const opportunities = path === "/crm/opportunities";
  return <>
    <header className="topbar ppo-shell-header"><Link className="mobile-brand" href="/" aria-label="Powerplants One home"><Image src="/brand/powerplants-logo-green-white.png" alt="Powerplants Australia" width={36} height={36} unoptimized loading="eager" className="brand-logo" /></Link><div className="product-heading"><span>{opportunities ? "Sales" : "Powerplants One"}</span><span aria-hidden="true">/</span><strong>{opportunities ? "Opportunities" : current.name}</strong></div><ShellControls key={path} module={current.name}/><div className="header-tools"><div id="header-search"/><span className="prototype-label">Synthetic data only</span><div id="header-account" className="header-account"/></div></header>
    {!!current.tabs.length && <nav className="module-navigation" aria-label={`${current.name} navigation`}>{current.tabs.map(([href, label]) => <Link key={href} href={href} aria-current={matches(path, href) || (href === "/schedule" && matches(path, "/service/appointments")) ? "page" : undefined}>{label}</Link>)}</nav>}

  </>;
}
