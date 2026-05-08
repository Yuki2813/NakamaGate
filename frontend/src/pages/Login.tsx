import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import GoogleOnboardingModal from '../components/GoogleOnboardingModal';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [onboarding, setOnboarding] = useState<{ token: string; email: string; suggestedAlias: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/home');
    } catch (err) {
      setError('Incorrect credentials. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    setError('');
    setLoading(true);
    try {
      const result = await loginWithGoogle(credentialResponse.credential);
      if (result.status === 'existing') {
        navigate('/home');
      } else {
        setOnboarding({
          token: credentialResponse.credential,
          email: result.email ?? '',
          suggestedAlias: result.suggested_alias ?? '',
        });
        setLoading(false);
      }
    } catch {
      setError('Could not sign in with Google.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#020617] relative px-4 transition-colors duration-500 overflow-hidden">

      {onboarding && (
        <GoogleOnboardingModal
          googleToken={onboarding.token}
          email={onboarding.email}
          suggestedAlias={onboarding.suggestedAlias}
          onSuccess={() => {
            setOnboarding(null);
            navigate('/home');
          }}
          onCancel={() => setOnboarding(null)}
        />
      )}

      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] absolute -top-40 -left-40"></div>
        <div className="w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] absolute -bottom-20 -right-20"></div>
      </div>

      <section className="w-full max-w-md z-10">
        <div className="bg-slate-900 border border-yellow-500/30 shadow-[0_0_50px_-12px_rgba(234,179,8,0.15)] rounded-3xl p-8 md:p-10 relative">

          <header className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              Welcome to <span className="text-yellow-500">NakamaGate</span>
            </h1>
            <p className="text-slate-400 font-medium">Sign in to continue</p>
          </header>

          {error && (
            <div role="alert" className="bg-red-900/20 text-red-400 p-3 rounded-xl text-sm font-medium mb-6 text-center border border-red-900/50">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-300 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="email" type="email" required placeholder="your@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 h-12 rounded-xl bg-black/40 border border-slate-700 text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label htmlFor="password" className="text-sm font-semibold text-slate-300">Password</label>
                <Link to="#" className="text-xs font-semibold text-yellow-500 hover:text-yellow-400 transition-colors">
                  Forgot your password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="password" type={showPassword ? "text" : "password"} required placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 h-12 rounded-xl bg-black/40 border border-slate-700 text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-yellow-500 focus:outline-none transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-base shadow-lg shadow-yellow-900/20 transition-all active:scale-[0.98] mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : "Sign In"}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative flex items-center py-2 mb-4">
              <div className="flex-grow border-t border-slate-700/50"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Or sign in with</span>
              <div className="flex-grow border-t border-slate-700/50"></div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in was cancelled.')}
                theme="filled_black"
                size="large"
                text="continue_with"
                shape="rectangular"
                width="368"
              />
            </div>
          </div>

          <footer className="mt-8 text-center text-sm font-medium text-slate-400">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-yellow-500 font-bold hover:text-yellow-400 transition-colors">
              Register here
            </Link>
          </footer>
        </div>
      </section>
    </main>
  );
}
