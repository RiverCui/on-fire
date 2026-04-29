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
    <div className="flex h-full flex-col items-center justify-center gap-8 p-10 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-900 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-white">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          {tChat('empty')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-white/60">
          {tChat('placeholderInput')}
        </p>
      </div>
      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {suggestions.map((s) => (
          <button
            key={s.key}
            onClick={() => onPick(s.text)}
            className="rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-4 text-left text-sm text-slate-700 shadow-sm backdrop-blur-xl transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {s.text}
          </button>
        ))}
      </div>
    </div>
  );
}
