import { notFound, redirect } from 'next/navigation';
import { mythologies } from '@/lib/myth-data';

interface CulturePageProps {
  params: Promise<{
    id: string;
  }>;
}

export function generateStaticParams() {
  return mythologies.map((item) => ({ id: item.id }));
}

export default async function CultureDetailPage(props: CulturePageProps) {
  const params = await props.params;
  const exists = mythologies.some((item) => item.id === params.id);
  if (!exists) notFound();
  redirect(`/mythology/${params.id}`);
}
