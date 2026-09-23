import type { Catalog } from "./model";
export function ReleaseLabel({ catalog }: { catalog: Catalog }) {
  return <p className="studio-note">
    {catalog.release ? "Hosted release" : "Local working copy"} · {catalog.checkout_commit
      ? <a href={`https://github.com/deanrfiedler-gif/powerplants-one/commit/${catalog.checkout_commit}`} target="_blank" rel="noreferrer">{catalog.checkout_commit.slice(0, 12)}</a>
      : "Git history unavailable"}.
    {catalog.release ? " GitHub changes appear here after deployment. Browser previews are temporary." : " Refresh reads local files, including uncommitted changes."}
  </p>;
}
