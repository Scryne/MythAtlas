import { notFound, redirect } from 'next/navigation';
import { mythologies } from '@/lib/myth-data';

interface CulturePageProps {
  params: {
    id: string;
  };
}

export function generateStaticParams() {
  return mythologies.map((item) => ({ id: item.id }));
}

export default function CultureDetailPage({ params }: CulturePageProps) {
  const exists = mythologies.some((item) => item.id === params.id);
  if (!exists) notFound();
  redirect(`/mythology/${params.id}`);
}
