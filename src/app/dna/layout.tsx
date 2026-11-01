import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mit DNA Gezgini',
  description: 'Mitleri tufan, yeraltı, yeniden doğuş gibi anlatı öğelerine ve arketiplere ayırın.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
