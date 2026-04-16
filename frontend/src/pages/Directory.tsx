import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, ChevronLeft, ChevronRight, Star, AlertTriangle, Search, MoreHorizontal } from 'lucide-react';
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
        setItems(response.data.items || []);
        setPageInfo(response.data.page_info || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error: any) {
        if (error.response?.status === 403) {
          setErrorMsg("Acceso restringido por género (+18).");
        } else {
          setErrorMsg("Error al conectar con la base de datos.");
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
    if (!isNaN(targetPage) && targetPage >= 1 && pageInfo && targetPage <= pageInfo.lastPage) {
      setPage(targetPage);
      setJumpPage("");
    }
  };

  // --- LÓGICA DE PAGINACIÓN (1, 2, 3...) ---
  const getPaginationRange = () => {
    if (!pageInfo) return [];
    const current = pageInfo.currentPage;
    const last = pageInfo.lastPage;
    const delta = 2; // Cuántas páginas mostrar a los lados de la actual
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

  if (loading && page === 1 && items.length === 0) return <Loader text="Sincronizando con AniList..." />;

  const availableGenres = isAdult ? ADULT_GENRES : SAFE_GENRES;

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 pb-20 relative overflow-hidden">
      {/* HEADER Y FILTROS (Igual que antes...) */}
      <header className="max-w-[1400px] mx-auto px-6 md:px-16 pt-12 pb-8 relative z-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
          Directorio <span className="text-yellow-500">Nakama</span>
        </h1>
      </header>

      {/* FILTROS */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-16 mb-10 relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-md border border-yellow-500/20 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-1 bg-black/50 p-1.5 rounded-xl border border-slate-700/50">
              <button onClick={() => { setMediaType('ANIME'); setPage(1); }} className={`px-6 py-2 rounded-lg font-black text-xs uppercase ${mediaType === 'ANIME' ? 'bg-yellow-500 text-black' : 'text-slate-400'}`}>Anime</button>
              <button onClick={() => { setMediaType('MANGA'); setPage(1); }} className={`px-6 py-2 rounded-lg font-black text-xs uppercase ${mediaType === 'MANGA' ? 'bg-yellow-500 text-black' : 'text-slate-400'}`}>Manga</button>
            </div>
            <select value={genre} onChange={(e) => { setGenre(e.target.value); setPage(1); }} className="bg-black/50 border border-slate-700 text-white rounded-xl px-4 py-2.5 outline-none font-semibold text-sm">
              <option value="">Géneros</option>
              {availableGenres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          
          {/* BUSCADOR DE PÁGINA RÁPIDO */}
          <form onSubmit={handleJumpPage} className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-slate-700">
            <Search className="w-4 h-4 text-slate-500 ml-2" />
            <input 
              type="number" 
              placeholder="Ir a..." 
              value={jumpPage} 
              onChange={(e) => setJumpPage(e.target.value)}
              className="w-16 bg-transparent text-white text-sm font-bold outline-none"
            />
          </form>
        </div>
      </section>

      {/* GRID (Igual que antes...) */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-16 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 items-stretch">
          {items.map((item) => (
            <Link key={item.id} to={`/media/${item.id}`} className="group flex flex-col h-full rounded-xl">
              <figure className="relative aspect-[2/3] overflow-hidden rounded-xl bg-slate-900 border border-slate-800 transition-all group-hover:border-yellow-500/50 group-hover:-translate-y-1">
                <img src={getImageUrl(item.image) || ''} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/80 px-2 py-1 rounded-md">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-[10px] font-bold text-white">{item.score}</span>
                </div>
              </figure>
              <div className="mt-3 min-h-[40px]">
                <h3 className="text-sm font-semibold text-slate-300 group-hover:text-yellow-400 transition-colors line-clamp-2">{item.title}</h3>
              </div>
            </Link>
          ))}
        </div>

        {/* --- NUEVA PAGINACIÓN ESTILO LISTA --- */}
        {pageInfo && pageInfo.lastPage > 1 && (
          <div className="mt-16 flex flex-wrap items-center justify-center gap-2">
            <Button 
              disabled={page <= 1} 
              onClick={() => setPage(p => p - 1)}
              className="bg-slate-900 border border-slate-800 hover:border-yellow-500 text-white rounded-xl w-10 h-10 p-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            {getPaginationRange().map((p, idx) => (
              p === '...' ? (
                <span key={`dots-${idx}`} className="text-slate-600 px-2"><MoreHorizontal className="w-5 h-5" /></span>
              ) : (
                <button
                  key={`page-${p}`}
                  onClick={() => setPage(p as number)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm transition-all border ${
                    page === p 
                    ? 'bg-yellow-500 border-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {p}
                </button>
              )
            ))}

            <Button 
              disabled={!pageInfo.hasNextPage} 
              onClick={() => setPage(p => p + 1)}
              className="bg-slate-900 border border-slate-800 hover:border-yellow-500 text-white rounded-xl w-10 h-10 p-0"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}