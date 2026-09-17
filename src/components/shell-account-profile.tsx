import { ShellWorkspaceSelector } from "./shell-workspace-selector";

export function accountInitials(name: string | undefined) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return words.length ? words.slice(-2).map(word => Array.from(word)[0]).join("").toUpperCase() : "PPO";
}
export function ShellAccountProfile({ name }: { name?: string }) {
  return <>
    <div className="ppo-account-profile"><span className="account-avatar" aria-hidden="true">{accountInitials(name)}</span><div><strong>{name ?? "Choose an identity"}</strong><small>Powerplants One · Synthetic data only</small></div></div>
    <ShellWorkspaceSelector />
    <p className="ppo-account-note">Choose a page from More to open its workspace. Sign-in and access permissions stay the same.</p>
  </>;
}
