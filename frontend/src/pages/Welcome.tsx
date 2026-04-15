import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, Users, PenTool } from 'lucide-react';

export default function Welcome() {
  return (
    <div className="min-h-screen bg-[#020617] font-sans antialiased text-slate-100 flex flex-col transition-colors duration-500 overflow-hidden relative">
      
      {/* Fondo de degradado Morado/Azul (Atenuado) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] absolute -top-40 -left-40"></div>
        <div className="w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] absolute -bottom-20 -right-20"></div>
      </div>

      {/* NAVEGACIÓN */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 border-b border-yellow-500/20 bg-slate-900/40 backdrop-blur-xl">
        <header className="text-3xl font-black tracking-tighter text-white">
          <span className="text-yellow-500">Nakama</span>Gate
        </header>
        <div className="flex gap-4">
          <Link to="/login">
            <Button 
              variant="outline" 
              className="border-2 border-yellow-500/40 font-semibold hover:border-yellow-500/60 text-yellow-500 hover:bg-yellow-500/10 transition-all"
            >
              Iniciar Sesión
            </Button>
          </Link>
        </div>
      </nav>

      {/* SECCIÓN PRINCIPAL (HERO) */}
      <main className="relative z-10 flex-grow max-w-6xl mx-auto px-6 py-16 md:py-28 text-center flex flex-col items-center justify-center w-full">
        
        {/* Badge decorativo */}
        <span className="inline-block bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 px-4 py-2 font-bold text-sm uppercase tracking-widest rounded-full mb-8 shadow-lg shadow-yellow-500/20">
          ✨ Para amantes del anime
        </span>
        
        {/* Encabezado principal */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 leading-[1.1] text-white">
          Tu comunidad<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500">
            de anime sin límites
          </span>
        </h1>
        
        {/* Descripción */}
        <p className="text-lg md:text-xl text-slate-300 font-medium max-w-3xl mb-12 leading-relaxed">
          Descubre, comparte y conecta. Explora miles de series, crea tu lista personal, lee reseñas sin censura y construye amistades auténticas con otros nakamas de todo el mundo.
        </p>
        
        {/* Llamadas a acción */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Link to="/register">
            <Button 
              size="lg"
              className="h-14 px-8 text-lg font-bold bg-yellow-500 hover:bg-yellow-400 text-black border-2 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_50px_rgba(234,179,8,0.5)] transition-all hover:scale-105"
            >
              Cruzar la Puerta
            </Button>
          </Link>
          <Link to="/login">
            <Button 
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg font-bold border-2 border-yellow-500/40 hover:border-yellow-500/60 text-yellow-300 hover:bg-yellow-500/10 transition-all"
            >
              Ya tengo cuenta
            </Button>
          </Link>
        </div>

      </main>

      {/* SECCIÓN DE CARACTERÍSTICAS */}
      <section aria-labelledby="features-title" className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        
        <h2 id="features-title" className="sr-only">Características principales</h2>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Característica 1 */}
          <article className="group bg-slate-900/50 backdrop-blur-md p-8 md:p-10 border-2 border-yellow-500/20 rounded-2xl shadow-lg hover:shadow-[0_0_40px_rgba(234,179,8,0.15)] hover:border-yellow-500/40 transition-all duration-300 hover:-translate-y-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-8 h-8 text-yellow-400" aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-black mb-4 text-white">
              Base de Datos Completa
            </h3>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              Acceso a información detallada sobre miles de animes. Descubre estrenos, géneros y organiza tu lista de seguimiento de forma inteligente.
            </p>
          </article>

          {/* Característica 2 */}
          <article className="group bg-slate-900/50 backdrop-blur-md p-8 md:p-10 border-2 border-yellow-500/20 rounded-2xl shadow-lg hover:shadow-[0_0_40px_rgba(234,179,8,0.15)] hover:border-yellow-500/40 transition-all duration-300 hover:-translate-y-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 mb-6 group-hover:scale-110 transition-transform">
              <PenTool className="w-8 h-8 text-yellow-400" aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-black mb-4 text-white">
              Reseñas Auténticas
            </h3>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              Puntúa, critica y desahógate sin filtros. Lee opiniones reales de otros usuarios y construye tu reputación como crítico en la comunidad.
            </p>
          </article>

          {/* Característica 3 */}
          <article className="group bg-slate-900/50 backdrop-blur-md p-8 md:p-10 border-2 border-yellow-500/20 rounded-2xl shadow-lg hover:shadow-[0_0_40px_rgba(234,179,8,0.15)] hover:border-yellow-500/40 transition-all duration-300 hover:-translate-y-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-yellow-400" aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-black mb-4 text-white">
              Red de Nakamas
            </h3>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              Conecta con otros amantes del anime. Añade amigos, mira qué están viendo y crea tu círculo de confianza personalizado.
            </p>
          </article>

        </div>
      </section>

      {/* FOOTER llamada final */}
      <footer className="relative z-10 border-t border-yellow-500/20 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <p className="text-slate-300 font-medium mb-6">
            ¿Listo para vivir el anime de verdad?
          </p>
          <Link to="/register">
            <Button 
              size="lg"
              className="h-12 px-8 font-bold bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_50px_rgba(234,179,8,0.5)] transition-all"
            >
              Únete hoy
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
}