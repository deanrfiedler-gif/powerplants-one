"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ShellIcon } from "./shell-icon";
import { openShellPanel, shellPanelEvent } from "./shell-events";
import type { ConversationsAction } from "./shell-conversations";
import type { PhoneHeaderAction, PhoneHeaderConfig } from "../shell/phone-header";

// Phone header amendment (PPO-SHELL-PHONE-HEADER-AMENDMENT-DEC; Figma "Shell / Phone header · compact" 1530:110).
// The compact row's own parts. They sit in the shared header beside the Conversations action, which the header
// controls keep, and the stylesheet shows them only on phones (desktop-shell.css, "Phone header amendment").
export const phoneMenuEvent = "ppo-shell-phone-menu";
export const phoneMenuStateEvent = "ppo-shell-phone-menu-state";

export type PhoneHeaderModel =
  | { type: "list"; title: string; count?: string; config: PhoneHeaderConfig | null }
  | { type: "record"; reference: string; back?: { href?: string; label: string }; config: PhoneHeaderConfig | null };

function RecordMore({ items, narrow, conversations }: { items: PhoneHeaderAction[]; narrow: PhoneHeaderAction[]; conversations?: ConversationsAction | null }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const [shownPath, setShownPath] = useState(path);
  if (shownPath !== path) {
    setShownPath(path);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLButtonElement>("button:not([hidden])")?.focus();
    const outside = (event: Event) => {
      if (!(event.target as Element | null)?.closest(".ppo-phone-more")) setOpen(false);
    };
    const other = (event: Event) => {
      if ((event as CustomEvent).detail !== "phone-more") setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    window.addEventListener(shellPanelEvent, other);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener(shellPanelEvent, other);
    };
  }, [open]);
  const choose = (item: PhoneHeaderAction) => {
    setOpen(false);
    if (button.current) item.onSelect(button.current);
  };
  return (
    <div className="ppo-phone-more" onKeyDown={(event) => {
      if (event.key === "Escape" && open) { event.stopPropagation(); setOpen(false); button.current?.focus(); }
    }}>
      <button ref={button} type="button" className="ppo-top-action" aria-label="More actions" aria-haspopup="menu" aria-expanded={open} aria-controls="shell-phone-more" onClick={() => { openShellPanel("phone-more"); setOpen(!open); }}>
        <ShellIcon name="more" />
      </button>
      <div ref={panel} id="shell-phone-more" className="ppo-phone-more-panel" role="menu" aria-label="More actions" hidden={!open}>
        {/* P3, P4: a record row has no Menu button, so More always starts with the menu (the same dialog the list row's
            Menu opens) and Conversations, which the record row does not draw; the page's own actions follow. */}
        <button type="button" role="menuitem" onClick={() => { setOpen(false); if (button.current) window.dispatchEvent(new CustomEvent(phoneMenuEvent, { detail: button.current })); }}>Open menu</button>
        {conversations && (
          <Link href="/conversations" role="menuitem" aria-label={conversations.name} aria-current={conversations.current ? "page" : undefined} onClick={() => setOpen(false)}>
            <span>Conversations</span>
            {conversations.badge && <span className="ppo-phone-more-count" aria-hidden="true">{conversations.badge}</span>}
          </Link>
        )}
        {(items.length > 0 || narrow.length > 0) && <div role="separator" className="ppo-phone-more-rule" />}
        {/* P7: at 320 px previous and next leave the row for this menu, so the record reference never truncates. */}
        {narrow.map((item) => <button key={item.label} type="button" role="menuitem" className="ppo-phone-narrow-item" onClick={() => choose(item)}>{item.label}</button>)}
        {items.map((item) => <button key={item.label} type="button" role="menuitem" onClick={() => choose(item)}>{item.label}</button>)}
      </div>
    </div>
  );
}

// The menu button and the title come first in the row; the page action, Conversations and Filter follow.
export function PhoneHeaderLead({ model, unread, menuOpen }: { model: PhoneHeaderModel; unread: boolean; menuOpen: boolean }) {
  if (model.type === "record") {
    const close = model.config?.record?.back;
    if (close) return <button type="button" className="ppo-top-action ppo-phone-lead ppo-phone-back" aria-label={close.label} title={close.label} onClick={event => close.onSelect(event.currentTarget)}><ShellIcon name="chevron-left" /></button>;
    const back = model.back ?? { label: "Back" };
    const icon = <ShellIcon name="chevron-left" />;
    return back.href ? (
      <Link className="ppo-top-action ppo-phone-lead ppo-phone-back" href={back.href} aria-label={back.label} title={back.label}>
        {icon}
      </Link>
    ) : (
      <button type="button" className="ppo-top-action ppo-phone-lead ppo-phone-back" aria-label={back.label} title={back.label} onClick={() => history.back()}>
        {icon}
      </button>
    );
  }
  // P4: the menu holds the department menu, account, notifications, global search, page guide and Design & build.
  const name = unread ? "Menu, unread notifications" : "Menu";
  return (
    <button
      id="shell-phone-menu"
      type="button"
      className="ppo-top-action ppo-phone-lead ppo-phone-menu"
      aria-label={name}
      title={name}
      aria-haspopup="dialog"
      aria-expanded={menuOpen}
      onClick={(event) => window.dispatchEvent(new CustomEvent(phoneMenuEvent, { detail: event.currentTarget }))}
    >
      <ShellIcon name="menu" />
      {unread && <span className="ppo-phone-dot" aria-hidden="true" />}
    </button>
  );
}

