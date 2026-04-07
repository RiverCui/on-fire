import { auth } from '@/auth';
import { fetchCashFlows, fetchCashFlowSummary } from '@/lib/data';
import CashFlowList from '@/components/dashboard/cashflow-list';

type CashflowPageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function CashflowPage({ searchParams }: CashflowPageProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return <div className="text-slate-500">Please log in.</div>;
  }

  const params = await searchParams;
  const now = new Date();
  const currentMonth = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [records, summary] = await Promise.all([
    fetchCashFlows(userId, currentMonth),
    fetchCashFlowSummary(userId, currentMonth),
  ]);

  const serialized = records.map((r) => ({
    id: r.id,
    recordDate: r.recordDate.toISOString(),
    type: r.type,
    amount: r.amount.toString(),
    category: r.category,
    note: r.note,
  }));

  return (
    <CashFlowList
      records={serialized}
      currentMonth={currentMonth}
      summary={summary}
    />
  );
}
