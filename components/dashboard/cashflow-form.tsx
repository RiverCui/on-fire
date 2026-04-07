'use client';

import { useActionState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createCashFlowRecord, updateCashFlowRecord, type CashFlowActionState } from '@/actions/cashflow';
import type { FlowType } from '@/generated/prisma/client';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/30 dark:focus:ring-white/30';

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-white/80';

type CashFlowFormProps = {
  defaultValues?: {
    id: string;
    recordDate: string; // ISO string
    type: FlowType;
    amount: number;
    category: string | null;
    note: string | null;
  };
  onSuccess: () => void;
};

export default function CashFlowForm({ defaultValues, onSuccess }: CashFlowFormProps) {
  const t = useTranslations('CashflowPage');
  const isEdit = !!defaultValues;

  const boundAction = isEdit
    ? updateCashFlowRecord.bind(null, defaultValues.id)
    : createCashFlowRecord;

  const [state, formAction, isPending] = useActionState<CashFlowActionState, FormData>(
    boundAction,
    {},
  );

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  // Default date: today in YYYY-MM-DD format
  const defaultDate = defaultValues
    ? defaultValues.recordDate.slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">
        {isEdit ? t('form.editTitle') : t('form.createTitle')}
      </h3>

      <form action={formAction} className="space-y-4">
        {/* Date */}
        <div>
          <label htmlFor="recordDate" className={labelClass}>{t('form.date')}</label>
          <input
            id="recordDate"
            name="recordDate"
            type="date"
            defaultValue={defaultDate}
            className={inputClass}
            required
          />
          {state.errors?.recordDate && (
            <p className="mt-1 text-xs text-rose-500">{state.errors.recordDate[0]}</p>
          )}
        </div>

        {/* Type */}
        <div>
          <label className={labelClass}>{t('form.type')}</label>
          <div className="mt-1 flex gap-3">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-700 dark:border-white/10 dark:has-[:checked]:border-emerald-500/50 dark:has-[:checked]:bg-emerald-900/20 dark:has-[:checked]:text-emerald-400">
              <input
                type="radio"
                name="type"
                value="INCOME"
                defaultChecked={defaultValues?.type === 'INCOME' || !defaultValues}
                className="sr-only"
              />
              {t('form.typeIncome')}
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50 has-[:checked]:text-rose-700 dark:border-white/10 dark:has-[:checked]:border-rose-500/50 dark:has-[:checked]:bg-rose-900/20 dark:has-[:checked]:text-rose-400">
              <input
                type="radio"
                name="type"
                value="EXPENSE"
                defaultChecked={defaultValues?.type === 'EXPENSE'}
                className="sr-only"
              />
              {t('form.typeExpense')}
            </label>
          </div>
          {state.errors?.type && (
            <p className="mt-1 text-xs text-rose-500">{state.errors.type[0]}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className={labelClass}>{t('form.amount')}</label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={defaultValues?.amount}
            placeholder={t('form.amountPlaceholder')}
            className={inputClass}
            required
          />
          {state.errors?.amount && (
            <p className="mt-1 text-xs text-rose-500">{state.errors.amount[0]}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className={labelClass}>{t('form.category')}</label>
          <input
            id="category"
            name="category"
            type="text"
            defaultValue={defaultValues?.category ?? ''}
            placeholder={t('form.categoryPlaceholder')}
            className={inputClass}
          />
        </div>

        {/* Note */}
        <div>
          <label htmlFor="note" className={labelClass}>{t('form.note')}</label>
          <input
            id="note"
            name="note"
            type="text"
            defaultValue={defaultValues?.note ?? ''}
            placeholder={t('form.notePlaceholder')}
            className={inputClass}
          />
        </div>

        {/* Error */}
        {state.message && !state.success && (
          <p className="text-sm text-rose-500">{state.message}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onSuccess}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-white/60 dark:hover:bg-white/10"
          >
            {t('form.cancel')}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 dark:bg-white/90 dark:text-slate-900 dark:hover:bg-white"
          >
            {isPending ? t('form.submitting') : isEdit ? t('form.submitEdit') : t('form.submitCreate')}
          </button>
        </div>
      </form>
    </div>
  );
}
