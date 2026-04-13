import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Inicializamos el navegador de React Router
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Hacemos la petición a tu endpoint de FastAPI
      const response = await apiClient.post('/auth/login', {
        email: email,
        password: password
      });

      // Si el backend nos devuelve el token de acceso
      if (response.data.access_token) {
        // 1. Guardamos el token en la memoria del navegador
        localStorage.setItem('token', response.data.access_token);
        
        // 2. ¡Redirigimos al usuario a su panel principal!
        navigate('/home'); 
      }
      
    } catch (err: any) {
      console.error(err);
      setError('Credenciales incorrectas o problema de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4 font-sans antialiased">
      {/* TARJETA ESTILO NEUBRUTALISMO */}
      <Card className="w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black rounded-xl bg-white">
        
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-4xl font-black italic uppercase tracking-tighter">
            Login
          </CardTitle>
          <CardDescription className="font-bold text-slate-600 text-base mt-2">
            ¡Bienvenido de nuevo, Nakama!
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            
            {/* Mensaje de Error */}
            {error && (
              <div className="p-3 text-sm bg-red-100 border-2 border-red-500 font-bold text-red-700 uppercase">
                {error}
              </div>
            )}
            
            {/* Campo Email */}
            <div className="space-y-2">
              <Label className="font-black uppercase text-xs tracking-widest text-black">
                Email
              </Label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="tu@email.com"
                className="border-2 border-black focus-visible:ring-0 focus-visible:border-purple-600 focus-visible:shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] transition-all h-12 font-medium" 
              />
            </div>
            
            {/* Campo Contraseña */}
            <div className="space-y-2">
              <Label className="font-black uppercase text-xs tracking-widest text-black">
                Contraseña
              </Label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                className="border-2 border-black focus-visible:ring-0 focus-visible:border-purple-600 focus-visible:shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] transition-all h-12 font-medium" 
              />
            </div>

          </CardContent>
          
          <CardFooter className="flex flex-col gap-5 pt-4">
            {/* Botón de Submit con animación manga */}
            <Button 
              className="w-full font-black text-xl bg-black text-white hover:bg-purple-600 border-4 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] h-14 uppercase tracking-wider" 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? 'CARGANDO...' : 'ENTRAR'}
            </Button>
            
            {/* Enlace al Registro */}
            <p className="text-sm font-bold text-slate-600">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-purple-700 underline hover:text-black transition-colors">
                Regístrate aquí
              </Link>
            </p>
          </CardFooter>
        </form>

      </Card>
    </div>
  );
}