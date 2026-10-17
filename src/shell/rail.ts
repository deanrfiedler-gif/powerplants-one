// F13 / UXB-75: the server renders the desktop rail at the width this browser last
// showed, so the first paint already has it and nothing moves after hydration. Each
// identity's own choice stays in browser storage and wins once the shell context loads;
// this cookie only carries the last width shown, never an identity or a permission.
export const railCookie = "ppo_shell_rail";
// The labelled rail is the default, matching an identity with no stored choice.
export const railExpandedFrom = (value: string | undefined) => value !== "compact";
export const railCookieValue = (expanded: boolean, secure: boolean) =>
  `${railCookie}=${expanded ? "expanded" : "compact"}; Path=/; Max-Age=31536000; SameSite=Lax${secure ? "; Secure" : ""}`;
