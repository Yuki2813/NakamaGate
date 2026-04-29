import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Filter, ChevronLeft, ChevronRight, Star, AlertTriangle,
  Hash, Check, PlayCircle, Clock, LayoutGrid
} from 'lucide-react';
import { apiClient } from '../api/client';
import { getImageUrl } from '../utils/helpers';
import Loader from '../components/Loader';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

interface MediaItem {
  id: number;
  type: string;
  title: string;
  image: string;
  score: number;
  year: string | number;
}

const ADULT_GENRES = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", "Mahou Shoujo", "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"];
const SAFE_GENRES  = ["Action", "Adventure", "Comedy", "Fantasy", "Mahou Shoujo", "Mecha", "Music", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural"];

const STATUS_OPTIONS = [
  { id: "",                  label: "Todos",      icon: LayoutGrid  },
  { id: "RELEASING",         label: "En Emisión", icon: PlayCircle  },
  { id: "FINISHED",          label: "Finalizados",icon: Check       },
  { id: "NOT_YET_RELEASED",  label: "Próximos",   icon: Clock       },
];

export default function Directory() {
  const [items,        setItems]        = useState<MediaItem[]>([]);
  const [pageInfo,     setPageInfo]     = useState<PageInfo | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null);

  const [isAdult,        setIsAdult]        = useState(false);
  const [page,           setPage]           = useState(1);
  const [mediaType,      setMediaType]      = useState<'ANIME' | 'MANGA'>('ANIME');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showGenreMenu,  setShowGenreMenu]  = useState(false);
  const [jumpPage,       setJumpPage]       = useState("");

  useEffect(() => {
    apiClient.get('/auth/me')
      .then(res => setIsAdult(res.data.is_adult || res.data.isAdult || false))
      .catch(err => console.error("Error perfil:", err));
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        let url = `/content/directory?media_type=${mediaType.toLowerCase()}&page=${page}`;
        if (selectedGenres.length > 0) url += `&genre=${selectedGenres.join(',')}`;
        if (selectedStatus) url += `&status=${selectedStatus}`;

        const response = await apiClient.get(url);
        const fetchedItems = response.data.items || [];

        if (fetchedItems.length === 0 && page > 1) {
          setPage(page - 1);
          return;
        }

        setItems(fetchedItems);
        setPageInfo(response.data.page_info || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error: any) {
        if (error.response?.status === 403) {
          setErrorMsg("El Gremio ha restringido este acceso (+18). Revisa tu rango de usuario.");
        } else {
          setErrorMsg("Error al conectar con la gran biblioteca de Nakama.");
        }
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [page, mediaType, selectedGenres, selectedStatus]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => {
      if (prev.includes(genre)) return prev.filter(g => g !== genre);
      if (prev.length >= 4) return prev;
      return [...prev, genre];
    });
    setPage(1);
  };

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPage = parseInt(jumpPage);
    if (!isNaN(targetPage) && targetPage >= 1) {
      setPage(targetPage);
      setJumpPage("");
    }
  };

  const getPaginationRange = () => {
    const current = page;
    const range = [];
    if (current > 2) range.push(current - 2);
    if (current > 1) range.push(current - 1);
    range.push(current);
    if (items.length === 24) {
      range.push(current + 1);
      if (pageInfo?.hasNextPage) range.push(current + 2);
    }
    return range;
  };

  if (loading && page === 1 && items.length === 0) return <Loader text="Sincronizando archivos..." />;

  const availableGenres = isAdult ? ADULT_GENRES : SAFE_GENRES;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-800 dark:text-slate-200 pb-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 md:w-150 md:h-150 bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 md:w-150 md:h-150 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* CABECERA */}
      <header className="max-w-350 mx-auto px-4 sm:px-6 md:px-16 pt-8 sm:pt-10 md:pt-12 pb-5 sm:pb-8 relative z-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-slate-900 dark:text-white mb-2 italic">
          Directorio <span className="text-yellow-500">Nakama</span>
        </h1>
        <div className="h-1 w-16 sm:w-20 bg-yellow-500 rounded-full" />
      </header>

      {/* FILTROS */}
      <section className="max-w-350 mx-auto px-4 sm:px-6 md:px-16 mb-8 sm:mb-12 relative z-50">
        <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-2xl border border-yellow-500/10 p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col lg:flex-row gap-4 sm:gap-6 items-start lg:items-center justify-between shadow-2xl">

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center w-full xl:w-auto relative">

            {/* TIPO: ANIME / MANGA */}
            <div className="flex bg-slate-100 dark:bg-black/40 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
              <button
                onClick={() => { setMediaType('ANIME'); setPage(1); setSelectedGenres([]); setSelectedStatus(""); }}
                className={`flex-1 sm:flex-none px-5 py-2 rounded-xl font-black text-xs uppercase transition-all duration-300 ${mediaType === 'ANIME' ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Anime
              </button>
              <button
                onClick={() => { setMediaType('MANGA'); setPage(1); setSelectedGenres([]); setSelectedStatus(""); }}
                className={`flex-1 sm:flex-none px-5 py-2 rounded-xl font-black text-xs uppercase transition-all duration-300 ${mediaType === 'MANGA' ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Manga
              </button>
            </div>

            {/* ESTADO */}
            <div className="flex bg-slate-100 dark:bg-black/40 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto overflow-x-auto">
              {STATUS_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isActive = selectedStatus === opt.id;
                return (
                  <button
                    key={opt.label}
                    onClick={() => { setSelectedStatus(opt.id); setPage(1); }}
                    className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs uppercase whitespace-nowrap transition-all duration-300 ${
                      isActive ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* GÉNEROS */}
            <div className="relative w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setShowGenreMenu(!showGenreMenu)}
                className="w-full sm:w-auto bg-white dark:bg-black/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:border-yellow-500/50 text-slate-600 dark:text-slate-300 rounded-2xl h-[42px] px-5 font-bold flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-2 truncate">
                  <Filter className="w-4 h-4 text-yellow-500 shrink-0" />
                  <span className="truncate">Géneros</span>
                </div>
                {selectedGenres.length > 0 && (
                  <Badge className="bg-yellow-500 text-black px-1.5 py-0 font-black shrink-0">
                    {selectedGenres.length}/4
                  </Badge>
                )}
              </Button>

              {showGenreMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowGenreMenu(false)} />
                  <div className="absolute top-full left-0 mt-2 w-full sm:w-80 bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Selecciona hasta 4</span>
                      {selectedGenres.length > 0 && (
                        <button onClick={() => setSelectedGenres([])} className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase">Limpiar</button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                      {availableGenres.map(g => {
                        const isSelected  = selectedGenres.includes(g);
                        const isDisabled  = !isSelected && selectedGenres.length >= 4;
                        return (
                          <button
                            key={g}
                            onClick={() => toggleGenre(g)}
                            disabled={isDisabled}
                            className={`flex items-center text-left gap-2 p-2.5 rounded-xl text-xs font-bold transition-all ${
                              isSelected  ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'
                              : isDisabled ? 'opacity-30 cursor-not-allowed text-slate-500 border border-transparent'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-yellow-500 text-black' : 'bg-black/20 dark:bg-black/40 border border-slate-400 dark:border-slate-600'}`}>
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                            <span className="truncate">{g}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* IR A PÁGINA */}
          <form onSubmit={handleJumpPage} className="flex items-center gap-3 bg-yellow-500/5 hover:bg-yellow-500/10 p-1.5 rounded-2xl border border-yellow-500/20 transition-all w-full lg:w-auto">
            <div className="bg-yellow-500 text-black p-2 rounded-xl shrink-0">
              <Hash className="w-4 h-4" />
            </div>
            <input
              type="number"
              placeholder="Ir a pág..."
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white text-sm font-black outline-none w-full xl:w-24 placeholder:text-slate-400 dark:placeholder:text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button type="submit" className="bg-transparent hover:bg-white/10 text-yellow-500 font-bold text-xs h-9 shrink-0">
              Ir
            </Button>
          </form>
        </div>
      </section>

      {/* ERROR */}
      {errorMsg && (
        <div className="max-w-350 mx-auto px-4 sm:px-6 md:px-16 mb-8 animate-in fade-in slide-in-from-top-4">
          <div className="bg-red-900/20 border border-red-500/30 p-6 sm:p-8 rounded-3xl flex flex-col items-center text-center">
            <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mb-4" />
            <h2 className="text-xl sm:text-2xl font-black text-white mb-2">Acceso Restringido</h2>
            <p className="text-slate-400 max-w-md text-sm sm:text-base">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* GRID DE CONTENIDO */}
      {!errorMsg && (
        <section className="max-w-350 mx-auto px-4 sm:px-6 md:px-16 relative z-10">

          {/* Overlay de carga durante paginación */}
          {loading && items.length > 0 && (
            <div className="absolute inset-0 z-20 bg-slate-50/60 dark:bg-[#020617]/60 backdrop-blur-sm flex justify-center pt-20">
              <div className="w-11 h-11 border-4 border-slate-300 dark:border-slate-800 border-t-yellow-500 rounded-full animate-spin" />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6 items-stretch">
            {items.map((item) => (
              <Link key={item.id} to={`/media/${item.id}`} className="group flex flex-col h-full">
                <figure className="relative aspect-2/3 overflow-hidden rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all duration-500 group-hover:border-yellow-500/40 group-hover:shadow-[0_0_30px_rgba(234,179,8,0.2)] group-hover:-translate-y-1 sm:group-hover:-translate-y-2">
                  <img
                    src={getImageUrl(item.image) || ''}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />

                  {item.score > 0 ? (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-lg">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-[10px] sm:text-xs font-black text-white">{item.score}</span>
                    </div>
                  ) : (
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 opacity-50">
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400">SIN NOTA</span>
                    </div>
                  )}
                </figure>
                <div className="mt-2 sm:mt-3 flex-grow">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-yellow-500 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-tight">
                    {item.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>

          {/* PAGINACIÓN */}
          <div className="mt-12 sm:mt-16 md:mt-20 flex flex-col items-center justify-center gap-4 sm:gap-6">
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 md:gap-3">
              <Button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-yellow-500 text-slate-800 dark:text-white rounded-xl sm:rounded-2xl w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 p-0 transition-all disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>

              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2">
                {getPaginationRange().map((p) => (
                  <button
                    key={`page-${p}`}
                    onClick={() => setPage(p as number)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all border-2 ${
                      page === p
                        ? 'bg-yellow-500 border-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-110'
                        : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-yellow-500/40 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <Button
                disabled={items.length < 24}
                onClick={() => setPage(p => p + 1)}
                className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-yellow-500 text-slate-800 dark:text-white rounded-xl sm:rounded-2xl w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 p-0 transition-all disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            <p className="text-[10px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-[0.2em] text-center">
              {items.length < 24
                ? `Archivo Nakama • Fin de los Registros (Página ${page})`
                : `Archivo Nakama • Explorando Página ${page}`}
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
