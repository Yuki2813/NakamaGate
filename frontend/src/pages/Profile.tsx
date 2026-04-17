import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Heart, Star, ShieldAlert, Settings, Home, Play, 
  CheckCircle2, Clock, Edit2, Camera, Check, X, RefreshCw 
} from 'lucide-react';
import { getImageUrl } from '../utils/helpers';
import Loader from '../components/Loader';
import AvatarEditor from 'react-avatar-editor';

interface MediaData {
  id: number;
  type: string;
  title: string;
  image: string;
  score: number;
}

interface FavoriteItem {
  id: number; // ID de la relación de favorito
  status: string;
  media: MediaData;
}

interface FriendUser {
  id: number;
  alias: string;
  picture: string | null;
}

interface SocialData {
  friends: FriendUser[];
  pending: FriendUser[];
}

interface UserProfile {
  id: number;
  alias: string;
  picture: string | null;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [userFriends, setUserFriends] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS PARA EDICIÓN DE ALIAS ---
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [newAlias, setNewAlias] = useState("");
  const [savingAlias, setSavingAlias] = useState(false);

  // --- ESTADOS PARA RECORTE DE AVATAR ---
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

      const socialRes = await apiClient.get('/friends/social-data');
      setUserFriends(socialRes.data?.friends || []);

    } catch (err) {
      console.error("Error cargando el perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // ================= ACCIONES DE ALIAS =================
  const handleUpdateAlias = async () => {
    if (!newAlias.trim() || newAlias === profile?.alias) {
      setIsEditingAlias(false);
      return;
    }
    setSavingAlias(true);
    try {
      // Ajusta esta ruta a tu endpoint de FastAPI para actualizar el perfil
      await apiClient.put('/auth/profile', { alias: newAlias });
      setProfile(prev => prev ? { ...prev, alias: newAlias } : null);
      setIsEditingAlias(false);
    } catch (error) {
      console.error("Error actualizando alias:", error);
      alert("Error al cambiar el alias.");
    } finally {
      setSavingAlias(false);
    }
  };

  // ================= ACCIONES DE AVATAR =================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSaveAvatar = async () => {
    if (editorRef.current) {
      setSavingAvatar(true);
      // Extraemos el lienzo (canvas) con la imagen recortada
      const canvasScaled = editorRef.current.getImageScaledToCanvas();
      
      // Convertimos el canvas a un archivo Blob (jpg)
      canvasScaled.toBlob(async (blob) => {
        if (!blob) return;
        const formData = new FormData();
        formData.append("file", blob, "avatar.jpg"); // "file" es el nombre que suele esperar FastAPI (UploadFile)

        try {
          // Ajusta esta ruta a tu endpoint de FastAPI para subir avatares
          const res = await apiClient.post('/auth/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          // Actualizamos la foto en el estado local con la URL que devuelva el back
          setProfile(prev => prev ? { ...prev, picture: res.data.picture_url || res.data.picture } : null);
          setSelectedFile(null); // Cerramos el modal
        } catch (error) {
          console.error("Error subiendo avatar:", error);
          alert("Error al subir el nuevo avatar.");
        } finally {
          setSavingAvatar(false);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  // ================= ACCIONES DE FAVORITOS =================
  const handleToggleStatus = async (favId: number, currentStatus: string) => {
    // Ciclo de estados: pendiente -> watching -> completed -> pending...
    let nextStatus = 'watching';
    if (currentStatus === 'watching') nextStatus = 'completed';
    if (currentStatus === 'completed') nextStatus = 'pending';

    try {
      // Ajusta la ruta a tu endpoint de actualización de favoritos
      await apiClient.put(`/favorites/${favId}/status`, { status: nextStatus });
      
      // Actualizamos el estado local para verlo al instante
      setFavorites(prev => prev.map(fav => 
        fav.id === favId ? { ...fav, status: nextStatus } : fav
      ));
    } catch (error) {
      console.error("Error cambiando estado:", error);
    }
  };


  if (loading) return <Loader text="Accediendo al expediente..." />;

  if (!profile) return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-yellow-500">Error al cargar tu perfil</h1>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-yellow-500/30 pb-20 relative">
      
      {/* ================= MODAL RECORTE AVATAR ================= */}
      {selectedFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col items-center">
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-wider">Ajustar Avatar</h3>
            
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-black mb-6">
              <AvatarEditor
                ref={editorRef}
                image={selectedFile}
                width={250}
                height={250}
                border={20}
                borderRadius={125} // Mitad del width para hacerlo circular
                color={[0, 0, 0, 0.7]} // Color del borde de recorte
                scale={scale}
                rotate={0}
              />
            </div>

            <div className="w-full mb-8">
              <label className="text-xs font-bold text-slate-400 mb-2 block uppercase">Zoom</label>
              <input 
                type="range" 
                min="1" max="3" step="0.01" 
                value={scale} 
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full accent-yellow-500"
              />
            </div>

            <div className="flex gap-3 w-full">
              <Button onClick={() => setSelectedFile(null)} variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl" disabled={savingAvatar}>
                Cancelar
              </Button>
              <Button onClick={handleSaveAvatar} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl" disabled={savingAvatar}>
                {savingAvatar ? 'Guardando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= NAVEGACIÓN SUPERIOR ================= */}
      <nav className="sticky top-0 z-50 border-b border-yellow-500/20 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-[1200px] mx-auto px-6 md:px-16 py-4 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 text-white hover:text-yellow-400 transition-colors">
            <Home className="w-5 h-5" />
            <span className="font-semibold text-sm">Volver a Home</span>
          </Link>
          <div className="text-center">
            <h1 className="font-black text-white tracking-tight">NakamaGate</h1>
          </div>
          <div className="w-20 text-right">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-yellow-500">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ================= CABECERA DEL PERFIL ================= */}
      <header className="relative w-full max-w-[1200px] mx-auto px-6 md:px-16 pt-12 pb-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 w-full">
          
          {/* AVATAR INTERACTIVO */}
          <div className="relative group shrink-0">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-slate-800 bg-slate-900 overflow-hidden shadow-2xl relative">
              {getImageUrl(profile.picture) ? (
                <img src={getImageUrl(profile.picture)!} alt={profile.alias} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl font-black text-yellow-500 bg-slate-900 uppercase">
                  {(profile.alias || 'NA').substring(0, 2)}
                </div>
              )}
              
              {/* Overlay Hover para cambiar foto */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
              >
                <Camera className="w-10 h-10 text-white mb-2" />
              </div>
            </div>
            
            {/* Input archivo oculto */}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
          </div>

          {/* INFO Y ALIAS */}
          <div className="flex-1 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between w-full gap-6">
            <div>
              {/* LÓGICA DE EDICIÓN DE ALIAS */}
              {isEditingAlias ? (
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <Input 
                    value={newAlias} 
                    onChange={(e) => setNewAlias(e.target.value)} 
                    className="h-12 text-2xl font-black bg-slate-800 border-yellow-500/50 text-white max-w-[250px] rounded-xl"
                    autoFocus
                  />
                  <Button onClick={handleUpdateAlias} disabled={savingAlias} className="bg-green-600 hover:bg-green-500 text-white rounded-xl h-12 w-12 p-0">
                    <Check className="w-5 h-5" />
                  </Button>
                  <Button onClick={() => {setIsEditingAlias(false); setNewAlias(profile.alias)}} variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl h-12 w-12 p-0">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center md:justify-start gap-4 group cursor-pointer" onClick={() => setIsEditingAlias(true)}>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight group-hover:text-yellow-500 transition-colors">
                    {profile.alias}
                  </h1>
                  <Edit2 className="w-5 h-5 text-slate-500 group-hover:text-yellow-500 transition-colors" />
                </div>
              )}

              <p className="text-yellow-400 font-semibold mt-2 flex items-center justify-center md:justify-start gap-2">
                <Star className="w-5 h-5 fill-yellow-400" /> Cazador Oficial
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-16 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* COLUMNA IZQUIERDA (ESTADÍSTICAS Y AMIGOS) */}
        <aside className="lg:col-span-1 space-y-8">
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Expediente</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#020617] rounded-2xl p-4 text-center border border-slate-800/50">
                <span className="block text-3xl font-black text-yellow-500">{favorites.length}</span>
                <span className="text-xs font-medium text-slate-400">Archivados</span>
              </div>
              <div className="bg-[#020617] rounded-2xl p-4 text-center border border-slate-800/50">
                <span className="block text-3xl font-black text-yellow-500">{userFriends.length}</span>
                <span className="text-xs font-medium text-slate-400">Aliados</span>
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Tu Equipo</h2>
            {userFriends && userFriends.length > 0 ? (
              <ul className="space-y-4">
                {userFriends.slice(0, 5).map((friend) => (
                  <li key={friend.id}>
                    <Link to={`/friend/${friend.id}`} className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-full border-2 border-slate-700 bg-slate-800 overflow-hidden group-hover:border-yellow-500 transition-colors">
                        {getImageUrl(friend.picture) ? (
                          <img src={getImageUrl(friend.picture)!} alt={friend.alias} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-yellow-500 bg-slate-900">
                            {friend.alias.substring(0,2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="font-black text-slate-300 group-hover:text-yellow-500 transition-colors tracking-wide">
                        {friend.alias}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic text-center py-4">Aún no tienes aliados.</p>
            )}
          </section>
        </aside>

        {/* COLUMNA DERECHA (FAVORITOS CON CAMBIO DE ESTADO) */}
        <div className="lg:col-span-2 space-y-10">
          <section>
            <header className="flex items-center gap-3 mb-6">
              <Heart className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Tu Santuario</h2>
            </header>

            {favorites.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                {favorites.map((fav) => {
                  const media = fav.media;
                  if (!media) return null;

                  const getStatusBadge = (status: string) => {
                    switch(status?.toLowerCase()) {
                      case 'watching': return { icon: Play, label: 'Viendo', color: 'bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/40' };
                      case 'completed': return { icon: CheckCircle2, label: 'Visto', color: 'bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/40' };
                      case 'on_hold': return { icon: Clock, label: 'Pausa', color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/40' };
                      case 'pending':
                      default: return { icon: RefreshCw, label: 'Pendiente', color: 'bg-slate-500/20 border-slate-500/30 text-slate-300 hover:bg-slate-500/40' };
                    }
                  };

                  const statusBadge = getStatusBadge(fav.status);
                  const StatusIcon = statusBadge.icon;

                  return (
                    <article key={media.id} className="group relative">
                      <Link to={`/media/${media.id}`} className="block focus:outline-none">
                        <figure className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 group-hover:border-yellow-500/50 shadow-lg transition-all duration-300">
                          <img src={media.image} alt={media.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60"></div>
                        </figure>
                        <h3 className="mt-3 text-sm font-bold leading-tight line-clamp-2 text-slate-300 group-hover:text-yellow-500 transition-colors">
                          {media.title}
                        </h3>
                      </Link>

                      {/* BOTÓN CAMBIO DE ESTADO RÁPIDO */}
                      <button 
                        onClick={(e) => { e.preventDefault(); handleToggleStatus(fav.id, fav.status); }}
                        className={`absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border backdrop-blur-md transition-all cursor-pointer ${statusBadge.color} shadow-lg`}
                        title="Clic para cambiar estado"
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider hidden group-hover:inline-block">
                          {statusBadge.label}
                        </span>
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl p-12 text-center">
                <Heart className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-300 mb-2">Santuario vacío</h3>
                <p className="text-slate-500 text-sm">Aún no has añadido obras a tus favoritos.</p>
              </div>
            )}
          </section>
        </div>

      </div>
    </main>
  );
}