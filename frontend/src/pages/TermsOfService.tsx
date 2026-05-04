import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, Eye, User, Ban } from 'lucide-react';

const sections = [
  {
    icon: <User className="w-5 h-5 text-yellow-500" />,
    title: "1. Platform Use",
    content: [
      "NakamaGate is an anime and manga tracking and discovery platform intended for users aged 13 and over.",
      "By registering, you agree to provide truthful information about your age. Access to adult content requires confirmation of legal age.",
      "You agree not to use the platform for illegal activities, spam or harassment of other users.",
    ],
  },
  {
    icon: <Shield className="w-5 h-5 text-yellow-500" />,
    title: "2. Privacy and Data",
    content: [
      "We only collect data necessary for the service to function: email, alias, content preferences and favorites list.",
      "Your password is stored encrypted via bcrypt. We never store passwords in plain text.",
      "We do not sell or share your personal data with third parties except when legally required.",
      "Users who sign in via Google OAuth are created with a secure random token; we do not have access to your Google password.",
    ],
  },
  {
    icon: <Eye className="w-5 h-5 text-yellow-500" />,
    title: "3. Content",
    content: [
      "NakamaGate acts as an intermediary for information obtained from the AniList API. We do not host or distribute copyright-protected multimedia content.",
      "Titles, images and synopses belong to their respective creators and distributors.",
      "Reviews and ratings published are the sole responsibility of their authors.",
    ],
  },
  {
    icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    title: "4. Adult Content",
    content: [
      "Some content available on the platform may be classified as Ecchi or adult (+18).",
      "This content is only accessible to users who have verified their age in their profile settings.",
      "It is the user's responsibility to provide truthful information about their age.",
    ],
  },
  {
    icon: <Ban className="w-5 h-5 text-yellow-500" />,
    title: "5. Limitation of Liability",
    content: [
      "NakamaGate is provided 'as is', without guarantees of uninterrupted availability or absence of errors.",
      "We are not responsible for data loss resulting from technical failures.",
      "We reserve the right to modify, suspend or discontinue the service at any time.",
    ],
  },
];

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 font-sans">

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-yellow-500/10 blur-[120px]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-yellow-500/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-225 mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 text-slate-400 hover:text-yellow-500 transition-colors text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <span className="font-black text-yellow-500 tracking-tighter text-xl italic uppercase">NAKAMAGATE</span>
          <div className="w-16" />
        </div>
      </nav>

      <div className="relative z-10 max-w-225 mx-auto px-6 py-16 pb-24">

        <header className="mb-14 text-center">
          <p className="text-yellow-500/80 text-[10px] font-black uppercase tracking-[0.4em] mb-3">Legal</p>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Last updated: January 2025. By using NakamaGate you accept the following terms.
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
          Questions? Contact the project creator: <span className="text-slate-500">yagopuentetecnologia@gmail.com</span>
        </p>
      </div>
    </main>
  );
}
