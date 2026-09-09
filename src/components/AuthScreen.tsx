import React, { useState } from 'react';
import { signInWithGoogle } from '../services/firebase';
import { Sparkles, Shield, Pin, Globe, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: unknown) {
      console.error('[Auth] Google Sign-In Error:', err);
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in cancelled. Please click below to try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setErrorMsg(
          'This domain is not authorized in Firebase. Please add this domain to Firebase Console > Authentication > Settings > Authorized Domains.'
        );
      } else {
        setErrorMsg(error.message || 'Unable to sign in with Google. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1530] text-white flex flex-col justify-between relative overflow-hidden selection:bg-[#ff64c8]/30 selection:text-white">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#5645d4]/25 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#ff64c8]/20 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute -bottom-20 left-1/4 w-[500px] h-72 bg-[#5645d4]/20 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Subtle Grid Lines Overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      ></div>

      {/* Top Navbar Brand */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center shadow-md">
            <img
              src="/apple-touch-icon.png"
              alt="Arigato SEO Labs"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                Arigato<span className="text-[#a594fd]"> Labs</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#5645d4]/40 text-[#d8d0f2] border border-[#5645d4]/50 px-1.5 py-0.2 rounded-full">
                Studio
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/70">
          <Shield className="w-3.5 h-3.5 text-[#1aae39]" />
          <span className="hidden sm:inline">Protected User Spaces</span>
        </div>
      </header>

      {/* Main Center Auth Card */}
      <main className="relative z-10 max-w-md w-full mx-auto px-4 sm:px-6 py-8">
        <div className="bg-[#121e42]/85 backdrop-blur-xl border border-white/15 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50 text-center relative overflow-hidden">
          {/* Subtle Top Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5645d4] via-[#ff64c8] to-[#5645d4]"></div>

          {/* Logo Badge */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-[#5645d4] to-[#7f71f6] p-0.5 shadow-lg shadow-[#5645d4]/30 flex items-center justify-center">
            <div className="w-full h-full bg-[#0a1530] rounded-[14px] flex items-center justify-center p-2.5">
              <img
                src="/apple-touch-icon.png"
                alt="Arigato SEO Labs"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            Welcome to SEO Labs
          </h1>
          <p className="text-xs sm:text-sm text-white/70 mb-6 leading-relaxed">
            Your personal AI SEO workspace for Pinterest algorithmic indexing and Google SERP domination.
          </p>

          {/* Error Message if any */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/40 text-left flex items-start gap-2.5 text-xs text-[#fca5a5]">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#ef4444] mt-0.5" />
              <div className="leading-snug">{errorMsg}</div>
            </div>
          )}

          {/* Google Sign-In Action Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className={`w-full py-3.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer shadow-lg ${
              isLoading
                ? 'bg-white/70 text-gray-700 cursor-not-allowed'
                : 'bg-white hover:bg-[#f8f9fa] text-[#1f2937] hover:shadow-xl active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin"></span>
                <span>Connecting with Google...</span>
              </>
            ) : (
              <>
                {/* Official Google 'G' SVG Logo */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Privacy & Scope Callout */}
          <div className="mt-5 pt-5 border-t border-white/10 space-y-2 text-left">
            <div className="flex items-center gap-2 text-[11px] text-white/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1aae39] shrink-0" />
              <span>Isolated Firestore space for your keywords</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1aae39] shrink-0" />
              <span>Personal profile with custom name & gender onboarding</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1aae39] shrink-0" />
              <span>One-Time Passcode protection for keyword edits</span>
            </div>
          </div>
        </div>

        {/* Studio Features Preview Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 text-center">
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-xs">
            <Pin className="w-4 h-4 text-[#e60023] mx-auto mb-1" />
            <span className="text-[10px] sm:text-[11px] font-medium text-white/80 block">
              Pinterest SEO
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-xs">
            <Globe className="w-4 h-4 text-[#7f71f6] mx-auto mb-1" />
            <span className="text-[10px] sm:text-[11px] font-medium text-white/80 block">
              Site SERP Studio
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-xs">
            <Sparkles className="w-4 h-4 text-[#f5d75e] mx-auto mb-1" />
            <span className="text-[10px] sm:text-[11px] font-medium text-white/80 block">
              OCR Text Grab
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-4 py-4 text-center text-xs text-white/40">
        Arigato SEO Labs • Powered by Google Firebase Authentication
      </footer>
    </div>
  );
};
