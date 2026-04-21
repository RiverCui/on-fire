const glassCard =
  'rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/5';

const shimmer = 'animate-pulse rounded-lg bg-slate-200/70 dark:bg-white/10';

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* FIRE simulator skeleton */}
      <section className={glassCard}>
        <div className="mb-6 space-y-2">
          <div className={`${shimmer} h-3 w-24`} />
          <div className={`${shimmer} h-4 w-40`} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className={`${shimmer} h-10 w-full`} />
          <div className={`${shimmer} h-10 w-full`} />
          <div className={`${shimmer} h-10 w-full`} />
          <div className={`${shimmer} h-10 w-full`} />
        </div>
        <div className={`${shimmer} mt-6 h-24 w-full`} />
      </section>

      {/* Metrics cards */}
      <section className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`${glassCard} flex flex-col gap-4`}>
            <div className="flex items-center justify-between">
              <div className={`${shimmer} h-3 w-20`} />
              <div className={`${shimmer} h-5 w-5 rounded-full`} />
            </div>
            <div className={`${shimmer} h-8 w-32`} />
            <div className={`${shimmer} h-3 w-24`} />
          </div>
        ))}
      </section>

      {/* Progress + cash flow */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className={`${glassCard} space-y-6`}>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className={`${shimmer} h-3 w-24`} />
              <div className={`${shimmer} h-6 w-40`} />
            </div>
            <div className={`${shimmer} h-6 w-16 rounded-full`} />
          </div>
          <div className={`${shimmer} h-3 w-full`} />
          <div className="flex flex-wrap gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className={`${shimmer} h-3 w-20`} />
                <div className={`${shimmer} h-5 w-24`} />
              </div>
            ))}
          </div>
        </div>
        <div className={`${glassCard} space-y-6`}>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className={`${shimmer} h-3 w-20`} />
              <div className={`${shimmer} h-5 w-32`} />
            </div>
            <div className={`${shimmer} h-4 w-16`} />
          </div>
          <ul className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5"
              >
                <div className="space-y-2">
                  <div className={`${shimmer} h-4 w-28`} />
                  <div className={`${shimmer} h-3 w-20`} />
                </div>
                <div className={`${shimmer} h-4 w-16`} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
