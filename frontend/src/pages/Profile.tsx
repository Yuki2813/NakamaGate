import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Button } from "@/components/ui/button";
import { Heart, Star, ShieldAlert, Settings, Home, Play, CheckCircle2, Clock } from 'lucide-react';
import { getImageUrl } from '../utils/helpers';
import Loader from '../components/Loader';

interface MediaData {
  id: number;
  type: string;
  title: string;
  image: string;
  score: number;
}

interface FavoriteItem {
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
  const [socialData, setSocialData] = useState<SocialData | null>(null);
  const [userFriends, setUserFriends] = useState<FriendUser[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // 1. Cargar MI Perfil
        const profileRes = await apiClient.get('/auth/me');
        setProfile(profileRes.data);
        console.log("Mi perfil cargado:", profileRes.data);

        // 2. Cargar MIS Favoritos
        const favsRes = await apiClient.get('/favorites/');
        setFavorites(favsRes.data);
        console.log("Mis favoritos cargados:", favsRes.data);

        // 3. Cargar MIS Datos Sociales
        const socialRes = await apiClient.get('/friends/social-data');
        setSocialData(socialRes.data);
        console.log("Mis amigos cargados:", socialRes.data?.friends);

        // 4. Cargar MIS amigos
        setUserFriends(socialRes.data?.friends || []);

        setLoading(false);
      } catch (err) {
        console.error("Error cargando el perfil:", err);
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);



  const handleSendRequest = async () => {
    if (!profile) return;
    try {
      await apiClient.post(`/friends/request/${profile.id}`);
      alert("Petición de amistad enviada.");
    } catch (error) {
      console.error("Error al enviar petición:", error);
    }
  };

  const handleRemoveFriend = async () => {
    if (!profile) return;
    try {
      await apiClient.delete(`/friends/remove/${profile.id}`);
      alert("Amigo eliminado de tu red.");
    } catch (error) {
      console.error("Error al eliminar amigo:", error);
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
    <main className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-yellow-500/30 pb-20">
      
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
          <div className="w-20"></div>
        </div>
      </nav>

      {/* ================= CABECERA DEL PERFIL ================= */}
      <header className="relative w-full max-w-[1200px] mx-auto px-6 md:px-16 pt-12 pb-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
          <div className="relative group shrink-0">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl border-4 border-[#020617] bg-slate-800 overflow-hidden shadow-[0_0_40px_-5px_rgba(234,179,8,0.4)]">
              {getImageUrl(profile.picture) ? (
                <img src={getImageUrl(profile.picture)!} alt={profile.alias} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl font-black text-yellow-500 bg-slate-900 uppercase">
                  {(profile.alias || 'NA').substring(0, 2)}
                </div>
              )}
            </div>
            <button className="absolute bottom-2 right-2 md:bottom-4 md:right-4 w-12 h-12 bg-yellow-500 text-black rounded-full flex items-center justify-center hover:bg-yellow-400 border-4 border-[#020617] transition-colors shadow-lg" title="Editar Perfil">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between w-full gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                {profile.alias}
              </h1>
              <p className="text-yellow-400 font-semibold mt-2 flex items-center justify-center md:justify-start gap-2">
                <Star className="w-5 h-5 fill-yellow-400" /> Mi Perfil Nakama
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-16 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* COLUMNA IZQUIERDA (ESTADÍSTICAS Y AMIGOS) */}
        <aside className="lg:col-span-1 space-y-8">
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Estadísticas</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#020617] rounded-2xl p-4 text-center border border-slate-800/50">
                <span className="block text-3xl font-black text-yellow-500">{favorites.length}</span>
                <span className="text-xs font-medium text-slate-400">Favoritos</span>
              </div>
              <div className="bg-[#020617] rounded-2xl p-4 text-center border border-slate-800/50">
                <span className="block text-3xl font-black text-yellow-500">{userFriends.length}</span>
                <span className="text-xs font-medium text-slate-400">Amigos</span>
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">
              Tu Red de Nakamas
            </h2>
            
            {userFriends && userFriends.length > 0 ? (
              <ul className="space-y-4">
                {userFriends.slice(0, 5).map((friend) => (
                  <li key={friend.id}>
                    <Link to={`/friend/${friend.id}`} className="flex items-center gap-3 group">
                      <div className="w-10 h-10 rounded-full bg-[#020617] border border-slate-700 overflow-hidden group-hover:border-yellow-500 transition-colors">
                        {getImageUrl(friend.picture) ? (
                          <img src={getImageUrl(friend.picture)!} alt={friend.alias} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-yellow-500 bg-slate-900">
                            {friend.alias.substring(0,2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-slate-300 group-hover:text-yellow-500 transition-colors">
                        {friend.alias}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic text-center py-4">Aún no tienes amigos en tu red.</p>
            )}
          </section>
        </aside>

        {/* COLUMNA DERECHA (FAVORITOS) */}
        <div className="lg:col-span-2 space-y-10">
          <section aria-labelledby="favorites-title">
            <header className="flex items-center gap-3 mb-6">
              <Heart className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <h2 id="favorites-title" className="text-2xl font-bold text-white tracking-tight">Tu Santuario (Favoritos)</h2>
            </header>

            {favorites.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                {favorites.map((fav) => {
                  const media = fav.media; // Extraemos la data del anime/manga
                  if (!media) return null;

                  // Función para obtener el icono y color según el estado
                  const getStatusBadge = (status: string) => {
                    switch(status?.toLowerCase()) {
                      case 'watching':
                        return { icon: Play, label: 'Viendo', color: 'bg-blue-500/20 border-blue-500/30 text-blue-300' };
                      case 'completed':
                        return { icon: CheckCircle2, label: 'Completado', color: 'bg-green-500/20 border-green-500/30 text-green-300' };
                      case 'on_hold':
                        return { icon: Clock, label: 'En Pausa', color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300' };
                      default:
                        return { icon: Heart, label: status || 'Favorito', color: 'bg-red-500/20 border-red-500/30 text-red-300' };
                    }
                  };

                  const statusBadge = getStatusBadge(fav.status);
                  const StatusIcon = statusBadge.icon;

                  return (
                    <article key={media.id} className="group cursor-pointer">
                      <Link to={`/media/${media.id}`} className="block focus:outline-none">
                        <figure className="relative aspect-[2/3] overflow-hidden rounded-xl bg-slate-900 border border-slate-800 group-hover:border-yellow-500/50 shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                          
                          <img src={media.image} alt={media.title} className="w-full h-full object-cover" loading="lazy" />
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/95 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border w-fit ${statusBadge.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              <span className="text-xs font-bold uppercase">{statusBadge.label}</span>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-yellow-500 uppercase block">{media.type}</span>
                              <span className="text-xs text-slate-300">★ {media.score.toFixed(1)}</span>
                            </div>
                          </div>

                          {/* Badge flotante de estado */}
                          <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg border ${statusBadge.color} group-hover:hidden transition-opacity`}>
                            <StatusIcon className="w-3 h-3" />
                            <span className="text-xs font-bold uppercase">{statusBadge.label}</span>
                          </div>
                        </figure>
                        <h3 className="mt-3 text-sm font-semibold leading-tight line-clamp-2 text-slate-300 group-hover:text-yellow-500 transition-colors">
                          {media.title}
                        </h3>
                      </Link>
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