import React from 'react';
import QRCode from 'react-qr-code';
import { Barcode128 } from './Barcode128';

/**
 * Link a phone opens when it scans the QR: the product's info page.
 * Set VITE_PUBLIC_URL (e.g. http://192.168.1.10:5173) so phones on the shop Wi-Fi can reach it;
 * otherwise the address this page was opened with is used.
 */
export const productInfoUrl = (code: string) => {
  const base = (import.meta.env.VITE_PUBLIC_URL as string | undefined) || window.location.origin;
  return `${base.replace(/\/$/, '')}/product/${encodeURIComponent(code)}`;
};

/** Barcode (for the billing scanner) + small QR (phone camera opens the product page) */
const ProductCodes: React.FC<{ code: string; barcodeHeight?: number }> = ({ code, barcodeHeight = 24 }) => (
  <div className="inline-flex items-center gap-2">
    <Barcode128 value={code} height={barcodeHeight} moduleWidth={1} />
    <a
      href={productInfoUrl(code)}
      target="_blank"
      rel="noreferrer"
      title="Scan with a phone to see this product"
      onClick={(e) => e.stopPropagation()}
      className="shrink-0 rounded border border-gray-200 bg-white p-0.5 dark:border-slate-700"
    >
      <QRCode value={productInfoUrl(code)} size={40} style={{ height: 40, width: 40 }} viewBox="0 0 256 256" />
    </a>
  </div>
);

export default ProductCodes;
