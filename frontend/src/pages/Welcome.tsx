import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans antialiased text-black flex flex-col">
      
      {/* NAVEGACIÓN */}
      <nav className="flex items-center justify-between p-6 border-b-4 border-black bg-white">
        <div className="text-2xl font-black tracking-tighter">
          NakamaGate
        </div>
        <div>
          <Link to="/login">
            <Button variant="outline" className="border-2 border-black font-bold hover:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Entrar
            </Button>
          </Link>
        </div>
      </nav>

      {/* SECCIÓN PRINCIPAL (HERO) */}
      <main className="flex-grow max-w-5xl mx-auto px-6 py-20 text-center flex flex-col items-center justify-center">
        {/* Etiqueta +18 que querías mantener */}
        <span className="bg-black text-white px-4 py-1 font-bold text-sm uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] mb-6 transform -rotate-2">
          Comunidad para todas las edades
        </span>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-tight">
          Tu rincón para <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500">
            vivir el Anime.
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-700 font-medium max-w-2xl mb-10">
          Explora cientos de series, gestiona tu lista de nakamas y comparte tus reseñas sin filtros en una comunidad madura.
        </p>
        
        <div className="flex gap-4">
          <Link to="/register">
            <Button className="h-14 px-8 text-lg font-bold bg-black text-white border-4 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px]">
              ¡Cruzar la Puerta!
            </Button>
          </Link>
        </div>
      </main>

      {/* SECCIÓN DE CARACTERÍSTICAS (Las 3 funciones reales de tu app) */}
      <section className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-3 gap-8">
        
        <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <h3 className="text-2xl font-black mb-3">📺 Base de Datos</h3>
          <p className="text-slate-600 font-medium text-lg">Busca información detallada sobre tus animes favoritos, descubre estrenos y organiza lo que estás viendo.</p>
        </div>

        <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl bg-[#f3e8ff]">
          <h3 className="text-2xl font-black mb-3">✍️ Reseñas Reales</h3>
          <p className="text-slate-600 font-medium text-lg">Puntúa, critica y lee las opiniones de otros usuarios. Construye tu reputación como crítico de anime.</p>
        </div>

        <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <h3 className="text-2xl font-black mb-3">🤝 Red de Nakamas</h3>
          <p className="text-slate-600 font-medium text-lg">Añade amigos, mira qué están viendo y crea tu propio círculo de confianza dentro de la plataforma.</p>
        </div>

      </section>
    </div>
  );
}