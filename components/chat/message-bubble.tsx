'use client';

import { useContext } from 'react';
import type { UIMessage } from 'ai';
import { Streamdown } from 'streamdown';
import { cn } from '@/lib/utils';
import { ToolCallDisplay } from './tool-call-display';
import { ChatThemeContext } from './chat-theme-context';

export function MessageBubble({ message }: { message: UIMessage }) {
  const theme = useContext(ChatThemeContext);
  const isUser = message.role === 'user';
  const isCompact = theme === 'compact';

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'shadow-sm',
          isCompact
            ? 'max-w-[85%] rounded-xl px-3 py-1.5 text-xs leading-snug'
            : 'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
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
