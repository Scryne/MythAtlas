'use client';

import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import {
  categoryMeta,
  getEntryForQuery,
  groupResultsByCategory,
  highlightParts,
  popularSearches,
  runGlobalSearch,
  type SearchResult,
} from '@/lib/global-search';
import { deities, mythologies, myths, sacredSites } from '@/lib/myth-data';

const RECENT_KEY = 'mythatlas:recent-searches';
const MAX_RECENTS = 8;
const OPEN_EVENT = 'mythatlas:open-search';

type ResultFilter = 'all' | 'mythology' | 'myth' | 'deity' | 'site';

const mythologyColorById = new Map(mythologies.map((item) => [item.id, item.color]));
const mythToMythology = new Map(myths.map((item) => [item.id, item.mythologyId]));
const deityToMythology = new Map(deities.map((item) => [item.id, item.mythologyId]));
const siteToMythology = new Map(sacredSites.map((item) => [item.id, item.mythologyId]));

function readRecents(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item === 'string').slice(0, MAX_RECENTS);
  } catch {
    return [];
  }
}

function writeRecents(values: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(values.slice(0, MAX_RECENTS)));
  } catch {
    // ignore storage errors
  }
}

function addRecentTerm(term: string, setRecents: Dispatch<SetStateAction<string[]>>) {
  const value = term.trim();
  if (!value) return;
  setRecents((prev) => {
    const next = [value, ...prev.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, MAX_RECENTS);
    writeRecents(next);
    return next;
  });
}

function mythologyColorForResult(result: SearchResult): string {
  const rawId = result.id.split(':')[1] || '';

  if (result.category === 'mythology') return mythologyColorById.get(rawId) || 'var(--color-gold)';
  if (result.category === 'myth') return mythologyColorById.get(mythToMythology.get(rawId) || '') || 'var(--color-gold)';
  if (result.category === 'deity') return mythologyColorById.get(deityToMythology.get(rawId) || '') || 'var(--color-gold)';
  if (result.category === 'site') return mythologyColorById.get(siteToMythology.get(rawId) || '') || 'var(--color-gold)';
  return 'var(--color-gold)';
}

const filterOptions: Array<{ id: ResultFilter; label: string }> = [
  { id: 'all', label: 'Tum Sonuclar' },
  { id: 'mythology', label: 'Mitolojiler' },
  { id: 'myth', label: 'Mitler' },
  { id: 'deity', label: 'Tanrilar' },
  { id: 'site', label: 'Mekanlar' },
];

