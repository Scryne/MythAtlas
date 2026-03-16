'use client';

import Image, { type ImageProps } from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { getDisplayImageSrc, isImageProxyUrl } from '@/lib/image-proxy';

const DEFAULT_BLUR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23241817'/%3E%3Cstop offset='1' stop-color='%231a1510'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' fill='url(%23g)'/%3E%3Ccircle cx='20' cy='18' r='12' fill='%23c9a84c22'/%3E%3Ccircle cx='46' cy='40' r='14' fill='%23e8c96a22'/%3E%3C/svg%3E";

interface AncientImageProps
  extends Omit<ImageProps, 'src' | 'alt' | 'placeholder' | 'blurDataURL'> {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  symbol?: string;
  fallbackLabel?: string;
  blurDataURL?: string;
}

export default function AncientImage({
  src,
  fallbackSrc,
  alt,
  className,
  symbol = '',
  fallbackLabel,
  blurDataURL = DEFAULT_BLUR,
  ...props
}: AncientImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const primarySrc = useMemo(
    () => getDisplayImageSrc(src, fallbackLabel || alt),
    [alt, fallbackLabel, src]
  );
  const secondarySrc = useMemo(
    () => getDisplayImageSrc(fallbackSrc, fallbackLabel || alt),
    [alt, fallbackLabel, fallbackSrc]
  );
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(primarySrc);

  const label = useMemo(() => {
    if (fallbackLabel) return fallbackLabel;
    return alt.trim().length > 0 ? alt : 'Mitolojik gorsel';
  }, [alt, fallbackLabel]);

  useEffect(() => {
    setCurrentSrc(primarySrc);
    setFailed(false);
    setLoaded(false);
  }, [primarySrc, secondarySrc]);

  if (!currentSrc || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(201,168,76,0.22),rgba(13,10,7,0.96)_64%)] text-center ${
          className || ''
        }`}
      >
        <div className="px-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/35 bg-black/20 shadow-[var(--shadow-gold)]">
            {symbol ? (
              <span className="text-xl text-gold-light">{symbol}</span>
            ) : (
              <span className="h-5 w-5 rounded-full border border-gold/35 bg-gold/10" aria-hidden />
            )}
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-foreground/50">
            {failed ? 'Gorsel su anda goruntulenemiyor' : src ? 'Gorsel yukleniyor' : 'Gorsel hazirlaniyor'}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-foreground/75">{label}</p>
        </div>
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      unoptimized={isImageProxyUrl(currentSrc) || /^https?:\/\//.test(currentSrc)}
      className={`${className || ''} ${loaded ? 'fade-in-image' : ''}`.trim()}
      placeholder="blur"
      blurDataURL={blurDataURL}
      onError={() => {
        if (secondarySrc && currentSrc !== secondarySrc) {
          setCurrentSrc(secondarySrc);
          setLoaded(false);
          return;
        }
        setFailed(true);
      }}
      onLoad={() => setLoaded(true)}
    />
  );
}
