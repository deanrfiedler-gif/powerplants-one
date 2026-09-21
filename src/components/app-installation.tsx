"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ShellIcon } from "./shell-icon";
import { hasPendingWork } from "./pending-work";
import { reviewNavigation } from "./navigation-intent";

/**
 * Installation is a browser and operating-system decision. This controller only owns
 * the in-app entry points: it offers Chromium's own prompt when the browser has
 * actually given us one, and otherwise shows the manual steps. It never claims an
 * installed or uninstalled state it cannot observe, and it stores nothing: an ordinary
 * tab cannot see an installation made in another browser, profile or device.
 */

/** The Chromium-only event. Bounded here rather than widened across the app. */
type InstallPromptEvent = Event & {
  readonly platforms?: readonly string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isInstallPromptEvent(event: Event): event is InstallPromptEvent {
  return "prompt" in event && typeof (event as InstallPromptEvent).prompt === "function";
}

export type InstallOutcome = "" | "accepted" | "dismissed" | "failed";

type Snapshot = {
  /** A real, unconsumed browser event is held, so Install can do something. */
  offered: boolean;
  /** appinstalled fired in this window. Its absence proves nothing. */
  installedHere: boolean;
  standalone: boolean;
  outcome: InstallOutcome;
  prompting: boolean;
};

const initial: Snapshot = {
  offered: false,
  installedHere: false,
  standalone: false,
  outcome: "",
  prompting: false,
};

let held: InstallPromptEvent | null = null;
let current: Snapshot = initial;
const listeners = new Set<() => void>();

function publish(change: Partial<Snapshot>) {
  current = { ...current, ...change };
  for (const notify of listeners) notify();
}

const standaloneQuery = "(display-mode: standalone)";

function detectStandalone() {
  if (typeof window === "undefined") return false;
  // Apple's installed web apps still report through navigator.standalone.
  const apple = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return (
    (typeof window.matchMedia === "function" && window.matchMedia(standaloneQuery).matches) ||
    apple === true
  );
}

let started = false;

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("beforeinstallprompt", (event: Event) => {
    if (!isInstallPromptEvent(event)) return;
    // Taking ownership of the prompt. The browser's own menu entry still works.
    event.preventDefault();
    held = event;
    // A newly eligible event re-enables the action after an earlier dismissal.
    publish({ offered: true, outcome: "" });
  });
  window.addEventListener("appinstalled", () => {
    held = null;
    publish({ offered: false, installedHere: true, outcome: "accepted", prompting: false });
  });
  const media = typeof window.matchMedia === "function" ? window.matchMedia(standaloneQuery) : null;
  media?.addEventListener("change", () => publish({ standalone: detectStandalone() }));
  publish({ standalone: detectStandalone() });
}

// Attach as early as the client bundle runs, rather than waiting for a subscriber's
// effect: Chromium can fire beforeinstallprompt during hydration, and an event we are
// not listening for is gone. Anything earlier than this still reaches the browser's own
// menu, which stays a supported installation route.
start();

// One controller for the session: the listeners outlive every route change and every
// remount of the surface that renders the action.
function subscribe(notify: () => void) {
  start();
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

/** Invoke Chromium's prompt from the click that asked for it. One at a time. */
export async function promptInstall(): Promise<InstallOutcome> {
  const event = held;
  if (!event || current.prompting) return "";
  // The browser allows each event once, so it is consumed whatever the answer is.
  held = null;
  publish({ prompting: true, offered: false, outcome: "" });
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    publish({ prompting: false, outcome });
    return outcome;
  } catch {
    // A rejected or unusable event is gone. Only a new browser event restores the action.
    publish({ prompting: false, outcome: "failed" });
    return "failed";
  }
}

export function useInstallation() {
  const state = useSyncExternalStore(
    subscribe,
    () => current,
    () => initial,
  );
  return { ...state, install: promptInstall };
}

const helpEvent = "ppo-installation-help";

export function openInstallationHelp() {
  window.dispatchEvent(new Event(helpEvent));
}

type Platform = "apple" | "android" | "mac";

const platforms: { id: Platform; label: string }[] = [
  { id: "apple", label: "iPhone or iPad" },
  { id: "android", label: "Android" },
  { id: "mac", label: "Mac" },
];

/** Advisory only: it chooses which steps to show first and gates nothing. */
function suggestedPlatform(): Platform {
  if (typeof navigator === "undefined") return "apple";
  const agent = navigator.userAgent;
  // An iPad asking for a desktop site is identified by touch, not by the agent alone.
  const touchMac = /Macintosh/.test(agent) && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(agent) || touchMac) return "apple";
  if (/Android/.test(agent)) return "android";
  if (/Macintosh/.test(agent)) return "mac";
  return "android";
}

