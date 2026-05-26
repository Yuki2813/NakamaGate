import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  googleToken: string;
  email: string;
  suggestedAlias: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function GoogleOnboardingModal({ googleToken, email, suggestedAlias, onSuccess, onCancel }: Props) {
  const { completeGoogleSignup } = useAuth();
  const [alias, setAlias] = useState(suggestedAlias);
  const [isAdult, setIsAdult] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (alias.trim().length < 3 || alias.trim().length > 20) {
      setError('Alias must be between 3 and 20 characters.');
      return;
    }
    if (!acceptTerms) {
      setError('You must accept the terms of service to continue.');
      return;
    }

    setSubmitting(true);
    try {
      await completeGoogleSignup(googleToken, alias.trim(), isAdult, acceptTerms);
      onSuccess();
    } catch (err: any) {
      let detail;
      if (err && err.response && err.response.data) {
        detail = err.response.data.detail;
      }

      let message = 'Could not complete the registration.';
      if (typeof detail === 'string') {
        message = detail;
      }
      setError(message);
      setSubmitting(false);
    }
  };

  let submitContent: React.ReactNode = 'Create account';
  if (submitting) {
    submitContent = (
      <>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-yellow-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <header className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-white mb-2">
            Welcome to <span className="text-yellow-500">NakamaGate</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Just a few details to finish setting up your account for <span className="text-slate-200 font-semibold">{email}</span>
          </p>
        </header>

        {error && (
          <div role="alert" className="bg-red-900/20 text-red-400 p-3 rounded-xl text-sm font-medium mb-4 text-center border border-red-900/50 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="onboarding-alias" className="text-sm font-semibold text-slate-300 ml-1">Choose your alias</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="onboarding-alias"
                type="text"
                required
                minLength={3}
                maxLength={20}
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full pl-11 h-12 rounded-xl bg-black/40 border border-slate-700 text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
              />
            </div>
            <p className="text-xs text-slate-500 ml-1">3 to 20 characters. Must be unique.</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isAdult}
              onChange={(e) => setIsAdult(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-600 bg-black/40 accent-yellow-500"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-200">I am 18 or older</p>
              <p className="text-xs text-slate-500">Enables adult content. You can change this later in your profile.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-600 bg-black/40 accent-yellow-500"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-200">
                I accept the <Link to="/terms" target="_blank" className="text-yellow-500 hover:text-yellow-400 underline">Terms of Service</Link>
              </p>
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 h-11 rounded-xl border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 h-11 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-black font-bold"
            >
              {submitContent}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
