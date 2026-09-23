import { Suspense } from "react";
import { PlatformSearch } from "../../../components/platform-search";
import "../../styles/sh-platform.css";
import "../../styles/my-work.css";
export default function Page() {
  return (
    <Suspense fallback={<p>Loading search…</p>}>
      <div id="ppo-my-work">
        <PlatformSearch />
      </div>
    </Suspense>
  );
}
