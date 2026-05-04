import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60 backdrop-blur-md mt-16">
      <div className="max-w-300 mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="font-black text-yellow-500 tracking-tighter text-base italic uppercase">NAKAMAGATE</span>
          <p className="text-slate-500 text-xs">© {currentYear} NakamaGate. All rights reserved.</p>
        </div>

        <div className="flex items-center gap-5 text-xs text-slate-500">
          <Link to="/terms" className="hover:text-yellow-500 transition-colors">
            Terms of Service
          </Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span>
            Created by <span className="text-slate-600 dark:text-slate-400 font-semibold">Yago Puente</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
