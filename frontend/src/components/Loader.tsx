export default function Loader({ text = "Cargando NakamaGate..." }: { text?: string }) {
  return (
    <main aria-busy="true" className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020617] relative overflow-hidden">

      <div className="absolute w-100 h-100 bg-yellow-500/10 rounded-full blur-[80px] pointer-events-none" aria-hidden="true"></div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="w-14 h-14 border-4 border-slate-300 dark:border-slate-800 border-t-yellow-500 rounded-full animate-spin shadow-[0_0_15px_rgba(234,179,8,0.4)]" role="status">
          <span className="sr-only">{text}</span>
        </div>

        <p className="text-yellow-600 dark:text-yellow-500/80 font-bold tracking-widest uppercase text-sm animate-pulse">
          {text}
        </p>
      </div>
    </main>
  );
}
