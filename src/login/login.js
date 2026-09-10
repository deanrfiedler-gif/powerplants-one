(() => {
  "use strict";
  const root = document.getElementById("ppo-login");
  const byId = id => root.querySelector("#" + id);
  const form = byId("signin-form"), button = byId("sign-in");
  const label = byId("sign-in-label"), spinner = byId("pending-icon");
  const symbol = root.querySelector(".microsoft-symbol"), announcer = byId("announcer");
  const originalLabel = label.textContent;
  let pending = false;
  // Native navigation works without JavaScript. Never simulate an authenticated session.
  form.addEventListener("submit", event => {
    if (pending || button.disabled) { event.preventDefault(); return; }
    pending = true;
    button.setAttribute("aria-disabled", "true");
    button.setAttribute("aria-busy", "true");
    label.textContent = "Opening Microsoft…";
    spinner.hidden = false; symbol.hidden = true;
    announcer.textContent = "Opening Microsoft. Return to this page to try again if sign-in is cancelled.";
  });
  // Back/forward cache must not leave the action locked after provider cancellation.
  window.addEventListener("pageshow", () => {
    pending = false;
    button.removeAttribute("aria-disabled"); button.removeAttribute("aria-busy");
    label.textContent = originalLabel;
    spinner.hidden = true; symbol.hidden = false; announcer.textContent = "";
  });
  const help = byId("help"), dialog = byId("help-dialog");
  help.hidden = false;
  help.addEventListener("click", () => { dialog.showModal(); dialog.querySelector(".close").focus(); });
  dialog.querySelectorAll("[data-close]").forEach(close => close.addEventListener("click", () => dialog.close()));
  dialog.addEventListener("close", () => help.focus({ preventScroll: true }));
  dialog.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const items = [...dialog.querySelectorAll("button,summary,a[href]")].filter(el => el.getClientRects().length > 0);
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
})();
