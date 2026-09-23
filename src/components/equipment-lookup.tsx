"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Field, PageHeader, ReadState } from "./business-ui";
import { Button, ButtonLink } from "./ui/button";
import { EquipmentContext, EquipmentNav } from "./equipment-workspace";
import { useCrmResource } from "./crm-state";
import type { equipmentLookup } from "../equipment/reads";
type Detector = {
  detect: (image: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};
type DetectorConstructor = {
  new (options: { formats: string[] }): Detector;
  getSupportedFormats: () => Promise<string[]>;
};
const titles: Record<string, string> = {
  Exact: "Equipment found — compare the physical label",
  Moved: "Equipment has recorded movement — confirm the current location",
  Removed: "Equipment is removed or decommissioned",
  Ambiguous: "More than one permitted record matches",
  Malformed: "This identifier is not recognised",
  UnknownOrInaccessible: "No permitted match — unknown or inaccessible",
};

export function EquipmentLookup() {
  const query = useSearchParams(),
    router = useRouter(),
    q = query.get("q") ?? "";
  const [manual, setManual] = useState(q),
    [camera, setCamera] = useState(
      "Camera is off. Manual lookup is always available.",
    ),
    [active, setActive] = useState(false),
    [confirmed, setConfirmed] = useState<string | null>(null);
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    generation = useRef(0),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const result = useCrmResource<Awaited<ReturnType<typeof equipmentLookup>>>(
    q ? `equipment/lookup?q=${encodeURIComponent(q)}` : null,
    true,
  );
  const release = () => {
    generation.current++;
    if (timer.current) clearTimeout(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        release();
        setActive(false);
        setCamera(
          "Camera stopped while the page was hidden. Start it again or use manual lookup.",
        );
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      release();
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  const lookup = (raw: string) => {
    release();
    setActive(false);
    setConfirmed(null);
    let value = raw.trim();
    if (/^https?:\/\//i.test(value)) {
      try {
        const u = new URL(value);
        if (u.origin === location.origin && !u.search && !u.hash)
          value = u.pathname;
      } catch {
        /* Server returns malformed. */
      }
    }
    setManual(value);
    router.push(`/equipment/lookup?q=${encodeURIComponent(value)}`, {
      scroll: false,
    });
  };
  async function startCamera() {
    release();
    const attempt = generation.current;
    setActive(true);
    setCamera("Checking camera support…");
    const ctor = (
      window as unknown as { BarcodeDetector?: DetectorConstructor }
    ).BarcodeDetector;
    try {
      if (
        !window.isSecureContext ||
        !navigator.mediaDevices?.getUserMedia ||
        !ctor ||
        !(await ctor.getSupportedFormats()).includes("qr_code")
      ) {
        setCamera(
          "QR camera scanning is unavailable in this browser. Enter the Asset reference or serial below.",
        );
        setActive(false);
        return;
      }
      if (attempt !== generation.current) return;
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (attempt !== generation.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      video.current!.srcObject = media;
      await video.current!.play();
      const detector = new ctor({ formats: ["qr_code"] });
      let emptyFrames = 0;
      setCamera(
        "Point the camera at the equipment QR label. No record changes are made.",
      );
      const scan = async () => {
        if (attempt !== generation.current || !video.current) return;
        try {
          const codes = await detector.detect(video.current);
          if (attempt !== generation.current) return;
          if (codes.length === 1) {
            setCamera(
              "Code read. Compare the physical equipment with the result.",
            );
            lookup(codes[0].rawValue);
            return;
          }
          emptyFrames++;
          if (codes.length > 1)
            setCamera(
              "Several codes are visible. Show one label at a time or enter its reference.",
            );
          else if (emptyFrames > 24)
            setCamera(
              "No code read yet. Improve the light, move closer, or use manual lookup.",
            );
          timer.current = setTimeout(() => void scan(), 400);
        } catch {
          if (attempt === generation.current) {
            release();
            setActive(false);
            setCamera(
              "The scan failed. Restart the camera or enter the reference manually.",
            );
          }
        }
      };
      void scan();
    } catch (e) {
      if (attempt === generation.current) {
        release();
        setActive(false);
        setCamera(
          (e as Error).name === "NotAllowedError"
            ? "Camera permission was denied. Use manual lookup, or allow camera access in your browser and retry."
            : "The camera could not be opened. Check the device or use manual lookup.",
        );
      }
    }
  }
  return (
    <main id="ppo-equipment" className="eq-workspace">
      <PageHeader
        eyebrow="EQ-02 · Equipment"
        title="Identify equipment"
        description="Scan or enter the identifier, then compare the physical label and installed location."
      />
      <EquipmentNav />
      <section className="eq-card">
        <h2>QR camera</h2>
        <video
          ref={video}
          className="eq-camera"
          playsInline
          muted
          hidden={!active}
          aria-label="Equipment QR camera preview"
        />
        <p role="status">{camera}</p>
        <div className="eq-actions">
          <Button onClick={() => void startCamera()} disabled={active}>
            Start camera
          </Button>
          {active && (
            <Button
              onClick={() => {
                release();
                setActive(false);
                setCamera("Camera stopped. Manual lookup is available.");
              }}
            >
              Stop camera
            </Button>
          )}
        </div>
      </section>
      <form
        className="eq-filters"
        onSubmit={(e) => {
          e.preventDefault();
          lookup(manual);
        }}
      >
        <Field
          name="equipment-identifier"
          label="Asset reference, UUID or serial"
          value={manual}
          onChange={setManual}
          required
        />
        <Button type="submit" variant="primary">
          Look up equipment
        </Button>
      </form>
      <ReadState
        loading={result.loading}
        error={result.error}
        retry={result.reload}
      />
      {result.data && (
        <section aria-live="polite">
          <h2>{titles[result.data.outcome]}</h2>
          {result.data.message && <p>{result.data.message}</p>}
          {result.data.outcome === "UnknownOrInaccessible" && (
            <p>
              Check the label and spelling. If the reference is correct, ask the
              record owner to check your access. Hidden record existence is not
              disclosed.
            </p>
          )}
          {result.data.items.map((a) => (
            <article key={a.id} className="eq-card">
              <h3>{a.description}</h3>
              <EquipmentContext row={a} />
              {result.data!.items.length === 1 && (
                <>
                  <label>
                    <input
                      type="checkbox"
                      checked={confirmed === `${a.id}:${a.version}`}
                      onChange={(e) =>
                        setConfirmed(
                          e.target.checked ? `${a.id}:${a.version}` : null,
                        )
                      }
                    />{" "}
                    I compared this reference, serial and physical location with
                    the equipment label.
                  </label>
                  <p className="eq-muted">
                    This comparison is for this lookup session. It does not
                    change canonical identity status or create inspection
                    evidence.
                  </p>
                  {confirmed === `${a.id}:${a.version}` && (
                    <div className="eq-actions">
                      <ButtonLink href={`/equipment/${a.id}`}>
                        Open Equipment workspace
                      </ButtonLink>
                      <ButtonLink href={`/sites/${a.site_id}/readiness`}>
                        Check Site readiness
                      </ButtonLink>
                      <ButtonLink href={`/equipment/${a.id}?view=inspections`}>
                        Select Inspection context
                      </ButtonLink>
                    </div>
                  )}
                </>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
