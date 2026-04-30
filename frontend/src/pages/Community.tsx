import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, UserPlus, UserX, Users, ShieldCheck,
  Clock, AlertTriangle, CheckCircle2, Swords, ExternalLink
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from '../api/client';
import { getImageUrl } from '../utils/helpers';
import Loader from '../components/Loader';

export default function Community() {
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  // IDs rápidos para lookup
  const friendIds = useMemo(() => new Set(friends.map((f: any) => f.id)), [friends]);
  const incomingIds = useMemo(() => new Set(requests.map((r: any) => r.id)), [requests]);

  // Estados UI
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, userId: number | null, alias: string }>({
    isOpen: false, userId: null, alias: ''
  });

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000); 
  };

  const fetchSocialData = async () => {
    try {
      const response = await apiClient.get('/friends/social-data');
      setFriends(response.data.friends || []);
      setRequests(response.data.pending || []);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchSocialData(); }, []);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const response = await apiClient.get(`/auth/search?alias=${searchQuery}`);
      setSearchResults(response.data || []);
    } catch (error) { console.error(error); } finally { setSearching(false); }
  };

  // --- SOLICITUD CON MENSAJES PERSONALIZADOS ---
  const sendRequest = async (userId: number) => {
    try {
      await apiClient.post(`/friends/request/${userId}`);
      setSentRequests(prev => new Set(prev).add(userId));
      showNotification('success', '¡Misión de reclutamiento enviada!');
    } catch (error: any) {
      const backendMessage = error.response?.data?.detail;
      if (backendMessage === "Ya son amigos" || backendMessage === "Ya existe la amistad") {
        showNotification('error', '¡Este cazador ya pertenece a tu equipo!');
      } else if (backendMessage === "Ya hay una solicitud pendiente") {
        setSentRequests(prev => new Set(prev).add(userId));
        showNotification('error', 'Paciencia, ya le enviaste una invitación.');
      } else if (backendMessage === "No te puedes enviar solicitud a ti mismo") {
        showNotification('error', 'No puedes reclutarte a ti mismo, lobo solitario.');
      } else {
        showNotification('error', backendMessage || 'El cazador no está disponible.');
      }
    }
  };

  const acceptRequest = async (userId: number) => {
    try {
      await apiClient.put(`/friends/accept/${userId}`);
      fetchSocialData();
      showNotification('success', '¡Nuevo aliado en tu equipo!');
    } catch (error: any) {
      showNotification('error', error.response?.data?.detail || 'El pacto falló.');
    }
  };

  const removeFriendDirectly = async (userId: number) => {
    try {
      await apiClient.delete(`/friends/remove/${userId}`);
      fetchSocialData();
    } catch (error: any) {
      showNotification('error', 'Fallo al procesar la petición.');
    }
  };

  const executeRemoveFriend = async () => {
    if (!confirmModal.userId) return;
    try {
      await apiClient.delete(`/friends/remove/${confirmModal.userId}`);
      fetchSocialData();
      showNotification('success', 'Alianza disuelta correctamente.');
    } catch (error: any) {
      showNotification('error', 'No se pudo disolver la alianza.');
    } finally {
      setConfirmModal({ isOpen: false, userId: null, alias: '' });
    }
  };

  if (loading) return <Loader text="Cargando Gremio..." />;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-800 dark:text-slate-200 pb-20 relative overflow-hidden">

      {/* Fondos decorativos */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-yellow-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      {/* NOTIFICACIÓN FLOTANTE */}
      {notification && (
        <div className="fixed top-24 right-4 md:right-8 z-50 animate-in fade-in slide-in-from-top-5 duration-300 max-w-sm">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
            notification.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span className="font-bold text-sm">{notification.text}</span>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <UserX className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">¿Romper Alianza?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-8 font-medium text-sm">
              Expulsarás a <span className="text-yellow-500 font-bold uppercase">{confirmModal.alias}</span>. Esta acción no se deshace.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setConfirmModal({ isOpen: false, userId: null, alias: '' })} variant="outline" className="flex-1 border-slate-300 dark:border-slate-700 rounded-xl">Cancelar</Button>
              <Button onClick={executeRemoveFriend} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl">Expulsar</Button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-350 mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-16">

        {/* HEADER */}
        <header className="mb-10 md:mb-14">
          <div className="flex items-center gap-3 mb-3">
            <Swords className="w-5 h-5 text-yellow-500" />
            <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 px-3 py-0.5 rounded-full uppercase tracking-widest font-black text-[10px]">
              Comunidad Oficial
            </Badge>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">
            Gremio <span className="text-yellow-500">Nakama</span>
          </h1>
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium max-w-md">
            Encuentra aliados, gestiona solicitudes y forja tu equipo de confianza.
          </p>
        </header>

        <Tabs defaultValue="search" className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start w-full">

          {/* ── SIDEBAR ── */}
          <div className="w-full lg:w-64 shrink-0">
            <TabsList className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl w-full flex flex-row lg:flex-col h-auto overflow-x-auto lg:overflow-visible gap-1.5 shadow-sm justify-start">

              <TabsTrigger value="search" className="flex-1 lg:w-full justify-center lg:justify-start py-3 px-2 sm:py-3.5 sm:px-4 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all gap-2">
                <Search className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">Buscar</span>
                <span className="hidden sm:inline">Buscar Cazadores</span>
              </TabsTrigger>

              <TabsTrigger value="requests" className="flex-1 lg:w-full justify-center lg:justify-start py-3 px-2 sm:py-3.5 sm:px-4 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Solicitudes</span>
                {requests.length > 0 && (
                  <span className="ml-auto bg-red-500 px-1.5 py-0.5 rounded-md text-[10px] text-white font-black animate-pulse">
                    {requests.length}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger value="friends" className="flex-1 lg:w-full justify-center lg:justify-start py-3 px-2 sm:py-3.5 sm:px-4 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all gap-2">
                <Users className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">Equipo</span>
                <span className="hidden sm:inline">Mi Equipo</span>
                {friends.length > 0 && (
                  <span className="ml-auto text-[10px] font-black text-slate-400 dark:text-slate-600">{friends.length}</span>
                )}
              </TabsTrigger>

            </TabsList>

            {/* Info card desktop */}
            <div className="hidden lg:flex flex-col gap-4 mt-5">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <ShieldCheck className="w-7 h-7 text-yellow-500/60 mb-3" />
                <h4 className="text-slate-900 dark:text-white font-bold text-sm mb-1">Zona Segura</h4>
                <p className="text-slate-500 text-xs leading-relaxed">Recluta con sabiduría. Un buen equipo marca la diferencia en cada misión.</p>
              </div>
              {(sentRequests.size > 0) && (
                <div className="p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
                  <p className="text-yellow-500 text-xs font-bold uppercase tracking-wider mb-1">Solicitudes enviadas</p>
                  <p className="text-slate-500 text-xs">{sentRequests.size} en espera de respuesta</p>
                </div>
              )}
            </div>
          </div>

          {/* ── CONTENIDO ── */}
          <div className="flex-1 w-full min-w-0">

            {/* BUSCAR */}
            <TabsContent value="search" className="m-0 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
                  <Input
                    placeholder="Busca por alias..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 pl-12 text-base font-semibold rounded-2xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 text-slate-900 dark:text-white shadow-sm"
                  />
                </div>
                <Button type="submit" disabled={searching} className="h-14 px-8 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl shadow-lg w-full sm:w-auto">
                  {searching ? 'Buscando...' : 'Buscar'}
                </Button>
              </form>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map((user: any) => {
                    const isFriend    = friendIds.has(user.id);
                    const hasSent     = sentRequests.has(user.id);
                    const hasIncoming = incomingIds.has(user.id);

                    return (
                      <div key={user.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                        isFriend    ? 'bg-yellow-500/5 border-yellow-500/30 dark:bg-yellow-500/5'
                        : hasSent   ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        : hasIncoming ? 'bg-blue-500/5 border-blue-500/20'
                        : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-yellow-500/40 hover:shadow-md'
                      }`}>

                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                          <img src={getImageUrl(user.picture) || ''} className="w-full h-full object-cover" alt={user.alias} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{user.alias}</p>
                          {isFriend && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-500 uppercase tracking-wider">
                              <ShieldCheck className="w-3 h-3" /> Ya en tu equipo
                            </span>
                          )}
                          {hasSent && !isFriend && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <Clock className="w-3 h-3" /> Solicitud enviada · esperando respuesta
                            </span>
                          )}
                          {hasIncoming && !isFriend && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                              <CheckCircle2 className="w-3 h-3" /> Quiere unirse a ti
                            </span>
                          )}
                          {!isFriend && !hasSent && !hasIncoming && (
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Cazador disponible</span>
                          )}
                        </div>

                        {/* Acción */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Link to={`/friend/${user.id}`}>
                            <Button variant="outline" size="sm" className="rounded-xl border-yellow-500/40 text-yellow-500 hover:bg-yellow-500 hover:text-black gap-1.5 font-bold text-xs">
                              <ExternalLink className="w-3.5 h-3.5" /> Ver perfil
                            </Button>
                          </Link>
                          {isFriend ? null : hasSent ? (
                            <span className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
                              Enviada
                            </span>
                          ) : hasIncoming ? (
                            <Button onClick={() => acceptRequest(user.id)} size="sm" className="rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Aceptar
                            </Button>
                          ) : (
                            <Button onClick={() => sendRequest(user.id)} size="sm" className="rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs gap-1.5">
                              <UserPlus className="w-3.5 h-3.5" /> Reclutar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {searchResults.length === 0 && searchQuery && !searching && (
                <div className="text-center py-16 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/30">
                  <Search className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold text-sm">Sin resultados para "{searchQuery}"</p>
                </div>
              )}
            </TabsContent>

            {/* SOLICITUDES */}
            <TabsContent value="requests" className="m-0 space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
              {requests.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold text-sm">No hay solicitudes pendientes</p>
                </div>
              ) : (
                requests.map((user: any) => (
                  <div key={user.id} className="flex items-center gap-4 p-4 sm:p-5 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-yellow-500/30 transition-all">
                    <div className="relative shrink-0">
                      <img src={getImageUrl(user.picture) || ''} className="w-14 h-14 rounded-2xl object-cover border-2 border-yellow-500/30 bg-slate-100 dark:bg-slate-800" alt={user.alias} />
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 dark:text-white truncate">{user.alias}</p>
                      <p className="text-[11px] text-yellow-500 font-bold uppercase tracking-wider">Quiere unirse a tu equipo</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button onClick={() => acceptRequest(user.id)} size="sm" className="bg-green-600 hover:bg-green-500 text-white font-black rounded-xl px-4 gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aceptar
                      </Button>
                      <Button onClick={() => removeFriendDirectly(user.id)} variant="outline" size="icon" className="border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 rounded-xl w-9 h-9">
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* EQUIPO */}
            <TabsContent value="friends" className="m-0 animate-in fade-in slide-in-from-right-4 duration-300">
              {friends.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold text-sm">Tu equipo está vacío</p>
                  <p className="text-slate-400 text-xs mt-1">Busca cazadores y empieza a reclutar</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {friends.map((user: any) => (
                    <div key={user.id} className="group relative bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-yellow-500/40 hover:shadow-lg transition-all">

                      {/* Degradado superior decorativo */}
                      <div className="absolute top-0 left-0 right-0 h-20 bg-linear-to-b from-yellow-500/5 to-transparent pointer-events-none" />

                      <div className="p-5 flex items-center gap-4">
                        <Link to={`/friend/${user.id}`} className="relative shrink-0">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-yellow-500/40 bg-slate-100 dark:bg-slate-800 group-hover:border-yellow-500 transition-colors shadow-md">
                            <img src={getImageUrl(user.picture) || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={user.alias} />
                          </div>
                          <ShieldCheck className="absolute -bottom-1 -right-1 w-5 h-5 text-yellow-500 drop-shadow-sm" />
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link to={`/friend/${user.id}`}>
                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight truncate group-hover:text-yellow-500 transition-colors">{user.alias}</p>
                          </Link>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aliado</span>
                          <div className="mt-2">
                            <Link to={`/friend/${user.id}`}>
                              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg border-slate-200 dark:border-slate-700 text-slate-500 hover:border-yellow-500/50 hover:text-yellow-500 font-bold gap-1 px-2.5">
                                <ExternalLink className="w-3 h-3" /> Ver perfil
                              </Button>
                            </Link>
                          </div>
                        </div>

                        <Button
                          onClick={() => setConfirmModal({ isOpen: true, userId: user.id, alias: user.alias })}
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-slate-300 dark:text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl w-8 h-8 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </main>
  );
}