import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError("")
  }

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const response = await axios.post("http://localhost:8000/auth/login", {
        email: form.email,
        password: form.password,
      })
      localStorage.setItem("token", response.data.access_token)
      navigate("/")
    } catch (err: any) {
      setError(err.response?.data?.detail || "Credenciales incorrectas")
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
          <p className="text-sm text-muted-foreground mt-1.5">Bienvenido de vuelta</p>
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

            {/* Contraseña */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <a
                  href="#"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
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
              disabled={loading || !form.email || !form.password}
              className="w-full"
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>

          </CardContent>
        </Card>

        {/* Link registro */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿No tienes cuenta?{" "}
          <Link
            to="/register"
            className="text-foreground font-medium hover:underline underline-offset-4"
          >
            Regístrate gratis
          </Link>
        </p>

      </div>
    </div>
  )
}