const steps: Record<Platform, { title: string; items: string[]; note: string }> = {
  apple: {
    title: "Add to the Home Screen with Safari",
    items: [
      "Open the normal Powerplants One address in Safari. If you are already signed in, go to My Work. Do not save a Microsoft sign-in page.",
      "Open Share — on some layouts this is in the page menu — then choose Add to Home Screen. On iPad, tap View More first if you do not see it.",
      "Turn on Open as Web App if the option is shown, check the name reads Powerplants One, then tap Add.",
      "Open the new Home Screen icon and sign in there if you are asked. My Work should open.",
    ],
    note: "If Add to Home Screen is missing, look further down the share actions, or use Edit Actions where your iOS version offers it. In an app that opens web pages inside itself, open the page in Safari first. These are steps you take in the operating system; a website cannot start them for you.",
  },
  android: {
    title: "Install with Chrome",
    items: [
      "Open the normal Powerplants One address in Chrome, outside a private window.",
      "Use Install Powerplants One in this menu when it is offered, or Chrome's own menu entry to install the app.",
      "Check the name and choose Install.",
      "Open the new icon and sign in there if you are asked. My Work should open.",
    ],
    note: "Chrome decides when it can offer installation. If this menu has no Install entry, use Chrome's own menu.",
  },
  mac: {
    title: "Add to the Dock with Safari",
    items: [
      "On macOS Sonoma 14 or later, open Powerplants One in Safari.",
      "Choose File, then Add to Dock. It is also in the Share menu.",
      "Name it Powerplants One and choose Add.",
      "Open it from the Dock. It keeps the normal desktop layout.",
    ],
    note: "Mac guidance is provided for convenience. It has not been verified on a Mac for this release.",
  },
};

export function InstallationHelp() {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("apple");
  useEffect(() => {
    const show = () => {
      opener.current = document.activeElement as HTMLElement | null;
      setPlatform(suggestedPlatform());
      setOpen(true);
    };
    window.addEventListener(helpEvent, show);
    return () => window.removeEventListener(helpEvent, show);
  }, []);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      heading.current?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);
  const close = () => {
    setOpen(false);
    const from = opener.current;
    const restore =
      from && from !== document.body && from.isConnected
        ? from
        : // The trigger lives in the More surface, which closes behind this panel.
          document.querySelector<HTMLElement>("#navigation-toggle, #desktop-more-toggle");
    restore?.focus({ preventScroll: true });
  };
  const chosen = steps[platform];
  return (
    <dialog
      ref={dialog}
      className="ppo-install-help"
      aria-labelledby="ppo-install-help-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={() => setOpen(false)}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      {open && (
        <div className="ppo-install-help-body">
          <header>
            <h2 id="ppo-install-help-title" ref={heading} tabIndex={-1}>
              How to install Powerplants One
            </h2>
            <button
              className="ppo-top-action"
              aria-label="Close installation instructions"
              onClick={close}
            >
              <ShellIcon name="close" />
            </button>
          </header>
          <p className="ppo-install-intro">
            Installing keeps an icon on this device that opens Powerplants One in its own
            window. You do it once per device, and it does not change who can sign in.
          </p>
          <div className="ppo-install-platforms" role="group" aria-label="Choose a device">
            {platforms.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={platform === option.id}
                onClick={() => setPlatform(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <h3>{chosen.title}</h3>
          <ol>
            {chosen.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p className="ppo-install-note">{chosen.note}</p>
          <footer>
            <button className="ppo-install-done" onClick={close}>
              Close
            </button>
          </footer>
        </div>
      )}
    </dialog>
  );
}

/**
 * The quiet secondary entries for the existing More surface: Chromium's own prompt when
 * the browser has offered one, the manual steps otherwise, and a reload for the installed
 * window, which has no browser reload button of its own.
 */
export function InstallationActions({ onNavigate }: { onNavigate: () => void }) {
  const { offered, standalone, outcome, prompting, install } = useInstallation();
  const [message, setMessage] = useState("");
  const run = useCallback(async () => {
    const result = await install();
    setMessage(
      result === "accepted"
        ? "Installation accepted. Look for the Powerplants One icon on this device."
        : result === "dismissed"
          ? "Installation was not completed. Your browser's own menu can still install it."
          : result === "failed"
            ? "This browser could not show its installation prompt. Use its own menu, or read the steps."
            : "",
    );
  }, [install]);
  const reload = useCallback(() => {
    if (reviewNavigation(() => { onNavigate(); window.location.reload(); })) return;
    if (hasPendingWork() && !window.confirm("Reload Powerplants One and discard unsaved entries?"))
      return;
    onNavigate();
    // A full document load picks up the deployed release. Nothing stored or queued is removed.
    window.location.reload();
  }, [onNavigate]);
  return (
    <div className="ppo-install-actions">
      {/* An installed window does not need to be told how to install itself. */}
      {!standalone && (offered || prompting) && (
        <button className="ppo-more-link" onClick={run} disabled={prompting}>
          <ShellIcon name="plus" />
          <span>{prompting ? "Waiting for your browser…" : "Install Powerplants One"}</span>
        </button>
      )}
      {!standalone && (
        <button
          className="ppo-more-link"
          onClick={() => {
            onNavigate();
            openInstallationHelp();
          }}
        >
          <ShellIcon name="help" />
          <span>{offered ? "Other ways to install" : "How to install this app"}</span>
        </button>
      )}
      {standalone && (
        <button className="ppo-more-link" onClick={reload}>
          <ShellIcon name="recovery" />
          <span>Reload app</span>
        </button>
      )}
      {(message || (outcome === "accepted" && !message)) && (
        <p className="ppo-install-message" role="status">
          {message || "Powerplants One was installed on this device."}
        </p>
      )}
    </div>
  );
}
