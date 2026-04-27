import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, UserPlus, UserX, Users, ShieldCheck,
  Clock, UserSearch, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

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

  const handleSearch = async (e: React.FormEvent) => {
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
      setSearchResults(prev => prev.filter(u => u.id !== userId));
      showNotification('success', '¡Misión de reclutamiento enviada!');
    } catch (error: any) {
      const backendMessage = error.response?.data?.detail;
      
      // Personalización según lo que diga FastAPI
      if (backendMessage === "Ya son amigos" || backendMessage === "Ya existe la amistad") {
        showNotification('error', '¡Este cazador ya pertenece a tu equipo!');
      } else if (backendMessage === "Ya hay una solicitud pendiente") {
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
    <main className="min-h-screen bg-[#020617] text-slate-200 pb-20 relative">
      
      {/* NOTIFICACIÓN FLOTANTE */}
      {notification && (
        <div className="fixed top-24 right-4 md:right-8 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
            notification.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            <span className="font-bold">{notification.text}</span>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <UserX className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-white text-center mb-2">¿Romper Alianza?</h3>
            <p className="text-slate-400 text-center mb-8 font-medium">Expulsarás a <span className="text-yellow-500 font-bold uppercase">{confirmModal.alias}</span>. Esta acción no se deshace.</p>
            <div className="flex gap-3">
              <Button onClick={() => setConfirmModal({ isOpen: false, userId: null, alias: '' })} variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl">Cancelar</Button>
              <Button onClick={executeRemoveFriend} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl">Expulsar</Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-16">
        
        {/* HEADER DE LA SECCIÓN */}
        <header className="mb-10 md:mb-16">
          <Badge className="mb-4 bg-yellow-500/10 text-yellow-500 border-yellow-500/20 px-4 py-1 rounded-full uppercase tracking-tighter font-black text-xs">
            Comunidad Oficial
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 italic uppercase">
            Gremio <span className="text-yellow-500">Nakama</span>
          </h1>
        </header>

        {/* ESTRUCTURA FLEX PARA SIDEBAR (IZQUIERDA) Y CONTENIDO (DERECHA) */}
        <Tabs defaultValue="search" className="flex flex-col lg:flex-row gap-8 items-start w-full">
          
          {/* --- SIDEBAR IZQUIERDA --- */}
          <div className="w-full lg:w-72 shrink-0">
            {/* Flex-row en móvil, Flex-col en ordenador */}
            <TabsList className="bg-slate-800/80 border border-slate-700 p-2 rounded-2xl w-full flex flex-row lg:flex-col h-auto overflow-x-auto lg:overflow-visible gap-2 shadow-xl custom-scrollbar justify-start">
              
              <TabsTrigger value="search" className="flex-1 lg:w-full justify-center lg:justify-start py-4 px-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-slate-400 hover:text-slate-200 transition-all">
                <Search className="w-5 h-5 mr-3 hidden sm:block" /> Buscar Cazadores
              </TabsTrigger>
              
              <TabsTrigger value="requests" className="flex-1 lg:w-full justify-center lg:justify-start py-4 px-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-slate-400 hover:text-slate-200 transition-all flex items-center">
                <Clock className="w-5 h-5 mr-3 hidden sm:block" /> Solicitudes
                {requests.length > 0 && (
                  <span className="ml-auto bg-red-600 px-2 py-0.5 rounded-md text-[11px] text-white font-black shadow-sm">
                    {requests.length}
                  </span>
                )}
              </TabsTrigger>
              
              <TabsTrigger value="friends" className="flex-1 lg:w-full justify-center lg:justify-start py-4 px-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-slate-400 hover:text-slate-200 transition-all">
                <Users className="w-5 h-5 mr-3 hidden sm:block" /> Mi Equipo
              </TabsTrigger>

            </TabsList>
            
            {/* Pequeña tarjeta decorativa en la sidebar solo visible en escritorio */}
            <div className="hidden lg:block mt-6 p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <ShieldCheck className="w-8 h-8 text-yellow-500/50 mb-3" />
              <h4 className="text-white font-bold mb-1">Zona Segura</h4>
              <p className="text-slate-500 text-sm font-medium">Recluta con sabiduría. Un buen equipo marca la diferencia en cada misión.</p>
            </div>
          </div>

          {/* --- CONTENIDO DERECHA --- */}
          <div className="flex-1 w-full min-w-0">
            
            {/* BUSCAR */}
            <TabsContent value="search" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-yellow-500 transition-colors" />
                  <Input 
                    placeholder="Escribe el alias exacto o parcial..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-16 bg-slate-800/90 border-slate-600 pl-14 text-lg font-bold rounded-2xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 text-white shadow-md"
                  />
                </div>
                <Button type="submit" disabled={searching} className="h-16 px-10 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl shadow-lg w-full sm:w-auto text-base">
                  {searching ? 'Rastreando...' : 'Buscar'}
                </Button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {searchResults.map((user: any) => (
                  <Card key={user.id} className="bg-slate-800/80 border-slate-600 hover:border-yellow-500 shadow-xl transition-all rounded-3xl overflow-hidden group">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-2xl border-2 border-slate-700 group-hover:border-yellow-500/50 transition-colors overflow-hidden mb-5 bg-slate-900">
                        <img src={getImageUrl(user.picture) || ''} className="w-full h-full object-cover" alt={user.alias} />
                      </div>
                      <p className="font-black text-xl text-white uppercase tracking-tight mb-5 truncate w-full">{user.alias}</p>
                      <Button onClick={() => sendRequest(user.id)} variant="outline" className="w-full h-12 border-slate-600 text-slate-300 hover:bg-yellow-500 hover:text-black hover:border-yellow-500 font-bold rounded-xl gap-2 transition-all">
                        <UserPlus className="w-5 h-5" /> Reclutar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* SOLICITUDES */}
            <TabsContent value="requests" className="m-0 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
               {requests.length === 0 ? (
                 <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No tienes misiones de reclutamiento</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                   {requests.map((user: any) => (
                     <Card key={user.id} className="bg-slate-800/90 border-slate-600 hover:border-yellow-500/50 rounded-2xl shadow-lg transition-all">
                       <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                         <div className="flex items-center gap-4 w-full sm:w-auto">
                           <img src={getImageUrl(user.picture) || ''} className="w-14 h-14 rounded-full border-2 border-yellow-500/30 bg-slate-900 object-cover shrink-0" alt={user.alias} />
                           <div className="text-left">
                             <p className="font-black text-white text-lg leading-tight truncate">{user.alias}</p>
                             <span className="text-[10px] text-yellow-500 uppercase font-bold tracking-wider">Quiere unirse</span>
                           </div>
                         </div>
                         <div className="flex gap-2 w-full sm:w-auto shrink-0">
                           <Button onClick={() => acceptRequest(user.id)} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl px-6">Aceptar</Button>
                           <Button onClick={() => removeFriendDirectly(user.id)} variant="outline" size="icon" className="border-slate-600 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl">
                             <UserX className="w-4 h-4" />
                           </Button>
                         </div>
                       </CardContent>
                     </Card>
                   ))}
                 </div>
               )}
            </TabsContent>

            {/* EQUIPO */}
            <TabsContent value="friends" className="m-0 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {friends.length === 0 ? (
                  <div className="col-span-full text-center py-20 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Tu equipo está vacío</p>
                  </div>
                ) : (
                  friends.map((user: any) => (
                    <Card key={user.id} className="bg-slate-800/90 border-slate-600 hover:border-yellow-500/50 shadow-xl rounded-3xl relative group overflow-hidden">
                      <CardContent className="p-8 flex flex-col items-center">
                        <Link to={`/friend/${user.id}`} className="flex flex-col items-center w-full">
                          <div className="relative mb-5">
                            <div className="w-24 h-24 rounded-full border-4 border-yellow-500 overflow-hidden shadow-lg bg-slate-900 group-hover:scale-105 transition-transform">
                              <img src={getImageUrl(user.picture) || ''} className="w-full h-full object-cover" alt={user.alias} />
                            </div>
                            <ShieldCheck className="absolute bottom-0 right-0 w-8 h-8 text-yellow-500 fill-slate-900" />
                          </div>
                          <p className="font-black text-xl text-white uppercase tracking-tight mb-2 truncate w-full text-center group-hover:text-yellow-400 transition-colors">{user.alias}</p>
                        </Link>
                        <Badge variant="outline" className="border-yellow-500 text-yellow-500 text-[10px] font-black uppercase bg-yellow-500/10 px-3 py-0.5">Aliado Rango S</Badge>
                      </CardContent>
                      
                      <Button 
                        onClick={() => setConfirmModal({ isOpen: true, userId: user.id, alias: user.alias })}
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-3 right-3 text-slate-500 hover:text-red-500 hover:bg-red-500/20 rounded-full transition-colors"
                      >
                        <UserX className="w-5 h-5" />
                      </Button>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </main>
  );
}