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
    <div className="glass overflow-hidden rounded-3xl border-electric/25 shadow-glow">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-black/40 px-5 py-4">
        <div className="min-w-0">
          <p className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-electric">
            PC-01 · Field unit
          </p>
          <h2 className="mt-1 font-display text-lg font-bold uppercase leading-none tracking-[-0.01em] text-frost">
            Optical passport reader
          </h2>
        </div>
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-electric/40 bg-electric/10 text-electric shadow-glow-cyan"
          aria-hidden="true"
        >
          <ScanLine className="h-5 w-5" />
        </span>
      </div>

      <div className="p-4 sm:p-6">
        <div
          className={cn(
            "relative min-h-[270px] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[inset_0_0_60px_rgba(31,182,255,0.08)]",
            cameraState === "starting" && "grid place-items-center",
          )}
        >
          <div ref={readerRef} id={readerId} className="relative z-10 min-h-[270px] w-full" />
          {cameraState !== "scanning" ? (
            <div className="absolute inset-0 z-20 grid place-items-center bg-black/85 px-6 text-center">
              <div>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-electric/50 bg-electric/10 text-electric shadow-glow-cyan">
                  {cameraState === "starting" ? (
                    <LoaderCircle className="h-6 w-6 animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6" />
                  )}
                </span>
                <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.18em] text-electric">
                  {cameraState === "starting" ? "Starting camera…" : "Camera is off"}
                </p>
                <p className="mx-auto mt-2 max-w-xs font-mono text-[11px] leading-5 text-muted">
                  Point the camera at the QR code printed on a medicine passport.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="corner-marks pointer-events-none absolute inset-4 z-20" aria-hidden="true" />
              <div
                className="scanline-beam pointer-events-none z-20 motion-safe:animate-scanline"
                aria-hidden="true"
              />
            </>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {cameraState === "scanning" || cameraState === "starting" ? (
            <Button variant="secondary" onClick={() => void stopCamera().then(() => setCameraState("stopped"))}>
              <CameraOff className="h-4 w-4" />
              Stop camera
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => void startCamera()}>
              <Camera className="h-4 w-4" />
              Start camera scan
            </Button>
          )}
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-electric" />
            Camera processing stays in your browser
          </span>
        </div>

        <div className="my-6 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-white/10" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            or enter manually
          </span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={submitManual} noValidate>
          <label
            htmlFor="manual-nafdac"
            className="mb-2 flex items-baseline justify-between gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted"
          >
            NAFDAC number or passport URL
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Keyboard className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
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
            <Button type="submit" variant="primary" className="sm:px-7">
              Verify
            </Button>
          </div>
        </form>

        {error ? (
          <div
            id="scanner-error"
            className="mt-4 flex gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 font-mono text-xs leading-5 text-frost shadow-glow-red"
            role="alert"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
