import NavLinks from "./nav-links";
import { Button } from '@/components/ui/button';
import { signOut } from '@/auth';
import { LogOut } from 'lucide-react';
import { getTranslations } from 'next-intl/server';


export default async function SideNav() {
	const t = await getTranslations('DashboardLayout');
	return (
		<div className="flex h-full flex-col px-3 py-4 md:px-4">
			<div className="flex grow flex-col justify-between space-y-2">
				<NavLinks />
				<div className="m-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur">
          <p className="text-sm font-semibold text-white">{t('dailyMetricsTitle')}</p>
          <p className="mt-1 text-xs text-white/70">{t('dailyMetricsSubtitle')}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4 w-full bg-white/90 text-slate-900 hover:bg-white"
          >
            {t('dailyMetricsButton')}
          </Button>
        </div>
			</div>
			<div className="mt-auto pt-4">
				<form
					action={async () => {
						'use server';
						await signOut({ redirectTo: '/login' });
					}}
				>
					<Button
						variant="ghost"
						className="w-full justify-start gap-2 text-white/60 hover:bg-white/10 hover:text-white"
					>
						<LogOut className="h-5 w-5" />
						<span className="font-inter text-sm font-medium">Sign Out</span>
					</Button>
				</form>
			</div>
		</div>
	);
}
