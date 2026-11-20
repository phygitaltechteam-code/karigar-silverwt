import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Scan a barcode with the phone/laptop camera using the browser's built-in
 * BarcodeDetector (Chrome / Edge / Android). No external library.
 * The camera only opens on https:// or localhost (browser security rule).
 */
interface Props {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

export const cameraScanSupported = () =>
  typeof window !== 'undefined' &&
  'BarcodeDetector' in window &&
  !!navigator.mediaDevices?.getUserMedia;

export const CameraBarcodeScanner: React.FC<Props> = ({ open, onClose, onDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let stopped = false;

    const start = async () => {
      if (!window.isSecureContext) {
        setError('Camera needs a secure link (https:// or localhost). Open the app over https on the phone.');
        return;
      }
      if (!cameraScanSupported()) {
        setError('This browser cannot read barcodes from the camera. Use Chrome on Android or type/scan the code.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (stopped) return;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        const Detector = (window as any).BarcodeDetector;
        const detector = new Detector({ formats: ['code_128', 'qr_code', 'ean_13', 'code_39'] });
        const tick = async () => {
          if (stopped) return;
          try {
            const found = await detector.detect(video);
            if (found?.length && found[0].rawValue) {
              onDetected(String(found[0].rawValue));
              onClose();
              return;
            }
          } catch {
            /* frame not ready yet */
          }
          timer = window.setTimeout(tick, 250);
        };
        tick();
      } catch (e: any) {
        setError(e?.name === 'NotAllowedError' ? 'Camera permission was denied.' : 'Could not open the camera.');
      }
    };
    start();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl bg-white p-3 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1a1c1b] dark:text-white">Scan product barcode</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        {error ? (
          <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>
        ) : (
          <div className="relative overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} className="h-64 w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 bg-red-500/80" />
          </div>
        )}
        <p className="mt-2 text-center text-[11px] text-gray-500">Hold the barcode inside the frame</p>
      </div>
    </div>
  );
};

export default CameraBarcodeScanner;
