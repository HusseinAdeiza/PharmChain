"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CameraOff,
  Keyboard,
  LoaderCircle,
  ScanLine,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import type { Html5Qrcode as Html5QrcodeInstance } from "html5-qrcode";
import { Button, cn } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { nafdacFromInput, passportPath } from "@/lib/nafdac";

const readerId = "pharmchain-qr-reader";

type CameraState = "idle" | "starting" | "scanning" | "stopped";

export function ProductScanner() {
  const router = useRouter();
  const readerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const handledRef = useRef(false);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [manualValue, setManualValue] = useState("");
  const [error, setError] = useState<string>();

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) {
      return;
    }
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      setCameraState("stopped");
    }
  }, []);

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, [stopCamera]);

  const openPassport = useCallback(
    (decodedText: string) => {
      if (handledRef.current) {
        return;
      }
      handledRef.current = true;
      const nafdacNumber = nafdacFromInput(decodedText);
      if (!nafdacNumber) {
        setError("That QR code is not a PharmChain passport URL. Enter the NAFDAC number manually.");
        setCameraState("stopped");
        void stopCamera();
        return;
      }
      router.push(passportPath(nafdacNumber));
    },
    [router, stopCamera],
  );

  const startCamera = async () => {
    if (!readerRef.current) {
      return;
    }
    setError(undefined);
    setCameraState("starting");
    handledRef.current = false;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(readerId, false);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.6,
        },
        (decodedText) => openPassport(decodedText),
        () => undefined,
      );
      setCameraState("scanning");
    } catch (cameraError) {
      scannerRef.current = null;
      setCameraState("stopped");
      const message =
        cameraError instanceof Error && cameraError.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access or use manual entry."
          : "The camera could not start. Use HTTPS, close other camera apps, or enter the number manually.";
      setError(message);
      try {
        readerRef.current.replaceChildren();
      } catch {
        setError(message);
      }
    }
  };

  const submitManual = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nafdacNumber = nafdacFromInput(manualValue);
    if (!nafdacNumber) {
      setError("Enter a valid NAFDAC number or a PharmChain /verify/ passport URL.");
      return;
    }
    setError(undefined);
    router.push(passportPath(nafdacNumber));
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-card">
      <div className="border-b border-ink/5 px-5 py-5 sm:px-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-teal">
              Instant check
            </p>
            <h2 className="mt-1 font-display text-xl font-extrabold tracking-[-0.03em] text-ink">
              Scan a drug passport
            </h2>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mint text-ink">
            <ScanLine className="h-5 w-5" />
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <div
          className={cn(
            "relative min-h-[270px] overflow-hidden rounded-3xl border border-ink/10 bg-ink",
            cameraState === "starting" && "grid place-items-center",
          )}
        >
          <div ref={readerRef} id={readerId} className="relative z-10 min-h-[270px] w-full" />
          {cameraState !== "scanning" ? (
            <div className="absolute inset-0 z-20 grid place-items-center bg-[radial-gradient(circle_at_50%_30%,rgba(185,239,220,0.2),transparent_48%),#102c2a] px-6 text-center text-white">
              <div>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/10">
                  {cameraState === "starting" ? (
                    <LoaderCircle className="h-6 w-6 animate-spin text-mint" />
                  ) : (
                    <Camera className="h-6 w-6 text-mint" />
                  )}
                </span>
                <p className="mt-4 font-display text-lg font-bold">
                  {cameraState === "starting" ? "Starting camera…" : "Camera is off"}
                </p>
                <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-white/55">
                  Point the camera at the QR code printed on a medicine passport.
                </p>
              </div>
            </div>
          ) : (
            <div className="pointer-events-none absolute left-1/2 top-8 z-20 h-px w-64 -translate-x-1/2 bg-mint shadow-[0_0_12px_2px_rgba(185,239,220,0.75)] motion-safe:animate-scan" />
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {cameraState === "scanning" || cameraState === "starting" ? (
            <Button variant="outline" onClick={() => void stopCamera().then(() => setCameraState("stopped"))}>
              <CameraOff className="h-4 w-4" />
              Stop camera
            </Button>
          ) : (
            <Button onClick={() => void startCamera()}>
              <Camera className="h-4 w-4" />
              Start camera scan
            </Button>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/45">
            <ShieldCheck className="h-3.5 w-3.5" />
            Camera processing stays in your browser
          </span>
        </div>

        <div className="my-6 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-ink/10" />
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-ink/35">
            or enter manually
          </span>
          <span className="h-px flex-1 bg-ink/10" />
        </div>

        <form onSubmit={submitManual} noValidate>
          <label htmlFor="manual-nafdac" className="mb-2 block text-sm font-semibold text-ink">
            NAFDAC number or passport URL
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Keyboard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
              <Input
                id="manual-nafdac"
                value={manualValue}
                onChange={(event) => setManualValue(event.target.value)}
                placeholder="e.g. 12345-6789"
                autoComplete="off"
                className="pl-11"
                aria-describedby={error ? "scanner-error" : undefined}
              />
            </div>
            <Button type="submit" className="sm:px-7">
              Verify
            </Button>
          </div>
        </form>

        {error ? (
          <div id="scanner-error" className="mt-4 flex gap-2 text-sm leading-5 text-red-700" role="alert">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
