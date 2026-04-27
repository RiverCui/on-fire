'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ToolCallDisplay({ part }: { part: Record<string, unknown> }) {
  const t = useTranslations('Chat');
  const [open, setOpen] = useState(false);

  const type = String(part.type ?? '');
  const toolName = type.replace(/^tool-/, '');
  const input = part.input ?? part.args;
  const output = part.output ?? part.result;

  return (
    <div className="my-1 rounded-md border bg-background px-2 py-1 text-xs">
      <button
        className="flex items-center gap-1 text-muted-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Wrench className="h-3 w-3" />
        <span>{t('toolCallLabel')}:</span>
        <code>{toolName}</code>
      </button>
      {open && (
        <pre className="mt-1 overflow-x-auto rounded bg-muted/50 p-2 text-[11px]">
          {JSON.stringify({ input, output }, null, 2)}
        </pre>
      )}
    </div>
  );
}
