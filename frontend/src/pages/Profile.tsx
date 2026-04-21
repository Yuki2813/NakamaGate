import { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Heart, Star, ShieldAlert, Settings, Home, 
  Edit2, Camera, Check, X, ChevronDown, Trash2, Award, BarChart3
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
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [newAlias, setNewAlias] = useState("");
  const [savingAlias, setSavingAlias] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<AvatarEditor>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scale, setScale] = useState(1.2);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const fetchProfileData = async () => {
    try {
      const profileRes = await apiClient.get('/auth/me');
      setProfile(profileRes.data);
      setNewAlias(profileRes.data.alias);

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
    return [
      { id: 1, name: 'Iniciado', desc: 'Primera obra añadida', icon: <Star className="w-4 h-4"/>, active: favorites.length > 0 },
      { id: 2, name: 'Coleccionista', desc: 'Más de 10 favoritos', icon: <Heart className="w-4 h-4"/>, active: favorites.length >= 10 },
      { id: 3, name: 'Finalizador', desc: 'Una obra completada', icon: <Check className="w-4 h-4"/>, active: favorites.some(f => f.status === 'completed') },
      { id: 4, name: 'Crítico', desc: 'Escribe tu primera reseña', icon: <Award className="w-4 h-4"/>, active: false },
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

  const handleDeleteFavorite = async (mediaId: number) => {
    if (!window.confirm("¿Eliminar de tu biblioteca?")) return;
    try {
      // Nota: Asegúrate de que tu backend use 'media_type' como query param si es necesario
      await apiClient.delete(`/favorites/${mediaId}?media_type=anime`);
      setFavorites(prev => prev.filter(fav => fav.media.id !== mediaId));
    } catch (error) {
      console.error("Error eliminando:", error);
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
    <main className="min-h-screen bg-[#020617] text-slate-200 pb-20 relative font-sans">
      
      {/* MODAL EDITOR AVATAR */}
      {selectedFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
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

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-yellow-500/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 text-white hover:text-yellow-500 transition-colors">
            <Home className="w-5 h-5" />
            <span className="font-bold text-sm">Inicio</span>
          </Link>
          <span className="font-black text-yellow-500 tracking-tighter text-xl italic uppercase">NAKAMAGATE</span>
          <Settings className="w-5 h-5 text-slate-500 cursor-pointer hover:text-white" />
        </div>
      </nav>

      {/* HEADER */}
      <header className="max-w-[1200px] mx-auto px-6 pt-12 pb-10 flex flex-col md:flex-row items-center gap-8">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-40 h-40 md:w-44 md:h-44 rounded-full border-4 border-slate-800 overflow-hidden bg-slate-900 shadow-2xl relative shadow-yellow-500/10">
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
              <Input value={newAlias} onChange={(e) => setNewAlias(e.target.value)} className="h-10 bg-slate-800 border-yellow-500/50 text-white font-bold max-w-xs" autoFocus />
              <Button onClick={handleUpdateAlias} size="icon" className="bg-green-600"><Check className="w-4 h-4"/></Button>
              <Button onClick={() => setIsEditingAlias(false)} size="icon" variant="outline"><X className="w-4 h-4"/></Button>
            </div>
          ) : (
            <div className="flex items-center justify-center md:justify-start gap-4">
              <h1 className="text-4xl font-black text-white">{profile.alias}</h1>
              <button onClick={() => setIsEditingAlias(true)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-all"><Edit2 className="w-4 h-4" /></button>
            </div>
          )}
          <p className="text-yellow-500/80 font-bold mt-1 text-sm tracking-widest uppercase italic flex items-center justify-center md:justify-start gap-2">
            <Star className="w-4 h-4 fill-yellow-500" /> Cazador Nakama
          </p>
        </div>
      </header>

      {/* CUERPO DEL PERFIL */}
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* COLUMNA IZQUIERDA: STATS Y LOGROS */}
        <aside className="lg:col-span-1 space-y-6">
          
          {/* STATS RÁPIDAS */}
          <section className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-sm">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 text-center">Expediente</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/50 rounded-2xl p-4 text-center border border-slate-800/50">
                <p className="text-2xl font-black text-white">{favorites.length}</p>
                <p className="text-[8px] uppercase text-slate-500 font-bold tracking-widest">Favoritos</p>
              </div>
              <div className="bg-slate-950/50 rounded-2xl p-4 text-center border border-slate-800/50">
                <p className="text-2xl font-black text-white">0</p>
                <p className="text-[8px] uppercase text-slate-500 font-bold tracking-widest">Reseñas</p>
              </div>
            </div>
          </section>

          {/* SECCIÓN LOGROS */}
          <section className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-sm">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" /> Logros Desbloqueados</h2>
            <div className="grid grid-cols-4 gap-3">
              {badges.map(badge => (
                <div key={badge.id} title={`${badge.name}: ${badge.desc}`} className={`aspect-square rounded-xl flex items-center justify-center border transition-all ${badge.active ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' : 'bg-slate-950/50 border-slate-800 text-slate-700 opacity-50'}`}>
                  {badge.icon}
                </div>
              ))}
            </div>
          </section>

          {/* SECCIÓN GÉNEROS */}
          <section className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-sm">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-yellow-500" /> Gustos Personales</h2>
            <div className="space-y-4">
              {genreStats.length > 0 ? genreStats.map(([genre, count]) => (
                <div key={genre}>
                  <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5 text-slate-400">
                    <span>{genre}</span>
                    <span>{count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: `${(count / favorites.length) * 100}%` }}></div>
                  </div>
                </div>
              )) : <p className="text-xs text-slate-600 italic text-center">Añade obras para ver tus gustos.</p>}
            </div>
          </section>

        </aside>

        {/* COLUMNA DERECHA: BIBLIOTECA */}
        <section className="lg:col-span-2">
          <header className="flex items-center gap-3 mb-8">
            <Heart className="w-5 h-5 fill-yellow-500 text-yellow-500" />
            <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Mi Biblioteca</h2>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {favorites.map((fav) => {
              const statusStyles = 
                fav.status === 'watching' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                fav.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                'bg-slate-800/50 text-slate-300 border-slate-700';

              return (
                <article key={fav.media.id} className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group">
                  <div className="relative block aspect-[2/3] bg-slate-950">
                    <img src={fav.media.image} alt={fav.media.title} className="w-full h-full object-cover" />
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border backdrop-blur-sm ${statusStyles}`}>
                      {fav.status === 'watching' ? 'Viendo' : fav.status === 'completed' ? 'Completado' : 'Pendiente'}
                    </div>
                    {/* BOTÓN ELIMINAR FLOTANTE */}
                    <button 
                      onClick={() => handleDeleteFavorite(fav.media.id)}
                      className="absolute top-2 right-2 p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-3 flex flex-col flex-1 gap-3">
                    <Link to={`/media/${fav.media.id}`}>
                      <h3 className="font-bold text-xs text-slate-200 line-clamp-2 hover:text-yellow-400 transition-colors">{fav.media.title}</h3>
                    </Link>
                    <div className="relative mt-auto">
                      <select
                        value={fav.status}
                        onChange={(e) => handleStatusChange(fav.media.id, e.target.value)}
                        className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-[10px] font-semibold rounded-lg pl-3 pr-8 py-2 focus:ring-1 focus:ring-yellow-500 appearance-none cursor-pointer"
                      >
                        <option value="watching">Viendo</option>
                        <option value="completed">Completado</option>
                        <option value="pending">Pendiente</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}