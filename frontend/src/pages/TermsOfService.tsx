import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, Eye, User, Ban } from 'lucide-react';

const sections = [
  {
    icon: <User className="w-5 h-5 text-yellow-500" />,
    title: "1. Uso de la Plataforma",
    content: [
      "NakamaGate es una plataforma de seguimiento y descubrimiento de anime y manga destinada a usuarios mayores de 13 años.",
      "Al registrarte, aceptas proporcionar información veraz sobre tu edad. El acceso a contenido para adultos requiere confirmación de mayoría de edad.",
      "Te comprometes a no usar la plataforma para actividades ilegales, spam o acoso a otros usuarios.",
    ],
  },
  {
    icon: <Shield className="w-5 h-5 text-yellow-500" />,
    title: "2. Privacidad y Datos",
    content: [
      "Recopilamos únicamente los datos necesarios para el funcionamiento del servicio: email, alias, preferencias de contenido y lista de favoritos.",
      "Tu contraseña se almacena cifrada mediante bcrypt. Nunca almacenamos contraseñas en texto plano.",
      "No vendemos ni compartimos tus datos personales con terceros salvo obligación legal.",
      "Los usuarios que acceden mediante Google OAuth son creados con un token seguro aleatorio; no tenemos acceso a tu contraseña de Google.",
    ],
  },
  {
    icon: <Eye className="w-5 h-5 text-yellow-500" />,
    title: "3. Contenido",
    content: [
      "NakamaGate actúa como intermediario de información obtenida de la API de AniList. No alojamos ni distribuimos contenido multimedia protegido por derechos de autor.",
      "Los títulos, imágenes y sinopsis pertenecen a sus respectivos creadores y distribuidores.",
      "Las reseñas y valoraciones publicadas son responsabilidad exclusiva de sus autores.",
    ],
  },
  {
    icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    title: "4. Contenido para Adultos",
    content: [
      "Parte del contenido disponible en la plataforma puede estar clasificado como Ecchi o para adultos (+18).",
      "Este contenido solo es accesible para usuarios que hayan verificado su mayoría de edad en los ajustes de su perfil.",
      "Es responsabilidad del usuario proporcionar información veraz sobre su edad.",
    ],
  },
  {
    icon: <Ban className="w-5 h-5 text-yellow-500" />,
    title: "5. Limitación de Responsabilidad",
    content: [
      "NakamaGate se ofrece 'tal cual', sin garantías de disponibilidad ininterrumpida o ausencia de errores.",
      "No nos responsabilizamos por pérdida de datos derivada de fallos técnicos.",
      "Nos reservamos el derecho de modificar, suspender o discontinuar el servicio en cualquier momento.",
    ],
  },
];

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 font-sans">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-yellow-500/10 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-yellow-500/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-[900px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 text-slate-400 hover:text-yellow-500 transition-colors text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
          <span className="font-black text-yellow-500 tracking-tighter text-xl italic uppercase">NAKAMAGATE</span>
          <div className="w-16" />
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 max-w-[900px] mx-auto px-6 py-16 pb-24">

        <header className="mb-14 text-center">
          <p className="text-yellow-500/80 text-[10px] font-black uppercase tracking-[0.4em] mb-3">Legal</p>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Términos de Servicio
          </h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Última actualización: enero de 2025. Al usar NakamaGate aceptas los siguientes términos.
          </p>
        </header>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
                  {section.icon}
                </div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest">{section.title}</h2>
              </div>
              <ul className="space-y-3">
                {section.content.map((paragraph, index) => (
                  <li key={index} className="flex gap-3 text-slate-400 text-sm leading-relaxed">
                    <span className="text-yellow-500/40 mt-0.5 flex-shrink-0">—</span>
                    <span>{paragraph}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="text-center text-slate-700 text-xs mt-12">
          ¿Dudas? Contacta al creador del proyecto: <span className="text-slate-500">yagopuentetecnologia@gmail.com</span>
        </p>
      </div>
    </main>
  );
}
