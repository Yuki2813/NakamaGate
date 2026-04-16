import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  AlertTriangle, 
  Search, 
  MoreHorizontal,
  Hash
} from 'lucide-react';
import { apiClient } from '../api/client';
import { getImageUrl } from '../utils/helpers';
import Loader from '../components/Loader';
import { Button } from "@/components/ui/button";

// --- INTERFACES ---
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
const SAFE_GENRES = ["Action", "Adventure", "Comedy", "Fantasy", "Mahou Shoujo", "Mecha", "Music", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural"];

export default function Directory() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isAdult, setIsAdult] = useState(false);
  const [page, setPage] = useState(1);
  const [mediaType, setMediaType] = useState<'ANIME' | 'MANGA'>('ANIME');
  const [genre, setGenre] = useState('');
  
  const [jumpPage, setJumpPage] = useState("");

  useEffect(() => {
    apiClient.get('/auth/me')
      .then(res => setIsAdult(res.data.is_adult || res.data.isAdult || false))
      .catch(err => console.error("Error perfil:", err));
  }, []);

  useEffect(() => {
    const fetchDirectory = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        let url = `/content/directory?media_type=${mediaType.toLowerCase()}&page=${page}`;
        if (genre) url += `&genre=${genre}`;

        const response = await apiClient.get(url);
        const fetchedItems = response.data.items || [];

        // Lógica de rebote: Si la página está vacía y no es la 1, vuelve al inicio
        if (fetchedItems.length === 0 && page > 1) {
          setPage(1);
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
    };
    fetchDirectory();
  }, [page, mediaType, genre]);

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPage = parseInt(jumpPage);
    if (!isNaN(targetPage) && targetPage >= 1) {
      setPage(targetPage);
      setJumpPage("");
    }
  };

  const getPaginationRange = () => {
    if (!pageInfo) return [];
    const current = pageInfo.currentPage;
    const last = pageInfo.lastPage;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    range.push(1);
    for (let i = current - delta; i <= current + delta; i++) {
      if (i < last && i > 1) range.push(i);
    }
    if (last > 1) range.push(last);

    for (let i of range) {
      if (l) {
        if (i - l === 2) rangeWithDots.push(l + 1);
        else if (i - l !== 1) rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  };

  if (loading && page === 1 && items.length === 0) return <Loader text="Sincronizando archivos..." />;

  const availableGenres = isAdult ? ADULT_GENRES : SAFE_GENRES;

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 pb-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="max-w-[1400px] mx-auto px-6 md:px-16 pt-12 pb-8 relative z-10">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2">
          Directorio <span className="text-yellow-500">Nakama</span>
        </h1>
        <div className="h-1 w-20 bg-yellow-500 rounded-full mb-4"></div>
      </header>

      {/* BARRA DE FILTROS SUPERIOR (Ahora perfectamente alineada en escritorio) */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-16 mb-12 relative z-10">
        {/* Cambiado lg:row a lg:flex-row para que queden en línea */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-yellow-500/10 p-5 rounded-3xl flex flex-col lg:flex-row gap-6 items-center justify-between shadow-2xl">
          
          <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto">
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-slate-800">
              <button 
                onClick={() => { setMediaType('ANIME'); setPage(1); setGenre(''); }}
                className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-all duration-300 ${mediaType === 'ANIME' ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'text-slate-500 hover:text-white'}`}
              >
                Anime
              </button>
              <button 
                onClick={() => { setMediaType('MANGA'); setPage(1); setGenre(''); }}
                className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-all duration-300 ${mediaType === 'MANGA' ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'text-slate-500 hover:text-white'}`}
              >
                Manga
              </button>
            </div>

            <div className="relative group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500 group-hover:scale-110 transition-transform" />
              <select 
                value={genre} 
                onChange={(e) => { setGenre(e.target.value); setPage(1); }}
                className="appearance-none bg-black/40 border border-slate-800 text-slate-300 rounded-2xl pl-12 pr-12 py-3.5 outline-none font-bold text-sm focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all cursor-pointer min-w-[200px]"
              >
                <option value="">Todos los géneros</option>
                {availableGenres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>

          <form onSubmit={handleJumpPage} className="flex items-center gap-3 bg-yellow-500/5 hover:bg-yellow-500/10 p-1.5 rounded-2xl border border-yellow-500/20 transition-all w-full lg:w-auto">
            <div className="bg-yellow-500 text-black p-2 rounded-xl">
              <Hash className="w-4 h-4" />
            </div>
            <input 
              type="number" 
              placeholder="Ir a pág..." 
              value={jumpPage} 
              onChange={(e) => setJumpPage(e.target.value)}
              className="bg-transparent text-white text-sm font-black outline-none w-24 placeholder:text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button type="submit" className="bg-transparent hover:bg-white/10 text-yellow-500 font-bold text-xs h-9">
              Ir
            </Button>
          </form>
        </div>
      </section>

      {errorMsg && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-16 mb-8 animate-in fade-in slide-in-from-top-4">
          <div className="bg-red-900/20 border border-red-500/30 p-8 rounded-3xl flex flex-col items-center text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">Acceso Restringido</h2>
            <p className="text-slate-400 max-w-md">{errorMsg}</p>
          </div>
        </div>
      )}

      {!errorMsg && (
        <section className="max-w-[1400px] mx-auto px-6 md:px-16 relative z-10">
          
          {loading && items.length > 0 && (
            <div className="absolute inset-0 z-20 bg-[#020617]/40 backdrop-blur-sm flex justify-center pt-20">
              <div className="w-12 h-12 border-4 border-slate-800 border-t-yellow-500 rounded-full animate-spin"></div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 items-stretch">
            {items.map((item) => (
              <Link key={item.id} to={`/media/${item.id}`} className="group flex flex-col h-full">
                <figure className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 transition-all duration-500 group-hover:border-yellow-500/40 group-hover:shadow-[0_0_30px_rgba(234,179,8,0.2)] group-hover:-translate-y-2">
                  <img 
                    src={getImageUrl(item.image) || ''} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    loading="lazy" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity"></div>
                  
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-black text-white">{item.score || '??'}</span>
                  </div>
                </figure>
                <div className="mt-4 flex-grow min-h-[44px]">
                  <h3 className="text-sm font-bold text-slate-300 group-hover:text-yellow-400 transition-colors line-clamp-2 leading-tight">
                    {item.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>

          {/* CONTROLES DE PAGINACIÓN INFERIORES */}
          {pageInfo && pageInfo.lastPage > 1 && (
            <div className="mt-20 flex flex-col xl:flex-row items-center justify-center gap-8">
              
              {/* Botones de números */}
              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                <Button 
                  disabled={page <= 1} 
                  onClick={() => setPage(p => p - 1)}
                  className="bg-slate-900/50 border border-slate-800 hover:border-yellow-500 text-white rounded-2xl w-10 h-10 md:w-12 md:h-12 p-0 transition-all"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </Button>

                <div className="flex flex-wrap items-center gap-1 md:gap-2">
                  {getPaginationRange().map((p, idx) => (
                    p === '...' ? (
                      <div key={`dots-${idx}`} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-slate-600">
                        <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                    ) : (
                      <button
                        key={`page-${p}`}
                        onClick={() => setPage(p as number)}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl font-black text-xs md:text-sm transition-all border-2 ${
                          page === p 
                          ? 'bg-yellow-500 border-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)] md:scale-110' 
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-yellow-500/40 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  ))}
                </div>

                <Button 
                  disabled={!pageInfo.hasNextPage} 
                  onClick={() => setPage(p => p + 1)}
                  className="bg-slate-900/50 border border-slate-800 hover:border-yellow-500 text-white rounded-2xl w-10 h-10 md:w-12 md:h-12 p-0 transition-all"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </Button>
              </div>

              {/* Buscador de páginas replicado al final para mayor comodidad */}
              <form onSubmit={handleJumpPage} className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 focus-within:border-yellow-500/50 transition-all">
                <Search className="w-4 h-4 text-slate-500 ml-3" />
                <input 
                  type="number" 
                  placeholder="Saltar a..." 
                  value={jumpPage} 
                  onChange={(e) => setJumpPage(e.target.value)}
                  className="w-20 bg-transparent text-white text-sm font-bold outline-none placeholder:text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button type="submit" className="bg-slate-800 hover:bg-yellow-500 hover:text-black text-slate-300 font-bold text-xs h-9 rounded-xl transition-colors">
                  Ir
                </Button>
              </form>

            </div>
          )}

          {/* Texto de estado de página AniList Safe */}
          <div className="mt-10 text-center">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
              {pageInfo && page > pageInfo.lastPage 
                ? `Explorando el Vacío (Página ${page})` 
                : `Archivo Nakama • Página ${page} de ${pageInfo?.lastPage || '??'}`
              }
            </p>
          </div>
        </section>
      )}
    </main>
  );
}