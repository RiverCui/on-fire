export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.06),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(250,250,250,0.1),_transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_60%)] dark:bg-[radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.15),_transparent_60%)]" />
      {children}
    </div>
  );
}
