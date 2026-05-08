import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, Users, PenTool } from 'lucide-react';

export default function Welcome() {
  return (
    <div className="min-h-screen bg-[#020617] font-sans antialiased text-slate-100 flex flex-col transition-colors duration-500 overflow-hidden relative">

      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] absolute -top-40 -left-40"></div>
        <div className="w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] absolute -bottom-20 -right-20"></div>
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 py-6 border-b border-yellow-500/20 bg-slate-900/40 backdrop-blur-xl">
        <header>
          <img
            src="https://res.cloudinary.com/dlalpfup4/image/upload/v1777901507/1000091271_cyfjfk.png"
            alt="NakamaGate"
            className="h-10 w-auto object-contain"
          />
        </header>
        <div className="flex gap-4">
          <Link to="/login">
            <Button
              variant="outline"
              className="border-2 border-yellow-500/40 font-semibold hover:border-yellow-500/60 text-yellow-500 hover:bg-yellow-500/10 transition-all"
            >
              Log In
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex-grow max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-28 text-center flex flex-col items-center justify-center w-full">

        <span className="inline-block bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 px-3 sm:px-4 py-1.5 sm:py-2 font-bold text-xs sm:text-sm uppercase tracking-widest rounded-full mb-6 sm:mb-8 shadow-lg shadow-yellow-500/20">
          ✨ For anime lovers
        </span>

        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-5 sm:mb-6 leading-[1.1] text-white">
          Your anime community<br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-yellow-400 via-yellow-300 to-yellow-500">
            without limits
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-slate-300 font-medium max-w-3xl mb-10 sm:mb-12 leading-relaxed">
          Discover, share and connect. Explore thousands of series, create your personal list, read uncensored reviews and build genuine friendships with other nakamas from around the world.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Link to="/register">
            <Button
              size="lg"
              className="h-14 px-8 text-lg font-bold bg-yellow-500 hover:bg-yellow-400 text-black border-2 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_50px_rgba(234,179,8,0.5)] transition-all hover:scale-105"
            >
              Enter the Gate
            </Button>
          </Link>
          <Link to="/login">
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg font-bold border-2 border-yellow-500/40 hover:border-yellow-500/60 text-yellow-300 hover:bg-yellow-500/10 transition-all"
            >
              I already have an account
            </Button>
          </Link>
        </div>

      </main>

      <section aria-labelledby="features-title" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">

        <h2 id="features-title" className="sr-only">Main features</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">

          <article className="group bg-slate-900/50 backdrop-blur-md p-6 sm:p-8 md:p-10 border-2 border-yellow-500/20 rounded-2xl shadow-lg hover:shadow-[0_0_40px_rgba(234,179,8,0.15)] hover:border-yellow-500/40 transition-all duration-300 hover:-translate-y-2">
            <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 mb-5 sm:mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400" aria-hidden="true" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black mb-3 sm:mb-4 text-white">
              Complete Database
            </h3>
            <p className="text-slate-400 font-medium text-base sm:text-lg leading-relaxed">
              Access detailed information about thousands of anime. Discover new releases, genres and organize your watchlist intelligently.
            </p>
          </article>

          <article className="group bg-slate-900/50 backdrop-blur-md p-6 sm:p-8 md:p-10 border-2 border-yellow-500/20 rounded-2xl shadow-lg hover:shadow-[0_0_40px_rgba(234,179,8,0.15)] hover:border-yellow-500/40 transition-all duration-300 hover:-translate-y-2">
            <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 mb-5 sm:mb-6 group-hover:scale-110 transition-transform">
              <PenTool className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400" aria-hidden="true" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black mb-3 sm:mb-4 text-white">
              Authentic Reviews
            </h3>
            <p className="text-slate-400 font-medium text-base sm:text-lg leading-relaxed">
              Rate, critique and express yourself without filters. Read real opinions from other users and build your reputation as a critic in the community.
            </p>
          </article>

          <article className="group bg-slate-900/50 backdrop-blur-md p-6 sm:p-8 md:p-10 border-2 border-yellow-500/20 rounded-2xl shadow-lg hover:shadow-[0_0_40px_rgba(234,179,8,0.15)] hover:border-yellow-500/40 transition-all duration-300 hover:-translate-y-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 mb-5 sm:mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400" aria-hidden="true" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black mb-3 sm:mb-4 text-white">
              Nakama Network
            </h3>
            <p className="text-slate-400 font-medium text-base sm:text-lg leading-relaxed">
              Connect with other anime lovers. Add friends, see what they&apos;re watching and create your personalized circle of trust.
            </p>
          </article>

        </div>
      </section>

      <footer className="relative z-10 border-t border-yellow-500/20 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <p className="text-slate-300 font-medium mb-6">
            Ready to experience anime for real?
          </p>
          <Link to="/register">
            <Button
              size="lg"
              className="h-12 px-8 font-bold bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_50px_rgba(234,179,8,0.5)] transition-all"
            >
              Join today
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
