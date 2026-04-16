import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Sun, Moon, Compass } from 'lucide-react'; // <-- Compass añadido
import { apiClient } from '../api/client';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getImageUrl } from '../utils/helpers';


interface UserData {
  alias: string;
  picture: string;
}

export default function Navbar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [mediaType, setMediaType] = useState<'ANIME' | 'MANGA'>('ANIME');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }

    apiClient.get('/auth/me')
      .then(res => setUserData(res.data))
      .catch(err => console.error("Error perfil:", err));
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const res = await apiClient.get(`/content/search?search_text=${query}&media_type=${mediaType.toLowerCase()}`);
        setResults(res.data.items || res.data);
      } catch (error) {
        console.error("Error buscando:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query, mediaType]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#020617]/80 backdrop-blur-xl border-b border-yellow-500/20 px-4 md:px-6 py-3 flex items-center justify-between transition-colors">
      
      {/* LOGO */}
      <Link to="/home" className="flex items-center gap-3 hover:scale-105 transition-transform shrink-0 group">
        <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl rotate-12 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.4)] group-hover:rotate-0 transition-all duration-300">
          <span className="text-[#020617] font-black text-xl -rotate-12 group-hover:rotate-0 transition-all duration-300">N</span>
        </div>
        <span className="text-2xl font-black tracking-tight hidden md:block text-white">
          Nakama<span className="text-yellow-500">Gate</span>
        </span>
      </Link>

      {/* ÁREA CENTRAL: BUSCADOR Y DIRECTORIO */}
      <div className="flex-1 flex items-center justify-center max-w-2xl mx-4 gap-4">
        
        {/* BUSCADOR */}
        <div className="relative w-full flex flex-col">
          <div className="flex items-stretch bg-black/40 border border-slate-700 focus-within:border-yellow-500/50 focus-within:ring-1 focus-within:ring-yellow-500/20 transition-all rounded-xl overflow-hidden h-11">
            
            <div className="relative flex-grow flex items-center">
              <Search className="absolute left-3 w-5 h-5 text-slate-500" />
              <Input 
                type="text" 
                placeholder="Buscar obras..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                onFocus={() => query.length >= 3 && setShowDropdown(true)}
                className="pl-10 h-full border-none rounded-none focus-visible:ring-0 bg-transparent font-medium text-white placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center bg-slate-900/50 p-1 m-1 rounded-lg border border-slate-700/50">
              <button
                onMouseDown={(e) => { e.preventDefault(); setMediaType('ANIME'); }}
                className={`px-3 py-1 font-bold text-[10px] uppercase rounded-md transition-all ${mediaType === 'ANIME' ? 'bg-yellow-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Anime
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); setMediaType('MANGA'); }}
                className={`px-3 py-1 font-bold text-[10px] uppercase rounded-md transition-all ${mediaType === 'MANGA' ? 'bg-yellow-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Manga
              </button>
            </div>
          </div>

          {/* Resultados de Búsqueda */}
          {showDropdown && (
            <div className="absolute top-14 left-0 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] flex flex-col z-50 max-h-80 overflow-y-auto custom-scrollbar overflow-hidden">
              {results.length > 0 ? (
                results.map((item: any) => (
                  <div 
                    key={item.id} 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setShowDropdown(false); setQuery(''); navigate(`/media/${item.id}`); }}
                    className="flex items-center gap-4 p-3 border-b border-slate-800 last:border-0 hover:bg-slate-800/80 cursor-pointer transition-colors group"
                  >
                    <div className="w-10 h-14 rounded-md overflow-hidden shrink-0 bg-slate-800">
                      <img src={item.image_thumb || item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-slate-200 group-hover:text-yellow-400 transition-colors line-clamp-1">{item.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-xs text-slate-500 uppercase">{item.type || mediaType}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span className="font-medium text-xs text-slate-500">{item.year || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 text-sm">
                  {isSearching ? 'Buscando en el catálogo...' : 'No se encontraron resultados.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTÓN DIRECTORIO (Solo visible en pantallas medianas o más grandes) */}
        <Link to="/directory" className="hidden lg:block shrink-0">
          <Button variant="ghost" className="h-11 px-4 rounded-xl text-slate-300 hover:text-yellow-400 hover:bg-yellow-500/10 font-bold transition-all flex items-center gap-2">
            <Compass className="w-5 h-5" />
            Directorio
          </Button>
        </Link>
      </div>

      {/* BOTONES DE ACCIÓN (DERECHA) */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        
        {/* Botón Directorio en móvil (Solo el icono) */}
        <Link to="/directory" className="lg:hidden">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 hover:text-yellow-400 hover:bg-yellow-500/10">
            <Compass className="w-5 h-5" />
          </Button>
        </Link>

        {/* Tema */}
        <Button 
          onClick={toggleDarkMode}
          variant="outline" 
          className="h-10 w-10 p-0 rounded-xl border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-yellow-500/50 text-slate-300 transition-all shrink-0"
          title="Cambiar tema"
        >
          {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* Perfil */}
        <Link to="/profile">
          <Button className="h-10 px-2 md:px-3 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-yellow-500/50 text-slate-200 transition-all font-semibold flex items-center gap-2">
            {getImageUrl(userData?.picture) ? (
              <img src={getImageUrl(userData?.picture)!} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-slate-600 shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs shrink-0">
                <User className="w-3 h-3" />
              </div>
            )}
            <span className="max-w-[100px] truncate hidden sm:inline">{userData?.alias || 'Perfil'}</span>
          </Button>
        </Link>

        {/* Logout */}
        <Button 
          onClick={handleLogout} 
          className="h-10 w-10 p-0 rounded-xl border border-red-900/30 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-all shrink-0"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </nav>
  );
}