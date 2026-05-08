import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Button } from "@/components/ui/button";
import { Check, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();

  const [alias, setAlias] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isAdult, setIsAdult] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!acceptTerms) {
      setError('You must accept the terms of service to register.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/auth/register', {
        alias,
        email,
        password,
        is_adult: isAdult
      });
      navigate('/login');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        const serverError = err.response.data.detail;

        if (typeof serverError === 'string') {
          setError(serverError);
        } else if (Array.isArray(serverError) && serverError.length > 0) {
          setError(serverError[0].msg);
        } else {
          setError('The server rejected the registration.');
        }
      } else {
        setError('Connection error. Make sure the server is running.');
      }
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#020617] relative px-4 py-12 transition-colors duration-500 overflow-hidden">

      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] absolute -bottom-40 -right-40"></div>
        <div className="w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] absolute -top-20 -left-20"></div>
      </div>

      <section className="w-full max-w-md z-10">
        <div className="bg-slate-900 border border-yellow-500/30 shadow-[0_0_50px_-12px_rgba(234,179,8,0.15)] rounded-3xl p-8 md:p-10 relative">

          <header className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              Join <span className="text-yellow-500">NakamaGate</span>
            </h1>
            <p className="text-slate-400 font-medium">Create your Nakama profile</p>
          </header>

          {error && (
            <div role="alert" className="bg-red-900/20 text-red-400 p-3 rounded-xl text-sm font-medium mb-6 text-center border border-red-900/50 animate-in fade-in zoom-in-95 duration-200">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="alias" className="text-sm font-semibold text-slate-300 ml-1">Alias / Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" aria-hidden="true" />
                <input
                  id="alias"
                  type="text"
                  required
                  placeholder="E.g.: Kirito99"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="w-full pl-11 h-12 rounded-xl bg-black/40 border border-slate-700 text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-slate-300 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="otaku@nakamagate.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 h-12 rounded-xl bg-black/40 border border-slate-700 text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pass" className="text-sm font-semibold text-slate-300 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" aria-hidden="true" />
                <input
                  id="pass"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 h-12 rounded-xl bg-black/40 border border-slate-700 text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-yellow-500 focus:outline-none transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm" className="text-sm font-semibold text-slate-300 ml-1">Repeat Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" aria-hidden="true" />
                <input
                  id="confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-11 h-12 rounded-xl bg-black/40 border border-slate-700 text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-yellow-500 focus:outline-none transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="py-2 space-y-3">

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={isAdult}
                    onChange={(e)=>setIsAdult(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border border-slate-600 rounded bg-black/40 checked:bg-yellow-500 checked:border-yellow-500 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:ring-offset-1 focus:ring-offset-slate-900"
                  />
                  <Check className="absolute w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={4} />
                </div>
                <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                  I confirm I am over 18 years old. <span className="text-slate-500 text-xs italic">(Optional)</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    required
                    checked={acceptTerms}
                    onChange={(e)=>setAcceptTerms(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border border-slate-600 rounded bg-black/40 checked:bg-yellow-500 checked:border-yellow-500 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:ring-offset-1 focus:ring-offset-slate-900"
                  />
                  <Check className="absolute w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={4} />
                </div>
                <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                  I accept the <Link to="/terms" className="text-yellow-500 hover:text-yellow-400 hover:underline">Terms of Service</Link> and Privacy Policy.
                </span>
              </label>

            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-base shadow-lg shadow-yellow-900/20 mt-2 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <footer className="mt-8 text-center text-sm font-medium text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-yellow-500 font-bold hover:text-yellow-400 hover:underline transition-colors">
              Sign in
            </Link>
          </footer>
        </div>
      </section>
    </main>
  );
}
