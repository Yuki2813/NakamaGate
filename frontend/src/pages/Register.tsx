import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ email: "", username: "", password: "", passwordConfirm: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError("")
  }

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault()
    setError("")

    // Validaciones
    if (form.password !== form.passwordConfirm) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)
    try {
      await register(form.email, form.username, form.password)
      navigate("/")
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al registrarse")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-foreground"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">NakamaGate</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Crea tu cuenta</p>
        </div>

        {/* Card */}
        <Card className="border-border bg-card">
          <CardContent className="pt-6 space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            {/* Usuario */}
            <div className="space-y-1.5">
              <Label htmlFor="username">Nombre de usuario</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="tu_usuario"
                value={form.username}
                onChange={handleChange}
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-1.5">
              <Label htmlFor="passwordConfirm">Confirmar contraseña</Label>
              <Input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.passwordConfirm}
                onChange={handleChange}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* Botón */}
            <Button
              onClick={handleSubmit}
              disabled={loading || !form.email || !form.username || !form.password || !form.passwordConfirm}
              className="w-full"
            >
              {loading ? "Registrando..." : "Registrarse"}
            </Button>

          </CardContent>
        </Card>

        {/* Link login */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link
            to="/login"
            className="text-foreground font-medium hover:underline underline-offset-4"
          >
            Inicia sesión
          </Link>
        </p>

      </div>
    </div>
  )
}
