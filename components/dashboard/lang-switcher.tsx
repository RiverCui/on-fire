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
      <SelectTrigger className="w-[100px] border-white/20 bg-white/10 text-white hover:bg-white/20">
        <SelectValue placeholder={t("language")} />
      </SelectTrigger>
      <SelectContent className="border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
        <SelectItem value="zh" className="hover:bg-white/10 focus:bg-white/10 focus:text-white">中文</SelectItem>
        <SelectItem value="en" className="hover:bg-white/10 focus:bg-white/10 focus:text-white">English</SelectItem>
      </SelectContent>
    </Select>
  )
}