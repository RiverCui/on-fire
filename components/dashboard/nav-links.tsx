"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Settings, Wallet, TrendingUp } from "lucide-react";
import { useTranslations } from 'next-intl';

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
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link key={link.label} href={link.href}>
            <LinkIcon className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">{link.label}</p>
            </div>
          </Link>
        );
      })}
    </>
  );
}
