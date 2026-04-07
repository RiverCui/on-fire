'use client';

import { useCallback, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Banknote, Bitcoin, Building2, CreditCard, Landmark, Pencil, Plus, Trash2, TrendingDown, Wallet } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import AssetAccountForm from '@/components/dashboard/asset-account-form';
import { deleteAssetAccount } from '@/actions/asset';
import { formatCurrency, formatDateToLocal } from '@/lib/utils';
import type { AssetType } from '@/generated/prisma/client';

type Account = {
  id: string;
  name: string;
  type: AssetType;
  currency: string;
  currentBalance: string | number;
  updatedAt: string;
};

type AccountListProps = {
  accounts: Account[];
  totalBalance: number;
};

const glassCard =
  'rounded-3xl border border-slate-200 bg-white/80 p-6 text-slate-900 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-white';

const ASSET_TYPE_ICON: Record<AssetType, typeof Wallet> = {
  CASH: Wallet,
  STOCK: TrendingDown,
  BOND: Landmark,
  REAL_ESTATE: Building2,
  CRYPTO: Bitcoin,
  DEBT: CreditCard,
  OTHER: Banknote,
};

const ASSET_TYPE_COLOR: Record<AssetType, string> = {
  CASH: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  STOCK: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  BOND: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  REAL_ESTATE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  CRYPTO: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  DEBT: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  OTHER: 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400',
};

export default function AccountList({ accounts, totalBalance }: AccountListProps) {
  const t = useTranslations('AccountPage');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    setEditingAccount(null);
    setDialogOpen(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setDialogOpen(true);
  };

  const handleClose = useCallback(() => {
    setDialogOpen(false);
    setEditingAccount(null);
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteAssetAccount(id);
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('title')}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-white/60">{t('description')}</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 dark:bg-white/90 dark:text-slate-900 dark:hover:bg-white"
        >
          <Plus className="h-4 w-4" />
          {t('addButton')}
        </button>
      </div>

      {/* Summary Card */}
      {accounts.length > 0 && (
        <div className={`${glassCard} flex items-center justify-between`}>
          <div>
            <p className="text-sm text-slate-500 dark:text-white/60">{t('table.balance')}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <p className="text-sm text-slate-500 dark:text-white/60">
            {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
          </p>
        </div>
      )}

      {/* Account List */}
      {accounts.length === 0 ? (
        <div className={`${glassCard} flex flex-col items-center justify-center py-16 text-center`}>
          <Wallet className="h-12 w-12 text-slate-300 dark:text-white/20" />
          <p className="mt-4 text-sm text-slate-500 dark:text-white/60">{t('emptyState')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const Icon = ASSET_TYPE_ICON[account.type];
            const colorClass = ASSET_TYPE_COLOR[account.type];
            const balance = Number(account.currentBalance);

            return (
              <div key={account.id} className={`${glassCard} group flex flex-col gap-4`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{account.name}</p>
                      <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
                        {t(`types.${account.type}`)}
                      </span>
                    </div>
                  </div>
                  {/* Edit / Delete */}
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleEdit(account)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white/80"
                      title={t('editButton')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      disabled={isPending && deletingId === account.id}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50 dark:text-white/40 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
                      title={t('deleteButton')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-auto">
                  <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(balance)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-white/40">
                    {t('table.currency')}: {account.currency} · {t('table.updatedAt')}: {formatDateToLocal(account.updatedAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose}>
        <AssetAccountForm
          key={editingAccount?.id ?? 'create'}
          defaultValues={
            editingAccount
              ? {
                  id: editingAccount.id,
                  name: editingAccount.name,
                  type: editingAccount.type,
                  currency: editingAccount.currency,
                  currentBalance: Number(editingAccount.currentBalance),
                }
              : undefined
          }
          onSuccess={handleClose}
        />
      </Dialog>
    </div>
  );
}
