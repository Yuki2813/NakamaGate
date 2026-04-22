import { useEffect, useState } from 'react';
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
import { Heart, CheckCircle2, AlertCircle, X } from 'lucide-react';
import Loader from '../components/Loader';

interface MediaItem {
  id: number;
  type: string; // ANIME o MANGA
  title: string;
  image: string;
  score: number;
}

interface HomeSection {
  section_title: string;
  items: MediaItem[];
}

export default function Home() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  const fetchData = async () => {
    try {
      // Hacemos las dos peticiones al mismo tiempo para que cargue más rápido
      const [homeRes, favsRes] = await Promise.all([
        apiClient.get('content/home'),
        apiClient.get('/favorites/')
      ]);

      const data = homeRes.data;
      const userFavorites = favsRes.data;

      const formattedSections: HomeSection[] = [];

      // 1. CONTINUAR VIENDO (Aparece primero si tiene obras marcadas como "watching")
      const watchingMedia = userFavorites
        .filter((fav: any) => fav.status === 'watching')
        .map((fav: any) => fav.media);

      if (watchingMedia.length > 0) {
        formattedSections.push({ section_title: "▶️ Continuar Viendo", items: watchingMedia });
      }

      // 2. TENDENCIAS (Lo más popular del momento)
      if (data.trending && data.trending.length > 0) {
        formattedSections.push({ section_title: "🔥 Tendencias Actuales", items: data.trending });
      }

      // 3. MÁS ESPERADOS (Próximos estrenos)
      if (data.upcoming && data.upcoming.length > 0) {
        formattedSections.push({ section_title: "✨ Próximos Estrenos", items: data.upcoming });
      }

      // 4. GÉNEROS ALEATORIOS Y TOPS INTERCALADOS
      if (data.genre1) {
        formattedSections.push({ section_title: `Explora: ${data.genre1.name}`, items: data.genre1.items });
      }
      if (data.genre2) {
        formattedSections.push({ section_title: `Descubre: ${data.genre2.name}`, items: data.genre2.items });
      }
      
      if (data.top_animes && data.top_animes.length > 0) {
        formattedSections.push({ section_title: "🏆 Top Animes Históricos", items: data.top_animes });
      }
      
      if (data.genre3) {
        formattedSections.push({ section_title: `Joyas de ${data.genre3.name}`, items: data.genre3.items });
      }
      if (data.genre4) {
        formattedSections.push({ section_title: `Sumérgete en ${data.genre4.name}`, items: data.genre4.items });
      }
      
      if (data.top_mangas && data.top_mangas.length > 0) {
        formattedSections.push({ section_title: "📚 Top Mangas", items: data.top_mangas });
      }
      
      if (data.genre5) {
        formattedSections.push({ section_title: `Quizás te guste: ${data.genre5.name}`, items: data.genre5.items });
      }

      // Actualizamos el estado para que se pinten los carruseles
      setSections(formattedSections);

      // Guardamos los IDs en un Set para que los corazones salgan amarillos rápido
      const ids = new Set<number>(userFavorites.map((f: any) => f.media.id));
      setFavoriteIds(ids);

    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
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
    // Convertimos a minúsculas y nos aseguramos de que no sea null
    const safeType = (item.type || 'anime').toLowerCase();

    console.log(`Enviando a favoritos: ID ${item.id}, Tipo: ${safeType}`);

    try {
      if (isFav) {
        await apiClient.delete(`/favorites/${item.id}?media_type=${safeType}`);
        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        showStatus('success', `Eliminado de tus favoritos.`);
      } else {
        // IMPORTANTE: Los nombres de los campos deben coincidir con tu Pydantic
        await apiClient.post('/favorites/', {
          media_id: item.id,
          media_type: safeType
        });
        setFavoriteIds(prev => new Set(prev).add(item.id));
        showStatus('success', `¡Añadido a favoritos!`);
      }
    } catch (error) {
      console.error("Error toggle favorito:", error);
      showStatus('error', "No se pudo actualizar. Revisa la consola.");
    }
  };

  if (loading) return <Loader text="Sincronizando Nakamagate..." />;

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 font-sans pb-20 relative overflow-hidden">
      
      {/* NOTIFICACIONES */}
      {notification.show && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center p-4 pointer-events-none">
          <div className={`
            pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300
            ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}
          `}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="font-bold text-sm">{notification.message}</p>
            <X className="w-4 h-4 cursor-pointer opacity-50" onClick={() => setNotification(prev => ({...prev, show: false}))} />
          </div>
        </div>
      )}

      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

      <header className="max-w-[1400px] mx-auto px-6 md:px-16 pt-12 pb-10 relative z-10">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
          Explora <span className="text-yellow-500">NakamaGate</span>
        </h1>
      </header>

      <div className="relative z-10">
        {sections.map((section, idx) => (
          <section key={idx} className="mb-14 max-w-[1400px] mx-auto group/section">
            <header className="flex items-center justify-between px-6 md:px-16 mb-6">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white italic uppercase">
                {section.section_title}
              </h2>
              <Link to="/directory" className="text-xs font-black text-yellow-500 hover:text-yellow-400 transition-colors uppercase tracking-widest">
                Ver todo
              </Link>
            </header>

            <div className="relative px-6 md:px-16">
              <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent className="-ml-4 md:-ml-6">
                  {section.items.map((item) => {
                    const isFav = favoriteIds.has(item.id);
                    
                    return (
                      <CarouselItem key={item.id} className="pl-4 md:pl-6 basis-[45%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                        <article className="h-full">
                          <Card className="border-none bg-transparent shadow-none group/card cursor-pointer h-full relative">
                            
                            <Link to={`/media/${item.id}`} className="flex flex-col h-full focus:outline-none rounded-xl">
                              
                              {/* FIGURE: Contiene la imagen y el botón para que se muevan juntos */}
                              <figure className="relative aspect-[2/3] overflow-hidden rounded-xl bg-slate-900 border border-slate-800 shadow-lg transition-all duration-300 group-hover/card:shadow-[0_0_20px_-5px_rgba(234,179,8,0.3)] group-hover/card:border-yellow-500/50 group-hover/card:-translate-y-1 m-0">
                                
                                {/* BOTÓN FAVORITO: Ahora se mueve con la card */}
                                <button 
                                  onClick={(e) => toggleFavorite(e, item)}
                                  className={`
                                    absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all z-20 shadow-lg border
                                    ${isFav 
                                      ? 'bg-yellow-500 text-black border-yellow-400 opacity-100 scale-100' 
                                      : 'bg-slate-900/60 text-white hover:text-yellow-500 opacity-0 group-hover/card:opacity-100 scale-90 hover:scale-110 border-transparent hover:border-yellow-400'}
                                  `}
                                >
                                  <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                                </button>

                                <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105" loading="lazy" />
                                
                                {item.score > 0 && (
                                  <figcaption className="absolute bottom-3 left-3 bg-[#020617]/80 backdrop-blur-md border border-slate-700/50 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                    <span className="text-yellow-500">★</span>
                                    <span>{item.score}</span>
                                  </figcaption>
                                )}
                              </figure>

                              <div className="mt-4 flex-grow">
                                <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-slate-300 group-hover/card:text-yellow-400 transition-colors">
                                  {item.title}
                                </h3>
                              </div>
                            </Link>
                          </Card>
                        </article>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>

                <CarouselPrevious className="hidden md:flex absolute -left-12 lg:-left-16 top-[40%] w-12 h-12 rounded-full border border-slate-700 bg-slate-900/90 text-white backdrop-blur-md opacity-0 group-hover/section:opacity-100 transition-all hover:bg-yellow-500 hover:text-black z-10" />
                <CarouselNext className="hidden md:flex absolute -right-12 lg:-right-16 top-[40%] w-12 h-12 rounded-full border border-slate-700 bg-slate-900/90 text-white backdrop-blur-md opacity-0 group-hover/section:opacity-100 transition-all hover:bg-yellow-500 hover:text-black z-10" />
              </Carousel>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}