'use client';

import { useState } from 'react';
import { SendHorizontal, Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

type Props = {
  onSend: (text: string) => void;
  onStop: () => void;
  streaming: boolean;
  disabled?: boolean;
};

export function ChatInput({ onSend, onStop, streaming, disabled }: Props) {
  const t = useTranslations('Chat');
  const [value, setValue] = useState('');

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || streaming || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <div className="flex items-end gap-2 border-t border-slate-200/80 bg-white/60 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={t('placeholderInput')}
        rows={2}
        disabled={disabled}
        className="flex-1 resize-none rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none backdrop-blur-xl transition focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-300 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus-visible:border-white/30 dark:focus-visible:ring-white/20"
      />
      {streaming ? (
        <Button
          type="button"
          variant="outline"
          onClick={onStop}
          className="border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
          <Square className="mr-1 h-4 w-4" /> {t('stop')}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={submit}
          disabled={!value.trim() || disabled}
          className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white/90 dark:text-slate-900 dark:hover:bg-white"
        >
          <SendHorizontal className="mr-1 h-4 w-4" /> {t('send')}
        </Button>
      )}
    </div>
  );
}
