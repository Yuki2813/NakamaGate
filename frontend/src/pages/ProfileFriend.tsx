import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/helpers';
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Heart, Star, ShieldAlert, Home, Play, CheckCircle2, Clock, Trash2, MessageSquare, Loader2 } from 'lucide-react';

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

interface ReviewMedia {
  id: number;
  title: string;
  image: string;
  type: string;
}

interface ReviewItem {
  id: number;
  score: number;
  content: string;
  created_at: string;
  media: ReviewMedia;
}

interface SocialData {
  friends: { id: number }[];
  sent_pending?: { id: number }[];
  pending?: { id: number }[];
}

interface UserProfile {
  id: number;
  alias: string;
  picture: string | null;
}

export default function ProfileFriend() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoritesTotal, setFavoritesTotal] = useState(0);
  const [favPage, setFavPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  const [socialData, setSocialData] = useState<SocialData | null>(null);

  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRemoveFriendModal, setShowRemoveFriendModal] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!id) { setLoading(false); return; }

      try {
        const profileRes = await apiClient.get(`/auth/users/${id}`);
        setProfile(profileRes.data);
      } catch {
        setLoading(false);
        return;
      }

      try {
        const favsRes = await apiClient.get(`/friends/${id}/favorites?page=1&limit=20`);
        setFavorites(favsRes.data.items ?? []);
        setFavoritesTotal(favsRes.data.total ?? 0);
        setHasMore(favsRes.data.has_more ?? false);
        setFavPage(1);
      } catch {
        setFavorites([]);
      }

      try {
        const reviewsRes = await apiClient.get(`/reviews/user/${id}`);
        setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
      } catch {
        setReviews([]);
      }

      try {
        const socialRes = await apiClient.get('/friends/social-data');
        setSocialData(socialRes.data);
      } catch {
        // no social data available
      }

      setLoading(false);
    };

    fetchProfileData();
  }, [id]);

  const fetchMoreFavorites = async () => {
    if (!id || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = favPage + 1;
      const res = await apiClient.get(`/friends/${id}/favorites?page=${nextPage}&limit=20`);
      setFavorites(prev => [...prev, ...(res.data.items ?? [])]);
      setHasMore(res.data.has_more ?? false);
      setFavPage(nextPage);
    } catch {
      // could not load more
    } finally {
      setLoadingMore(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'watching':
        return { icon: Play, label: 'Watching', color: 'bg-blue-500/20 border-blue-500/30 text-blue-300' };
      case 'completed':
        return { icon: CheckCircle2, label: 'Completed', color: 'bg-green-500/20 border-green-500/30 text-green-300' };
      case 'on_hold':
        return { icon: Clock, label: 'On Hold', color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300' };
      default:
        return { icon: Heart, label: status || 'Favorite', color: 'bg-red-500/20 border-red-500/30 text-red-300' };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const refreshSocialData = async () => {
    try {
      const res = await apiClient.get('/friends/social-data');
      setSocialData(res.data);
    } catch {
      // ignore
    }
  };

  const handleSendRequest = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/friends/request/${profile.id}`);
      await refreshSocialData();
    } catch (error) {
      console.error("Error sending request:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/friends/accept/${profile.id}`);
      await refreshSocialData();
    } catch (error) {
      console.error("Error accepting request:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      await apiClient.delete(`/friends/remove/${profile.id}`);
      await refreshSocialData();
      setShowRemoveFriendModal(false);
    } catch (error) {
      console.error("Error removing friend:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminDelete = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      await apiClient.delete(`/auth/users/${profile.id}`);
      setShowDeleteModal(false);
      navigate('/community');
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Could not delete the account.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617]">
      <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
    </main>
  );

  if (!profile) return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-yellow-500">Profile not found</h1>
    </main>
  );

  const isFriend = socialData?.friends?.some(f => f.id === profile.id);
  const hasSentRequest = socialData?.sent_pending?.some(s => s.id === profile.id);
  const hasIncomingRequest = socialData?.pending?.some(p => p.id === profile.id);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-800 dark:text-slate-200 font-sans selection:bg-yellow-500/30 pb-20">

      {showDeleteModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">Delete account?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-1 font-medium text-sm">
              You are about to delete the account of <span className="text-yellow-500 font-bold uppercase">{profile.alias}</span>.
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-center mb-8 text-xs">
              This action is irreversible and will delete all their data.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setShowDeleteModal(false)} variant="outline" className="flex-1 border-slate-300 dark:border-slate-700 rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleAdminDelete} disabled={actionLoading} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRemoveFriendModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <UserMinus className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">Remove friend?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-8 font-medium text-sm">
              You will no longer be friends with <span className="text-yellow-500 font-bold uppercase">{profile.alias}</span>. You can send a new request later.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setShowRemoveFriendModal(false)} variant="outline" className="flex-1 border-slate-300 dark:border-slate-700 rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleRemoveFriend} disabled={actionLoading} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl">
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 border-b border-yellow-500/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-300 mx-auto px-4 sm:px-6 md:px-16 py-4 flex items-center justify-between">
          <Link to="/community" className="flex items-center gap-2 text-slate-800 dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors">
            <Home className="w-5 h-5" />
            <span className="font-semibold text-sm">Back to Home</span>
          </Link>
          <h1 className="font-black text-slate-900 dark:text-white tracking-tight">NakamaGate</h1>
          <div className="w-20" />
        </div>
      </nav>

      <header className="relative w-full max-w-300 mx-auto px-4 sm:px-6 md:px-16 pt-8 sm:pt-12 pb-8 sm:pb-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
          <div className="shrink-0">
            <div className="w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 rounded-full border-4 border-slate-200 dark:border-[#020617] bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-[0_0_40px_-5px_rgba(234,179,8,0.4)]">
              {getImageUrl(profile.picture) ? (
                <img src={getImageUrl(profile.picture)!} alt={profile.alias} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl font-black text-yellow-500 bg-slate-100 dark:bg-slate-900 uppercase">
                  {(profile.alias || 'NA').substring(0, 2)}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between w-full gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {profile.alias}
              </h1>
              <p className="text-yellow-400 font-semibold mt-2 flex items-center justify-center md:justify-start gap-2">
                <Star className="w-5 h-5 fill-yellow-400" /> Public Profile
              </p>
            </div>
            <div className="flex gap-3">
              {isFriend ? (
                <Button onClick={() => setShowRemoveFriendModal(true)} disabled={actionLoading} variant="outline" className="h-12 rounded-xl border-red-500/50 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-all font-semibold">
                  <UserMinus className="w-5 h-5 mr-2" /> Remove
                </Button>
              ) : hasSentRequest ? (
                <Button disabled variant="outline" className="h-12 rounded-xl border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold cursor-not-allowed">
                  <Clock className="w-5 h-5 mr-2" /> Request sent
                </Button>
              ) : hasIncomingRequest ? (
                <Button onClick={handleAcceptRequest} disabled={actionLoading} className="h-12 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg transition-all">
                  <CheckCircle2 className="w-5 h-5 mr-2" /> Accept request
                </Button>
              ) : (
                <Button onClick={handleSendRequest} disabled={actionLoading} className="h-12 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-black font-bold shadow-lg shadow-yellow-900/20 transition-all">
                  <UserPlus className="w-5 h-5 mr-2" /> Add
                </Button>
              )}
              {isAdmin && (
                <Button onClick={() => setShowDeleteModal(true)} variant="outline" className="h-12 rounded-xl border-red-700/50 bg-red-900/10 hover:bg-red-700 hover:text-white text-red-500 transition-all font-semibold">
                  <Trash2 className="w-5 h-5 mr-2" /> Delete account
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-300 mx-auto px-4 sm:px-6 md:px-16 mt-8 sm:mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">

        <aside className="lg:col-span-1 space-y-8">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Stats</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-100 dark:bg-[#020617] rounded-2xl p-4 text-center border border-slate-200 dark:border-slate-800/50">
                <span className="block text-3xl font-black text-yellow-500">{favoritesTotal}</span>
                <span className="text-xs font-medium text-slate-400">Favorites</span>
              </div>
              <div className="bg-slate-100 dark:bg-[#020617] rounded-2xl p-4 text-center border border-slate-200 dark:border-slate-800/50">
                <span className="block text-3xl font-black text-yellow-500">{reviews.length}</span>
                <span className="text-xs font-medium text-slate-400">Reviews</span>
              </div>
            </div>
          </section>
        </aside>

        <div className="lg:col-span-2 space-y-12">

          <section aria-labelledby="favorites-title">
            <header className="flex items-center gap-3 mb-6">
              <Heart className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <h2 id="favorites-title" className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {profile.alias}&apos;s Sanctuary
              </h2>
            </header>

            {favorites.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                  {favorites.map((fav) => {
                    const media = fav.media;
                    if (!media) return null;
                    const statusBadge = getStatusBadge(fav.status);
                    const StatusIcon = statusBadge.icon;
                    return (
                      <article key={`${media.id}-${fav.status}`} className="group cursor-pointer">
                        <Link to={`/media/${media.id}`} className="block focus:outline-none">
                          <figure className="relative aspect-2/3 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group-hover:border-yellow-500/50 shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                            <img src={media.image} alt={media.title} className="w-full h-full object-cover" loading="lazy" />
                            <div className="absolute inset-0 bg-linear-to-t from-[#020617]/95 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border w-fit ${statusBadge.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                <span className="text-xs font-bold uppercase">{statusBadge.label}</span>
                              </div>
                              <div>
                                <span className="text-xs font-bold text-yellow-500 uppercase block">{media.type}</span>
                                <span className="text-xs text-slate-300">★ {(media.score ?? 0).toFixed(1)}</span>
                              </div>
                            </div>
                            <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg border ${statusBadge.color} group-hover:hidden`}>
                              <StatusIcon className="w-3 h-3" />
                              <span className="text-xs font-bold uppercase">{statusBadge.label}</span>
                            </div>
                          </figure>
                          <h3 className="mt-3 text-sm font-semibold leading-tight line-clamp-2 text-slate-600 dark:text-slate-300 group-hover:text-yellow-500 transition-colors">
                            {media.title}
                          </h3>
                        </Link>
                      </article>
                    );
                  })}
                </div>

                {hasMore && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      onClick={fetchMoreFavorites}
                      disabled={loadingMore}
                      variant="outline"
                      className="h-11 px-8 rounded-xl border-yellow-500/40 text-yellow-500 hover:bg-yellow-500 hover:text-black font-bold transition-all"
                    >
                      {loadingMore
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</>
                        : `Load more · ${favoritesTotal - favorites.length} remaining`
                      }
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 border-dashed rounded-3xl p-12 text-center">
                <Heart className="w-12 h-12 text-slate-400 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-2">Empty Sanctuary</h3>
                <p className="text-slate-500 text-sm">{profile.alias} hasn&apos;t added any titles to their favorites yet.</p>
              </div>
            )}
          </section>

          <section aria-labelledby="reviews-title">
            <header className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-6 h-6 text-yellow-500" />
              <h2 id="reviews-title" className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {profile.alias}&apos;s Chronicles
              </h2>
            </header>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Link to={`/media/${review.media.id}`} key={review.id} className="block group">
                    <article className="flex gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 group-hover:border-yellow-500/40 transition-all shadow-sm">
                      <img
                        src={review.media.image}
                        alt={review.media.title}
                        className="w-14 h-20 object-cover rounded-xl shrink-0 border border-slate-200 dark:border-slate-700"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">
                              {review.media.type}
                            </span>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight line-clamp-1 group-hover:text-yellow-500 transition-colors">
                              {review.media.title}
                            </h3>
                          </div>
                          <div className="flex shrink-0">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < review.score ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-700'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {review.content}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2">{formatDate(review.created_at)}</p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 border-dashed rounded-3xl p-12 text-center">
                <MessageSquare className="w-12 h-12 text-slate-400 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-2">No chronicles</h3>
                <p className="text-slate-500 text-sm">{profile.alias} hasn&apos;t written any reviews yet.</p>
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}
