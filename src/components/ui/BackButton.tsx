'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface BackButtonProps {
  label?: string;
  className?: string;
}

export default function BackButton({ label = 'Geri dön', className }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      className={className}
      onClick={() => {
        router.back();
      }}
    >
      ← {label}
    </Button>
  );
}
