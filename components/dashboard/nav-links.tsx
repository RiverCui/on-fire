"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Settings, Wallet, TrendingUp } from "lucide-react";
import { useTranslations } from 'next-intl';
import { cn } from "@/lib/utils";

export default function NavLinks() {
	const t = useTranslations('Dashboard');
	const pathname = usePathname();
	const links = [
		{
			label: t('overview'),
			icon: BarChart3,
			href: "/dashboard",
		},
		{
			label: t('account'),
			icon: Wallet,
			href: "/dashboard/account",
		},
		{
			label: t('cashflow'),
			icon: TrendingUp,
			href: "/dashboard/cashflow",
		},
		{
			label: t('settings'),
			icon: Settings,
			href: "/dashboard/settings",
		},
	];

	return (
		<nav className="flex flex-col gap-1">
			{links.map((link) => {
				const LinkIcon = link.icon;
				const isActive = pathname === link.href ||
					(link.href !== "/dashboard" && pathname.startsWith(link.href));

				return (
					<Link
						key={link.label}
						href={link.href}
						className={cn(
							"flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-accent",
							isActive
								? "bg-accent text-accent-foreground font-medium"
								: "text-muted-foreground hover:text-accent-foreground"
						)}
					>
						<LinkIcon className="h-5 w-5" />
						<span className="text-sm">{link.label}</span>
					</Link>
				);
			})}
		</nav>
	);
}
