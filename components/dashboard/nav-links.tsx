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
      label: "资产账户",
      icon: Wallet,
      href: "/dashboard/accounts",
    },
    {
      label: "现金流",
      icon: TrendingUp,
      href: "/dashboard/cashflow",
    },
    {
      label: "设置",
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
