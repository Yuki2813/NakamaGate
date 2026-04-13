import { useState } from 'react';
import { apiClient } from '../api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/users/login', { email, password });
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        window.location.href = '/'; // O usar navigate('/')
      }
    } catch (err: any) {
      setError('Credenciales incorrectas o error de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black rounded-xl bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black italic uppercase">Login</CardTitle>
          <CardDescription className="font-bold">¡Bienvenido de nuevo, Nakama!</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="p-3 text-sm bg-red-100 border-2 border-red-400 font-bold">{error}</div>}
            <div className="space-y-2">
              <Label className="font-bold uppercase text-xs">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="border-2 border-black focus-visible:ring-0" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold uppercase text-xs">Contraseña</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="border-2 border-black focus-visible:ring-0" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full font-black text-lg bg-black hover:bg-white hover:text-black border-2 border-black transition-all" type="submit" disabled={isLoading}>
              {isLoading ? 'CARGANDO...' : 'ENTRAR'}
            </Button>
            <p className="text-sm font-bold">¿No tienes cuenta? <Link to="/register" className="text-purple-600 underline">Regístrate aquí</Link></p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}