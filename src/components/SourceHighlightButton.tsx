'use client';

const SOURCE_HIGHLIGHT_EVENT = 'mythatlas:highlight-sources';

interface SourceHighlightButtonProps {
  sourceIds: string[];
  className?: string;
  label?: string;
}

export default function SourceHighlightButton({
  sourceIds,
  className,
  label = 'Kaynaklari gor',
}: SourceHighlightButtonProps) {
  if (!sourceIds.length) return null;

  return (
    <button
      type="button"
      className={
        className ||
        'rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-gold-light hover:bg-gold/20'
      }
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent(SOURCE_HIGHLIGHT_EVENT, { detail: { sourceIds } })
        );
        window.location.hash = 'academic-sources';
      }}
    >
      {label}
    </button>
  );
}

export { SOURCE_HIGHLIGHT_EVENT };
