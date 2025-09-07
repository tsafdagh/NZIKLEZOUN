import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
  text?: string;
}

export function Loader({ className, text }: LoaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-20 text-center',
        className
      )}
    >
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      {text && <p className="text-lg text-muted-foreground max-w-xs">{text}</p>}
    </div>
  );
}
