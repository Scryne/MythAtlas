'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [status, setStatus] = useState<'idle' | 'shared' | 'copied' | 'error'>('idle');

  async function handleShare() {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text, url });
        setStatus('shared');
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setStatus('copied');
        return;
      }

      setStatus('error');
    } catch {
      setStatus('error');
    } finally {
      window.setTimeout(() => setStatus('idle'), 2200);
    }
  }

  const label =
    status === 'shared'
      ? 'Paylasildi'
      : status === 'copied'
        ? 'Baglanti kopyalandi'
        : status === 'error'
          ? 'Paylasim kullanilamiyor'
          : 'Paylas';

  return (
    <Button type="button" onClick={handleShare} variant="secondary" size="sm">
      ↗ {label}
    </Button>
  );
}
