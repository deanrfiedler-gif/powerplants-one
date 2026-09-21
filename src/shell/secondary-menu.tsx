"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { HeaderContent } from "../components/header-content";

// The secondary menu of a workspace: beside the rail and under the header. It was built for My Work
// (design report r03, mockups r06) and is shared from here so another workspace gets the same menu,
// not a likeness of it: docked from 1200px with the choice remembered by its owner, a modal overlay
// below that whose opening never overwrites the remembered choice, an icon-only header trigger in the
// shell's menu slot, the menu's own right border as the collapse target, a 24px strip with a grip as
// the expand target, Escape/backdrop/Close returning focus to whatever opened it, and no hidden links
// left in the keyboard order. The owner supplies the contents, the remembered state and the scope id
// that the shared menu rules in my-work.css are written against.
const wideQuery = "(min-width: 1200px)";
const phoneQuery = "(max-width: 780px)";
const subscribeTo = (query: string) => (changed: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", changed);
  return () => media.removeEventListener("change", changed);
};
const subscribeWide = subscribeTo(wideQuery),
  subscribePhone = subscribeTo(phoneQuery);

// The three glyphs the frame itself draws, in My Work's outline family (24px grid, 1.7 stroke). The
// collapsed strip draws a plain grip rather than a glyph, and the menu's own right border has no icon.
const glyphs = {
  panel: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M9.5 4.5v15" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
} as const;
const Glyph = ({ name }: { name: keyof typeof glyphs }) => (
  <svg className="mw-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {glyphs[name]}
  </svg>
);

export type SecondaryMenuState = ReturnType<typeof useSecondaryMenu>;
export function useSecondaryMenu(remembered: boolean, remember: (open: boolean) => void) {
  // Wide screens dock the menu beside the rail and the content reflows; narrower screens overlay
  // it so the content is never squeezed. The remembered choice applies when docked.
  const docked = useSyncExternalStore(subscribeWide, () => window.matchMedia(wideQuery).matches, () => true);
  // Unknown until the browser answers, so a phone never paints a desktop presentation first.
  const phone = useSyncExternalStore<boolean | null>(subscribePhone, () => window.matchMedia(phoneQuery).matches, () => null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const open = docked ? remembered : overlayOpen;
  const overlay = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLElement | null>(null);
  const toggle = (source: HTMLElement | null) => {
    if (docked) remember(!open);
    else {
      opener.current = source;
      setOverlayOpen(!open);
    }
  };
  const closeOverlay = useCallback((restoreFocus = true) => {
    setOverlayOpen(false);
    if (restoreFocus && opener.current?.isConnected) opener.current.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const d = overlay.current;
    if (!d) return;
    if (!docked && overlayOpen && !d.open) d.showModal();
    if ((docked || !overlayOpen) && d.open) d.close();
  }, [docked, overlayOpen]);
  return { docked, phone, open, toggle, closeOverlay, overlay };
}

export function SecondaryMenuFrame({
  state,
  id,
  name,
  menuId,
  contentId,
  attributes,
  menu,
  message,
  children,
}: {
  state: SecondaryMenuState;
  id: string;
  name: string;
  menuId: string;
  contentId: string;
  attributes?: Record<`data-${string}`, string | undefined>;
  menu: ReactNode;
  message: string;
  children: ReactNode;
}) {
  const { docked, phone, open, toggle, closeOverlay, overlay } = state;
  // A phone has three separate menus (this one, More and Create), so its trigger says which it is.
  const label = phone ? `${name} menu` : open ? "Hide menu" : "Show menu";
  return (
    <section id={id} data-module-layout="full-bleed" data-menu={docked ? (open ? "docked" : "collapsed") : "overlay"} {...attributes} aria-label={name}>
      <HeaderContent slot="menu">
        {/* Icon only to look at: the name stays for assistive technology and as the tooltip, and the
            button keeps one width in both states so nothing to its right moves. */}
        <button type="button" className="ppo-menu-toggle" title={label} aria-expanded={open} aria-controls={menuId} onClick={(e) => toggle(e.currentTarget)}>
          <Glyph name={phone ? "menu" : "panel"} />
          <span>{label}</span>
        </button>
      </HeaderContent>
      {docked ? (
        <aside id={menuId} className="mw-menu" hidden={!open} aria-label={`${name} menu`}>
          {menu}
        </aside>
      ) : (
        <dialog
          id={menuId}
          ref={overlay}
          className="mw-menu mw-menu-overlay"
          aria-label={`${name} menu`}
          onCancel={(e) => {
            e.preventDefault();
            closeOverlay();
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeOverlay();
          }}
        >
          <button type="button" className="mw-icon-button mw-menu-close" onClick={() => closeOverlay()} aria-label="Close menu">
            <Glyph name="close" />
          </button>
          {menu}
        </dialog>
      )}
      {/* Docked, the menu's own right border is the collapse target and a 24px strip is the expand target.
          Neither protrudes into the workspace, and neither opens on hover alone. Below the docked width the
          overlay and the header trigger are the only controls, so neither is rendered. */}
      {docked &&
        (open ? (
          <button
            type="button"
            className="mw-menu-edge"
            aria-label={`Collapse ${name} menu`}
            title={`Collapse ${name} menu`}
            aria-expanded={true}
            aria-controls={menuId}
            onClick={(e) => toggle(e.currentTarget)}
          />
        ) : (
          <button
            type="button"
            className="mw-menu-strip"
            aria-label={`Expand ${name} menu`}
            title={`Expand ${name} menu`}
            aria-expanded={false}
            aria-controls={menuId}
            onClick={(e) => toggle(e.currentTarget)}
          >
            <span className="mw-menu-grip" aria-hidden="true" />
          </button>
        ))}
      <div className="mw-content" id={contentId}>
        <p className="mw-live" role="status" aria-live="polite">
          {message}
        </p>
        {children}
      </div>
    </section>
  );
}
