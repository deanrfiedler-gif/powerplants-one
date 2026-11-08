"use client";
import { useShell } from "./shell-provider";

export function RefinedPreference() {
  const shell = useShell();
  if (!shell.desktop || !shell.context?.preference_scope) return null;
  return (
    <label className="ppo-refined-preference">
      <input
        type="checkbox"
        checked={shell.refined}
        disabled={shell.refinedForced}
        onChange={(e) => shell.setRefined(e.target.checked)}
      />
      Refined desktop shell
      {shell.refinedForced && <small>Set by the test environment</small>}
    </label>
  );
}
