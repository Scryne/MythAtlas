import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 font-heading text-xs tracking-[0.14em] text-gold/80">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-gold-light">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-gold-light' : ''}>{item.label}</span>
              )}
              {!isLast ? <span className="text-gold/40">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
