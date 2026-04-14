import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Sun, Moon } from 'lucide-react';
import { apiClient } from '../api/client';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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



  // 2. Sincronizar el tema al cargar
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

  // 3. FUNCIÓN TOGGLE (Actualiza el HTML real)
 const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

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

  // 4. Lógica de búsqueda (Debounce)
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
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b-4 border-black dark:border-white px-4 md:px-6 py-3 flex items-center justify-between shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[0px_4px_0px_0px_rgba(147,51,234,0.4)] transition-colors">
      
      {/* LOGO */}
      <Link to="/home" className="flex items-center gap-2 hover:scale-105 transition-transform shrink-0">
        <div className="w-8 h-8 bg-purple-600 border-2 border-black rotate-45 flex items-center justify-center">
          <span className="text-white font-black -rotate-45">N</span>
        </div>
        <span className="text-2xl font-black italic tracking-tighter hidden md:block dark:text-white">NakamaGate</span>
      </Link>

      {/* BUSCADOR */}
      <div className="relative w-full max-w-xl mx-4 flex flex-col">
        <div className="flex items-stretch border-2 border-black dark:border-white bg-white dark:bg-slate-800 transition-all rounded-lg overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
          <div className="relative flex-grow flex items-center">
            <Search className="absolute left-3 w-5 h-5 text-slate-400" />
            <Input 
              type="text" 
              placeholder="Buscar..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onFocus={() => query.length >= 3 && setShowDropdown(true)}
              className="pl-10 h-11 border-none rounded-none focus-visible:ring-0 bg-transparent font-bold dark:text-white"
            />
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-700 border-l-2 border-black dark:border-white">
            <button
              onMouseDown={(e) => { e.preventDefault(); setMediaType('ANIME'); }}
              className={`px-3 font-black text-[10px] uppercase transition-all ${mediaType === 'ANIME' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-slate-500 dark:text-slate-300'}`}
            >
              Anime
            </button>
            <button
              onMouseDown={(e) => { e.preventDefault(); setMediaType('MANGA'); }}
              className={`px-3 font-black text-[10px] uppercase transition-all ${mediaType === 'MANGA' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-slate-500 dark:text-slate-300'}`}
            >
              Manga
            </button>
          </div>
        </div>

        {/* Dropdown de Resultados */}
        {showDropdown && (
          <div className="absolute top-12 left-0 w-full bg-white dark:bg-slate-800 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col z-50 max-h-80 overflow-y-auto">
            {results.map((item: any) => (
              <div 
                key={item.id} 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setShowDropdown(false); setQuery(''); navigate(`/media/${item.id}`); }}
                className="flex items-center gap-4 p-3 border-b-2 border-slate-100 dark:border-slate-700 hover:bg-purple-100 dark:hover:bg-purple-900 cursor-pointer transition-colors"
              >
                <img src={item.image_thumb || item.image} className="w-10 h-14 object-cover border-2 border-black dark:border-white" />
                <div className="flex flex-col">
                  <span className="font-black text-sm uppercase dark:text-white line-clamp-1">{item.title}</span>
                  <span className="font-bold text-xs text-slate-500">{item.year || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex items-center gap-2">
        <Button 
          onClick={toggleDarkMode}
          variant="outline" 
          className="border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:bg-slate-800 dark:text-white h-10"
        >
          {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
        </Button>

        <Link to="/profile">
          <Button className="border-4 border-black dark:border-white bg-white dark:bg-slate-800 text-black dark:text-white font-black uppercase hover:bg-yellow-400 dark:hover:bg-purple-600 transition-all h-10 px-3">
            {userData?.picture && (
              <img src={`http://localhost:8000${userData.picture}`} className="w-6 h-6 rounded-full border-2 border-black dark:border-white mr-2 object-cover" />
            )}
            <span className="max-w-[80px] truncate hidden sm:inline">{userData?.alias || 'Perfil'}</span>
          </Button>
        </Link>

        <Button onClick={handleLogout} className="bg-black text-white dark:bg-white dark:text-black border-4 border-black dark:border-white font-black hover:bg-red-500 h-10 px-3 transition-colors">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </nav>
  );
}