'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'i18n/navigation';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export default function LongSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (value: string) => {
    router.replace(pathname, { locale: value });  
  }

  const t = useTranslations('DashboardLayout');

  return (
    <Select defaultValue={locale} onValueChange={handleChange}>
      <SelectTrigger className="w-[100px] border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
        <SelectValue placeholder={t("language")} />
      </SelectTrigger>
      <SelectContent className="border-slate-200 bg-white text-slate-900 backdrop-blur-xl dark:border-white/20 dark:bg-slate-900/95 dark:text-white">
        <SelectItem value="zh" className="hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 dark:hover:bg-white/10 dark:focus:bg-white/10 dark:focus:text-white">中文</SelectItem>
        <SelectItem value="en" className="hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 dark:hover:bg-white/10 dark:focus:bg-white/10 dark:focus:text-white">English</SelectItem>
      </SelectContent>
    </Select>
  )
}
