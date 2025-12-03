'use client';

import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';

export default function AnimatedProgress({ targetValue }: { targetValue: number }) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(targetValue);
    }, 100);
    return () => clearTimeout(timer);
  }, [targetValue]);

  return (
    <Progress value={progress} className="h-3 w-full rounded-full bg-white/50" />
  )
}