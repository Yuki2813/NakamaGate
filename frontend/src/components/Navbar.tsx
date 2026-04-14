import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Sun, Moon } from 'lucide-react';
import { apiClient } from '../api/client';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: number;
  title: string;
  image?: string | null;
  image_thumb?: string | null;
  year?: string | number;
}

interface UserData {
  alias: string;
  picture: string;
}

export default function Navbar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [mediaType, setMediaType] = useState<'ANIME' | 'MANGA'>('ANIME');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isDark, setIsDark] = useState(false);

  // 1. Carga de datos inicial (Tema y Perfil)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }

    apiClient.get('/auth/me')
      .then(res => setUserData(res.data))
      .catch(err => console.error("Error al cargar perfil", err));
  }, []);

  // 2. Alternar Modo Oscuro
  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // 3. Buscador con Debounce
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
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b-4 border-black px-4 md:px-6 py-3 flex items-center justify-between shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[0px_4px_0px_0px_rgba(147,51,234,1)] transition-colors">
      
      {/* LOGO */}
      <Link to="/home" className="flex items-center gap-2 hover:scale-105 transition-transform shrink-0">
        <div className="w-9 h-9 bg-purple-600 border-2 border-black rotate-45 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
          <span className="text-white font-black -rotate-45">N</span>
        </div>
        <span className="text-2xl font-black italic tracking-tighter hidden lg:block dark:text-white">
          NakamaGate
        </span>
      </Link>

      {/* BLOQUE BUSCADOR UNIFICADO */}
      <div className="relative w-full max-w-2xl mx-4 flex flex-col group">
        <div className="flex items-stretch border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] bg-white dark:bg-slate-800 transition-all overflow-hidden rounded-lg">
          
          {/* Input de Texto */}
          <div className="relative flex-grow flex items-center">
            <Search className="absolute left-3 w-5 h-5 text-slate-400" />
            <Input 
              type="text" 
              placeholder="Buscar contenido..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onFocus={() => query.length >= 3 && setShowDropdown(true)}
              className="pl-10 h-12 border-none rounded-none focus-visible:ring-0 bg-transparent font-bold dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Selector Estilizado (Anime/Manga) */}
          <div className="flex bg-slate-100 dark:bg-slate-700 border-l-2 border-black dark:border-white">
            <button
              onMouseDown={(e) => { e.preventDefault(); setMediaType('ANIME'); }}
              className={`px-4 font-black text-[10px] uppercase tracking-tighter transition-all ${
                mediaType === 'ANIME' 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'text-slate-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Anime
            </button>
            <div className="w-[1px] bg-black dark:bg-white opacity-20"></div>
            <button
              onMouseDown={(e) => { e.preventDefault(); setMediaType('MANGA'); }}
              className={`px-4 font-black text-[10px] uppercase tracking-tighter transition-all ${
                mediaType === 'MANGA' 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'text-slate-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Manga
            </button>
          </div>
        </div>

        {/* Dropdown de Resultados */}
        {showDropdown && (
          <div className="absolute top-14 left-0 w-full bg-white dark:bg-slate-800 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col z-50 max-h-80 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center font-black animate-pulse dark:text-white">RASTREANDO...</div>
            ) : results.length > 0 ? (
              results.map((item) => (
                <div 
                  key={item.id} 
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setShowDropdown(false); setQuery(''); navigate(`/media/${item.id}`); }}
                  className="flex items-center gap-4 p-3 border-b-2 border-slate-100 dark:border-slate-700 hover:bg-purple-100 dark:hover:bg-purple-900 cursor-pointer transition-colors"
                >
                  <img 
                    src={item.image_thumb || item.image || "https://via.placeholder.com/40x56"} 
                    className="w-10 h-14 object-cover border-2 border-black dark:border-white shrink-0" 
                  />
                  <div className="flex flex-col">
                    <span className="font-black text-sm uppercase dark:text-white line-clamp-1">{item.title}</span>
                    <span className="font-bold text-xs text-slate-500">{item.year || 'N/A'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center font-black text-red-500 uppercase">Sin resultados</div>
            )}
          </div>
        )}
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex items-center gap-2">
        {/* Toggle Dark Mode */}
        <Button 
          onClick={toggleDarkMode}
          variant="outline" 
          className="border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:bg-slate-800 dark:text-white h-11"
        >
          {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
        </Button>

        {/* Perfil */}
        <Link to="/profile" className="hidden sm:block">
          <Button className="border-4 border-black dark:border-white bg-white dark:bg-slate-800 text-black dark:text-white font-black uppercase hover:bg-yellow-400 dark:hover:bg-purple-600 transition-all h-11 px-3">
            {userData?.picture && (
              <img 
                src={userData.picture.startsWith('http') ? userData.picture : `http://localhost:8000${userData.picture}`} 
                className="w-6 h-6 rounded-full border-2 border-black dark:border-white mr-2 object-cover" 
              />
            )}
            <span className="max-w-[80px] truncate">{userData?.alias || 'Perfil'}</span>
          </Button>
        </Link>

        {/* Salir */}
        <Button onClick={handleLogout} className="bg-black text-white dark:bg-white dark:text-black border-4 border-black dark:border-white font-black hover:bg-red-500 h-11 px-3">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </nav>
  );
}