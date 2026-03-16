'use client';

import Button from '@/components/ui/Button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error: _error, reset }: ErrorPageProps) {
  return (
    <section className="section-container page-section">
      <div className="ancient-card mx-auto max-w-2xl p-8 text-center">
        <p className="meta-text text-xs uppercase tracking-[0.2em]">500</p>
        <h1 className="mt-2 text-3xl text-gold">Tanrilar su an mesgul gorunuyor...</h1>
        <p className="mt-3 text-sm text-secondary">
          Beklenmeyen bir durum olustu. Ham hata gostermek yerine sayfayi guvenli halde tuttuk.
        </p>
        <div className="mt-6 flex justify-center">
          <Button onClick={reset} variant="secondary">
            Tekrar dene
          </Button>
        </div>
      </div>
    </section>
  );
}
