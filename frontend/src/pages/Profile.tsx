import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings, Heart, Star, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';    

interface UserData {
  id: number;
  email: string;
  alias: string;
  picture: string;
  rol: string;
}

export default function Profile() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/auth/me')
      .then(res => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center font-black uppercase animate-pulse">Cargando perfil...</div>;
  if (!user) return <div className="p-20 text-center font-black">No se encontró el usuario.</div>;

 return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 dark:bg-slate-900 transition-colors duration-300">
      
      {/* BOTÓN VOLVER (NUEVO) */}
      <div className="mb-8">
        <Link to="/home">
          <Button variant="outline" className="border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white dark:bg-white dark:text-black transition-all">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al Home
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
        {/* COLUMNA 1: AVATAR */}
        <div className="w-full md:w-1/3 flex flex-col gap-6">
          <div className="relative group">
            <img 
              src={`http://localhost:8000${user.picture}`} 
              alt={user.alias}
              className="w-full aspect-square object-cover border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(147,51,234,1)] rounded-xl bg-white"
            />
          </div>
          <Button className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase transition-all">
            <Settings className="w-5 h-5 mr-2" />
            Editar Perfil
          </Button>
        </div>

        {/* COLUMNA 2: INFO (Con clases dark: para el modo oscuro) */}
        <div className="w-full md:w-2/3">
          <h1 className="text-6xl font-black uppercase italic tracking-tighter mb-2 dark:text-white">
            {user.alias}
          </h1>
          <p className="text-xl font-bold text-slate-500 mb-8 dark:text-slate-400">
            {user.email}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {/* Las tarjetas ahora cambian de color en dark mode */}
            <div className="bg-white dark:bg-slate-800 dark:text-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <span className="flex items-center text-xs font-black uppercase text-slate-400 mb-1">
                <Heart className="w-4 h-4 mr-1 text-red-500" /> Favoritos
              </span>
              <span className="text-3xl font-black">0</span>
            </div>
            {/* Repetir estructura para Reseñas y Nakamas... */}
          </div>

          <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:bg-slate-800 dark:text-white">
            <CardHeader className="border-b-4 border-black bg-slate-50 dark:bg-slate-700">
              <CardTitle className="font-black uppercase italic">Muro de Actividad</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <p className="font-bold text-lg italic text-slate-400 dark:text-slate-500 text-center">
                "Aún no has compartido ninguna reseña con tus nakamas..."
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}