import type { MetadataRoute } from "next";
import {
  appIdentity,
  appStart,
  canvas,
  installationIcons,
  navy,
} from "../platform/installation";

// The one canonical manifest, served at /manifest.webmanifest by the App Router file
// convention. Identity and start URL stay stable and record-free so an installed icon
// survives ordinary releases: no identity, tenant, token, timestamp, build hash or
// per-install query string belongs here. Orientation is left unlocked.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: appIdentity,
    name: "Powerplants One",
    short_name: "PPO",
    description:
      "Private synthetic prototype of the Powerplants One business operations platform.",
    start_url: appStart,
    scope: "/",
    display: "standalone",
    lang: "en-AU",
    dir: "ltr",
    theme_color: navy,
    background_color: canvas,
    prefer_related_applications: false,
    icons: installationIcons
      .filter((icon) => icon.manifest)
      .map((icon) => ({
        src: icon.path,
        sizes: icon.sizes,
        type: icon.type,
        purpose: icon.purpose,
      })),
  };
}
