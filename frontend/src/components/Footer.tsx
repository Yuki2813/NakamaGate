import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-950/60 backdrop-blur-md mt-16">
      <div className="max-w-300 mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="font-black text-yellow-500 tracking-tighter text-base italic uppercase">NAKAMAGATE</span>
          <p className="text-slate-600 text-xs">© {currentYear} NakamaGate. Todos los derechos reservados.</p>
        </div>

        <div className="flex items-center gap-5 text-xs text-slate-500">
          <Link to="/terms" className="hover:text-yellow-500 transition-colors">
            Términos de Servicio
          </Link>
          <span className="text-slate-800">•</span>
          <span>
            Creado por <span className="text-slate-400 font-semibold">Yago Puente</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
