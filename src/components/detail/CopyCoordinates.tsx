'use client';

import { useState } from 'react';

interface CopyCoordinatesProps {
  lat: number;
  lng: number;
}

export default function CopyCoordinates({ lat, lng }: CopyCoordinatesProps) {
  const [copied, setCopied] = useState(false);
  const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="rounded-md border border-gold/25 bg-black/20 px-3 py-2 text-xs text-foreground/75 hover:border-gold/45"
      title="Koordinati kopyala"
    >
      {copied ? 'Kopyalandi' : text}
    </button>
  );
}
