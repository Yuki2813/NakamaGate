import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { BACKEND_URL } from '../config/env';
import {
  Heart, ArrowLeft, Star, Trash2, Edit2, Send,
  AlertTriangle, BookOpen, Tv, CheckCircle, X,
  Play, ExternalLink, Users, GitBranch
} from 'lucide-react';

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


const RELATION_LABELS: Record<string, string> = {
  SEQUEL:      'Sequel',
  PREQUEL:     'Prequel',
  SIDE_STORY:  'Side Story',
  SPIN_OFF:    'Spin-off',
  PARENT:      'Source Material',
  ALTERNATIVE: 'Alternative',
};

export default function MediaDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
  };

  const [media, setMedia] = useState<MediaDetailData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const { user } = useAuth();

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteStatus, setFavoriteStatus] = useState<'watching' | 'completed' | 'pending'>('pending');
  const [statusLoading, setStatusLoading] = useState(false);

  const [reviewScore, setReviewScore] = useState(3);
  const [reviewContent, setReviewContent] = useState('');
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const reloadReviews = async (type: string) => {
    const res = await apiClient.get(`/reviews/media/${id}?media_type=${type}`);
    return Array.isArray(res.data) ? res.data : [];
  };

  // Carga en dos fases: primero el media (su type va como query param), luego reseñas y favorito en paralelo.
  useEffect(() => {
    const load = async () => {
      try {
        const mediaRes = await apiClient.get(`/content/${id}`);
        const mediaData: MediaDetailData = mediaRes.data;
        setMedia(mediaData);

        let mediaType = 'anime';
        if (mediaData.type) {
          mediaType = mediaData.type.toLowerCase();
        }

        const [reviewsRes, favRes] = await Promise.allSettled([
          apiClient.get(`/reviews/media/${id}?media_type=${mediaType}`),
          apiClient.get(`/favorites/check/${id}`),
        ]);

        if (reviewsRes.status === 'fulfilled') {
          let allReviews: Review[] = [];
          if (Array.isArray(reviewsRes.value.data)) {
            allReviews = reviewsRes.value.data;
          }
          setReviews(allReviews);

          let myExistingReview: Review | null = null;
          if (user) {
            const found = allReviews.find(r => r.user.id === user.id);
            if (found) {
              myExistingReview = found;
            }
          }
          setUserReview(myExistingReview);
          if (myExistingReview) {
            setReviewScore(myExistingReview.score);
            setReviewContent(myExistingReview.content);
          }
        }
        if (favRes.status === 'fulfilled') {
          setIsFavorite(favRes.value.data.is_favorite);
          if (favRes.value.data.status) {
            setFavoriteStatus(favRes.value.data.status);
          }
        }
      } catch (err: any) {
        if (err.response && err.response.status === 403) {
          let detail = "Restricted access (+18).";
          if (err.response.data && err.response.data.detail) {
            detail = err.response.data.detail;
          }
          setAccessError(detail);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const toggleFavorite = async () => {
    if (statusLoading) return;
    setStatusLoading(true);
    try {
      let mediaType = 'anime';
      if (media && media.type) {
        mediaType = media.type.toLowerCase();
      }
      if (isFavorite) {
        await apiClient.delete(`/favorites/${id}?media_type=${mediaType}`);
        setIsFavorite(false);
        setFavoriteStatus('pending');
        showToast('Removed from favorites.');
      } else {
        await apiClient.post('/favorites/', { media_id: id, media_type: mediaType });
        setIsFavorite(true);
        setFavoriteStatus('pending');
        showToast('Added to favorites!');
      }
    } catch {
      showToast('Could not update favorites.', 'err');
    } finally {
      setStatusLoading(false);
    }
  };

  // Cambio de estado con actualización optimista; revertimos si el PUT falla.
  const changeStatus = async (newStatus: 'watching' | 'completed' | 'pending') => {
    if (statusLoading || newStatus === favoriteStatus) return;
    const previous = favoriteStatus;
    setFavoriteStatus(newStatus);
    setStatusLoading(true);
    try {
      await apiClient.put(`/favorites/${id}/status`, { status: newStatus });
      showToast('Status updated.');
    } catch {
      setFavoriteStatus(previous);
      showToast('Could not update status.', 'err');
    } finally {
      setStatusLoading(false);
    }
  };

  // POST nuevo o PUT en edición; tras guardar recargamos para tener alias y picture.
  const handleSubmitReview = async () => {
    if (!reviewContent.trim() || reviewScore < 1 || reviewScore > 5) {
      showToast('Complete the review with a score and text.', 'err'); return;
    }
    setSubmittingReview(true);
    try {
      let mediaType;
      if (media && media.type) {
        mediaType = media.type.toLowerCase();
      }
      if (userReview && isEditingReview) {
        await apiClient.put(`/reviews/${userReview.id}`, {
          id_api: id, media_type: mediaType, score: reviewScore, content: reviewContent
        });
        setUserReview({ ...userReview, score: reviewScore, content: reviewContent });
        setIsEditingReview(false);
        showToast('Review updated.');
      } else {
        const res = await apiClient.post('/reviews/', {
          id_api: id, media_type: mediaType, score: reviewScore, content: reviewContent
        });
        setUserReview(res.data);
        showToast('Review published.');
      }
      let typeForReload = 'anime';
      if (media && media.type) {
        typeForReload = media.type.toLowerCase();
      }
      setReviews(await reloadReviews(typeForReload));
    } catch {
      showToast('Error saving the review.', 'err');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    try {
      await apiClient.delete(`/reviews/${reviewToDelete}`);
      if (userReview && userReview.id === reviewToDelete) {
        setUserReview(null);
        setReviewScore(3);
        setReviewContent('');
      }
      setReviewToDelete(null);

      let typeForReload = 'anime';
      if (media && media.type) {
        typeForReload = media.type.toLowerCase();
      }
      setReviews(await reloadReviews(typeForReload));
      showToast('Review deleted.');
    } catch {
      showToast('Error deleting the review.', 'err');
    }
  };

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-300 dark:border-slate-800 border-t-yellow-500 rounded-full animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">Loading...</p>
      </div>
    </main>
  );

  if (accessError) return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white px-4">
      <div className="bg-linear-to-br from-red-950/40 to-[#020617] border border-red-500/30 p-8 sm:p-10 rounded-3xl flex flex-col items-center text-center max-w-sm shadow-2xl">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 uppercase italic">Restricted Zone</h2>
        <p className="text-slate-400 mb-8 text-sm">{accessError}</p>
        <button onClick={() => navigate('/home')} className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 px-8 rounded-xl transition-all hover:scale-105">
          Back to home
        </button>
      </div>
    </main>
  );

  if (!media) return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white gap-6 px-4">
      <h2 className="text-2xl sm:text-3xl font-black italic text-center">Title not found</h2>
      <button onClick={() => navigate('/home')} className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 px-8 rounded-xl transition-all">
        Back to home
      </button>
    </main>
  );

  const bgImage = media.banner || media.image;

  let isAnime = false;
  if (media.type) {
    isAnime = media.type.toUpperCase() === 'ANIME';
  }

  let favBtnClasses;
  if (isFavorite) {
    favBtnClasses = 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]';
  } else {
    favBtnClasses = 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-yellow-500/50 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-slate-200 dark:hover:bg-slate-800';
  }

  let favBtnLabel = 'Add';
  if (isFavorite) {
    favBtnLabel = 'In Favorites';
  }

  let myReviewSection;
  if (userReview && !isEditingReview) {
    myReviewSection = (
      <div className="relative bg-linear-to-br from-yellow-500/5 to-slate-900/60 border border-yellow-500/20 rounded-2xl p-5 sm:p-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              let starFill = 'transparent';
              let starColor = '#94a3b8';
              if (i < userReview.score) {
                starFill = '#eab308';
                starColor = '#eab308';
              }
              return (
                <Star key={i} className="w-5 h-5 sm:w-6 sm:h-6" style={{ fill: starFill, color: starColor }} />
              );
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsEditingReview(true)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all">
              <Edit2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </button>
            <button onClick={() => setReviewToDelete(userReview.id)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 border border-slate-200 dark:border-slate-700 hover:border-red-500/30 rounded-xl transition-all">
              <Trash2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">{userReview.content}</p>
      </div>
    );
  } else {
    let submitButtonLabel = 'Publish';
    if (isEditingReview) {
      submitButtonLabel = 'Update';
    }
    myReviewSection = (
      <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-8 space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Score</label>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => {
              let starFill = 'transparent';
              let starColor = '#334155';
              if (i < reviewScore) {
                starFill = '#eab308';
                starColor = '#eab308';
              }
              return (
                <button key={i} onClick={() => setReviewScore(i + 1)} className="hover:scale-125 transition-transform">
                  <Star className="w-7 h-7 sm:w-8 sm:h-8 cursor-pointer" style={{ fill: starFill, color: starColor }} />
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your opinion</label>
          <textarea
            value={reviewContent}
            onChange={e => setReviewContent(e.target.value.slice(0, 255))}
            placeholder="Share your experience with this title..."
            className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-yellow-500/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 rounded-xl p-4 focus:outline-none resize-none transition-colors text-sm"
            rows={4}
          />
          <p className="text-xs text-slate-500 mt-1 text-right">{reviewContent.length}/255</p>
        </div>
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
              className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-bold rounded-xl transition-all text-sm"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmitReview}
            disabled={submittingReview}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-black px-5 py-2.5 rounded-xl transition-all hover:scale-105 text-sm"
          >
            <Send className="w-4 h-4" />
            {submitButtonLabel}
          </button>
        </div>
      </div>
    );
  }

  let communitySection;
  if (reviews.length === 0) {
    communitySection = (
      <div className="flex flex-col items-center justify-center py-12 bg-slate-100 dark:bg-slate-900/30 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl gap-3">
        <Heart className="w-10 h-10 text-slate-400 dark:text-slate-700" />
        <p className="text-slate-500 font-bold text-sm">Be the first to review</p>
      </div>
    );
  } else {
    const reviewCards = [];
    for (const review of reviews) {
      let isOwn = false;
      if (user && review.user.id === user.id) {
        isOwn = true;
      }
      let isAdmin = false;
      if (user && user.rol === 'admin') {
        isAdmin = true;
      }

      let cardClasses = 'border-slate-200 dark:border-slate-800';
      if (isOwn) {
        cardClasses = 'border-yellow-500/30 bg-yellow-500/5';
      }

      let avatar;
      if (review.user.picture) {
        avatar = (
          <img
            src={getImageUrl(review.user.picture)!}
            alt={review.user.alias}
            className="w-9 h-9 rounded-full object-cover border-2 border-slate-300 dark:border-slate-700"
          />
        );
      } else {
        avatar = (
          <div className="w-9 h-9 rounded-full bg-yellow-500/20 border-2 border-yellow-500/30 flex items-center justify-center shrink-0">
            <span className="text-sm font-black text-yellow-400">{review.user.alias[0].toUpperCase()}</span>
          </div>
        );
      }

      const stars = [];
      for (let i = 0; i < 5; i++) {
        let starFill = 'transparent';
        let starColor = '#334155';
        if (i < review.score) {
          starFill = '#eab308';
          starColor = '#eab308';
        }
        stars.push(
          <Star key={i} className="w-3 h-3" style={{ fill: starFill, color: starColor }} />
        );
      }

      reviewCards.push(
        <div
          key={review.id}
          className={`relative bg-slate-100 dark:bg-slate-900/40 border rounded-2xl p-4 sm:p-6 transition-all ${cardClasses}`}
        >
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {isOwn && (
              <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                Your review
              </span>
            )}
            {isAdmin && !isOwn && (
              <button
                onClick={() => setReviewToDelete(review.id)}
                className="p-1.5 bg-slate-800 hover:bg-red-900/30 border border-slate-700 hover:border-red-500/30 rounded-lg transition-all"
                title="Delete review (admin)"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-400" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 mb-3">
            {avatar}
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{review.user.alias}</p>
              <div className="flex gap-0.5 mt-0.5">
                {stars}
              </div>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{review.content}</p>
        </div>
      );
    }
    communitySection = (
      <div className="grid gap-3 sm:gap-4">
        {reviewCards}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 pb-20 relative overflow-x-hidden">

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-300 flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-[90vw] ${toast.type === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {toast.type === 'ok'
            ? <CheckCircle className="w-5 h-5 shrink-0" />
            : <AlertTriangle className="w-5 h-5 shrink-0" />
          }
          <p className="font-bold text-sm">{toast.msg}</p>
        </div>
      )}

      {reviewToDelete !== null && (
        <div className="fixed inset-0 z-200 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white mb-2">Delete review?</h3>
            <p className="text-slate-400 mb-6 text-sm">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setReviewToDelete(null)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl transition-all">
                Cancel
              </button>
              <button onClick={handleDeleteReview} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {trailerOpen && media.trailer && (
        <div className="fixed inset-0 z-200 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" onClick={() => setTrailerOpen(false)}>
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

      <div className="relative h-[40vh] sm:h-[50vh] min-h-[260px] sm:min-h-[340px] overflow-hidden">
        <img src={bgImage} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-105 opacity-20 blur-md" />
        <img src={bgImage} alt="banner" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-linear-to-t from-slate-50 dark:from-[#020617] via-slate-50/50 dark:via-[#020617]/50 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-slate-50/80 dark:from-[#020617]/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-yellow-500/30 to-transparent" />
        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 md:left-16">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-yellow-500 transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold">Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-300 mx-auto px-4 sm:px-6 md:px-16 -mt-32 sm:-mt-44 relative z-10">

        <div className="flex flex-col md:flex-row gap-6 md:gap-12 mb-12">

          <div className="shrink-0 flex flex-col items-center md:items-start gap-4 md:gap-6">

            <div className="relative w-36 sm:w-44 md:w-56 group">
              <div className="absolute -inset-2 bg-yellow-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-black/50">
                <img src={media.image} alt={media.title} className="w-full aspect-2/3 object-cover" />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                  {isAnime
                    ? <Tv className="w-3 h-3 text-yellow-400" />
                    : <BookOpen className="w-3 h-3 text-yellow-400" />
                  }
                  <span className="text-[10px] font-black text-yellow-400 uppercase">{media.type}</span>
                </div>
                {media.is_adult && (
                  <div className="absolute top-2.5 right-2.5 bg-red-600/80 backdrop-blur-md px-2 py-1 rounded-lg">
                    <span className="text-[10px] font-black text-white">+18</span>
                  </div>
                )}
              </div>
            </div>

            <div className="w-36 sm:w-44 md:w-56 space-y-2">
              <button
                onClick={toggleFavorite}
                disabled={statusLoading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-sm border transition-all duration-300 disabled:opacity-50 group ${favBtnClasses}`}
              >
                <Heart className={`w-4 h-4 transition-transform group-hover:scale-110 ${isFavorite ? 'fill-current' : ''}`} />
                {favBtnLabel}
              </button>

              {isFavorite && (
                <select
                  value={favoriteStatus}
                  onChange={(e) => changeStatus(e.target.value as 'watching' | 'completed' | 'pending')}
                  disabled={statusLoading}
                  aria-label="Change status"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider hover:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/30 cursor-pointer disabled:opacity-50"
                >
                  <option value="watching">Watching</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              )}
            </div>
          </div>

          <div className="flex-1 pt-2 md:pt-0 md:mt-16">

            <div className="flex flex-wrap gap-2 mb-3">
              {media.genres.map(g => (
                <span key={g} className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 dark:text-yellow-400">
                  {g}
                </span>
              ))}
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black italic text-slate-900 dark:text-white leading-tight mb-2 drop-shadow-2xl">
              {media.title}
            </h1>
            {media.title_en && media.title_en !== media.title && (
              <p className="text-base text-slate-500 mb-3">{media.title_en}</p>
            )}

            {media.studios?.length > 0 && (
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                Produced by{' '}
                {media.studios.map((s, i) => (
                  <span key={s.id}>
                    {s.url
                      ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-yellow-500 dark:text-yellow-400 hover:underline font-bold">{s.name}</a>
                      : <span className="text-yellow-500 dark:text-yellow-400 font-bold">{s.name}</span>
                    }
                    {i < media.studios.length - 1 && ', '}
                  </span>
                ))}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-6">
              {media.score > 0 && (
                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-xl">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-yellow-500 font-black text-sm">{media.score}</span>
                  <span className="text-yellow-600 text-xs">/100</span>
                </div>
              )}
              {media.year > 0 && (
                <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-bold">
                  {media.year}
                </div>
              )}
              {media.units > 0 && (
                <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-bold">
                  {media.units} {isAnime ? 'eps.' : 'chaps.'}
                </div>
              )}
              <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-bold">
                {media.status}
              </div>
            </div>

            {media.trailer && (
              <button
                onClick={() => setTrailerOpen(true)}
                className="inline-flex items-center gap-3 bg-slate-100 dark:bg-white/5 hover:bg-yellow-500/10 border border-slate-200 dark:border-white/10 hover:border-yellow-500/30 text-slate-900 dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 font-bold px-5 py-2.5 rounded-xl transition-all group"
              >
                <div className="w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <Play className="w-3.5 h-3.5 text-black fill-black ml-0.5" />
                </div>
                Watch trailer
              </button>
            )}
          </div>
        </div>

        {media.streaming?.length > 0 && (
          <section className="mb-10">
            <SectionTitle icon={<Play className="w-5 h-5" />} title="Where to Watch" />
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {media.streaming.map(link => (
                <a
                  key={link.site}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl transition-all hover:scale-105 hover:-translate-y-0.5 shadow-lg"
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: link.color || '#eab308' }} />
                  <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white text-sm">{link.site}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-400 transition-colors" />
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mb-10">
          <SectionTitle title="Synopsis" />
          <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-8">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
              {media.description || 'No synopsis available.'}
            </p>
          </div>
        </section>

        {media.characters?.length > 0 && (
          <section className="mb-10">
            <SectionTitle icon={<Users className="w-5 h-5" />} title="Main Characters" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {media.characters.map(char => (
                <div key={char.id} className="group flex flex-col items-center gap-2 text-center">
                  <div className="w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 group-hover:border-yellow-500/40 transition-colors bg-slate-100 dark:bg-slate-900 shadow-lg">
                    {char.image
                      ? <img src={char.image} alt={char.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center text-slate-600 text-xl font-black">{char.name?.[0]}</div>
                    }
                  </div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors line-clamp-2 leading-tight">
                    {char.name}
                  </p>
                  {char.role === 'MAIN' && (
                    <span className="text-[9px] font-black text-yellow-500 uppercase tracking-wider bg-yellow-500/10 px-1.5 py-0.5 rounded-full border border-yellow-500/20">
                      Main
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {media.staff?.length > 0 && (
          <section className="mb-10">
            <SectionTitle title="Creative Staff" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {media.staff.map(member => (
                <div key={member.id} className="group flex items-center gap-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-yellow-500/20 rounded-2xl p-3 transition-all hover:bg-slate-200 dark:hover:bg-slate-900">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                    {member.image
                      ? <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-slate-500 font-black">{member.name?.[0]}</div>
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{member.name}</p>
                    <p className="text-xs text-slate-500 truncate">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {media.relations?.length > 0 && (
          <section className="mb-10">
            <SectionTitle icon={<GitBranch className="w-5 h-5" />} title="You might also like" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {media.relations.map(rel => (
                <Link key={rel.id} to={`/media/${rel.id}`} className="group flex flex-col gap-2">
                  <div className="relative aspect-2/3 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 group-hover:border-yellow-500/40 transition-all shadow-lg bg-slate-100 dark:bg-slate-900 shrink-0">
                    {rel.image
                      ? <img src={rel.image} alt={rel.title} className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                      : <div className="absolute inset-0 flex items-center justify-center text-slate-600"><BookOpen className="w-8 h-8" /></div>
                    }
                    <div className="absolute top-2 left-2 z-10">
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/10 text-yellow-400 shadow-md">
                        {RELATION_LABELS[rel.relation] || rel.relation}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors line-clamp-2">
                    {rel.title}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mb-10">
          <SectionTitle title="My Review" />
          {myReviewSection}
        </section>

        <section>
          <SectionTitle title="Community" badge={reviews.length} />
          {communitySection}
        </section>
      </div>
    </main>
  );
}

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
    <div className="flex items-center gap-3 mb-5 sm:mb-6">
      <div className="w-1 h-7 bg-yellow-500 rounded-full shrink-0" />
      {icon && <span className="text-yellow-500">{icon}</span>}
      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{title}</h2>
      {badge !== undefined && (
        <span className="text-sm font-bold text-slate-500">({badge})</span>
      )}
    </div>
  );
}
