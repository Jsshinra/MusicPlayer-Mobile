import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface Props {
  onResult: (text: string) => void;
  onError?: (err: Error) => void;
}

const READER_ID = "lumen-qr-reader";

/**
 * Camera viewport + QR decoder. Drops the reader into a div with a fixed id
 * and lets html5-qrcode bind getUserMedia + a canvas-based decoder.
 *
 * Keeps a `started` ref so React's StrictMode double-mount doesn't try to
 * start the camera twice (which html5-qrcode rejects).
 */
export function QrScanner({ onResult, onError }: Props) {
  const startedRef = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  // Keep latest callbacks without re-running the effect (camera teardown is
  // expensive on Android, and we don't want a permission-prompt loop).
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const scanner = new Html5Qrcode(READER_ID, { verbose: false });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          // Library calls this repeatedly; consumer is responsible for
          // ignoring follow-ups (we close the modal on first hit).
          onResultRef.current?.(decoded);
        },
        () => {
          // No-op; per-frame "not found" callbacks would flood the log.
        },
      )
      .catch((err: unknown) => {
        const e = err instanceof Error ? err : new Error(String(err));
        onErrorRef.current?.(e);
      });

    return () => {
      const s = scannerRef.current;
      scannerRef.current = null;
      if (!s) return;
      // Best-effort stop; if it was never running, .stop() rejects — swallow.
      s.stop().catch(() => {}).finally(() => {
        try { s.clear(); } catch { /* ignore */ }
      });
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-black">
      <div id={READER_ID} className="w-full" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-60 w-60 rounded-2xl border-2 border-white/70 shadow-[0_0_0_2000px_rgba(0,0,0,0.45)]" />
      </div>
    </div>
  );
}
