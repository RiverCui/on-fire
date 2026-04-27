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
          'max-w-[80%] rounded-lg px-4 py-2 text-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
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
