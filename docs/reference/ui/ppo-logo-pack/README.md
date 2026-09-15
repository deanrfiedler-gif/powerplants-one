# Powerplants One — refined logo pack r01

Prepared 14 September 2026. Digital assets for the PPO app and related screen placements.

## Which file to use

| Placement | SVG master | PNG sizes supplied |
| --- | --- | --- |
| Navy menu rail / dark mobile tile | `svg/ppo-symbol-on-navy.svg` | 36, 72, 80, 160, 256, 512, 1024 px |
| Compact mark on white or very light surfaces | `svg/ppo-symbol-on-light.svg` | 36, 72, 80, 160, 256, 512, 1024 px |
| Full company logo on brand navy | `svg/powerplants-full-on-navy.svg` | 80, 160, 256, 512, 1024, 2048 px |
| Full company logo on white / very light grey | `svg/powerplants-full-on-light.svg` | 80, 160, 256, 512, 1024, 2048 px |
| Single-colour reversed full logo | `svg/powerplants-full-white.svg` | 80, 160, 256, 512, 1024, 2048 px |
| Full corporate logo inside a white disc | `svg/powerplants-full-white-badge.svg` | 80, 160, 256, 512, 1024, 2048 px |
| Browser tab | `icons/favicon.ico` | Contains 16, 32 and 48 px frames |
| Scalable web icon | `icons/ppo-app-icon.svg` | PNG: 16, 32, 48, 180, 192, 512 px |
| Apple touch icon | `icons/ppo-app-icon-180.png` | 180 × 180 px |
| Web app icons | `icons/ppo-app-icon-192.png`, `icons/ppo-app-icon-512.png` | 192 × 192 and 512 × 512 px |

All PNGs are square. Their dimensions are part of the filename. Use SVG where supported, or use a PNG at twice the intended CSS display size: 160 px for an 80 px desktop logo, and 72 px for a 36 px mobile logo. All master SVGs contain real vector shapes; the full-logo lettering is outlined and requires no font installation. There are no embedded bitmap images, external resources or scripts in the SVGs.

## Recommended app use

- Desktop rail: `ppo-symbol-on-navy.svg`, 80 × 80 px in the current 96 px rail.
- Mobile: `ppo-symbol-on-navy.svg`, 36 × 36 px inside the existing navy tile.
- Larger branded screens: full green-and-white logo on navy; full green-and-navy logo on light surfaces. Use the white badge when that treatment is wanted.
- The original guidelines show a 60 px minimum for the full logo (page 9). Use an 80 px or larger image box here, allowing for transparent margins; prefer larger placements when the company name needs to be readily readable. The 36 px mobile slot suits the compact adaptation.
- Give the home link the accessible label `Powerplants One home`, image alt text `Powerplants One`, and tooltip `Powerplants One`. A company-logo-only placement can use `Powerplants Australia` as its alt text.
- Preserve aspect ratio and surrounding clear space. Do not stretch, add effects or recolour through CSS filters.

These are the required image sizes for the current web prototype and common web shortcuts. This pack does not contain native app-store submission artwork or imply that the web app is installable.

## Colour and transparency

- Green: **#62BB46** (RGB 98, 187, 70).
- Navy: **#242A37** (RGB 36, 42, 55).
- White: **#FFFFFF**.
- The six logo masters and their PNGs have transparent backgrounds. The white-badge variant intentionally includes a white disc, with transparency outside it.
- The app-icon files intentionally have a solid navy square background, so the symbol remains visible on different browser and device backgrounds. Platform icon masks may round its corners.
- The backgrounds on `logo-pack-preview.png` are preview surfaces, not backgrounds baked into the transparent logo files.
- No Adobe background removal is required.

## Refinement and source evidence

Full logos: original vector shapes and outlined lettering extracted from the supplied **PPA Brand Identity Guidelines 2026**, page 6. The white badge preserves the original artwork arrangement from page 7. Colours were set to the explicit digital RGB/HEX values on page 18. The original full-logo geometry was retained rather than redrawn or traced from a PNG.

The all-white full logo is a monochrome derivative of those same paths; it is not the separate circular video treatment pictured in the guide.

Compact logos: the user-requested symbol-only adaptation already prepared in this conversation, with three symmetrical continuous ellipses, uniform stroke thickness and four equal circles. The light-background variant uses navy circles. These remain the PPO-specific adaptation, distinct from the original full corporate mark.

Full-logo spacing, original custom curves and lettering are preserved from the vector source. The PNG uploads are not vector masters and were not used for raster tracing. The supplied originals remain separate and unchanged.

Rail placement source: `src/app/desktop-shell.css` and `src/app/mobile-layout.css`, read from repository main commit `39caa8ed0fe04ff157f1933c963e9653bb118945` earlier in this session. The pack has not been installed in the repository or deployed to the application.

## Contents and checks

- 6 SVG logo masters.
- 38 transparent PNG logo exports.
- 1 SVG app icon, 6 PNG icon sizes and 1 multi-resolution ICO.
- Visual contact sheet, this usage guide and a manifest containing source details and file hashes.

Checks: parsed every SVG, verified PNG dimensions and alpha channels, confirmed exact opaque brand colours, verified all three ICO frame sizes, visually reviewed the six variants and desktop/mobile size samples, and checked the final ZIP contents. SVG extraction retains the PDF's original path geometry; tiny raster antialiasing differences are normal.