export default function SearchModal() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [filter, setFilter] = useState<ResultFilter>('all');

  useEffect(() => {
    setRecents(readRecents());
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setQuery(inputValue.trim()), 180);
    return () => window.clearTimeout(timeout);
  }, [inputValue]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (open && key === 'escape') {
        event.preventDefault();
        setOpen(false);
      }
    };

    const onOpenRequest = () => setOpen(true);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener(OPEN_EVENT, onOpenRequest);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOpenRequest);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open]);

  const results = useMemo(() => runGlobalSearch(query), [query]);
  const filteredResults = useMemo(
    () => (filter === 'all' ? results : results.filter((item) => item.category === filter)),
    [filter, results]
  );
  const groupedResults = useMemo(() => groupResultsByCategory(filteredResults), [filteredResults]);
  const flatResults = useMemo(() => groupedResults.flatMap((group) => group.items), [groupedResults]);

  useEffect(() => {
    setActiveIndex(0);
  }, [filter, query]);

  const closeModal = useCallback(() => {
    setOpen(false);
  }, []);

  const resetSearch = useCallback(() => {
    setInputValue('');
    setQuery('');
    setFilter('all');
  }, []);

  const onSelect = useCallback(
    (item: SearchResult) => {
      addRecentTerm(query.trim() || item.label, setRecents);
      closeModal();
      resetSearch();
      router.push(item.href);
    },
    [closeModal, query, resetSearch, router]
  );

  const onSubmitTerm = useCallback(
    (term: string) => {
      const top = getEntryForQuery(term);
      addRecentTerm(term, setRecents);
      if (!top) {
        setInputValue(term);
        return;
      }

      closeModal();
      resetSearch();
      router.push(top.href);
    },
    [closeModal, resetSearch, router]
  );

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!flatResults.length) {
        if (event.key === 'Enter' && inputValue.trim()) {
          event.preventDefault();
          onSubmitTerm(inputValue.trim());
        }
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % flatResults.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const item = flatResults[activeIndex];
        if (item) onSelect(item);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, flatResults, inputValue, onSelect, onSubmitTerm, open]);

  const emptySuggestions = popularSearches.slice(0, 4);

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Atlas arama"
      description="Mitolojiler, mitler, tanrilar ve kutsal alanlar arasinda hizli gecis."
      panelClassName="max-w-3xl"
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <label className="block text-sm text-secondary" htmlFor="atlas-search-input">
            Arama ifadesi
          </label>
          <input
            ref={inputRef}
            id="atlas-search-input"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Mitoloji, tanri, site veya elements:flood"
            className="w-full rounded-card border border-[color:var(--color-border)] bg-surface px-4 py-3 text-sm text-primary outline-none transition-colors focus:border-[color:var(--color-border-hover)]"
          />
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((item) => {
              const active = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`app-badge ${
                    active
                      ? 'border-[color:var(--color-border-hover)] bg-gold/12 text-gold-light'
                      : 'border-[color:var(--color-border)] bg-black/20 text-secondary hover:text-gold-light'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div aria-live="polite" className="text-xs text-secondary">
          {query.trim()
            ? `${filteredResults.length} sonuc bulundu`
            : recents.length
              ? `${recents.length} son arama saklandi`
              : 'Aramaya baslamak icin en az iki karakter girin'}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length === 0 ? (
            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="font-heading text-sm text-gold">Son aramalar</h3>
                {recents.length === 0 ? (
                  <EmptyState
                    title="Arama gecmisi henuz bos"
                    description="Arama yaptikca hizli erisim icin burada son sorgularinizi gosteririz."
                    icon="⌕"
                    className="items-start text-left"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {recents.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => onSubmitTerm(term)}
                        className="app-badge border-[color:var(--color-border)] bg-gold/8 text-gold-light"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="font-heading text-sm text-gold">Populer aramalar</h3>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => onSubmitTerm(term)}
                      className="app-badge border-[color:var(--color-border)] bg-black/20 text-secondary hover:text-gold-light"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : groupedResults.length === 0 ? (
            <EmptyState
              title="Bu iz surulemedi"
              description="Aradiginiz ifade icin atlasin veri katmanlarinda dogrudan bir kayit bulamadik. Asagidaki onerilerle tekrar deneyebilirsiniz."
              icon="✧"
              className="mt-2"
            />
          ) : (
            <div className="space-y-5">
              {groupedResults.map((group) => (
                <section key={group.category.id} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-secondary">
                    <span>{group.category.icon}</span>
                    <span>{group.category.label}</span>
                    <Badge variant="muted">{group.items.length}</Badge>
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const currentIndex = flatResults.findIndex((result) => result.id === item.id);
                      const active = currentIndex === activeIndex;
                      const parts = highlightParts(item.label, query);
                      const meta = categoryMeta(item.category);
                      const color = mythologyColorForResult(item);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onSelect(item)}
                          className={`w-full rounded-card border px-4 py-3 text-left transition-colors ${
                            active
                              ? 'border-[color:var(--color-border-hover)] bg-gold/12'
                              : 'border-transparent hover:border-[color:var(--color-border)] hover:bg-black/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <span
                                  aria-hidden
                                  className="inline-block h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-gold/80">{meta.icon}</span>
                                <p className="truncate text-sm text-primary">
                                  {parts.map((part, index) => (
                                    <span
                                      key={`${item.id}-part-${index}`}
                                      className={part.matched ? 'text-gold-light' : ''}
                                    >
                                      {part.text}
                                    </span>
                                  ))}
                                </p>
                              </div>
                              <p className="truncate text-xs text-secondary">{item.subtitle}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {query.trim().length > 0 && groupedResults.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {emptySuggestions.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onSubmitTerm(term)}
                className="app-badge border-[color:var(--color-border)] bg-black/20 text-secondary hover:text-gold-light"
              >
                {term}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--color-border)] pt-4 text-[11px] text-secondary">
          <span>Kisayollar: ↑ ↓ gezin, Enter ac, ESC kapat</span>
          <span>Arama paneli: CMD/CTRL + K</span>
        </div>
      </div>
    </Modal>
  );
}
