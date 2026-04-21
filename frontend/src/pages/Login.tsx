import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
// 1. IMPORTAMOS EL HOOK EN LUGAR DEL COMPONENTE
import { useGoogleLogin } from '@react-oauth/google';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- LOGIN TRADICIONAL ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.access_token || res.data.token);
      navigate('/home');
    } catch (err) {
      setError('Credenciales incorrectas. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  // --- LOGIN CON GOOGLE (PERSONALIZADO) ---
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      setLoading(true);
      try {
        // ATENCIÓN: useGoogleLogin devuelve un "access_token"
        const res = await apiClient.post('/auth/google', { 
          token: tokenResponse.access_token 
        });
        
        localStorage.setItem('token', res.data.access_token || res.data.token);
        navigate('/home');
      } catch (err) {
        setError('No se pudo iniciar sesión con Google.');
        setLoading(false);
      }
    },
    onError: () => setError('El inicio de sesión con Google fue cancelado.')
  });

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#020617] relative px-4 transition-colors duration-500 overflow-hidden">
      
      {/* Fondo de degradado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] absolute -top-40 -left-40"></div>
        <div className="w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] absolute -bottom-20 -right-20"></div>
      </div>

      <section className="w-full max-w-md z-10">
        <div className="bg-slate-900 border border-yellow-500/30 shadow-[0_0_50px_-12px_rgba(234,179,8,0.15)] rounded-3xl p-8 md:p-10 relative">
          
          <header className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              Bienvenido a <span className="text-yellow-500">NakamaGate</span>
            </h1>
            <p className="text-slate-400 font-medium">Inicia sesión para continuar</p>
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
                  id="email" type="email" required placeholder="tu@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 h-12 rounded-xl bg-black/40 border border-slate-700 text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label htmlFor="password" className="text-sm font-semibold text-slate-300">Contraseña</label>
                <Link to="#" className="text-xs font-semibold text-yellow-500 hover:text-yellow-400 transition-colors">
                  ¿Olvidaste tu contraseña?
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
              {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : "Entrar"}
            </Button>
          </form>

          {/* DIVISOR Y BOTÓN PERSONALIZADO DE GOOGLE */}
          <div className="mt-6">
            <div className="relative flex items-center py-2 mb-4">
              <div className="flex-grow border-t border-slate-700/50"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-500 uppercase tracking-wider">O entra con</span>
              <div className="flex-grow border-t border-slate-700/50"></div>
            </div>
            
            <button 
              type="button"
              onClick={() => loginWithGoogle()}
              className="w-full h-12 flex items-center justify-center gap-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 hover:text-yellow-500 hover:border-yellow-500/50 transition-all active:scale-[0.98]"
            >
              {/* SVG del Logo de Google */}
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>
          </div>

          <footer className="mt-8 text-center text-sm font-medium text-slate-400">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-yellow-500 font-bold hover:text-yellow-400 transition-colors">
              Regístrate aquí
            </Link>
          </footer>
        </div>
      </section>
    </main>
  );
}