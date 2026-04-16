import { useEffect, useState } from 'react';
import { Search, UserPlus, UserX, Users, ShieldCheck, Clock, UserSearch } from 'lucide-react';
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
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]); 
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const fetchSocialData = async () => {
    try {
      const response = await apiClient.get('/friends/social-data');
      setFriends(response.data.friends || []);
      setRequests(response.data.pending_requests || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchSocialData(); }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const response = await apiClient.get(`/auth/search?query=${searchQuery}`);
      setSearchResults(response.data || []);
    } catch (error) { console.error(error); } finally { setSearching(false); }
  };

  if (loading) return <Loader text="Cargando Gremio..." />;

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 pb-20">
      {/* 1. CONTENEDOR MAESTRO: Centraliza todo el contenido de la página */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 2. HEADER: Centrado vertical y horizontalmente */}
        <header className="py-16 flex flex-col items-center text-center">
          <Badge className="mb-4 bg-yellow-500/10 text-yellow-500 border-yellow-500/20 px-4 py-1 rounded-full uppercase tracking-tighter font-black">
            Comunidad Oficial
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 italic">
            GREMIO <span className="text-yellow-500">NAKAMA</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl font-medium">
            Gestiona tus alianzas y busca nuevos compañeros para tu próxima aventura.
          </p>
        </header>

        {/* 3. TABS: Ocupan el 100% del ancho del contenedor maestro */}
        <Tabs defaultValue="search" className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="bg-slate-900/50 border border-white/5 h-16 p-1.5 rounded-2xl w-full max-w-2xl backdrop-blur-md">
              <TabsTrigger value="search" className="flex-1 rounded-xl font-black text-xs uppercase data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
                <Search className="w-4 h-4 mr-2" /> Buscar
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex-1 rounded-xl font-black text-xs uppercase data-[state=active]:bg-yellow-500 data-[state=active]:text-black relative">
                Solicitudes {requests.length > 0 && <span className="ml-2 bg-red-600 px-1.5 rounded-md text-[10px] text-white font-black">{requests.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex-1 rounded-xl font-black text-xs uppercase data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
                Equipo
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 4. CONTENIDO: Usamos Grid para que las tarjetas no se amontonen a la izquierda */}
          
          {/* SECCIÓN BUSCAR */}
          <TabsContent value="search" className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
            {/* Buscador centrado y ancho */}
            <form onSubmit={handleSearch} className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <Input 
                  placeholder="Escribe el nombre del usuario..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-16 bg-black/40 border-slate-800 pl-14 text-lg font-bold rounded-2xl focus:border-yellow-500/50 focus:ring-4 focus:ring-yellow-500/10 transition-all"
                />
              </div>
              <Button type="submit" disabled={searching} className="h-16 px-10 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl">
                {searching ? 'Buscando...' : 'Buscar Nakama'}
              </Button>
            </form>

            {/* Grid de resultados corregido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((user: any) => (
                <Card key={user.id} className="bg-slate-900/30 border-slate-800 hover:border-yellow-500/40 transition-all rounded-3xl overflow-hidden group backdrop-blur-sm">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-2xl border-2 border-slate-800 group-hover:border-yellow-500/50 transition-colors overflow-hidden mb-4 shadow-xl">
                      <img src={getImageUrl(user.picture) || ''} className="w-full h-full object-cover" alt={user.alias} />
                    </div>
                    <p className="font-black text-xl text-white uppercase tracking-tight mb-4 truncate w-full">{user.alias}</p>
                    <Button variant="outline" className="w-full border-slate-800 hover:bg-yellow-500 hover:text-black font-bold rounded-xl gap-2 transition-all">
                      <UserPlus className="w-4 h-4" /> Reclutar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* SECCIÓN SOLICITUDES (Diseño en lista centrada) */}
          <TabsContent value="requests" className="max-w-3xl mx-auto space-y-4 animate-in fade-in duration-500">
             {requests.length === 0 ? (
               <div className="text-center py-20 opacity-30 italic">No hay mensajes en tu tablón...</div>
             ) : (
               requests.map((user: any) => (
                 <Card key={user.id} className="bg-slate-900/50 border-yellow-500/20 rounded-3xl overflow-hidden">
                   <CardContent className="p-6 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       <img src={getImageUrl(user.picture) || ''} className="w-12 h-12 rounded-full border border-yellow-500/20" alt={user.alias} />
                       <p className="font-black text-white">{user.alias}</p>
                     </div>
                     <div className="flex gap-2">
                       <Button size="sm" className="bg-green-600 hover:bg-green-500 text-white font-black rounded-xl">Aceptar</Button>
                       <Button size="sm" variant="ghost" className="text-slate-500 hover:text-red-500 font-bold">Ignorar</Button>
                     </div>
                   </CardContent>
                 </Card>
               ))
             )}
          </TabsContent>

          {/* SECCIÓN EQUIPO (Diseño equilibrado) */}
          <TabsContent value="friends" className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {friends.map((user: any) => (
                <Card key={user.id} className="bg-slate-900/40 border-slate-800 hover:border-yellow-500/20 rounded-3xl relative group overflow-hidden">
                  <CardContent className="p-8 flex flex-col items-center">
                    <div className="relative mb-4">
                      <div className="w-24 h-24 rounded-full border-4 border-yellow-500 overflow-hidden shadow-2xl">
                        <img src={getImageUrl(user.picture) || ''} className="w-full h-full object-cover" alt={user.alias} />
                      </div>
                      <ShieldCheck className="absolute bottom-0 right-0 w-8 h-8 text-yellow-500 fill-black" />
                    </div>
                    <p className="font-black text-xl text-white uppercase tracking-tight mb-1">{user.alias}</p>
                    <Badge variant="outline" className="border-yellow-500/30 text-yellow-500 text-[10px] font-black uppercase">Aliado Rango S</Badge>
                  </CardContent>
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-slate-700 hover:text-red-500"><UserX className="w-4 h-4" /></Button>
                </Card>
              ))}
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </main>
  );
}