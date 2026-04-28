import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { 
  Heart, CheckCircle2, AlertCircle, X, Star, BookOpen, Tv, 
  Play, RefreshCw, Flame, Sparkles, Trophy, PlayCircle, Calendar, Compass 
} from 'lucide-react';
import Loader from '../components/Loader';

interface MediaItem {
  id: number;
  type: string;
  title: string;
  image: string;
  score: number;
}

interface HomeSection {
  section_title: string;
  items: MediaItem[];
}

interface FetchState {
  loading: boolean;
  error: string | null;
}

export default function Home() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [fetchState, setFetchState] = useState<FetchState>({ loading: true, error: null });

  const [heroBanner, setHeroBanner] = useState<MediaItem | null>(null);
  const [animeDelDia, setAnimeDelDia] = useState<MediaItem | null>(null);
  const [mangaDelDia, setMangaDelDia] = useState<MediaItem | null>(null);

  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  const fetchData = async () => {
    setFetchState({ loading: true, error: null });
    try {
      const [homeRes, favsRes] = await Promise.all([
        apiClient.get('content/home'),
        apiClient.get('/favorites/')
      ]);

      const data = homeRes.data;
      const userFavorites = favsRes.data;

      if (data.anime_del_dia) setAnimeDelDia(data.anime_del_dia);
      if (data.manga_del_dia) setMangaDelDia(data.manga_del_dia);

      const formattedSections: HomeSection[] = [];

      // Nombres de sección limpios, sin emoticonos
      if (data.trending_anime && data.trending_anime.length > 0) {
        setHeroBanner(data.trending_anime[0]);
        formattedSections.push({ 
          section_title: "Top 10 Animes del Día", 
          items: data.trending_anime.slice(1, 10) 
        });
      }

      const watchingFavorites = userFavorites.filter((fav: any) => fav.status === 'watching');
      const watchingMedia = watchingFavorites.map((fav: any) => fav.media);

      if (watchingMedia.length > 0) {
        formattedSections.push({ section_title: "Continuar Viendo", items: watchingMedia });
      }

      if (data.trending_manga && data.trending_manga.length > 0) {
        formattedSections.push({ 
          section_title: "Top 10 Mangas del Día", 
          items: data.trending_manga.slice(0, 10) 
        });
      }

      if (data.upcoming && data.upcoming.length > 0) {
        formattedSections.push({ section_title: "Próximos Estrenos", items: data.upcoming });
      }

      if (data.genre1) formattedSections.push({ section_title: `Explora: ${data.genre1.name}`, items: data.genre1.items });
      if (data.genre2) formattedSections.push({ section_title: `Descubre: ${data.genre2.name}`, items: data.genre2.items });
      if (data.genre3) formattedSections.push({ section_title: `Joyas de ${data.genre3.name}`, items: data.genre3.items });
      if (data.genre4) formattedSections.push({ section_title: `Sumérgete en ${data.genre4.name}`, items: data.genre4.items });

      setSections(formattedSections);

      const ids = new Set<number>(userFavorites.map((f: any) => f.media.id));
      setFavoriteIds(ids);
      setFetchState({ loading: false, error: null });

    } catch (err) {
      console.error("Error cargando datos:", err);
      setFetchState({ loading: false, error: "No se pudieron cargar los contenidos. Intenta de nuevo." });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showStatus = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  const toggleFavorite = async (e: React.MouseEvent, item: MediaItem) => {
    e.preventDefault();
    e.stopPropagation();
    const isFav = favoriteIds.has(item.id);
    const safeType = (item.type || 'anime').toLowerCase();

    try {
      if (isFav) {
        await apiClient.delete(`/favorites/${item.id}?media_type=${safeType}`);
        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        showStatus('success', `Eliminado de favoritos.`);
      } else {
        await apiClient.post('/favorites/', { media_id: item.id, media_type: safeType });
        setFavoriteIds(prev => new Set(prev).add(item.id));
        showStatus('success', `¡Añadido a favoritos!`);
      }
    } catch (error) {
      showStatus('error', "No se pudo actualizar favoritos.");
    }
  };

  // Asignador de iconos dinámico según el título de la sección
  const getSectionIcon = (title: string) => {
    if (title.includes("Top 10")) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (title.includes("Continuar")) return <PlayCircle className="w-6 h-6 text-yellow-500" />;
    if (title.includes("Próximos")) return <Calendar className="w-6 h-6 text-yellow-500" />;
    return <Compass className="w-6 h-6 text-yellow-500" />;
  };

  if (fetchState.error) return (
    /* Limpiado el bg para que coja el del body */
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 text-slate-700 dark:text-slate-200">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{fetchState.error}</p>
      <button 
        onClick={fetchData}
        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 px-8 rounded-xl transition-all"
      >
        <RefreshCw className="w-4 h-4" />
        Reintentar
      </button>
    </main>
  );

  if (fetchState.loading) return <Loader text="Sincronizando Nakamagate..." />;

  const continuarViendoSection = sections.find(s => s.section_title.includes("Continuar"));
  const remainingSections = sections.filter(s => !s.section_title.includes("Continuar"));

  return (
    /* Limpiado el bg para que coja el del body */
    <main className="min-h-screen text-slate-800 dark:text-slate-200 pb-20 relative overflow-hidden">
      
      {/* NOTIFICACIONES */}
      {notification.show && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center p-4 pointer-events-none">
          <div className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300 ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="font-bold text-sm">{notification.message}</p>
            <X className="w-4 h-4 cursor-pointer opacity-50" onClick={() => setNotification(prev => ({...prev, show: false}))} />
          </div>
        </div>
      )}

      {/* HERO BANNER */}
      {heroBanner && (
        <section className="relative w-full h-[65vh] min-h-[550px] mb-12 overflow-hidden shadow-2xl flex items-center">
          <img 
            src={heroBanner.image} 
            className="absolute inset-0 w-full h-full object-cover opacity-30 blur-xl scale-110"
            alt="blur background"
          />
          {/* AHORA LOS GRADIENTES ADMITEN MODO CLARO Y OSCURO */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#020617] via-slate-50/80 dark:via-[#020617]/70 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/80 dark:from-[#020617]/60 via-transparent to-transparent"></div>

          <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-16 flex flex-col md:flex-row items-center gap-10">
            <div className="hidden md:block w-56 lg:w-72 shrink-0 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-300 dark:border-white/10">
               <img src={heroBanner.image} alt={heroBanner.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start text-yellow-500 font-black tracking-widest text-xs uppercase mb-4">
                <Flame className="w-4 h-4" />
                <span>TENDENCIA MÁXIMA HOY</span>
              </div>
              {/* Título adaptable */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white leading-tight mb-4 drop-shadow-2xl italic">{heroBanner.title}</h1>
              
              {heroBanner.score > 0 && (
                <div className="flex items-center gap-2 justify-center md:justify-start mb-8">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-yellow-500 font-black text-xl">{heroBanner.score}</span>
                  {/* Texto adaptable */}
                  <span className="text-slate-600 dark:text-slate-400 text-sm">/ 100</span>
                </div>
              )}

              <div className="flex gap-4 justify-center md:justify-start">
                <Link to={`/media/${heroBanner.id}`}>
                  <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg py-4 px-10 rounded-2xl transition-all hover:scale-105 shadow-xl shadow-yellow-500/20">Ver ahora</button>
                </Link>
                {/* Botón de favoritos adaptable */}
                <button onClick={(e) => toggleFavorite(e, heroBanner)} className={`p-4 rounded-2xl backdrop-blur-md border transition-all ${favoriteIds.has(heroBanner.id) ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-white/50 dark:bg-white/5 text-slate-900 dark:text-white border-slate-300 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10'}`}>
                  <Heart className={`w-6 h-6 ${favoriteIds.has(heroBanner.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="relative z-10 space-y-20">

        {/* GEMAS DEL DÍA */}
        {(animeDelDia || mangaDelDia) && (
          <section className="max-w-[1400px] mx-auto px-6 md:px-16">
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Gemas del Día</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* ANIME DEL DÍA */}
              {animeDelDia && (
                <div className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600/20 to-slate-200 dark:to-slate-900 border border-indigo-500/20 p-8 flex gap-6 items-center shadow-2xl">
                  <div className="w-32 md:w-40 shrink-0 rounded-2xl overflow-hidden shadow-2xl transition-transform group-hover:scale-105">
                    <img src={animeDelDia.image} className="w-full h-full object-cover aspect-[2/3]" alt="anime day" />
                  </div>
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <Tv className="w-3 h-3 text-indigo-400" />
                      <span className="text-indigo-400 text-xs font-bold uppercase">Anime del Día</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white italic line-clamp-2">{animeDelDia.title}</h2>
                    {animeDelDia.score > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-yellow-500 font-bold text-sm">{animeDelDia.score}</span>
                      </div>
                    )}
                    <Link to={`/media/${animeDelDia.id}`}>
                      <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-2 px-6 rounded-xl transition-all text-sm mt-2">Explorar</button>
                    </Link>
                  </div>
                </div>
              )}

              {/* MANGA DEL DÍA */}
              {mangaDelDia && (
                <div className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-600/10 to-slate-200 dark:to-slate-900 border border-amber-500/20 p-8 flex gap-6 items-center shadow-2xl">
                  <div className="w-32 md:w-40 shrink-0 rounded-2xl overflow-hidden shadow-2xl transition-transform group-hover:scale-105">
                    <img src={mangaDelDia.image} className="w-full h-full object-cover aspect-[2/3]" alt="manga day" />
                  </div>
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-400 text-xs font-bold uppercase">Manga del Día</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white italic line-clamp-2">{mangaDelDia.title}</h2>
                    {mangaDelDia.score > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-yellow-500 font-bold text-sm">{mangaDelDia.score}</span>
                      </div>
                    )}
                    <Link to={`/media/${mangaDelDia.id}`}>
                      <button className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold py-2 px-6 rounded-xl transition-all text-sm mt-2">Leer Detalles</button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* CONTINUAR VIENDO */}
        <section className="max-w-[1400px] mx-auto px-6 md:px-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <PlayCircle className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Continuar Viendo</h2>
            </div>
            <Link to="/directory" className="text-xs font-bold text-yellow-500 uppercase tracking-widest hover:underline">Ver todo</Link>
          </div>

          {continuarViendoSection && continuarViendoSection.items.length > 0 ? (
            <div className="px-4 md:px-8">
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent className="-ml-4">
                {continuarViendoSection.items.map((item) => (
                  <CarouselItem key={item.id} className="pl-4 basis-[45%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                    <MediaCard item={item} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-10 bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:bg-yellow-500 hover:text-black hover:border-yellow-500" />
              <CarouselNext className="hidden md:flex -right-10 bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:bg-yellow-500 hover:text-black hover:border-yellow-500" />
            </Carousel>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 gap-4">
              <Play className="w-10 h-10 text-slate-400 dark:text-slate-600" />
              <p className="text-slate-500 font-bold">No estás viendo nada todavía</p>
              <Link to="/directory">
                <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-2 px-6 rounded-xl transition-all text-sm">
                  Explorar el directorio
                </button>
              </Link>
            </div>
          )}
        </section>

        {/* CARRUSELES DINÁMICOS (Top 10s y géneros) */}
        {remainingSections.map((section, idx) => {
          const isTop10 = section.section_title.includes("Top 10");

          return (
            <section key={idx} className="max-w-[1400px] mx-auto group/section">
              <div className="flex items-center justify-between px-6 md:px-16 mb-8">
                <div className="flex items-center gap-3">
                  {getSectionIcon(section.section_title)}
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">{section.section_title}</h2>
                </div>
                <Link to="/directory" className="text-xs font-bold text-yellow-500 uppercase tracking-widest hover:underline">Ver todo</Link>
              </div>

              <div className="px-10 md:px-24">
                <Carousel opts={{ align: "start", loop: true }} className="w-full">
                  <CarouselContent className="-ml-4">
                    {section.items.map((item, itemIdx) => (
                      <CarouselItem key={item.id} className={`pl-4 ${isTop10 ? 'basis-[55%] sm:basis-[40%] md:basis-[30%] lg:basis-[25%] xl:basis-[20%] overflow-visible' : 'basis-[45%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6'}`}>
                        {isTop10 ? (
                          <div className="relative h-full py-4 flex items-end justify-end">
                            
                            {/* NÚMERO GIGANTE ESTILO NETFLIX ADAPTATIVO */}
                            <span
                              className="absolute left-[-15px] sm:left-[-10px] bottom-1 font-black leading-none select-none pointer-events-none drop-shadow-xl"
                              style={{
                                fontSize: 'clamp(110px, 14vw, 160px)',
                                color: 'transparent', 
                                zIndex: 1, 
                                letterSpacing: '-0.08em',
                              }}
                            >
                              <span className="webkit-text-stroke-light dark:webkit-text-stroke-dark">
                                {itemIdx + (section.section_title.includes("Anime") ? 2 : 1)}
                              </span>
                            </span>
                            {/* Truco para el borde del texto adaptable */}
                            <style>{`
                              .webkit-text-stroke-light { -webkit-text-stroke: 3px rgba(0,0,0,0.1); }
                              .dark .webkit-text-stroke-dark { -webkit-text-stroke: 3px rgba(255,255,255,0.8); }
                            `}</style>
                            
                            <div className="relative w-[70%] sm:w-[75%]" style={{ zIndex: 2 }}>
                              <MediaCard item={item} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite} />
                            </div>
                          </div>
                        ) : (
                          <MediaCard item={item} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite} />
                        )}
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden md:flex -left-10 bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:bg-yellow-500 hover:text-black hover:border-yellow-500" />
                  <CarouselNext className="hidden md:flex -right-10 bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:bg-yellow-500 hover:text-black hover:border-yellow-500" />
                </Carousel>
              </div>
            </section>
          );
        })}

      </div>
    </main>
  );
}

// Componente MediaCard unificado
function MediaCard({ 
  item, 
  favoriteIds, 
  toggleFavorite 
}: { 
  item: MediaItem; 
  favoriteIds: Set<number>; 
  toggleFavorite: (e: React.MouseEvent, item: MediaItem) => void;
}) {
  return (
    <Card className="bg-transparent border-none group/card h-full">
      <Link to={`/media/${item.id}`} className="block h-full">
        <figure className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-900 transition-all duration-300 group-hover/card:border-yellow-500/50 group-hover/card:-translate-y-2 shadow-xl">
          <button 
            onClick={(e) => toggleFavorite(e, item)} 
            className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md z-20 border transition-all ${favoriteIds.has(item.id) ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-black/50 text-white border-transparent opacity-0 group-hover/card:opacity-100 hover:scale-110'}`}
          >
            <Heart className={`w-4 h-4 ${favoriteIds.has(item.id) ? 'fill-current' : ''}`} />
          </button>
          <img src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" alt="media" />
          {item.score > 0 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shadow-lg">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-[11px] font-black text-white">{item.score}</span>
            </div>
          )}
        </figure>
        <h3 className="mt-4 text-sm font-bold text-slate-600 dark:text-slate-300 line-clamp-2 group-hover/card:text-yellow-500 dark:group-hover/card:text-white transition-colors">{item.title}</h3>
      </Link>
    </Card>
  );
}