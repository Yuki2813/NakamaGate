import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import {
  Heart, ArrowLeft, Star, Trash2, Edit2, Send,
  AlertTriangle, BookOpen, Tv, CheckCircle, Clock,
  Eye, X, Play, ExternalLink, Users, GitBranch
} from 'lucide-react';

const BACKEND_URL = "http://localhost:8000";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Trailer     { id: string; url: string; thumbnail: string | null }
interface StreamLink  { site: string; url: string; color: string | null; icon: string | null }
interface Character   { id: number; name: string; image: string | null; role: string }
interface Relation    { id: number; title: string; image: string | null; type: string; format: string; relation: string }
interface StaffMember { id: number; name: string; image: string | null; role: string }
interface Studio      { id: number; name: string; url: string | null }

interface MediaDetailData {
  id: number; type: string; title: string; title_en: string;
  image: string; banner: string | null; score: number; status: string;
  description: string; units: number; genres: string[]; year: number;
  is_adult: boolean;
  trailer:    Trailer | null;
  streaming:  StreamLink[];
  characters: Character[];
  relations:  Relation[];
  staff:      StaffMember[];
  studios:    Studio[];
}

interface Review {
  id: number;
  user: { id: number; alias: string; picture: string | null };
  score: number; content: string; created_at: string;
}

interface CurrentUser { id: number; alias: string }

// ── Constantes ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'watching',      label: 'Viendo',     icon: Eye },
  { value: 'completed',     label: 'Completado', icon: CheckCircle },
  { value: 'plan_to_watch', label: 'Pendiente',  icon: Clock },
] as const;

