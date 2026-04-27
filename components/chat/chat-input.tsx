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
    <div className="flex items-end gap-2 border-t p-3">
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
        className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {streaming ? (
        <Button type="button" variant="outline" onClick={onStop}>
          <Square className="mr-1 h-4 w-4" /> {t('stop')}
        </Button>
      ) : (
        <Button type="button" onClick={submit} disabled={!value.trim() || disabled}>
          <SendHorizontal className="mr-1 h-4 w-4" /> {t('send')}
        </Button>
      )}
    </div>
  );
}
