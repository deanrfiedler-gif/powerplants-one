// S1 opt-in presentation only. This preference never carries access or tenant data.
export const refinedPreferenceKey = (scope: string) =>
  `ppo-shell-refined:${scope}`;
export function refinedPreference(raw: string | null) {
  try {
    const value = JSON.parse(raw ?? "null");
    return value?.schema_version === 1 && value.version === "refined";
  } catch {
    return false;
  }
}
export function refinedEnabled(
  override: string | undefined,
  preference: boolean,
) {
  return override === "1" || (override !== "0" && preference);
}
export function capShellBadge(count: number | undefined) {
  return count && Number.isFinite(count) && count > 0
    ? count > 99
      ? "99+"
      : String(count)
    : null;
}
export function shortTenantName(name: string) {
  const chars = Array.from(name);
  return chars.length > 14 ? chars.slice(0, 13).join("") + "…" : name;
}
export function personColour(identity: string) {
  const colours = ["sage", "sky", "lilac", "sand", "rose", "teal"] as const;
  let hash = 0;
  for (const char of identity) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  return colours[hash % colours.length];
}

export function shellBuildLabel(commit: string | undefined) {
  return /^[0-9a-f]{40}$/.test(commit ?? "")
    ? `Build ${commit!.slice(0, 8)}`
    : "Local build";
}
