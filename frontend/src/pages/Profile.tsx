import { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Heart, Star, ShieldAlert, Settings, Home,
  Edit2, Camera, Check, X, ChevronDown, Trash2, Award, BarChart3,
  Flame, Trophy, PlayCircle, Swords, Brain, Clock, Sparkles, Lock,
  Compass, Search, ShieldCheck
} from 'lucide-react';
import Loader from '../components/Loader';
import AvatarEditor from 'react-avatar-editor';

// --- INTERFACES ---
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NUEVO ESTADO: Buscador local
  const [searchTerm, setSearchTerm] = useState("");

  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [newAlias, setNewAlias] = useState("");
  const [savingAlias, setSavingAlias] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<AvatarEditor>(null);
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

  const fetchProfileData = async () => {
    try {
      const profileRes = await apiClient.get('/auth/me');
      setProfile(profileRes.data);
      setNewAlias(profileRes.data.alias);
      setIsAdult(profileRes.data.is_adult ?? false);

      const favsRes = await apiClient.get('/favorites/');
      setFavorites(favsRes.data);
    } catch (err) {
      console.error("Error cargando perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // --- LÓGICA DE BÚSQUEDA ---
  const filteredFavorites = useMemo(() => {
    if (!searchTerm.trim()) return favorites;
    return favorites.filter(fav => 
      fav.media.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [favorites, searchTerm]);

  // --- LÓGICA DE ESTADÍSTICAS DE GÉNEROS ---
  const genreStats = useMemo(() => {
    const counts: { [key: string]: number } = {};
    favorites.forEach(fav => {
      fav.media.genres?.forEach(g => {
        counts[g] = (counts[g] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [favorites]);

  // --- LÓGICA DE LOGROS ---
  const badges = useMemo(() => {
    const completedCount = favorites.filter(f => f.status === 'completed').length;
    const watchingCount = favorites.filter(f => f.status === 'watching').length;
    const pendingCount = favorites.filter(f => f.status === 'pending').length;

    const hasAction = favorites.some(f => f.media.genres?.includes('Action'));
    const hasRomance = favorites.some(f => f.media.genres?.includes('Romance'));
    const hasMystery = favorites.some(f => f.media.genres?.includes('Mystery') || f.media.genres?.includes('Psychological'));

    const uniqueGenres = new Set();
    favorites.forEach(f => f.media.genres?.forEach(g => uniqueGenres.add(g)));

    return [
      { id: 1, name: 'Iniciado', desc: 'Primera obra añadida', icon: <Star className="w-4 h-4"/>, active: favorites.length > 0 },
      { id: 2, name: 'Coleccionista', desc: 'Más de 10 favoritos', icon: <Heart className="w-4 h-4"/>, active: favorites.length >= 10 },
      { id: 3, name: 'Otaku Mayor', desc: 'Más de 50 favoritos', icon: <Flame className="w-4 h-4"/>, active: favorites.length >= 50 },
      { id: 4, name: 'Finalizador', desc: 'Una obra completada', icon: <Check className="w-4 h-4"/>, active: completedCount >= 1 },
      { id: 5, name: 'Pilar', desc: '5 obras completadas', icon: <Trophy className="w-4 h-4"/>, active: completedCount >= 5 },
      { id: 6, name: 'Al Día', desc: 'Viendo 3 obras a la vez', icon: <PlayCircle className="w-4 h-4"/>, active: watchingCount >= 3 },
      { id: 7, name: 'Guerrero', desc: 'Fan de la Acción', icon: <Swords className="w-4 h-4"/>, active: hasAction },
      { id: 8, name: 'Enamorado', desc: 'Fan del Romance', icon: <Heart className="w-4 h-4 fill-current"/>, active: hasRomance },
      { id: 9, name: 'Mente Maestra', desc: 'Fan del Misterio/Psicológico', icon: <Brain className="w-4 h-4"/>, active: hasMystery },
      { id: 10, name: 'Crítico', desc: 'Escribe tu primera reseña', icon: <Award className="w-4 h-4"/>, active: false },
      { id: 11, name: 'Procrastinador', desc: 'Tienes 10 obras en "Pendientes"', icon: <Clock className="w-4 h-4"/>, active: pendingCount >= 10, isSecret: true, hint: 'Pista: Dejas mucho para mañana...' },
      { id: 12, name: 'Ecléctico', desc: 'Has explorado 5 géneros distintos', icon: <Sparkles className="w-4 h-4"/>, active: uniqueGenres.size >= 5, isSecret: true, hint: 'Pista: En la variedad está el gusto.' },
    ];
  }, [favorites]);

  // --- ACCIONES ---
  const handleUpdateAlias = async () => {
    if (!newAlias.trim() || newAlias === profile?.alias) {
      setIsEditingAlias(false);
      return;
    }
    setSavingAlias(true);
    try {
      await apiClient.patch('/auth/me/alias', { alias: newAlias });
      window.location.reload();
    } catch (error: any) {
      console.error("Error alias:", error);
      setSavingAlias(false);
    }
  };

  const handleStatusChange = async (mediaId: number, newStatus: string) => {
    try {
      await apiClient.put(`/favorites/${mediaId}/status`, { status: newStatus });
      setFavorites(prev => prev.map(fav => 
        fav.media.id === mediaId ? { ...fav, status: newStatus } : fav
      ));
    } catch (error) {
      console.error("Error cambio estado:", error);
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
      await apiClient.delete(`/favorites/${mediaToDelete}?media_type=${mediaTypeToDelete.toLowerCase()}`);
      setFavorites(prev => prev.filter(fav => fav.media.id !== mediaToDelete));
      setDeleteModalOpen(false);
      setMediaToDelete(null);
    } catch (error) {
      console.error("Error eliminando:", error);
    }
  };

  const handleToggleAdult = async () => {
    const newValue = !isAdult;
    setSavingAdult(true);
    try {
      await apiClient.patch('/auth/me/adult', { is_adult: newValue });
      setIsAdult(newValue);
    } catch (error) {
      console.error("Error actualizando preferencia:", error);
    } finally {
      setSavingAdult(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINAR') return;
    try {
      await apiClient.delete('/auth/me');
      localStorage.removeItem('token');
      window.location.href = '/';
    } catch (error) {
      console.error("Error eliminando cuenta:", error);
    }
  };

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

  if (loading) return <Loader text="Cargando perfil..." />;
  if (!profile) return <div className="text-white p-10 text-center">Perfil no encontrado.</div>;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-800 dark:text-slate-200 pb-20 relative font-sans overflow-hidden">
      
      {/* FONDOS MEZCLADOS: CUADRÍCULA + DESTELLOS DE AURA */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-yellow-500/10 blur-[120px]"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]"></div>
      </div>

      {/* MODAL EDITOR AVATAR */}
      {selectedFile && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full flex flex-col items-center">
            <h3 className="text-white font-black mb-6 uppercase tracking-tighter">Ajustar Perfil</h3>
            <div className="rounded-full overflow-hidden border-2 border-yellow-500/50 mb-6 bg-black">
              <AvatarEditor ref={editorRef} image={selectedFile} width={200} height={200} border={10} borderRadius={100} scale={scale} />
            </div>
            <input type="range" min="1" max="3" step="0.01" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-full my-6 accent-yellow-500" />
            <div className="flex gap-3 w-full">
              <Button onClick={() => setSelectedFile(null)} variant="outline" className="flex-1">Cancelar</Button>
              <Button onClick={handleSaveAvatar} className="flex-1 bg-yellow-500 text-black font-bold" disabled={savingAvatar}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BORRAR CUENTA */}
      {deleteAccountOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-red-900/50 p-8 rounded-3xl max-w-sm w-full flex flex-col items-center shadow-[0_0_50px_-12px_rgba(220,38,38,0.3)]">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white font-black mb-2 text-xl text-center">¿Eliminar tu cuenta?</h3>
            <p className="text-slate-400 text-sm mb-6 text-center leading-relaxed">
              Esta acción es <span className="text-red-400 font-bold">permanente e irreversible</span>. Perderás todos tus favoritos y reseñas. Escribe <span className="text-white font-black">ELIMINAR</span> para confirmar.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Escribe ELIMINAR"
              className="w-full mb-5 bg-slate-800 border border-slate-700 focus:border-red-500/50 text-white placeholder-slate-600 px-4 py-2.5 rounded-xl focus:outline-none transition-colors"
            />
            <div className="flex gap-3 w-full">
              <Button
                onClick={() => { setDeleteAccountOpen(false); setDeleteConfirmText(''); }}
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'ELIMINAR'}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-red-900/50 p-8 rounded-3xl max-w-sm w-full flex flex-col items-center shadow-[0_0_50px_-12px_rgba(220,38,38,0.2)]">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white font-black mb-2 text-xl text-center">¿Eliminar de la biblioteca?</h3>
            <p className="text-slate-400 text-sm mb-8 text-center">Esta acción no se puede deshacer. Perderás el progreso guardado para esta obra.</p>
            <div className="flex gap-3 w-full">
              <Button onClick={() => setDeleteModalOpen(false)} variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">Cancelar</Button>
              <Button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold">Eliminar</Button>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-yellow-500/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-300 mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 text-slate-800 dark:text-white hover:text-yellow-500 transition-colors">
            <Home className="w-5 h-5" />
            <span className="font-bold text-sm">Inicio</span>
          </Link>
          <span className="font-black text-yellow-500 tracking-tighter text-xl italic uppercase">NAKAMAGATE</span>
          <Settings className="w-5 h-5 text-slate-500 cursor-pointer hover:text-white" />
        </div>
      </nav>

      {/* HEADER */}
      <header className="relative z-10 max-w-300 mx-auto px-6 pt-12 pb-10 flex flex-col md:flex-row items-center gap-8">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-2xl relative shadow-yellow-500/10">
            {profile.picture ? (
              <img src={profile.picture} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl font-black text-yellow-500 bg-slate-900 uppercase">{profile.alias.substring(0, 2)}</div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {if(e.target.files?.[0]) setSelectedFile(e.target.files[0])}} />
        </div>

        <div className="flex-1 text-center md:text-left">
          {isEditingAlias ? (
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Input value={newAlias} onChange={(e) => setNewAlias(e.target.value)} className="h-10 bg-white dark:bg-slate-800 border-yellow-500/50 text-slate-900 dark:text-white font-bold max-w-xs" autoFocus />
              <Button onClick={handleUpdateAlias} size="icon" className="bg-green-600"><Check className="w-4 h-4"/></Button>
              <Button onClick={() => setIsEditingAlias(false)} size="icon" variant="outline"><X className="w-4 h-4"/></Button>
            </div>
          ) : (
            <div className="flex items-center justify-center md:justify-start gap-4">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white">{profile.alias}</h1>
              <button onClick={() => setIsEditingAlias(true)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-all"><Edit2 className="w-4 h-4" /></button>
            </div>
          )}
          <p className="text-yellow-500/80 font-bold mt-1 text-sm tracking-widest uppercase italic flex items-center justify-center md:justify-start gap-2">
            <Star className="w-4 h-4 fill-yellow-500" /> Cazador Nakama
          </p>
        </div>
      </header>

      {/* CUERPO DEL PERFIL */}
      <div className="relative z-10 max-w-300 mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* COLUMNA IZQUIERDA: STATS Y LOGROS (Más estrecha) */}
        <aside className="lg:col-span-1 space-y-6">
          
          <section className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm backdrop-blur-md">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 text-center">Expediente</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-100 dark:bg-slate-950/50 rounded-2xl p-3 text-center border border-slate-200 dark:border-slate-800/50">
                <p className="text-xl font-black text-slate-900 dark:text-white">{favorites.length}</p>
                <p className="text-[8px] uppercase text-slate-500 font-bold tracking-widest">Favoritos</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-950/50 rounded-2xl p-3 text-center border border-slate-200 dark:border-slate-800/50">
                <p className="text-xl font-black text-slate-900 dark:text-white">0</p>
                <p className="text-[8px] uppercase text-slate-500 font-bold tracking-widest">Reseñas</p>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm backdrop-blur-md">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" /> Logros Desbloqueados</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {badges.map(badge => {
                const isLockedSecret = badge.isSecret && !badge.active;
                const displayIcon = isLockedSecret ? <Lock className="w-3.5 h-3.5" /> : badge.icon;
                return (
                  <div key={badge.id} title={`${isLockedSecret ? '???' : badge.name}: ${isLockedSecret ? badge.hint : badge.desc}`} 
                    className={`aspect-square rounded-xl flex items-center justify-center border transition-all cursor-help
                      ${badge.active ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500 shadow-[0_0_15px_-3px_rgba(234,179,8,0.2)]' : 'bg-slate-100 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-700 opacity-50'}`}
                  >
                    {displayIcon}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm backdrop-blur-md">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-yellow-500" /> Gustos Personales</h2>
            <div className="space-y-4">
              {genreStats.length > 0 ? genreStats.map(([genre, count]) => (
                <div key={genre}>
                  <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5 text-slate-500 dark:text-slate-400">
                    <span>{genre}</span><span>{count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: `${(count / favorites.length) * 100}%` }}></div>
                  </div>
                </div>
              )) : <p className="text-[10px] text-slate-600 italic text-center">Añade obras para ver tus gustos.</p>}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm backdrop-blur-md">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-5 flex items-center gap-2">
              <Settings className="w-4 h-4 text-yellow-500" /> Ajustes de Cuenta
            </h2>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Contenido Adulto</p>
                </div>
                <p className="text-[9px] text-slate-600 leading-tight">Activa para ver contenido Ecchi y +18</p>
              </div>
              <button
                type="button"
                onClick={handleToggleAdult}
                disabled={savingAdult}
                title={isAdult ? "Desactivar contenido adulto" : "Activar contenido adulto"}
                className={`relative shrink-0 w-11 h-6 rounded-full overflow-hidden transition-colors duration-200 disabled:opacity-50 ${isAdult ? 'bg-yellow-500' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${isAdult ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="border-t border-slate-800 pt-4">
              <p className="text-[9px] font-black text-red-500/70 uppercase tracking-[0.2em] mb-3">Zona Peligrosa</p>
              <button
                onClick={() => setDeleteAccountOpen(true)}
                className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar cuenta
              </button>
            </div>
          </section>

        </aside>

        {/* COLUMNA DERECHA: BIBLIOTECA (Más ancha y con imágenes más pequeñas) */}
        <section className="lg:col-span-3">
          
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 fill-yellow-500 text-yellow-500" />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Mi Biblioteca</h2>
            </div>
            
            {/* NUEVO: BARRA DE BÚSQUEDA */}
            {favorites.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar en mi biblioteca..."
                  className="pl-9 h-10 bg-white dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus-visible:ring-yellow-500 placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl"
                />
              </div>
            )}
          </header>

          {/* GRID MODIFICADO PARA IMÁGENES MÁS PEQUEÑAS */}
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            
            {favorites.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-32 px-6 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl relative overflow-hidden group backdrop-blur-md">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/0 group-hover:bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none transition-colors duration-700"></div>
                <Compass className="w-20 h-20 text-slate-800 mb-6 stroke-[1px] relative z-10" />
                <h3 className="text-xl font-black text-slate-300 mb-2 tracking-tight relative z-10">Tu biblioteca está vacía</h3>
                <p className="text-slate-500 max-w-sm mb-6 text-xs relative z-10">Explora el directorio, filtra por tus géneros favoritos y empieza a forjar tu leyenda en Nakamagate.</p>
                <Link to="/directory" className="relative z-10">
                  <Button className="bg-yellow-600 hover:bg-yellow-500 text-black font-black px-6 h-10 rounded-xl transition-all active:scale-95 uppercase tracking-widest text-[10px]">
                    Explorar
                  </Button>
                </Link>
              </div>
            ) : filteredFavorites.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-500 border border-slate-800 border-dashed rounded-3xl bg-slate-900/30 backdrop-blur-sm">
                <p className="font-semibold text-lg mb-1">Sin resultados</p>
                <p className="text-sm">No se ha encontrado ninguna obra que contenga "{searchTerm}".</p>
              </div>
            ) : (
              filteredFavorites.map((fav) => {
                const statusStyles = 
                  fav.status === 'watching' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  fav.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  'bg-slate-800/50 text-slate-300 border-slate-700';

                return (
                  <article key={fav.media.id} className="flex flex-col bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden group backdrop-blur-md hover:border-yellow-500/30 transition-colors">
                    <div className="relative block aspect-2/3 bg-slate-950">
                      <img src={fav.media.image} alt={fav.media.title} className="w-full h-full object-cover" />
                      <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border backdrop-blur-sm ${statusStyles}`}>
                        {fav.status === 'watching' ? 'Viendo' : fav.status === 'completed' ? 'Completado' : 'Pendiente'}
                      </div>
                      <button 
                        onClick={() => triggerDeleteModal(fav.media.id, fav.media.type)}
                        className="absolute top-1.5 right-1.5 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

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
                          <option value="watching">Viendo</option>
                          <option value="completed">Completado</option>
                          <option value="pending">Pendiente</option>
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}