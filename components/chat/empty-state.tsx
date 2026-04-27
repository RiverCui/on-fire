'use client';

import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';

export function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  const t = useTranslations('Chat.promptSuggestions');
  const tChat = useTranslations('Chat');
  const suggestions: { key: string; text: string }[] = [
    { key: 'thisMonthExpense', text: t('thisMonthExpense') },
    { key: 'netWorth', text: t('netWorth') },
    { key: 'fireProgress', text: t('fireProgress') },
    { key: 'topCategories', text: t('topCategories') },
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex items-center gap-2 text-xl font-semibold">
        <Sparkles className="h-5 w-5" />
        {tChat('empty')}
      </div>
      <div className="grid max-w-xl gap-2 sm:grid-cols-2">
        {suggestions.map((s) => (
          <button
            key={s.key}
            onClick={() => onPick(s.text)}
            className="rounded-md border bg-background px-3 py-2 text-left text-sm hover:bg-accent"
          >
            {s.text}
          </button>
        ))}
      </div>
    </div>
  );
}
