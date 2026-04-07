'use client';

import { useEffect } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTranslations } from 'next-intl';

type FirePlanTourProps = {
  show: boolean;
};

export default function FirePlanTour({ show }: FirePlanTourProps) {
  const t = useTranslations('DashboardPage');

  useEffect(() => {
    if (!show) return;

    const steps: DriveStep[] = [
      {
        element: '[data-tour="progress-card"]',
        popover: {
          title: t('tour.progress.title'),
          description: t('tour.progress.desc'),
          side: 'bottom' as const,
          align: 'start' as const,
        },
      },
      {
        element: '[data-tour="new-plan-button"]',
        popover: {
          title: t('tour.planButton.title'),
          description: t('tour.planButton.desc'),
          side: 'bottom' as const,
          align: 'start' as const,
        },
      },
    ].filter((step) => document.querySelector(step.element as string));

    if (!steps.length) return;

    const driverObj = driver({
      showProgress: false,
      allowClose: true,
      allowKeyboardControl: true,
      overlayOpacity: 0.6,
      steps,
    });

    driverObj.drive();
    return () => driverObj.destroy();
  }, [show, t]);

  return null;
}
