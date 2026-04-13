import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    acceptPolicies: false,
    isOlderThan18: false
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Las contraseñas no coinciden.');
    }
    if (!formData.acceptPolicies || !formData.isOlderThan18) {
      return setError('Debes aceptar todos los términos y ser mayor de edad.');
    }

    console.log("Registrando usuario...", formData);
    // Aquí iría tu apiClient.post('/users/register', ...)
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] border-4 border-black rounded-2xl bg-white">
        <CardHeader className="text-center bg-black text-white rounded-t-lg mb-6">
          <CardTitle className="text-3xl font-black tracking-widest">NUEVO NAKAMA</CardTitle>
          <CardDescription className="text-slate-300 font-bold">Únete a la mayor red social de anime</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {error && <div className="p-3 text-sm bg-red-100 border-2 border-red-500 font-bold text-red-700">{error}</div>}
            
            <div className="space-y-2">
              <Label className="font-bold text-sm">CORREO ELECTRÓNICO</Label>
              <Input type="email" placeholder="tu@email.com" onChange={(e) => setFormData({...formData, email: e.target.value})} className="border-2 border-black h-12" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-sm">CONTRASEÑA</Label>
                <Input type="password" placeholder="••••••" onChange={(e) => setFormData({...formData, password: e.target.value})} className="border-2 border-black h-12" required />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-sm">CONFIRMAR</Label>
                <Input type="password" placeholder="••••••" onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="border-2 border-black h-12" required />
              </div>
            </div>

            <div className="space-y-4 py-4 border-t-2 border-dashed border-slate-200">
              <div className="flex items-center space-x-3">
                <Checkbox id="terms" onCheckedChange={(val) => setFormData({...formData, acceptPolicies: !!val})} className="border-2 border-black w-6 h-6" />
                <Label htmlFor="terms" className="text-sm font-bold leading-none cursor-pointer">Acepto las políticas de la comunidad</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox id="age" onCheckedChange={(val) => setFormData({...formData, isOlderThan18: !!val})} className="border-2 border-black w-6 h-6" />
                <Label htmlFor="age" className="text-sm font-bold leading-none cursor-pointer">Confirmo que tengo +18 años</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all">
              CREAR CUENTA
            </Button>
            <Link to="/login" className="font-bold text-sm hover:underline italic">¿Ya eres parte de NakamaGate? Entra aquí</Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}