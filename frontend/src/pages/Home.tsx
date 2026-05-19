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
  const [animeOfTheDay, setAnimeOfTheDay] = useState<MediaItem | null>(null);
  const [mangaOfTheDay, setMangaOfTheDay] = useState<MediaItem | null>(null);

  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  // Pide en paralelo el contenido del home, los IDs de favoritos del
  // usuario y los que tiene en estado "watching". Con eso monta las
  // secciones (hero, gemas del día, top 10, continue watching, géneros)
  // y guarda los IDs en un Set para que el icono de corazón de cada
  // tarjeta se pinte en O(1) sin recorrer la lista entera.
  const fetchData = async () => {
    setFetchState({ loading: true, error: null });
    try {
      const [homeRes, idsRes, watchingRes] = await Promise.all([
        apiClient.get('content/home'),
        apiClient.get('/favorites/ids'),
        apiClient.get('/favorites/watching')
      ]);

      const data = homeRes.data;
      const userFavoriteIds = idsRes.data;
      const userFavorites = watchingRes.data;

      if (data.anime_del_dia) setAnimeOfTheDay(data.anime_del_dia);
      if (data.manga_del_dia) setMangaOfTheDay(data.manga_del_dia);

      const formattedSections: HomeSection[] = [];

      if (data.trending_anime && data.trending_anime.length > 0) {
        setHeroBanner(data.trending_anime[0]);
        formattedSections.push({
          section_title: "Top 10 Anime of the Day",
          items: data.trending_anime.slice(0, 10)
        });
      }

      const watchingFavorites = userFavorites.filter((fav: any) => fav.status === 'watching');
      const watchingMedia = watchingFavorites.map((fav: any) => fav.media);

      if (watchingMedia.length > 0) {
        formattedSections.push({ section_title: "Continue Watching", items: watchingMedia });
      }

      if (data.trending_manga && data.trending_manga.length > 0) {
        formattedSections.push({
          section_title: "Top 10 Manga of the Day",
          items: data.trending_manga.slice(0, 10)
        });
      }

      if (data.upcoming && data.upcoming.length > 0) {
        formattedSections.push({ section_title: "Upcoming Releases", items: data.upcoming });
      }

      if (data.genre1) formattedSections.push({ section_title: `Explore: ${data.genre1.name}`, items: data.genre1.items });
      if (data.genre2) formattedSections.push({ section_title: `Discover: ${data.genre2.name}`, items: data.genre2.items });
      if (data.genre3) formattedSections.push({ section_title: `Gems of ${data.genre3.name}`, items: data.genre3.items });
      if (data.genre4) formattedSections.push({ section_title: `Dive into ${data.genre4.name}`, items: data.genre4.items });

      setSections(formattedSections);

      const ids = new Set<number>();
      for (const f of userFavoriteIds) {
        ids.add(f.id_api);
      }
      setFavoriteIds(ids);
      setFetchState({ loading: false, error: null });

    } catch (err) {
      console.error("Error loading data:", err);
      setFetchState({ loading: false, error: "Content could not be loaded. Please try again." });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showStatus = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  // Añade o quita un favorito desde una tarjeta del carrusel. El stop/prevent
  // evita que el <Link> envolvente navegue a /media/:id al pulsar el corazón.
  // Tras la llamada al backend actualizamos solo el Set local en vez de hacer
  // un refetch, para que el corazón cambie al instante.
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
        showStatus('success', `Removed from favorites.`);
      } else {
        await apiClient.post('/favorites/', { media_id: item.id, media_type: safeType });
        setFavoriteIds(prev => new Set(prev).add(item.id));
        showStatus('success', `Added to favorites!`);
      }
    } catch (error) {
      showStatus('error', "Could not update favorites.");
    }
  };

  const getSectionIcon = (title: string) => {
    if (title.includes("Top 10")) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (title.includes("Continue")) return <PlayCircle className="w-5 h-5 text-yellow-500" />;
    if (title.includes("Upcoming")) return <Calendar className="w-5 h-5 text-yellow-500" />;
    return <Compass className="w-5 h-5 text-yellow-500" />;
  };

  if (fetchState.error) return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 text-slate-700 dark:text-slate-200 px-4">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <p className="text-lg font-bold text-slate-700 dark:text-slate-300 text-center">{fetchState.error}</p>
      <button
        onClick={fetchData}
        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 px-8 rounded-xl transition-all"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </main>
  );

  if (fetchState.loading) return <Loader text="Syncing Nakamagate..." />;

  const continueWatchingSection = sections.find(s => s.section_title.includes("Continue"));
  const remainingSections = sections.filter(s => !s.section_title.includes("Continue"));

  return (
    <main className="min-h-screen text-slate-800 dark:text-slate-200 pb-20 relative overflow-hidden">

      {notification.show && (
        <div className="fixed inset-0 z-200 flex items-end justify-center sm:items-center p-4 pointer-events-none">
          <div className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300 ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <p className="font-bold text-sm">{notification.message}</p>
            <X className="w-4 h-4 cursor-pointer opacity-50 shrink-0" onClick={() => setNotification(prev => ({...prev, show: false}))} />
          </div>
        </div>
      )}

      {heroBanner && (
        <section className="relative w-full h-[55vh] min-h-[380px] mb-10 overflow-hidden shadow-2xl flex items-center">
          <img
            src={heroBanner.image}
            className="absolute inset-0 w-full h-full object-cover opacity-30 blur-xl scale-110"
            alt="blur background"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-50 dark:from-[#020617] via-slate-50/80 dark:via-[#020617]/70 to-transparent"></div>
          <div className="absolute inset-0 bg-linear-to-r from-slate-50/80 dark:from-[#020617]/60 via-transparent to-transparent"></div>

          <div className="relative z-10 w-full max-w-350 mx-auto px-4 sm:px-6 md:px-16 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="hidden md:block w-44 lg:w-64 shrink-0 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-300 dark:border-white/10">
               <img src={heroBanner.image} alt={heroBanner.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start text-yellow-500 font-black tracking-widest text-xs uppercase mb-3">
                <Flame className="w-4 h-4" />
                <span>TOP TRENDING TODAY</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 dark:text-white leading-tight mb-3 drop-shadow-2xl italic line-clamp-2">{heroBanner.title}</h1>

              {heroBanner.score > 0 && (
                <div className="flex items-center gap-2 justify-center md:justify-start mb-6">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-yellow-500 font-black text-lg">{heroBanner.score}</span>
                  <span className="text-slate-600 dark:text-slate-400 text-sm">/ 100</span>
                </div>
              )}

              <div className="flex gap-3 justify-center md:justify-start">
                <Link to={`/media/${heroBanner.id}?media_type=${heroBanner.type?.toLowerCase() || 'anime'}`}>
                  <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-base py-3 px-7 rounded-2xl transition-all hover:scale-105 shadow-xl shadow-yellow-500/20">Watch now</button>
                </Link>
                <button onClick={(e) => toggleFavorite(e, heroBanner)} className={`p-3 rounded-2xl backdrop-blur-md border transition-all ${favoriteIds.has(heroBanner.id) ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-white/50 dark:bg-white/5 text-slate-900 dark:text-white border-slate-300 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10'}`}>
                  <Heart className={`w-5 h-5 ${favoriteIds.has(heroBanner.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="relative z-10 space-y-14 md:space-y-20">

        {(animeOfTheDay || mangaOfTheDay) && (
          <section className="max-w-350 mx-auto px-4 sm:px-6 md:px-16">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Gems of the Day</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

              {animeOfTheDay && (
                <div className="group relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-linear-to-br from-indigo-600/20 to-slate-200 dark:to-slate-900 border border-indigo-500/20 p-5 sm:p-7 flex gap-5 items-center shadow-2xl">
                  <div className="w-24 sm:w-32 md:w-36 shrink-0 rounded-2xl overflow-hidden shadow-2xl transition-transform group-hover:scale-105">
                    <img src={animeOfTheDay.image} className="w-full h-full object-cover aspect-2/3" alt="anime day" />
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <Tv className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="text-indigo-400 text-xs font-bold uppercase">Anime of the Day</span>
                    </div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white italic line-clamp-2">{animeOfTheDay.title}</h2>
                    {animeOfTheDay.score > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-yellow-500 font-bold text-sm">{animeOfTheDay.score}</span>
                      </div>
                    )}
                    <Link to={`/media/${animeOfTheDay.id}?media_type=anime`}>
                      <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-2 px-5 rounded-xl transition-all text-sm mt-1">Explore</button>
                    </Link>
                  </div>
                </div>
              )}

              {mangaOfTheDay && (
                <div className="group relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-linear-to-br from-amber-600/10 to-slate-200 dark:to-slate-900 border border-amber-500/20 p-5 sm:p-7 flex gap-5 items-center shadow-2xl">
                  <div className="w-24 sm:w-32 md:w-36 shrink-0 rounded-2xl overflow-hidden shadow-2xl transition-transform group-hover:scale-105">
                    <img src={mangaOfTheDay.image} className="w-full h-full object-cover aspect-2/3" alt="manga day" />
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="text-amber-400 text-xs font-bold uppercase">Manga of the Day</span>
                    </div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white italic line-clamp-2">{mangaOfTheDay.title}</h2>
                    {mangaOfTheDay.score > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-yellow-500 font-bold text-sm">{mangaOfTheDay.score}</span>
                      </div>
                    )}
                    <Link to={`/media/${mangaOfTheDay.id}?media_type=manga`}>
                      <button className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold py-2 px-5 rounded-xl transition-all text-sm mt-1">Read Details</button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="max-w-350 mx-auto px-4 sm:px-6 md:px-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <PlayCircle className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Continue Watching</h2>
            </div>
            <Link to="/directory" className="text-xs font-bold text-yellow-500 uppercase tracking-widest hover:underline">View all</Link>
          </div>

          {continueWatchingSection && continueWatchingSection.items.length > 0 ? (
            <div className="px-3 sm:px-4 md:px-8">
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent className="-ml-3 sm:-ml-4">
                {continueWatchingSection.items.map((item) => (
                  <CarouselItem key={item.id} className="pl-3 sm:pl-4 basis-[48%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                    <MediaCard item={item} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-10 bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:bg-yellow-500 hover:text-black hover:border-yellow-500" />
              <CarouselNext className="hidden md:flex -right-10 bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:bg-yellow-500 hover:text-black hover:border-yellow-500" />
            </Carousel>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 gap-4">
              <Play className="w-10 h-10 text-slate-400 dark:text-slate-600" />
              <p className="text-slate-500 font-bold">You&apos;re not watching anything yet</p>
              <Link to="/directory">
                <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-2 px-6 rounded-xl transition-all text-sm">
                  Explore the directory
                </button>
              </Link>
            </div>
          )}
        </section>

        {remainingSections.map((section, idx) => {
          const isTop10 = section.section_title.includes("Top 10");

          return (
            <section key={idx} className="max-w-350 mx-auto group/section">
              <div className="flex items-center justify-between px-4 sm:px-6 md:px-16 mb-6">
                <div className="flex items-center gap-3">
                  {getSectionIcon(section.section_title)}
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">{section.section_title}</h2>
                </div>
                <Link to="/directory" className="text-xs font-bold text-yellow-500 uppercase tracking-widest hover:underline shrink-0">View all</Link>
              </div>

              <div className="px-6 sm:px-10 md:px-20">
                <Carousel opts={{ align: "start", loop: true }} className="w-full">
                  <CarouselContent className="-ml-3 sm:-ml-4">
                    {section.items.map((item, itemIdx) => (
                      <CarouselItem key={item.id} className={`pl-3 sm:pl-4 ${isTop10 ? 'basis-[60%] sm:basis-[42%] md:basis-[30%] lg:basis-[25%] xl:basis-[20%] overflow-visible' : 'basis-[48%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6'}`}>
                        {isTop10 ? (
                          <div className="relative h-full py-4 flex items-end justify-end">
                            <span
                              className="absolute -left-3.75 sm:-left-2.5 bottom-1 font-black leading-none select-none pointer-events-none"
                              style={{
                                fontSize: 'clamp(90px, 14vw, 160px)',
                                color: 'transparent',
                                WebkitTextStroke: '3px var(--top10-stroke)',
                                zIndex: 1,
                                letterSpacing: '-0.08em',
                              }}
                            >
                              {itemIdx + 1}
                            </span>

                            <div className="relative w-[72%] sm:w-[75%]" style={{ zIndex: 2 }}>
                              <MediaCard item={item} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite} fixedTitleHeight />
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

function MediaCard({
  item,
  favoriteIds,
  toggleFavorite,
  fixedTitleHeight = false,
}: {
  item: MediaItem;
  favoriteIds: Set<number>;
  toggleFavorite: (e: React.MouseEvent, item: MediaItem) => void;
  fixedTitleHeight?: boolean;
}) {
  return (
    <Card className="bg-transparent border-none ring-0 shadow-none group/card h-full">
      <Link to={`/media/${item.id}?media_type=${item.type?.toLowerCase() || 'anime'}`} className="block h-full">
        <figure className="relative aspect-2/3 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-900 transition-all duration-300 group-hover/card:border-yellow-500/50 group-hover/card:-translate-y-2 shadow-lg">
          <button
            onClick={(e) => toggleFavorite(e, item)}
            className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md z-20 border transition-all ${favoriteIds.has(item.id) ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-black/50 text-white border-transparent opacity-0 group-hover/card:opacity-100 hover:scale-110'}`}
          >
            <Heart className={`w-3.5 h-3.5 ${favoriteIds.has(item.id) ? 'fill-current' : ''}`} />
          </button>
          <img src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" alt="media" />
          {item.score > 0 && (
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-lg">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-[11px] font-black text-white">{item.score}</span>
            </div>
          )}
        </figure>
        <h3 className={`mt-2.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 line-clamp-2 group-hover/card:text-yellow-500 dark:group-hover/card:text-white transition-colors${fixedTitleHeight ? ' min-h-8 sm:min-h-10' : ''}`}>
          {item.title}
        </h3>
      </Link>
    </Card>
  );
}
