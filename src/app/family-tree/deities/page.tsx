import type { Metadata } from 'next';
import DeityEvolutionPageClient from './DeityEvolutionPageClient.lazy';

export const metadata: Metadata = {
  title: 'Tanrı Evrim Zincirleri',
  description: 'Tanrı kimliklerinin mitolojik gelenekler arasında nasıl evrilip dönüştüğünü izleyin.',
};

export default function DeityEvolutionPage() {
  return <DeityEvolutionPageClient />;
}
