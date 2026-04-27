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
    <div className="my-2 rounded-xl border border-slate-200/60 bg-slate-100/60 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5">
      <button
        className="flex items-center gap-1.5 text-slate-600 transition-colors hover:text-slate-900 dark:text-white/60 dark:hover:text-white"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Wrench className="h-3 w-3" />
        <span>{t('toolCallLabel')}:</span>
        <code className="font-mono text-slate-700 dark:text-white/80">{toolName}</code>
      </button>
      {open && (
        <pre className="mt-2 overflow-x-auto rounded-lg border border-slate-200/60 bg-slate-50/80 p-3 text-[11px] text-slate-700 dark:border-white/10 dark:bg-slate-900/40 dark:text-white/80">
          {JSON.stringify({ input, output }, null, 2)}
        </pre>
      )}
    </div>
  );
}
