import Link from 'next/link';

const linkGroups = [
  {
    title: 'Kesfet',
    links: [
      { href: '/map', label: 'Harita' },
      { href: '/discover', label: 'Kesfet' },
      { href: '/parallels', label: 'Paraleller' },
      { href: '/sites', label: 'Kutsal Alanlar' },
    ],
  },
  {
    title: 'Arastir',
    links: [
      { href: '/stats', label: 'Istatistikler' },
      { href: '/archaeology', label: 'Arkeoloji' },
      { href: '/family-tree', label: 'Aile Agaci' },
      { href: '/themes', label: 'Temalar' },
    ],
  },
  {
    title: 'Kaynaklar',
    links: [
      { href: '/bibliography', label: 'Kaynakca' },
      { href: '/scholars', label: 'Akademisyenler' },
      { href: '/methodology', label: 'Metodoloji' },
      {
        href: 'https://github.com/scryn/MythAtlas/blob/main/data/CONTRIBUTING.md',
        label: 'Veriye katki',
        external: true,
      },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-[color:var(--color-border)] bg-black/10">
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent" />
      <div className="section-container py-12">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(3,minmax(0,1fr))]">
          <div className="space-y-4">
            <div>
              <p className="font-heading text-2xl font-bold text-gold-gradient">MythAtlas</p>
              <p className="mt-2 max-w-md text-sm text-secondary">
                Acik kaynak veriyle beslenen, kadim hikayeleri cografya ve arkeolojiyle birlikte
                okutan dijital atlas.
              </p>
            </div>
            <div className="space-y-2 text-sm text-secondary">
              <p>Tum veriler acik kaynak referanslardan derlenir.</p>
              <p>MIT License ile lisanslanmistir.</p>
            </div>
          </div>

          {linkGroups.map((group) => (
            <div key={group.title} className="space-y-4">
              <h2 className="font-heading text-sm uppercase tracking-[0.18em] text-gold/80">
                {group.title}
              </h2>
              <div className="flex flex-col gap-2 text-sm">
                {group.links.map((link) =>
                  link.external ? (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary hover:text-gold-light"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-secondary hover:text-gold-light"
                    >
                      {link.label}
                    </Link>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="gold-divider my-8" />

        <div className="flex flex-col gap-3 text-xs text-secondary md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} MythAtlas. Tanimlar, veri notlari ve gorseller kaynaklariyla birlikte sunulur.</p>
          <p>Veriye katki icin GitHub uzerinden pull request gonderebilirsiniz.</p>
        </div>
      </div>
    </footer>
  );
}
