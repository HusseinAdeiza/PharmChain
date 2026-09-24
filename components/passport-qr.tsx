"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { passportPath } from "@/lib/nafdac";

export function PassportQr({ nafdacNumber }: { nafdacNumber: string }) {
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => "",
  );
  const url = origin ? `${origin}${passportPath(nafdacNumber)}` : "";
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);


  const copyUrl = async () => {
    if (!url) {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <div className="corner-marks corner-marks-soft glass rounded-3xl p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span
          className="grid h-10 w-10 place-items-center rounded-xl border border-electric/40 bg-electric/10 text-electric shadow-glow-cyan"
          aria-hidden="true"
        >
          <QrCode className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold uppercase leading-none tracking-[-0.01em] text-frost">Passport link</h2>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Public, account-free destination
          </p>
        </div>
      </div>

      {url ? (
        <div className="mt-5 flex flex-col items-center">
          <div className="rounded-2xl border border-white/10 bg-white p-3 shadow-glow-cyan">
            <QRCodeSVG
              value={url}
              size={184}
              level="M"
              marginSize={1}
              fgColor="#04060a"
              bgColor="#ffffff"
              title={`QR passport for ${nafdacNumber}`}
            />
          </div>
          <a
            href={url}
            className="mt-4 max-w-full break-all text-center font-mono text-xs leading-5 text-electric underline decoration-electric/40 decoration-1 underline-offset-4 transition-colors hover:text-frost hover:decoration-frost"
          >
            {url}
          </a>
          <Button variant="outline" size="sm" onClick={() => void copyUrl()} className="mt-3">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy passport URL"}
          </Button>
          {copyError ? (
            <p className="mt-2 border-l-2 border-danger pl-2 text-left font-mono text-xs font-bold text-danger" role="alert">
              Clipboard access was unavailable. Select and copy the URL above.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      )}
    </div>
  );
}
