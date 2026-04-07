'use client';

import { useActionState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createAssetAccount, updateAssetAccount, type AssetActionState } from '@/actions/asset';
import type { AssetType } from '@/generated/prisma/client';

const ASSET_TYPES: AssetType[] = ['CASH', 'STOCK', 'BOND', 'REAL_ESTATE', 'CRYPTO', 'DEBT', 'OTHER'];

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/30 dark:focus:ring-white/30';

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-white/80';

type AssetAccountFormProps = {
  defaultValues?: {
    id: string;
    name: string;
    type: AssetType;
    currency: string;
    currentBalance: number;
  };
  onSuccess: () => void;
};

export default function AssetAccountForm({ defaultValues, onSuccess }: AssetAccountFormProps) {
  const t = useTranslations('AccountPage');
  const isEdit = !!defaultValues;

  const boundAction = isEdit
    ? updateAssetAccount.bind(null, defaultValues.id)
    : createAssetAccount;

  const [state, formAction, isPending] = useActionState<AssetActionState, FormData>(
    boundAction,
    {},
  );

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  return (
    <div>
      <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">
        {isEdit ? t('form.editTitle') : t('form.createTitle')}
      </h3>

      <form action={formAction} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className={labelClass}>{t('form.name')}</label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={defaultValues?.name}
            placeholder={t('form.namePlaceholder')}
            className={inputClass}
            required
          />
          {state.errors?.name && (
            <p className="mt-1 text-xs text-rose-500">{state.errors.name[0]}</p>
          )}
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className={labelClass}>{t('form.type')}</label>
          <select
            id="type"
            name="type"
            defaultValue={defaultValues?.type ?? ''}
            className={inputClass}
            required
          >
            <option value="" disabled>{t('form.typePlaceholder')}</option>
            {ASSET_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`types.${type}`)}
              </option>
            ))}
          </select>
          {state.errors?.type && (
            <p className="mt-1 text-xs text-rose-500">{state.errors.type[0]}</p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label htmlFor="currency" className={labelClass}>{t('form.currency')}</label>
          <input
            id="currency"
            name="currency"
            type="text"
            defaultValue={defaultValues?.currency ?? 'CNY'}
            className={inputClass}
          />
        </div>

        {/* Balance */}
        <div>
          <label htmlFor="currentBalance" className={labelClass}>{t('form.balance')}</label>
          <input
            id="currentBalance"
            name="currentBalance"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.currentBalance ?? 0}
            placeholder={t('form.balancePlaceholder')}
            className={inputClass}
            required
          />
          {state.errors?.currentBalance && (
            <p className="mt-1 text-xs text-rose-500">{state.errors.currentBalance[0]}</p>
          )}
        </div>

        {/* Error message */}
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
