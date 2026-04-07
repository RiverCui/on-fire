import { auth } from '@/auth';
import { fetchAssetAccounts } from '@/lib/data';
import AccountList from '@/components/dashboard/account-list';

export default async function AccountPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return <div className="text-slate-500">Please log in.</div>;
  }

  const accounts = await fetchAssetAccounts(userId);

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.currentBalance),
    0,
  );

  // Serialize for client component
  const serialized = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    currency: a.currency,
    currentBalance: a.currentBalance.toString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return <AccountList accounts={serialized} totalBalance={totalBalance} />;
}
