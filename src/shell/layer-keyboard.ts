import type { KeyboardEvent } from "react";

const typed = new WeakMap<HTMLElement, { value: string; at: number }>();

export function layerControls(root: HTMLElement) {
  return [
    ...root.querySelectorAll<HTMLElement>(
      'summary,a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]',
    ),
  ].filter(
    (element) =>
      element.getClientRects().length && !element.closest("[hidden]"),
  );
}
// Bar popovers are one layer. Escape never reaches an older shell layer.
export function layerKeyboard(
  event: KeyboardEvent<HTMLElement>,
  close: () => void,
  arrows = true,
) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    close();
    return;
  }
  const controls = layerControls(event.currentTarget);
  if (!controls.length) return;
  const index = controls.indexOf(document.activeElement as HTMLElement);
  const editable =
    event.target instanceof Element &&
    !!event.target.closest('input,textarea,select,[contenteditable="true"]');
  if (event.key === "Tab") {
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      controls.at(-1)!.focus();
    } else if (!event.shiftKey && index === controls.length - 1) {
      event.preventDefault();
      controls[0].focus();
    }
  } else if (
    arrows &&
    ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) &&
    !editable
  ) {
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? controls.length - 1
          : (index + (event.key === "ArrowDown" ? 1 : -1) + controls.length) %
            controls.length;
    controls[next].focus();
  } else if (
    arrows &&
    !editable &&
    event.key.length === 1 &&
    event.key !== " " &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    const now = performance.now(),
      previous = typed.get(event.currentTarget);
    const value =
      (previous && now - previous.at < 700 ? previous.value : "") +
      event.key.toLowerCase();
    typed.set(event.currentTarget, { value, at: now });
    const ordered = [
      ...controls.slice(index + 1),
      ...controls.slice(0, index + 1),
    ];
    const match = ordered.find((node) =>
      (node.getAttribute("aria-label") ?? node.textContent ?? "")
        .trim()
        .toLowerCase()
        .startsWith(value),
    );
    if (match) {
      event.preventDefault();
      event.stopPropagation();
      match.focus();
    }
  }
}