const RELATION_LABELS: Record<string, string> = {
  SEQUEL:      'Secuela',
  PREQUEL:     'Precuela',
  SIDE_STORY:  'Historia paralela',
  SPIN_OFF:    'Spin-off',
  PARENT:      'Obra original',
  ALTERNATIVE: 'Alternativa',
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function MediaDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
  };

  const [media,        setMedia]        = useState<MediaDetailData | null>(null);
  const [reviews,      setReviews]      = useState<Review[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [accessError,  setAccessError]  = useState<string | null>(null);
  const [currentUser,  setCurrentUser]  = useState<CurrentUser | null>(null);

  const [isFavorite,    setIsFavorite]    = useState(false);
  const [favStatus,     setFavStatus]     = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [reviewScore,      setReviewScore]      = useState(3);
  const [reviewContent,    setReviewContent]    = useState('');
  const [userReview,       setUserReview]       = useState<Review | null>(null);
  const [isEditingReview,  setIsEditingReview]  = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [toast,         setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [trailerOpen,   setTrailerOpen]   = useState(false);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const reloadReviews = async (type: string) => {
    const res = await apiClient.get(`/reviews/media/${id}?media_type=${type}`);
    return Array.isArray(res.data) ? res.data : [];
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, mediaRes] = await Promise.all([
          apiClient.get('/auth/me'),
          apiClient.get(`/content/${id}`),
        ]);
        const me: CurrentUser    = meRes.data;
        const m: MediaDetailData = mediaRes.data;
        setCurrentUser(me);
        setMedia(m);

        const mediaType = m.type?.toLowerCase() || 'anime';

        const [reviewsRes, favRes] = await Promise.allSettled([
          apiClient.get(`/reviews/media/${id}?media_type=${mediaType}`),
          apiClient.get(`/favorites/check/${id}`),
        ]);

        if (reviewsRes.status === 'fulfilled') {
          const all: Review[] = Array.isArray(reviewsRes.value.data) ? reviewsRes.value.data : [];
          setReviews(all);
          // Buscamos la reseña del usuario actual comparando IDs
          const mine = all.find(r => r.user.id === me.id) || null;
          setUserReview(mine);
          if (mine) { setReviewScore(mine.score); setReviewContent(mine.content); }
        }
        if (favRes.status === 'fulfilled') {
          setIsFavorite(favRes.value.data.is_favorite);
          setFavStatus(favRes.value.data.status || null);
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
          setAccessError(err.response?.data?.detail || "Acceso restringido (+18).");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSetStatus = async (status: string) => {
    if (statusLoading) return;
    setStatusLoading(true);
    try {
      const mediaType = media?.type?.toLowerCase();
      if (favStatus === status) {
        await apiClient.delete(`/favorites/${id}?media_type=${mediaType}`);
        setIsFavorite(false); setFavStatus(null);
      } else {
        if (isFavorite) {
          await apiClient.patch(`/favorites/${id}`, { status, media_type: mediaType });
        } else {
          await apiClient.post('/favorites/', { media_id: id, media_type: mediaType, status });
          setIsFavorite(true);
        }
        setFavStatus(status);
      }
    } catch { showToast('No se pudo actualizar el estado.', 'err'); }
    finally   { setStatusLoading(false); }
  };

  const handleSubmitReview = async () => {
    if (!reviewContent.trim() || reviewScore < 1 || reviewScore > 5) {
      showToast('Completa la reseña con puntuación y texto.', 'err'); return;
    }
    setSubmittingReview(true);
    try {
      const mediaType = media?.type?.toLowerCase();
      if (userReview && isEditingReview) {
        await apiClient.put(`/reviews/${userReview.id}`, {
          id_api: id, media_type: mediaType, score: reviewScore, content: reviewContent
        });
        setUserReview({ ...userReview, score: reviewScore, content: reviewContent });
        setIsEditingReview(false);
        showToast('Reseña actualizada.');
      } else {
        const res = await apiClient.post('/reviews/', {
          id_api: id, media_type: mediaType, score: reviewScore, content: reviewContent
        });
        setUserReview(res.data);
        showToast('Reseña publicada.');
      }
      setReviews(await reloadReviews(media?.type?.toLowerCase() || 'anime'));
    } catch { showToast('Error al guardar la reseña.', 'err'); }
    finally   { setSubmittingReview(false); }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;
    try {
      await apiClient.delete(`/reviews/${userReview.id}`);
      setUserReview(null); setReviewScore(3); setReviewContent('');
      setConfirmDelete(false);
      setReviews(await reloadReviews(media?.type?.toLowerCase() || 'anime'));
      showToast('Reseña eliminada.');
    } catch { showToast('Error al eliminar la reseña.', 'err'); }
  };

  // ── Estados de carga / error ──────────────────────────────────────────────

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-[#020617]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">Cargando...</p>
      </div>
    </main>
  );

  if (accessError) return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white px-4">
      <div className="bg-gradient-to-br from-red-950/40 to-[#020617] border border-red-500/30 p-10 rounded-3xl flex flex-col items-center text-center max-w-md shadow-2xl">
        <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <AlertTriangle className="w-12 h-12 text-red-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-3 uppercase italic">Zona Restringida</h2>
        <p className="text-slate-400 mb-8">{accessError}</p>
        <button onClick={() => navigate('/home')} className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 px-8 rounded-xl transition-all hover:scale-105">
          Volver al inicio
        </button>
      </div>
    </main>
  );

  if (!media) return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white gap-6">
      <h2 className="text-3xl font-black italic">Obra no encontrada</h2>
      <button onClick={() => navigate('/home')} className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 px-8 rounded-xl transition-all">
        Volver al inicio
      </button>
    </main>
  );

  const bgImage = media.banner || media.image;
  const isAnime = media.type?.toUpperCase() === 'ANIME';

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 pb-24 relative overflow-x-hidden">

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 ${toast.type === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {toast.type === 'ok'
            ? <CheckCircle className="w-5 h-5 shrink-0" />
            : <AlertTriangle className="w-5 h-5 shrink-0" />
          }
          <p className="font-bold text-sm">{toast.msg}</p>
        </div>
      )}

      {/* MODAL CONFIRMAR BORRADO */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white mb-2">¿Eliminar reseña?</h3>
            <p className="text-slate-400 mb-8 text-sm">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl transition-all">
                Cancelar
              </button>
              <button onClick={handleDeleteReview} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TRÁILER */}
      {trailerOpen && media.trailer && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setTrailerOpen(false)}>
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setTrailerOpen(false)} className="absolute top-3 right-3 z-10 p-2 bg-black/60 hover:bg-black rounded-xl transition-all">
              <X className="w-5 h-5 text-white" />
            </button>
            <iframe
              src={`${media.trailer.url}?autoplay=1`}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* ── HERO BANNER ──────────────────────────────────────────────────────── */}
      <div className="relative h-[55vh] min-h-[420px] overflow-hidden">
        <img src={bgImage} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-105 opacity-20 blur-md" />
        <img src={bgImage} alt="banner" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
        <div className="absolute top-6 left-6 md:left-16">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold">Volver</span>
          </button>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ──────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-16 -mt-48 relative z-10">

        {/* CABECERA: Poster + Info */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 mb-16">

          {/* Poster */}
          <div className="shrink-0 flex justify-center md:justify-start">
            <div className="relative w-48 md:w-56 group">
              <div className="absolute -inset-2 bg-yellow-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-black/50">
                <img src={media.image} alt={media.title} className="w-full aspect-[2/3] object-cover" />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10">
                  {isAnime
                    ? <Tv className="w-3 h-3 text-yellow-400" />
                    : <BookOpen className="w-3 h-3 text-yellow-400" />
                  }
                  <span className="text-[10px] font-black text-yellow-400 uppercase">{media.type}</span>
                </div>
                {media.is_adult && (
                  <div className="absolute top-3 right-3 bg-red-600/80 backdrop-blur-md px-2 py-1 rounded-lg">
                    <span className="text-[10px] font-black text-white">+18</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-32 md:pt-0 mt-4 md:mt-16">

            {/* Géneros */}
            <div className="flex flex-wrap gap-2 mb-4">
              {media.genres.map(g => (
                <span key={g} className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                  {g}
                </span>
              ))}
            </div>

            {/* Título */}
            <h1 className="text-4xl md:text-6xl font-black italic text-white leading-tight mb-2 drop-shadow-2xl">
              {media.title}
            </h1>
            {media.title_en && media.title_en !== media.title && (
              <p className="text-lg text-slate-500 mb-4">{media.title_en}</p>
            )}

            {/* Estudio */}
            {media.studios?.length > 0 && (
              <p className="text-slate-400 text-sm mb-5">
                Producido por{' '}
                {media.studios.map((s, i) => (
                  <span key={s.id}>
                    {s.url
                      ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline font-bold">{s.name}</a>
                      : <span className="text-yellow-400 font-bold">{s.name}</span>
                    }
                    {i < media.studios.length - 1 && ', '}
                  </span>
                ))}
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              {media.score > 0 && (
                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-xl">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-yellow-400 font-black">{media.score}</span>
                  <span className="text-yellow-600 text-xs">/100</span>
                </div>
              )}
              {media.year > 0 && (
                <div className="bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-xl text-slate-300 text-sm font-bold">
                  {media.year}
                </div>
              )}
              {media.units > 0 && (
                <div className="bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-xl text-slate-300 text-sm font-bold">
                  {media.units} {isAnime ? 'episodios' : 'capítulos'}
                </div>
              )}
              <div className="bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-xl text-slate-300 text-sm font-bold">
                {media.status}
              </div>
            </div>

            {/* Botones de estado en lista */}
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Mi lista</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => {
                  const active = favStatus === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleSetStatus(value)}
                      disabled={statusLoading}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border transition-all duration-200 hover:scale-105 disabled:opacity-50 ${
                        active
                          ? 'bg-yellow-500 border-yellow-400 text-black shadow-lg shadow-yellow-500/20'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-yellow-500/50 hover:text-yellow-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                      {active && <X className="w-3 h-3 opacity-60" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botón tráiler */}
            {media.trailer && (
              <button
                onClick={() => setTrailerOpen(true)}
                className="flex items-center gap-3 bg-white/5 hover:bg-yellow-500/10 border border-white/10 hover:border-yellow-500/30 text-white hover:text-yellow-400 font-bold px-5 py-2.5 rounded-xl transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 text-black fill-black" />
                </div>
                Ver tráiler
              </button>
            )}
          </div>
        </div>

        {/* ── DÓNDE VERLO ────────────────────────────────────────────────────── */}
        {media.streaming?.length > 0 && (
          <section className="mb-12">
            <SectionTitle icon={<Play className="w-5 h-5" />} title="Dónde verlo" />
            <div className="flex flex-wrap gap-3">
              {media.streaming.map(link => (
                <a
                  key={link.site}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-5 py-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 rounded-2xl transition-all hover:scale-105 hover:-translate-y-0.5 shadow-lg"
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: link.color || '#eab308' }} />
                  <span className="font-bold text-slate-200 group-hover:text-white text-sm">{link.site}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── SINOPSIS ──────────────────────────────────────────────────────── */}
        <section className="mb-12">
          <SectionTitle title="Sinopsis" />
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
            <p className="text-slate-300 leading-relaxed text-base">
              {media.description || 'No hay sinopsis disponible.'}
            </p>
          </div>
        </section>

        {/* ── PERSONAJES ────────────────────────────────────────────────────── */}
        {media.characters?.length > 0 && (
          <section className="mb-12">
            <SectionTitle icon={<Users className="w-5 h-5" />} title="Personajes principales" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {media.characters.map(char => (
                <div key={char.id} className="group flex flex-col items-center gap-2 text-center">
                  <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-slate-800 group-hover:border-yellow-500/40 transition-colors bg-slate-900 shadow-lg">
                    {char.image
                      ? <img src={char.image} alt={char.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center text-slate-600 text-2xl font-black">{char.name?.[0]}</div>
                    }
                  </div>
                  <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors line-clamp-2 leading-tight">
                    {char.name}
                  </p>
                  {char.role === 'MAIN' && (
                    <span className="text-[9px] font-black text-yellow-500 uppercase tracking-wider bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                      Principal
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── EQUIPO CREATIVO ───────────────────────────────────────────────── */}
        {media.staff?.length > 0 && (
          <section className="mb-12">
            <SectionTitle title="Equipo creativo" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {media.staff.map(member => (
                <div key={member.id} className="group flex items-center gap-3 bg-slate-900/50 border border-slate-800 hover:border-yellow-500/20 rounded-2xl p-3 transition-all hover:bg-slate-900">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-800 border border-slate-700">
                    {member.image
                      ? <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-slate-500 font-black">{member.name?.[0]}</div>
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{member.name}</p>
                    <p className="text-xs text-slate-500 truncate">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── RELACIONES ────────────────────────────────────────────────────── */}
        {media.relations?.length > 0 && (
          <section className="mb-12">
            <SectionTitle icon={<GitBranch className="w-5 h-5" />} title="También te puede interesar" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {media.relations.map(rel => (
                <Link key={rel.id} to={`/media/${rel.id}`} className="group flex flex-col gap-2">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-slate-800 group-hover:border-yellow-500/40 transition-all shadow-lg bg-slate-900">
                    {rel.image
                      ? <img src={rel.image} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center text-slate-600"><BookOpen className="w-8 h-8" /></div>
                    }
                    <div className="absolute top-2 left-2">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm border border-white/10 text-yellow-400">
                        {RELATION_LABELS[rel.relation] || rel.relation}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors line-clamp-2">
                    {rel.title}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── MI RESEÑA ─────────────────────────────────────────────────────── */}
        <section className="mb-12">
          <SectionTitle title="Mi Reseña" />

          {userReview && !isEditingReview ? (
            <div className="relative bg-gradient-to-br from-yellow-500/5 to-slate-900/60 border border-yellow-500/20 rounded-2xl p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-6 h-6" style={{ fill: i < userReview.score ? '#eab308' : 'transparent', color: i < userReview.score ? '#eab308' : '#334155' }} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingReview(true)} className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all">
                    <Edit2 className="w-4 h-4 text-slate-400" />
                  </button>
                  <button onClick={() => setConfirmDelete(true)} className="p-2 bg-slate-800 hover:bg-red-900/30 border border-slate-700 hover:border-red-500/30 rounded-xl transition-all">
                    <Trash2 className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed">{userReview.content}</p>
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Puntuación</label>
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button key={i} onClick={() => setReviewScore(i + 1)} className="hover:scale-125 transition-transform">
                      <Star className="w-8 h-8 cursor-pointer" style={{ fill: i < reviewScore ? '#eab308' : 'transparent', color: i < reviewScore ? '#eab308' : '#334155' }} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Tu opinión</label>
                <textarea
                  value={reviewContent}
                  onChange={e => setReviewContent(e.target.value.slice(0, 255))}
                  placeholder="Comparte tu experiencia con esta obra..."
                  className="w-full bg-slate-800/50 border border-slate-700 focus:border-yellow-500/50 text-white placeholder-slate-600 rounded-xl p-4 focus:outline-none resize-none transition-colors"
                  rows={4}
                />
                <p className="text-xs text-slate-600 mt-1 text-right">{reviewContent.length}/255</p>
              </div>
              <div className="flex gap-3 justify-end">
                {isEditingReview && (
                  <button
                    onClick={() => {
                      setIsEditingReview(false);
                      if (userReview) { setReviewScore(userReview.score); setReviewContent(userReview.content); }
                    }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-black px-6 py-2.5 rounded-xl transition-all hover:scale-105"
                >
                  <Send className="w-4 h-4" />
                  {isEditingReview ? 'Actualizar' : 'Publicar'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── RESEÑAS COMUNIDAD ─────────────────────────────────────────────── */}
        <section>
          <SectionTitle title="Comunidad" badge={reviews.length} />

          {reviews.length > 0 ? (
            <div className="grid gap-4">
              {reviews.map(review => {
                const isOwn = review.user.id === currentUser?.id;
                return (
                  <div
                    key={review.id}
                    className={`relative bg-slate-900/40 border rounded-2xl p-6 transition-all ${isOwn ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-slate-800'}`}
                  >
                    {isOwn && (
                      <span className="absolute top-4 right-4 text-[10px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-full">
                        Tu reseña
                      </span>
                    )}
                    <div className="flex items-center gap-4 mb-4">
                      {review.user.picture ? (
                        <img
                          src={getImageUrl(review.user.picture)!}
                          alt={review.user.alias}
                          className="w-10 h-10 rounded-full object-cover border-2 border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 border-2 border-yellow-500/30 flex items-center justify-center shrink-0">
                          <span className="text-sm font-black text-yellow-400">{review.user.alias[0].toUpperCase()}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-white text-sm">{review.user.alias}</p>
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5" style={{ fill: i < review.score ? '#eab308' : 'transparent', color: i < review.score ? '#eab308' : '#334155' }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{review.content}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl gap-3">
              <Heart className="w-10 h-10 text-slate-700" />
              <p className="text-slate-500 font-bold">Sé el primero en opinar</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// ── Sub-componente reutilizable para títulos de sección ───────────────────────
function SectionTitle({
  title,
  icon,
  badge,
}: {
  title: string;
  icon?: React.ReactNode;
  badge?: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1 h-8 bg-yellow-500 rounded-full shrink-0" />
      {icon && <span className="text-yellow-500">{icon}</span>}
      <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">{title}</h2>
      {badge !== undefined && (
        <span className="text-base font-bold text-slate-500">({badge})</span>
      )}
    </div>
  );
}