export function PhoneHeaderTitle({ model }: { model: PhoneHeaderModel }) {
  if (model.type === "record") {
    // P3, P7: the position ("1 of 3 to send") or the record reference; a reference never truncates.
    const position = model.config?.record?.position;
    const label = position ?? model.reference;
    // A record page that has its own views (Job pack sections, for one) keeps the Choose view sheet: the reference is the
    // chooser, with its chevron, so the sheet the old header toggle opened is still reachable (P2, P5).
    const choose = model.config?.chooseView;
    return choose ? (
      <button
        type="button"
        className={`ppo-phone-title ppo-view-chooser ppo-phone-reference${position ? " ppo-phone-position" : ""}`}
        aria-label={`Choose view. Current record: ${label}`}
        aria-haspopup="dialog"
        aria-expanded={choose.expanded}
        aria-controls={choose.controls}
        onClick={(event) => choose.open(event.currentTarget)}
      >
        <span className="ppo-phone-title-text">{label}</span>
        <ShellIcon name="down" />
      </button>
    ) : (
      <span className={`ppo-phone-title ppo-phone-reference${position ? " ppo-phone-position" : ""}`}>{label}</span>
    );
  }
  const choose = model.config?.chooseView;
  const count = model.count ? <span className="ppo-phone-count">{model.count}</span> : null;
  // P8: the view chooser is a button announcing the current view.
  return choose ? (
    <button
      type="button"
      className="ppo-phone-title ppo-view-chooser"
      aria-label={`Choose view. Current view: ${model.title}${model.count ? `, ${model.count}` : ""}`}
      aria-haspopup="dialog"
      aria-expanded={choose.expanded}
      aria-controls={choose.controls}
      onClick={(event) => choose.open(event.currentTarget)}
    >
      <span className="ppo-phone-title-text">{model.title}</span>
      {count}
      <ShellIcon name="down" />
    </button>
  ) : (
    <span className="ppo-phone-title">
      <span className="ppo-phone-title-text">{model.title}</span>
      {count}
    </span>
  );
}

// Rendered on either side of the Conversations action (desktop-shell.css orders them).
export function PhoneHeaderActions({ model, place, conversations }: { model: PhoneHeaderModel; place: "before" | "after"; conversations?: ConversationsAction | null }) {
  const config = model.config;
  if (model.type === "record") {
    if (place === "before") return null;
    const record = config?.record;
    const step = (item: (PhoneHeaderAction & { disabled?: boolean }) | undefined, icon: "chevron-up" | "down", className: string) =>
      item ? <button type="button" className={`ppo-top-action ${className}`} aria-label={item.label} title={item.label} disabled={item.disabled} onClick={(event) => item.onSelect(event.currentTarget)}><ShellIcon name={icon} /></button> : null;
    const narrow = [record?.previous, record?.next].filter((item): item is PhoneHeaderAction & { disabled?: boolean } => !!item && !item.disabled);
    return (
      <>
        {step(record?.previous, "chevron-up", "ppo-phone-previous")}
        {step(record?.next, "down", "ppo-phone-next")}
        <RecordMore items={record?.more ?? []} narrow={narrow} conversations={conversations} />
      </>
    );
  }
  if (place === "before") {
    const action = config?.pageAction;
    return action ? (
      <button type="button" className={`ppo-top-action ppo-phone-page-action${action.search && config?.filter ? " ppo-phone-combines" : ""}`} aria-label={action.label} title={action.label} onClick={(event) => action.onSelect(event.currentTarget)}>
        <ShellIcon name={action.icon} />
      </button>
    ) : null;
  }
  const filter = config?.filter;
  if (!filter) return null;
  const applied = filter.applied ? ", a filter is applied" : "";
  return (
    <>
      <button type="button" className={`ppo-top-action ppo-phone-filter${config?.pageAction?.search ? " ppo-phone-combines" : ""}`} aria-label={`Filter${applied}`} title="Filter" onClick={(event) => filter.open(event.currentTarget)}>
        <ShellIcon name="filter" />
        {filter.applied && <span className="ppo-phone-dot" aria-hidden="true" />}
      </button>
      {/* P7: at 320 px a search page action and Filter become one control opening one screen. */}
      {config?.pageAction?.search && (
        <button type="button" className="ppo-top-action ppo-phone-search-filter" aria-label={`Search and filter${applied}`} title="Search and filter" onClick={(event) => (filter.searchAndFilter ?? filter.open)(event.currentTarget)}>
          <ShellIcon name="filter" />
          {filter.applied && <span className="ppo-phone-dot" aria-hidden="true" />}
        </button>
      )}
    </>
  );
}
