// The guide link policy (ADR-0065, decision 6). The compiler checks every link with it, and the renderer checks
// again before it draws one. No Node imports here: a client component imports this module.

// https hosts a guide may link to. It starts empty: adding a host is a reviewed change.
export const allowedHttpsHosts: readonly string[] = [];

export type LinkShape = "route" | "guide" | "https" | "refused";

// A single leading /, with no backslash anywhere: browsers read a leading // or /\ as another site's address.
// No query or fragment: a link to a section of a guide uses guide:<guide key>#<section id>. No square brackets: a
// route pattern such as /sales/opportunities/[id] names a register entry, not an address a browser can open.
const routeShape = /^\/(?![/\\])[^\s?#\\[\]]*$/;
const guideShape = /^guide:[a-z0-9.\-]+#[a-z0-9]+(-[a-z0-9]+)*$/;
// Whitespace, control and invisible format characters are refused in every link. Browsers drop some of them
// silently, so the address they open could differ from the one that was reviewed.
const hiddenCharacter = /[\s\p{Cc}\p{Cf}]/u;

// A syntax check only. Whether a route or guide target exists is checked against the register at compile time.
export function linkShape(href: string, httpsHosts: readonly string[] = allowedHttpsHosts): LinkShape {
  if (hiddenCharacter.test(href)) return "refused";
  if (routeShape.test(href)) return opensAsWritten(href) ? "route" : "refused";
  if (guideShape.test(href)) return "guide";
  if (isListedHttps(href, httpsHosts)) return "https";
  return "refused";
}

// A browser resolves . and .. segments, also written %2e, and percent-encodes some characters before it opens a path,
// so /sales/opportunities/%2e%2e would match its register entry and open /sales/. A route is accepted only when the
// path the browser opens is the path that was checked and reviewed.
function opensAsWritten(href: string): boolean {
  try {
    return new URL(href, "https://ppo.invalid").pathname === href;
  } catch {
    return false;
  }
}

function isListedHttps(href: string, httpsHosts: readonly string[]): boolean {
  if (!href.startsWith("https://")) return false;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  return url.protocol === "https:" && url.username === "" && url.password === "" && httpsHosts.includes(url.hostname);
}
