import {
  Sparkles,
  Pin,
  Globe,
  FileText,
  ShieldCheck,
  ArrowRight,
  Lock,
  Smartphone,
  CheckCircle2,
  Layers,
  Cpu,
  AlertCircle,
} from 'lucide-react';

interface LandingPageProps {
  onSignInClick: () => void;
  isLoading?: boolean;
  errorMsg?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignInClick,
  isLoading = false,
  errorMsg,
}) => {
  return (
    <div className="min-h-screen bg-[#0a1530] text-white flex flex-col selection:bg-[#ff64c8]/30 selection:text-white relative overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#5645d4]/20 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-[#ff64c8]/15 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-10 -left-20 w-[450px] h-[450px] bg-[#5645d4]/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      ></div>

      {/* Top Floating Navbar */}
      <header className="sticky top-0 z-50 w-full bg-[#0a1530]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 p-1 flex items-center justify-center shadow-md">
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
                  SEO
                </span>
              </div>
            </div>
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={onSignInClick}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-[#1a1a1a] bg-white hover:bg-[#f8f9fa] rounded-xl shadow-lg transition-all hover:shadow-xl active:scale-[0.98] cursor-pointer"
            >
              {/* Official Google SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.08] border border-white/15 text-xs font-medium text-[#d8d0f2] mb-6 backdrop-blur-md shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-[#f5d75e]" />
            <span>Next-Gen Visual & Search Indexing Studio</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-[1.15] mb-5">
            Rank Higher on <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff64c8] to-[#ff9472]">Pinterest</span> &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a594fd] to-[#5645d4]">Google SERP</span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed mb-8">
            The dual-mode SEO engine engineered by Arigato Labs. Turn visual prompts and artwork into viral pin titles, Google-indexed structured snippets, and ranked keyword clusters.
          </p>

          {/* Error Banner if any */}
          {errorMsg && (
            <div className="mb-6 p-3 rounded-xl bg-[#ef4444]/20 border border-[#ef4444]/40 max-w-md mx-auto flex items-start gap-2.5 text-xs text-[#fca5a5] text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#ef4444] mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Call to Action */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <button
              onClick={onSignInClick}
              disabled={isLoading}
              className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-xl bg-white hover:bg-[#f8f9fa] text-[#1a1a1a] text-sm font-bold shadow-xl shadow-white/10 hover:shadow-2xl transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98]"
            >
              {/* Official Google SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span>Launch Studio with Google</span>
              <ArrowRight className="w-4 h-4 ml-1 text-[#5645d4]" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1aae39]" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1aae39]" />
              Isolated private space
            </span>
          </div>
        </div>

        {/* 3 Core Power Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-16">
          {/* Module 1: Pinterest Engine */}
          <div className="bg-[#121e42]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#ff64c8]/50 transition-all shadow-xl group">
            <div className="w-12 h-12 rounded-xl bg-[#e60023]/20 text-[#ff64c8] border border-[#e60023]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Pin className="w-6 h-6 text-[#ff64c8]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">
              Dual-Mode Pinterest SEO
            </h3>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-4">
              Choose between <strong>Website Link CTA</strong> pins or <strong>Google Search Steps</strong>. Injects pinned keywords organically with engaging visual titles.
            </p>
            <div className="text-[11px] text-[#ff9472] font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Zero-Crop Full Artwork Preview</span>
            </div>
          </div>

          {/* Module 2: Arigato Site SEO */}
          <div className="bg-[#121e42]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#5645d4]/50 transition-all shadow-xl group">
            <div className="w-12 h-12 rounded-xl bg-[#5645d4]/20 text-[#a594fd] border border-[#5645d4]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6 text-[#a594fd]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">
              Google SERP 3-Block Generator
            </h3>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-4">
              Strict character & word audits. Generates &lt;199 words About Prompt, &lt;160 chars Meta Description, and 6 to 9 search tags with 1-click copy blocks.
            </p>
            <div className="text-[11px] text-[#a594fd] font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>Live Google Search Snippet Simulation</span>
            </div>
          </div>

          {/* Module 3: Tesseract OCR Visual Grabber */}
          <div className="bg-[#121e42]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#f5d75e]/50 transition-all shadow-xl group">
            <div className="w-12 h-12 rounded-xl bg-[#f5d75e]/15 text-[#f5d75e] border border-[#f5d75e]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-[#f5d75e]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">
              Neural OCR Visual Extractor
            </h3>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-4">
              Upload or paste screenshots directly. Extracts prompt text, hashtags, and keywords automatically with zero manual typing required.
            </p>
            <div className="text-[11px] text-[#f5d75e] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Ingestion into Repository</span>
            </div>
          </div>
        </div>

        {/* Security & Multi-User Isolated Architecture Banner */}
        <div className="bg-gradient-to-r from-[#121e42] to-[#1a2b5a] border border-white/15 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1aae39]/20 text-[#1aae39] border border-[#1aae39]/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-white">
                Isolated Private Workspaces & Security Lock
              </h4>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                Your target keywords are securely locked inside your personal Firebase Firestore space with custom Security Question protection.
              </p>
            </div>
          </div>

          <button
            onClick={onSignInClick}
            className="shrink-0 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/25 rounded-xl text-xs sm:text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            Enter Studio
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-[#0a1530]/90 py-6 text-center text-xs text-white/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Arigato SEO Labs • All Rights Reserved</span>
          <div className="flex items-center gap-4 text-white/60">
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" /> PWA Mobile Optimized
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Protected by Firebase
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
