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
    <div className="rounded-3xl border border-ink/8 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-mint text-ink">
          <QrCode className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-[-0.03em]">Passport link</h2>
          <p className="text-xs text-ink/45">Public, account-free destination</p>
        </div>
      </div>

      {url ? (
        <div className="mt-5 flex flex-col items-center">
          <div className="rounded-2xl border border-ink/8 bg-white p-3 shadow-sm">
            <QRCodeSVG
              value={url}
              size={184}
              level="M"
              marginSize={1}
              fgColor="#102c2a"
              bgColor="#ffffff"
              title={`QR passport for ${nafdacNumber}`}
            />
          </div>
          <a
            href={url}
            className="mt-4 max-w-full break-all text-center font-mono text-xs leading-5 text-teal underline decoration-teal/20 underline-offset-4 hover:decoration-teal"
          >
            {url}
          </a>
          <Button variant="outline" size="sm" onClick={() => void copyUrl()} className="mt-3">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy passport URL"}
          </Button>
          {copyError ? (
            <p className="mt-2 text-xs text-red-700" role="alert">
              Clipboard access was unavailable. Select and copy the URL above.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 h-64 animate-pulse rounded-2xl bg-ink/5" />
      )}
    </div>
  );
}
