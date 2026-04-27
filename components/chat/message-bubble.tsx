'use client';

import type { UIMessage } from 'ai';
import { Streamdown } from 'streamdown';
import { cn } from '@/lib/utils';
import { ToolCallDisplay } from './tool-call-display';

export function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
          isUser
            ? 'bg-slate-900 text-white dark:bg-white/90 dark:text-slate-900'
            : 'border border-slate-200/80 bg-white/80 text-slate-900 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-white',
        )}
      >
        {message.parts?.map((part, i) => {
          if (part.type === 'text') {
            return (
              <Streamdown key={i}>
                {(part as { text?: string }).text ?? ''}
              </Streamdown>
            );
          }
          if (part.type.startsWith('tool-')) {
            return <ToolCallDisplay key={i} part={part as Record<string, unknown>} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}
