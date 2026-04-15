import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Button } from "@/components/ui/button";
import { Heart, Home, Star, Trash2, Edit2, Send } from 'lucide-react';

const BACKEND_URL = "http://localhost:8000";

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

interface Review {
  id: number;
  user: {
    id: number;
    alias: string;
    picture: string | null;
  };
  score: number;
  content: string;
  created_at: string;
}

interface FavoriteCheckResponse {
  is_favorite: boolean;
}

export default function MediaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
  };
  
  const [media, setMedia] = useState<MediaDetailData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const [reviewScore, setReviewScore] = useState(3);
  const [reviewContent, setReviewContent] = useState('');
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const loadMediaData = async () => {
      try {
        // Cargar detalles del media
        const mediaRes = await apiClient.get(`/content/${id}`);
        setMedia(mediaRes.data);

        // Cargar reseñas
        try {
          const mediaType = mediaRes.data.type?.toLowerCase() || 'anime';
          const reviewsRes = await apiClient.get(`/reviews/media/${id}?media_type=${mediaType}`);
          const reviewsData = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
          setReviews(reviewsData);
          console.log("Reseñas cargadas:", reviewsData);
        } catch (reviewErr) {
          console.error("Error cargando reseñas:", reviewErr);
        }

        // Verificar si es favorito
        try {
          const checkRes = await apiClient.get<FavoriteCheckResponse>(`/favorites/check/${id}`);
          setIsFavorite(checkRes.data.is_favorite);
        } catch (favErr) {
          console.error("Error verificando favorito:", favErr);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error cargando detalles:", err);
        setLoading(false);
      }
    };

    loadMediaData();
  }, [id]);

  const handleToggleFavorite = async () => {
    try {
      const mediaType = media?.type?.toLowerCase();
      if (isFavorite) {
        await apiClient.delete(`/favorites/${id}?media_type=${mediaType}`);
      } else {
        await apiClient.post('/favorites/', {
          media_id: id,
          media_type: mediaType
        });
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error("Error actualizando favorito:", err);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewContent.trim() || reviewScore < 0 || reviewScore > 5) {
      alert('Por favor completa la reseña correctamente');
      return;
    }

    setSubmittingReview(true);
    try {
      const mediaType = media?.type?.toLowerCase();
      if (userReview && isEditingReview) {
        // Actualizar reseña existente
        await apiClient.put(`/reviews/${userReview.id}`, {
          id_api: id,
          media_type: mediaType,
          score: reviewScore,
          content: reviewContent
        });
        setUserReview({
          ...userReview,
          score: reviewScore,
          content: reviewContent
        });
        setIsEditingReview(false);
      } else {
        // Crear nueva reseña
        const newReviewRes = await apiClient.post('/reviews/', {
          id_api: id,
          media_type: mediaType,
          score: reviewScore,
          content: reviewContent
        });
        setUserReview(newReviewRes.data);
      }
      setReviewContent('');
      setReviewScore(3);
      
      // Recargar reseñas
      const reviewsRes = await apiClient.get(`/reviews/media/${id}?media_type=${mediaType}`);
      const reviewsData = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
      setReviews(reviewsData);
    } catch (err) {
      console.error("Error enviando reseña:", err);
      alert('Error al guardar la reseña');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;
    if (!confirm('¿Estás seguro de que quieres eliminar tu reseña?')) return;

    try {
      await apiClient.delete(`/reviews/${userReview.id}`);
      setUserReview(null);
      setReviewContent('');
      setReviewScore(3);
      
      // Recargar reseñas
      const mediaType = media?.type?.toLowerCase() || 'anime';
      const reviewsRes = await apiClient.get(`/reviews/media/${id}?media_type=${mediaType}`);
      const reviewsData = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
      setReviews(reviewsData);
    } catch (err) {
      console.error("Error eliminando reseña:", err);
      alert('Error al eliminar la reseña');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  if (!media) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white gap-6">
        <h2 className="text-3xl font-bold">Obra no encontrada</h2>
        <Button onClick={() => navigate('/home')} className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold">
          Volver a Home
        </Button>
      </main>
    );
  }

  const backgroundImageUrl = media.banner || media.image;

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 font-sans pb-20 relative">
      
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl absolute top-0 right-1/4"></div>
      </div>

      {/* BANNER SUAVE */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img src={backgroundImageUrl} alt="banner" className="w-full h-full object-cover opacity-100" />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(2, 6, 23, 0) 0%, rgba(2, 6, 23, 0.4) 60%, rgba(2, 6, 23, 1) 100%)'
        }}></div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-16 relative z-10 -mt-48 md:-mt-60 pt-8">
        
        {/* Botón Volver */}
        <button
          onClick={() => navigate('/home')}
          className="mb-6 p-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-full transition-all"
        >
          <Home className="w-5 h-5 text-yellow-400" />
        </button>
        
        {/* CABECERA CON IMAGEN Y INFO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          
          {/* Poster */}
          <div className="md:col-span-1 flex justify-center md:justify-start">
            <div className="w-48 h-72 rounded-2xl overflow-hidden border-4 border-[#020617] shadow-2xl shadow-yellow-500/20 bg-slate-800 flex-shrink-0">
              <img src={media.image} alt={media.title} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Información */}
          <div className="md:col-span-3 mt-16 md:mt-0">
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-bold rounded-full">
                {media.status}
              </span>
              <span className="px-3 py-1 bg-slate-700 text-slate-300 text-xs font-bold rounded-full">
                {media.type}
              </span>
              {media.is_adult && (
                <span className="px-3 py-1 bg-red-600/30 border border-red-500/30 text-red-400 text-xs font-bold rounded-full">
                  +18
                </span>
              )}
            </div>

            {/* Títulos */}
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              {media.title}
            </h1>
            {media.title_en && media.title_en !== media.title && (
              <p className="text-xl text-slate-400 mb-6">{media.title_en}</p>
            )}

            {/* Metadatos */}
            <div className="flex flex-wrap gap-4 mb-8 text-sm font-medium">
              <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-white font-bold">{media.score > 0 ? media.score : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800">
                <span className="text-slate-400">{media.year || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800">
                <span className="text-slate-400">{media.units > 0 ? media.units : '?'} {media.type === 'ANIME' ? 'Eps' : 'Caps'}</span>
              </div>
            </div>

            {/* Géneros */}
            <div className="flex flex-wrap gap-2 mb-8">
              {media.genres.map(genre => (
                <span key={genre} className="px-3 py-1 bg-slate-800/50 border border-slate-700 text-slate-300 text-sm rounded-lg">
                  {genre}
                </span>
              ))}
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-3">
              <Button
                onClick={handleToggleFavorite}
                className="h-12 px-6 rounded-xl font-bold flex items-center gap-2 transition-all"
                style={{
                  backgroundColor: isFavorite ? '#dc2626' : '#b45309',
                  color: 'white'
                }}
              >
                <Heart className="w-5 h-5" style={{ fill: isFavorite ? 'white' : 'none' }} />
                {isFavorite ? 'En Favoritos' : 'Añadir a Favoritos'}
              </Button>
            </div>
          </div>
        </div>

        {/* SINOPSIS */}
        <section className="mb-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Sinopsis</h2>
          <p className="text-slate-300 leading-relaxed whitespace-pre-line">
            {media.description || 'No hay sinopsis disponible.'}
          </p>
        </section>

        {/* MI RESEÑA */}
        <section className="mb-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Mi Reseña</h2>
          
          {userReview && !isEditingReview ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5"
                        style={{
                          fill: i < userReview.score ? '#eab308' : 'transparent',
                          color: i < userReview.score ? '#eab308' : '#475569'
                        }}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingReview(true)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-slate-300 mb-4">{userReview.content}</p>
              <button
                onClick={handleDeleteReview}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm"
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
              {/* Selector de puntuación */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Puntuación</label>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setReviewScore(i + 1)}
                      className="p-2 hover:scale-110 transition-transform"
                    >
                      <Star
                        className="w-6 h-6 cursor-pointer transition-colors"
                        style={{
                          fill: i < reviewScore ? '#eab308' : 'transparent',
                          color: i < reviewScore ? '#eab308' : '#64748b'
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Texto de reseña */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Tu Reseña (máx. 255 caracteres)
                </label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value.slice(0, 255))}
                  placeholder="Comparte tu opinión..."
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:border-yellow-500/50 resize-none"
                  rows={4}
                />
                <p className="text-xs text-slate-500 mt-1">{reviewContent.length}/255</p>
              </div>

              {/* Botones */}
              <div className="flex gap-3 justify-end">
                {isEditingReview && (
                  <button
                    onClick={() => {
                      setIsEditingReview(false);
                      if (userReview) {
                        setReviewScore(userReview.score);
                        setReviewContent(userReview.content);
                      }
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <Button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isEditingReview ? 'Actualizar' : 'Publicar'} Reseña
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* RESEÑAS DE OTROS USUARIOS */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">
            Reseñas de la Comunidad ({reviews.length})
          </h2>
          
          {reviews && reviews.length > 0 ? (
            <div className="grid gap-4">
              {reviews.map(review => (
                <div key={review.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {review.user.picture ? (
                        <img 
                          src={getImageUrl(review.user.picture)}
                          alt={review.user.alias}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-yellow-500/30 flex items-center justify-center">
                          <span className="text-xs font-bold text-yellow-400">{review.user.alias[0]}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white">{review.user.alias}</p>
                        <div className="flex gap-1 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4"
                              style={{
                                fill: i < review.score ? '#eab308' : 'transparent',
                                color: i < review.score ? '#eab308' : '#475569'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-300">{review.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-xl p-8 text-center">
              <p className="text-slate-400">Aún no hay reseñas. ¡Sé el primero!</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}