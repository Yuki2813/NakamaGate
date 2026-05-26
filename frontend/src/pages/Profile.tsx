import { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Heart, Star, ShieldAlert, Settings, Home,
  Edit2, Camera, Check, X, ChevronDown, Trash2, Award, BarChart3,
  Flame, Trophy, PlayCircle, Swords, Brain, Clock, Sparkles, Lock,
  Compass, Search, ShieldCheck, Loader2
} from 'lucide-react';
import Loader from '../components/Loader';
import AvatarEditor from 'react-avatar-editor';

interface MediaData {
  id: number;
  type: string;
  title: string;
  image: string;
  genres?: string[];
}

interface FavoriteItem {
  id: number;
  status: string;
  media: MediaData;
}

interface UserProfile {
  id: number;
  alias: string;
  picture: string | null;
  is_adult: boolean;
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoritesTotal, setFavoritesTotal] = useState(0);
  const [favPage, setFavPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'watching' | 'completed' | 'pending'>('all');
  const [allFavIds, setAllFavIds] = useState<{id_api: number, media_type: string, status: string}[]>([]);
  const [stats, setStats] = useState<{
    top_genres: [string, number][];
    unique_genres_count: number;
    has_action: boolean;
    has_romance: boolean;
    has_mystery: boolean;
  } | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [newAlias, setNewAlias] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<React.ComponentRef<typeof AvatarEditor>>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scale, setScale] = useState(1.2);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<number | null>(null);
  const [mediaTypeToDelete, setMediaTypeToDelete] = useState<string>("ANIME");

  const [isAdult, setIsAdult] = useState(false);
  const [savingAdult, setSavingAdult] = useState(false);

  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // /auth/me secuencial; el resto (favs, ids, reviews count, stats) en paralelo.
  const fetchProfileData = async () => {
    try {
      const profileRes = await apiClient.get('/auth/me');
      setProfile(profileRes.data);
      setNewAlias(profileRes.data.alias);

      let adultValue = false;
      if (profileRes.data.is_adult) {
        adultValue = profileRes.data.is_adult;
      }
      setIsAdult(adultValue);

      const params = new URLSearchParams({ page: '1', limit: '20' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const [pagsRes, idsRes, reviewCountRes, statsRes] = await Promise.all([
        apiClient.get(`/favorites/?${params}`),
        apiClient.get('/favorites/ids'),
        apiClient.get('/reviews/me/count'),
        apiClient.get('/favorites/stats')
      ]);

      let items = [];
      if (pagsRes.data.items) {
        items = pagsRes.data.items;
      }
      setFavorites(items);

      let total = 0;
      if (pagsRes.data.total) {
        total = pagsRes.data.total;
      }
      setFavoritesTotal(total);

      let moreFlag = false;
      if (pagsRes.data.has_more) {
        moreFlag = pagsRes.data.has_more;
      }
      setHasMore(moreFlag);

      setFavPage(1);

      let favIds = [];
      if (idsRes.data) {
        favIds = idsRes.data;
      }
      setAllFavIds(favIds);

      let revCount = 0;
      if (reviewCountRes.data.count) {
        revCount = reviewCountRes.data.count;
      }
      setReviewCount(revCount);

      let statsData = null;
      if (statsRes.data) {
        statsData = statsRes.data;
      }
      setStats(statsData);
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreFavorites = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = favPage + 1;
      const params = new URLSearchParams({ page: String(nextPage), limit: '20' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await apiClient.get(`/favorites/?${params}`);

      let newItems = [];
      if (res.data.items) {
        newItems = res.data.items;
      }
      setFavorites(prev => [...prev, ...newItems]);

      let moreFlag = false;
      if (res.data.has_more) {
        moreFlag = res.data.has_more;
      }
      setHasMore(moreFlag);

      setFavPage(nextPage);
    } catch {
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchFilteredFavorites = async (filter: 'all' | 'watching' | 'completed' | 'pending') => {
    try {
      const params = new URLSearchParams({ page: '1', limit: '20' });
      if (filter !== 'all') params.set('status', filter);
      const res = await apiClient.get(`/favorites/?${params}`);

      let items = [];
      if (res.data.items) {
        items = res.data.items;
      }
      setFavorites(items);

      let total = 0;
      if (res.data.total) {
        total = res.data.total;
      }
      setFavoritesTotal(total);

      let moreFlag = false;
      if (res.data.has_more) {
        moreFlag = res.data.has_more;
      }
      setHasMore(moreFlag);

      setFavPage(1);
    } catch (err) {
      console.error("Filter error:", err);
    }
  };

  const handleStatusFilterChange = (filter: 'all' | 'watching' | 'completed' | 'pending') => {
    if (filter === statusFilter) return;
    setStatusFilter(filter);
    setSearchTerm("");
    fetchFilteredFavorites(filter);
  };

  useEffect(() => {
    if (user && user.id) {
      fetchProfileData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!searchTerm.trim()) return;
    if (loadingMore || !hasMore) return;
    fetchMoreFavorites();
  }, [searchTerm, hasMore, loadingMore]);

  const filteredFavorites = useMemo(() => {
    if (!searchTerm.trim()) return favorites;
    return favorites.filter(fav =>
      fav.media.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [favorites, searchTerm]);

  const genreStats = useMemo(() => {
    if (stats && stats.top_genres) {
      return stats.top_genres;
    }
    return [];
  }, [stats]);

  // 12 insignias derivadas de favoriteIds y stats; isSecret se pinta como candado hasta desbloquearse.
  const badges = useMemo(() => {
    const totalCount = allFavIds.length;
    const completedCount = allFavIds.filter(f => f.status === 'completed').length;
    const watchingCount = allFavIds.filter(f => f.status === 'watching').length;
    const pendingCount = allFavIds.filter(f => f.status === 'pending').length;

    let hasAction = false;
    let hasRomance = false;
    let hasMystery = false;
    let uniqueGenresCount = 0;
    if (stats) {
      hasAction = stats.has_action;
      hasRomance = stats.has_romance;
      hasMystery = stats.has_mystery;
      uniqueGenresCount = stats.unique_genres_count;
    }

    return [
      { id: 1, name: 'Beginner', desc: 'First title added', icon: <Star className="w-4 h-4"/>, active: totalCount > 0 },
      { id: 2, name: 'Collector', desc: 'More than 10 favorites', icon: <Heart className="w-4 h-4"/>, active: totalCount >= 10 },
      { id: 3, name: 'Otaku Master', desc: 'More than 50 favorites', icon: <Flame className="w-4 h-4"/>, active: totalCount >= 50 },
      { id: 4, name: 'Finisher', desc: 'One title completed', icon: <Check className="w-4 h-4"/>, active: completedCount >= 1 },
      { id: 5, name: 'Pillar', desc: '5 titles completed', icon: <Trophy className="w-4 h-4"/>, active: completedCount >= 5 },
      { id: 6, name: 'Up to Date', desc: 'Watching 3 titles at once', icon: <PlayCircle className="w-4 h-4"/>, active: watchingCount >= 3 },
      { id: 7, name: 'Warrior', desc: 'Action fan', icon: <Swords className="w-4 h-4"/>, active: hasAction },
      { id: 8, name: 'Romantic', desc: 'Romance fan', icon: <Heart className="w-4 h-4 fill-current"/>, active: hasRomance },
      { id: 9, name: 'Mastermind', desc: 'Mystery/Psychological fan', icon: <Brain className="w-4 h-4"/>, active: hasMystery },
      { id: 10, name: 'Critic', desc: 'Write your first review', icon: <Award className="w-4 h-4"/>, active: false },
      { id: 11, name: 'Procrastinator', desc: 'You have 10 titles in "Pending"', icon: <Clock className="w-4 h-4"/>, active: pendingCount >= 10, isSecret: true, hint: 'Hint: You leave too much for tomorrow...' },
      { id: 12, name: 'Eclectic', desc: "You've explored 5 different genres", icon: <Sparkles className="w-4 h-4"/>, active: uniqueGenresCount >= 5, isSecret: true, hint: 'Hint: Variety is the spice of life.' },
    ];
  }, [stats, favoritesTotal, allFavIds]);

  // Recargamos tras cambio de alias para que toda la app recoja el JWT nuevo.
  const handleUpdateAlias = async () => {
    let sameAsCurrent = false;
    if (profile && newAlias === profile.alias) {
      sameAsCurrent = true;
    }
    if (!newAlias.trim() || sameAsCurrent) {
      setIsEditingAlias(false);
      return;
    }
    try {
      await apiClient.patch('/auth/me/alias', { alias: newAlias });
      window.location.reload();
    } catch (error: any) {
      console.error("Alias error:", error);
    }
  };

  const handleStatusChange = async (mediaId: number, newStatus: string) => {
    try {
      await apiClient.put(`/favorites/${mediaId}/status`, { status: newStatus });
      setFavorites(prev => prev.map(fav =>
        fav.media.id === mediaId ? { ...fav, status: newStatus } : fav
      ));
      setAllFavIds(prev => prev.map(f =>
        f.id_api === mediaId ? { ...f, status: newStatus } : f
      ));
    } catch (error) {
      console.error("Status change error:", error);
    }
  };

  const triggerDeleteModal = (mediaId: number, mediaType: string) => {
    setMediaToDelete(mediaId);
    setMediaTypeToDelete(mediaType);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!mediaToDelete) return;
    try {
      const typeLower = mediaTypeToDelete.toLowerCase();
      await apiClient.delete(`/favorites/${mediaToDelete}?media_type=${typeLower}`);
      setFavorites(prev => prev.filter(fav => fav.media.id !== mediaToDelete));
      setAllFavIds(prev => prev.filter(f => !(f.id_api === mediaToDelete && f.media_type === typeLower)));
      setFavoritesTotal(prev => Math.max(0, prev - 1));
      setDeleteModalOpen(false);
      setMediaToDelete(null);
      try {
        const statsRes = await apiClient.get('/favorites/stats');
        let statsData = null;
        if (statsRes.data) {
          statsData = statsRes.data;
        }
        setStats(statsData);
      } catch {
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // Toggle adulto; si el backend retira favoritos +18, recargamos el perfil entero.
  const handleToggleAdult = async () => {
    const newValue = !isAdult;
    setSavingAdult(true);
    try {
      const res = await apiClient.patch('/auth/me/adult', { is_adult: newValue });
      setIsAdult(newValue);
      await refreshUser();
      let removed = 0;
      if (res.data && res.data.removed_favorites) {
        removed = res.data.removed_favorites;
      }
      if (removed > 0) {
        await fetchProfileData();
      }
    } catch (error) {
      console.error("Preference update error:", error);
    } finally {
      setSavingAdult(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    try {
      await apiClient.delete('/auth/me');
      localStorage.removeItem('token');
      window.location.href = '/';
    } catch (error) {
      console.error("Account deletion error:", error);
    }
  };

  // Recorte de AvatarEditor a JPEG multipart; recargamos con ?u=timestamp para invalidar caché del navegador.
  const handleSaveAvatar = () => {
    if (editorRef.current) {
      setSavingAvatar(true);
      const canvasScaled = editorRef.current.getImageScaledToCanvas();
      canvasScaled.toBlob((blob: Blob | null) => {
        if (!blob) return;
        const upload = async () => {
          const formData = new FormData();
          formData.append("file", blob, "avatar.jpg");
          try {
            await apiClient.patch('/auth/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            window.location.href = window.location.pathname + "?u=" + Date.now();
          } catch (error) {
            setSavingAvatar(false);
          }
        };
        upload();
      }, 'image/jpeg', 0.9);
    }
  };

  if (loading) return <Loader text="Loading profile..." />;
  if (!profile) return <div className="text-white p-10 text-center">Profile not found.</div>;

  let aliasBlock;
  if (isEditingAlias) {
    aliasBlock = (
      <div className="flex items-center gap-2 justify-center md:justify-start">
        <Input value={newAlias} onChange={(e) => setNewAlias(e.target.value)} className="h-10 bg-white dark:bg-slate-800 border-yellow-500/50 text-slate-900 dark:text-white font-bold max-w-xs" autoFocus />
        <Button onClick={handleUpdateAlias} size="icon" className="bg-green-600"><Check className="w-4 h-4"/></Button>
        <Button onClick={() => setIsEditingAlias(false)} size="icon" variant="outline"><X className="w-4 h-4"/></Button>
      </div>
    );
  } else {
    aliasBlock = (
      <div className="flex items-center justify-center md:justify-start gap-4">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{profile.alias}</h1>
        <button onClick={() => setIsEditingAlias(true)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-all"><Edit2 className="w-4 h-4" /></button>
      </div>
    );
  }

  let avatarBlock;
  if (profile.picture) {
    avatarBlock = <img src={profile.picture} alt="Avatar" className="w-full h-full object-cover" />;
  } else {
    avatarBlock = <div className="w-full h-full flex items-center justify-center text-5xl font-black text-yellow-500 bg-slate-900 uppercase">{profile.alias.substring(0, 2)}</div>;
  }

  const badgeItems = [];
  for (const badge of badges) {
    const isLockedSecret = badge.isSecret && !badge.active;

    let displayIcon;
    if (isLockedSecret) {
      displayIcon = <Lock className="w-3.5 h-3.5" />;
    } else {
      displayIcon = badge.icon;
    }

    let titleName;
    let titleDesc;
    if (isLockedSecret) {
      titleName = '???';
      titleDesc = badge.hint;
    } else {
      titleName = badge.name;
      titleDesc = badge.desc;
    }

    let badgeClasses;
    if (badge.active) {
      badgeClasses = 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500 shadow-[0_0_15px_-3px_rgba(234,179,8,0.2)]';
    } else {
      badgeClasses = 'bg-slate-100 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-700 opacity-50';
    }

    badgeItems.push(
      <div
        key={badge.id}
        title={`${titleName}: ${titleDesc}`}
        className={`aspect-square rounded-xl flex items-center justify-center border transition-all cursor-help ${badgeClasses}`}
      >
        {displayIcon}
      </div>
    );
  }

  let genreStatsBlock;
  if (genreStats.length === 0) {
    genreStatsBlock = <p className="text-[10px] text-slate-600 italic text-center">Add titles to see your tastes.</p>;
  } else {
    const bars = [];
    for (const [genre, count] of genreStats) {
      let widthPct = 0;
      if (allFavIds.length > 0) {
        widthPct = (count / allFavIds.length) * 100;
      }
      bars.push(
        <div key={genre}>
          <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5 text-slate-500 dark:text-slate-400">
            <span>{genre}</span><span>{count}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500" style={{ width: `${widthPct}%` }}></div>
          </div>
        </div>
      );
    }
    genreStatsBlock = <>{bars}</>;
  }

  let adultToggleTitle = "Enable adult content";
  if (isAdult) {
    adultToggleTitle = "Disable adult content";
  }

  let adultToggleBg = 'bg-slate-700';
  if (isAdult) {
    adultToggleBg = 'bg-yellow-500';
  }

  let adultKnobPos = 'translate-x-1';
  if (isAdult) {
    adultKnobPos = 'translate-x-6';
  }

  const filterOptions = [
    { key: 'all', label: 'All', count: allFavIds.length },
    { key: 'watching', label: 'Watching', count: allFavIds.filter(f => f.status === 'watching').length },
    { key: 'completed', label: 'Completed', count: allFavIds.filter(f => f.status === 'completed').length },
    { key: 'pending', label: 'Pending', count: allFavIds.filter(f => f.status === 'pending').length },
  ] as const;

  const filterButtons = [];
  for (const opt of filterOptions) {
    const active = statusFilter === opt.key;

    let btnClasses;
    if (active) {
      btnClasses = 'bg-yellow-500 text-black border-yellow-500';
    } else {
      btnClasses = 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-yellow-500/50 hover:text-yellow-500';
    }

    let countClasses = 'text-slate-400';
    if (active) {
      countClasses = 'text-black/60';
    }

    filterButtons.push(
      <button
        key={opt.key}
        onClick={() => handleStatusFilterChange(opt.key)}
        className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all ${btnClasses}`}
      >
        {opt.label}
        <span className={`ml-2 text-[10px] ${countClasses}`}>{opt.count}</span>
      </button>
    );
  }

  let libraryGrid;
  if (allFavIds.length === 0) {
    libraryGrid = (
      <div className="col-span-full flex flex-col items-center justify-center py-32 px-6 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl relative overflow-hidden group backdrop-blur-md">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/0 group-hover:bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none transition-colors duration-700"></div>
        <Compass className="w-20 h-20 text-slate-800 mb-6 stroke-[1px] relative z-10" />
        <h3 className="text-xl font-black text-slate-300 mb-2 tracking-tight relative z-10">Your library is empty</h3>
        <p className="text-slate-500 max-w-sm mb-6 text-xs relative z-10">Explore the directory, filter by your favorite genres and start forging your legend in Nakamagate.</p>
        <Link to="/directory" className="relative z-10">
          <Button className="bg-yellow-600 hover:bg-yellow-500 text-black font-black px-6 h-10 rounded-xl transition-all active:scale-95 uppercase tracking-widest text-[10px]">
            Explore
          </Button>
        </Link>
      </div>
    );
  } else if (favorites.length === 0) {
    libraryGrid = (
      <div className="col-span-full py-20 text-center text-slate-500 border border-slate-800 border-dashed rounded-3xl bg-slate-900/30 backdrop-blur-sm">
        <p className="font-semibold text-lg mb-1">Nothing here</p>
        <p className="text-sm">You have no titles with status &quot;{statusFilter}&quot;.</p>
      </div>
    );
  } else if (filteredFavorites.length === 0) {
    libraryGrid = (
      <div className="col-span-full py-20 text-center text-slate-500 border border-slate-800 border-dashed rounded-3xl bg-slate-900/30 backdrop-blur-sm">
        <p className="font-semibold text-lg mb-1">No results</p>
        <p className="text-sm">No title was found containing &quot;{searchTerm}&quot;.</p>
      </div>
    );
  } else {
    const cards = [];
    for (const fav of filteredFavorites) {
      let statusStyles = 'bg-slate-800/50 text-slate-300 border-slate-700';
      if (fav.status === 'watching') {
        statusStyles = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      } else if (fav.status === 'completed') {
        statusStyles = 'bg-green-500/10 text-green-400 border-green-500/20';
      }

      let statusLabel = 'Pending';
      if (fav.status === 'watching') {
        statusLabel = 'Watching';
      } else if (fav.status === 'completed') {
        statusLabel = 'Completed';
      }

      cards.push(
        <article key={fav.media.id} className="flex flex-col bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden group backdrop-blur-md hover:border-yellow-500/30 transition-colors">
          <Link to={`/media/${fav.media.id}`} className="relative block aspect-2/3 bg-slate-950">
            <img src={fav.media.image} alt={fav.media.title} className="w-full h-full object-cover" />
            <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border backdrop-blur-sm ${statusStyles}`}>
              {statusLabel}
            </div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); triggerDeleteModal(fav.media.id, fav.media.type); }}
              className="absolute top-1.5 right-1.5 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </Link>

          <div className="p-2 sm:p-3 flex flex-col flex-1 gap-2">
            <Link to={`/media/${fav.media.id}`}>
              <h3 className="font-bold text-[10px] sm:text-xs text-slate-700 dark:text-slate-200 line-clamp-2 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors leading-tight">{fav.media.title}</h3>
            </Link>
            <div className="relative mt-auto">
              <select
                value={fav.status}
                onChange={(e) => handleStatusChange(fav.media.id, e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[9px] sm:text-[10px] font-semibold rounded-lg pl-2 pr-6 py-1.5 focus:ring-1 focus:ring-yellow-500 appearance-none cursor-pointer"
              >
                <option value="watching">Watching</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </article>
      );
    }
    libraryGrid = <>{cards}</>;
  }

  let loadMoreContent;
  if (loadingMore) {
    loadMoreContent = (
      <>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
      </>
    );
  } else {
    loadMoreContent = `Load more · ${favoritesTotal - favorites.length} remaining`;
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-800 dark:text-slate-200 pb-20 relative font-sans overflow-hidden">

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-yellow-500/10 blur-[120px]"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]"></div>
      </div>

      {selectedFile && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full flex flex-col items-center">
            <h3 className="text-white font-black mb-6 uppercase tracking-tighter">Adjust Profile</h3>
            <div className="rounded-full overflow-hidden border-2 border-yellow-500/50 mb-6 bg-black">
              <AvatarEditor ref={editorRef} image={selectedFile} width={200} height={200} border={10} borderRadius={100} scale={scale} />
            </div>
            <input type="range" min="1" max="3" step="0.01" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-full my-6 accent-yellow-500" />
            <div className="flex gap-3 w-full">
              <Button onClick={() => setSelectedFile(null)} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={handleSaveAvatar} className="flex-1 bg-yellow-500 text-black font-bold" disabled={savingAvatar}>Confirm</Button>
            </div>
          </div>
        </div>
      )}

      {deleteAccountOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-red-900/50 p-8 rounded-3xl max-w-sm w-full flex flex-col items-center shadow-[0_0_50px_-12px_rgba(220,38,38,0.3)]">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white font-black mb-2 text-xl text-center">Delete your account?</h3>
            <p className="text-slate-400 text-sm mb-6 text-center leading-relaxed">
              This action is <span className="text-red-400 font-bold">permanent and irreversible</span>. You will lose all your favorites and reviews. Type <span className="text-white font-black">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full mb-5 bg-slate-800 border border-slate-700 focus:border-red-500/50 text-white placeholder-slate-600 px-4 py-2.5 rounded-xl focus:outline-none transition-colors"
            />
            <div className="flex gap-3 w-full">
              <Button
                onClick={() => { setDeleteAccountOpen(false); setDeleteConfirmText(''); }}
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-red-900/50 p-8 rounded-3xl max-w-sm w-full flex flex-col items-center shadow-[0_0_50px_-12px_rgba(220,38,38,0.2)]">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white font-black mb-2 text-xl text-center">Remove from library?</h3>
            <p className="text-slate-400 text-sm mb-8 text-center">This action cannot be undone. You will lose the saved progress for this title.</p>
            <div className="flex gap-3 w-full">
              <Button onClick={() => setDeleteModalOpen(false)} variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">Cancel</Button>
              <Button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold">Delete</Button>
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 border-b border-yellow-500/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-300 mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 text-slate-800 dark:text-white hover:text-yellow-500 transition-colors">
            <Home className="w-5 h-5" />
            <span className="font-bold text-sm">Home</span>
          </Link>
          <span className="font-black text-yellow-500 tracking-tighter text-xl italic uppercase">NAKAMAGATE</span>
          <div className="w-5 h-5" />
        </div>
      </nav>

      <header className="relative z-10 max-w-300 mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-8 sm:pb-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-2xl relative shadow-yellow-500/10">
            {avatarBlock}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
              }
            }}
          />
        </div>

        <div className="flex-1 text-center md:text-left">
          {aliasBlock}
          <p className="text-yellow-500/80 font-bold mt-1 text-sm tracking-widest uppercase italic flex items-center justify-center md:justify-start gap-2">
            <Star className="w-4 h-4 fill-yellow-500" /> Nakama Hunter
          </p>
        </div>
      </header>

      <div className="relative z-10 max-w-300 mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">

        <aside className="lg:col-span-1 space-y-6">

          <section className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm backdrop-blur-md">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 text-center">Record</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-100 dark:bg-slate-950/50 rounded-2xl p-3 text-center border border-slate-200 dark:border-slate-800/50">
                <p className="text-xl font-black text-slate-900 dark:text-white">{allFavIds.length}</p>
                <p className="text-[8px] uppercase text-slate-500 font-bold tracking-widest">Favorites</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-950/50 rounded-2xl p-3 text-center border border-slate-200 dark:border-slate-800/50">
                <p className="text-xl font-black text-slate-900 dark:text-white">{reviewCount}</p>
                <p className="text-[8px] uppercase text-slate-500 font-bold tracking-widest">Reviews</p>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm backdrop-blur-md">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" /> Unlocked Achievements</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {badgeItems}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm backdrop-blur-md">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-yellow-500" /> Personal Tastes</h2>
            <div className="space-y-4">
              {genreStatsBlock}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm backdrop-blur-md">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-5 flex items-center gap-2">
              <Settings className="w-4 h-4 text-yellow-500" /> Account Settings
            </h2>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Adult Content</p>
                </div>
                <p className="text-[9px] text-slate-600 leading-tight">Enable to view Ecchi and +18 content</p>
              </div>
              <button
                type="button"
                onClick={handleToggleAdult}
                disabled={savingAdult}
                title={adultToggleTitle}
                className={`relative shrink-0 w-11 h-6 rounded-full overflow-hidden transition-colors duration-200 disabled:opacity-50 ${adultToggleBg}`}
              >
                <span className={`absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${adultKnobPos}`} />
              </button>
            </div>
            <div className="border-t border-slate-800 pt-4">
              <p className="text-[9px] font-black text-red-500/70 uppercase tracking-[0.2em] mb-3">Danger Zone</p>
              <button
                onClick={() => setDeleteAccountOpen(true)}
                className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete account
              </button>
            </div>
          </section>

        </aside>

        <section className="lg:col-span-3">

          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 fill-yellow-500 text-yellow-500" />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">My Library</h2>
            </div>

            {allFavIds.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search in my library..."
                  className="pl-9 h-10 bg-white dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus-visible:ring-yellow-500 placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl"
                />
              </div>
            )}
          </header>

          {allFavIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {filterButtons}
            </div>
          )}

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {libraryGrid}
          </div>

          {hasMore && !searchTerm && (
            <div className="mt-8 flex justify-center">
              <Button
                onClick={fetchMoreFavorites}
                disabled={loadingMore}
                variant="outline"
                className="h-11 px-8 rounded-xl border-yellow-500/40 text-yellow-500 hover:bg-yellow-500 hover:text-black font-bold transition-all"
              >
                {loadMoreContent}
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
