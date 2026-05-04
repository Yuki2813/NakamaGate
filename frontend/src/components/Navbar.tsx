import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  User,
  LogOut,
  Sun,
  Moon,
  Compass,
  Users,
  AlertTriangle
} from 'lucide-react';
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
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
    apiClient.get('/auth/me')
      .then(res => setUserData(res.data))
      .catch(err => console.error("Profile error:", err));
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
      setSearchError(null);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);
      setSearchError(null);
      try {
        const res = await apiClient.get(`/content/search?search_text=${query}&media_type=${mediaType.toLowerCase()}`);
        setResults(res.data.items || res.data);
      } catch (error: any) {
        if (error.response?.data?.detail) {
          setSearchError(error.response.data.detail);
        } else {
          setSearchError("Error connecting to the database.");
        }
        setResults([]);
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
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-yellow-500/20 py-2 md:py-3 transition-colors">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 flex flex-wrap items-center gap-x-1.5 gap-y-2 md:grid md:grid-cols-[auto_1fr_auto] md:gap-x-4">

        <Link to="/home" className="shrink-0 hover:scale-105 transition-transform">
          <img
            src={isDark
              ? 'https://res.cloudinary.com/dlalpfup4/image/upload/v1777901507/1000091271_cyfjfk.png'
              : 'https://res.cloudinary.com/dlalpfup4/image/upload/v1777901506/1000091274_wegamg.png'}
            alt="NakamaGate"
            className="h-8 md:h-10 w-auto object-contain"
          />
        </Link>

        <div className="ml-auto md:ml-0 md:order-3 flex items-center gap-0.5 sm:gap-1 md:gap-2 shrink-0">

          <div className="flex lg:hidden items-center">
            <Link to="/directory">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-600 dark:text-slate-300 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-500/10">
                <Compass className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/community">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-600 dark:text-slate-300 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-500/10">
                <Users className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <Button
            onClick={toggleDarkMode}
            variant="outline"
            className="h-9 w-9 md:h-10 md:w-10 p-0 rounded-xl border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 hover:border-yellow-500/50 text-slate-600 dark:text-slate-300 transition-all shrink-0"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
          </Button>

          <Link to="/profile">
            <Button className="h-9 md:h-10 px-2 md:px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-yellow-500/50 text-slate-800 dark:text-slate-200 transition-all font-semibold flex items-center gap-1.5">
              {getImageUrl(userData?.picture) ? (
                <img src={getImageUrl(userData?.picture)!} alt="Avatar" className="w-5 h-5 md:w-6 md:h-6 rounded-full object-cover border border-slate-300 dark:border-slate-600 shrink-0" />
              ) : (
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center shrink-0">
                  <User className="w-3 h-3" />
                </div>
              )}
              <span className="max-w-20 truncate hidden sm:inline text-sm">{userData?.alias || 'Profile'}</span>
            </Button>
          </Link>

          <Button
            onClick={handleLogout}
            className="h-9 w-9 md:h-10 md:w-10 p-0 rounded-xl border border-red-900/30 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-all shrink-0"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        <div className="order-last w-full md:order-2 md:w-auto flex items-center gap-2 md:justify-center">

          <div className="relative flex-1 md:max-w-xl flex flex-col">
            <div className="flex items-stretch bg-slate-100/80 dark:bg-black/40 border border-slate-300 dark:border-slate-700 focus-within:border-yellow-500/50 focus-within:ring-1 focus-within:ring-yellow-500/20 transition-all rounded-xl overflow-hidden h-10 md:h-11">

              <div className="relative grow flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search titles..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  onFocus={() => query.length >= 3 && setShowDropdown(true)}
                  className="pl-9 h-full border-none rounded-none focus-visible:ring-0 bg-transparent font-medium text-slate-900 dark:text-white placeholder:text-slate-500 text-sm"
                />
              </div>

              <div className="flex items-center bg-slate-200 dark:bg-slate-900/50 p-1 m-1 rounded-lg border border-slate-300/50 dark:border-slate-700/50">
                <button
                  onMouseDown={(e) => { e.preventDefault(); setMediaType('ANIME'); }}
                  className={`px-2 sm:px-3 py-1 font-bold text-[10px] uppercase rounded-md transition-all ${mediaType === 'ANIME' ? 'bg-yellow-500 text-black shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Anime
                </button>
                <button
                  onMouseDown={(e) => { e.preventDefault(); setMediaType('MANGA'); }}
                  className={`px-2 sm:px-3 py-1 font-bold text-[10px] uppercase rounded-md transition-all ${mediaType === 'MANGA' ? 'bg-yellow-500 text-black shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Manga
                </button>
              </div>
            </div>

            {showDropdown && (
              <div className="absolute top-12 md:top-14 left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] flex flex-col z-50 max-h-72 overflow-y-auto custom-scrollbar overflow-hidden">
                {searchError ? (
                  <div className="p-6 text-center text-red-400 text-sm font-bold flex flex-col items-center gap-3 bg-red-950/20">
                    <AlertTriangle className="w-7 h-7 text-red-500" />
                    <span>{searchError}</span>
                  </div>
                ) : results.length > 0 ? (
                  results.map((item: any) => (
                    <div
                      key={item.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setShowDropdown(false); setQuery(''); navigate(`/media/${item.id}`); }}
                      className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group"
                    >
                      <div className="w-9 h-12 rounded-md overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800">
                        <img src={item.image_thumb || item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex flex-col text-left min-w-0">
                        <span className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-yellow-500 dark:group-hover:text-yellow-400 transition-colors line-clamp-1">{item.title}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-medium text-xs text-slate-500 uppercase">{item.type || mediaType}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600"></span>
                          <span className="font-medium text-xs text-slate-500">{item.year || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-5 text-center text-slate-500 dark:text-slate-400 text-sm">
                    {isSearching ? 'Searching the catalog...' : 'No results found.'}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-1 shrink-0">
            <Link to="/directory">
              <Button variant="ghost" className="h-11 px-4 rounded-xl text-slate-600 dark:text-slate-300 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-500/10 font-bold transition-all flex items-center gap-2">
                <Compass className="w-5 h-5" />
                Directory
              </Button>
            </Link>
            <Link to="/community">
              <Button variant="ghost" className="h-11 px-4 rounded-xl text-slate-600 dark:text-slate-300 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-500/10 font-bold transition-all flex items-center gap-2">
                <Users className="w-5 h-5" />
                Guild
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </nav>
  );
}
