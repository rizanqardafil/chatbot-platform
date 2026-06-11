import { cn } from '@/lib/utils';
import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-retro-muted uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          'block w-full rounded-xl border px-4 py-2.5 text-sm transition-colors resize-y bg-retro-surface text-retro-text',
          'focus:outline-none focus:ring-2 focus:ring-retro-purple focus:border-transparent',
          'placeholder:text-retro-dim',
          error ? 'border-retro-danger' : 'border-retro-border',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-retro-danger">{error}</p>}
    </div>
  )
);

Textarea.displayName = 'Textarea';
