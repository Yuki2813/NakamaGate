import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Interfaz calcada de tu JSON
interface MediaDetailData {
  id: number;
  type: string;
  title: string;
  title_en: string;
  image: string;
  banner: string | null;
  score: number;
  status: string;
  description: string;
  units: number;
  genres: string[];
  year: number;
  is_adult: boolean;
}

export default function MediaDetail() {
  const { id } = useParams<{ id: string }>(); 
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/content/${id}`)
      .then(res => {
        setMedia(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando detalles:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="animate-spin w-16 h-16 border-8 border-black border-t-purple-600 rounded-full"></div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] gap-4">
        <h2 className="text-4xl font-black uppercase">Obra no encontrada</h2>
        <Button onClick={() => navigate('/home')} className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold">
          Volver al Inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-black pb-20">
      
      {/* BANNER SUPERIOR */}
      <div 
        className="w-full h-48 md:h-64 bg-purple-600 border-b-4 border-black relative bg-cover bg-center"
        style={{ backgroundImage: media.banner ? `url(${media.banner})` : 'none' }}
      >
        <div className="absolute top-4 left-4">
          <Link to="/home">
            <Button className="bg-white text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white font-black uppercase transition-all">
              ← Volver
            </Button>
          </Link>
        </div>
        {/* Etiqueta de estado en la esquina del banner */}
        <div className="absolute bottom-4 right-4 bg-black text-white px-4 py-1 font-black uppercase border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transform rotate-2">
          {media.status}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 relative -mt-20 md:-mt-32">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* COLUMNA IZQUIERDA: IMAGEN Y BOTONES */}
          <div className="w-full md:w-1/3 flex flex-col items-center md:items-start gap-6">
            <img 
              src={media.image} 
              alt={media.title} 
              className="w-48 md:w-full rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] object-cover bg-white"
            />
            
            <Button className="w-full h-14 text-lg font-black uppercase bg-black text-white hover:bg-yellow-400 hover:text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
              Añadir a mi lista
            </Button>
            
            <Button className="w-full h-14 text-lg font-black uppercase bg-white text-black hover:bg-purple-600 hover:text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
              Escribir Reseña
            </Button>
          </div>

          {/* COLUMNA DERECHA: INFORMACIÓN */}
          <div className="w-full md:w-2/3 pt-4 md:pt-36">
            <div className="flex flex-wrap gap-2 mb-4">
              {media.genres.map(genre => (
                <Badge key={genre} className="bg-white text-black border-2 border-black font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {genre}
                </Badge>
              ))}
            </div>

            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2 leading-none">
              {media.title}
            </h1>
            
            {media.title_en && media.title_en !== media.title && (
              <h2 className="text-xl font-bold text-slate-500 mb-6 italic">
                {media.title_en}
              </h2>
            )}

            <div className="flex items-center gap-6 mb-8 border-b-4 border-black pb-6 mt-6">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Puntuación</span>
                <span className="text-3xl font-black">⭐ {media.score > 0 ? media.score : 'N/A'}</span>
              </div>
              <div className="w-1 h-12 bg-black"></div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Año</span>
                <span className="text-xl font-black">{media.year || 'N/A'}</span>
              </div>
              <div className="w-1 h-12 bg-black"></div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{media.type === 'ANIME' ? 'Episodios' : 'Caps'}</span>
                <span className="text-xl font-black">{media.units > 0 ? media.units : '?'}</span>
              </div>
            </div>

            <h3 className="text-2xl font-black italic mb-4">SINOPSIS</h3>
            
            {/* whitespace-pre-line respeta los \n\n que vienen en tu JSON */}
            <p className="text-lg font-medium text-slate-700 leading-relaxed border-l-4 border-purple-600 pl-4 whitespace-pre-line">
              {media.description || 'No hay sinopsis disponible.'}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}