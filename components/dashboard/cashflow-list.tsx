'use client';

import { useCallback, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import CashFlowForm from '@/components/dashboard/cashflow-form';
import { deleteCashFlowRecord } from '@/actions/cashflow';
import { formatCurrency, formatDateToLocal } from '@/lib/utils';
import type { FlowType } from '@/generated/prisma/client';

type CashFlow = {
  id: string;
  recordDate: string;
  type: FlowType;
  amount: string | number;
  category: string | null;
  note: string | null;
};

type CashFlowListProps = {
  records: CashFlow[];
  currentMonth: string; // "2026-04"
  summary: { income: number; expense: number; net: number };
};

const glassCard =
  'rounded-3xl border border-slate-200 bg-white/80 p-6 text-slate-900 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-white';

export default function CashFlowList({ records, currentMonth, summary }: CashFlowListProps) {
  const t = useTranslations('CashflowPage');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CashFlow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Month navigation
  const navigateMonth = (delta: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', newMonth);
    router.push(`?${params.toString()}`);
  };

  const displayMonth = (() => {
    const [year, month] = currentMonth.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('default', { year: 'numeric', month: 'long' });
  })();

  const handleCreate = () => {
    setEditingRecord(null);
    setDialogOpen(true);
  };

  const handleEdit = (record: CashFlow) => {
    setEditingRecord(record);
    setDialogOpen(true);
  };

  const handleClose = useCallback(() => {
    setDialogOpen(false);
    setEditingRecord(null);
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteCashFlowRecord(id);
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

      {/* Month Selector + Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        {/* Month Nav */}
        <div className={`${glassCard} flex items-center justify-between sm:col-span-1`}>
          <button onClick={() => navigateMonth(-1)} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-white/10">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">{displayMonth}</span>
          <button onClick={() => navigateMonth(1)} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-white/10">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className={glassCard}>
          <p className="text-xs text-slate-500 dark:text-white/60">{t('summary.totalIncome')}</p>
          <p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(summary.income)}
          </p>
        </div>
        <div className={glassCard}>
          <p className="text-xs text-slate-500 dark:text-white/60">{t('summary.totalExpense')}</p>
          <p className="mt-1 text-xl font-semibold text-rose-600 dark:text-rose-400">
            -{formatCurrency(summary.expense)}
          </p>
        </div>
        <div className={glassCard}>
          <p className="text-xs text-slate-500 dark:text-white/60">{t('summary.netFlow')}</p>
          <p className={`mt-1 text-xl font-semibold ${summary.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(summary.net)}
          </p>
        </div>
      </div>

      {/* Records */}
      {records.length === 0 ? (
        <div className={`${glassCard} flex flex-col items-center justify-center py-16 text-center`}>
          <ArrowDownLeft className="h-12 w-12 text-slate-300 dark:text-white/20" />
          <p className="mt-4 text-sm text-slate-500 dark:text-white/60">{t('emptyState')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const isIncome = record.type === 'INCOME';
            const amount = Number(record.amount);

            return (
              <div
                key={record.id}
                className={`${glassCard} group flex items-center gap-4 !p-4`}
              >
                {/* Icon */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isIncome
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                }`}>
                  {isIncome ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {record.category || t('table.category')}
                  </p>
                  <p className="truncate text-xs text-slate-400 dark:text-white/40">
                    {formatDateToLocal(record.recordDate)}
                    {record.note && ` · ${record.note}`}
                  </p>
                </div>

                {/* Amount */}
                <p className={`text-lg font-semibold ${
                  isIncome
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {isIncome ? '+' : '-'}{formatCurrency(amount)}
                </p>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleEdit(record)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white/80"
                    title={t('editButton')}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    disabled={isPending && deletingId === record.id}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50 dark:text-white/40 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
                    title={t('deleteButton')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose}>
        <CashFlowForm
          key={editingRecord?.id ?? 'create'}
          defaultValues={
            editingRecord
              ? {
                  id: editingRecord.id,
                  recordDate: editingRecord.recordDate,
                  type: editingRecord.type,
                  amount: Number(editingRecord.amount),
                  category: editingRecord.category,
                  note: editingRecord.note,
                }
              : undefined
          }
          onSuccess={handleClose}
        />
      </Dialog>
    </div>
  );
}
