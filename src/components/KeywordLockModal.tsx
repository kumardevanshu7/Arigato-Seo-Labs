import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, X, AlertCircle } from 'lucide-react';

interface KeywordLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedPasscode: string;
  onSuccess: () => void;
}

export const KeywordLockModal: React.FC<KeywordLockModalProps> = ({
  isOpen,
  onClose,
  expectedPasscode,
  onSuccess,
}) => {
  const [enteredCode, setEnteredCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredCode === expectedPasscode) {
      setErrorMsg(null);
      setEnteredCode('');
      onSuccess();
    } else {
      setErrorMsg('Incorrect passcode. Access to keywords is locked.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#e5e3df] shadow-2xl max-w-sm w-full overflow-hidden relative">
        {/* Top Accent Bar */}
        <div className="h-1 bg-[#e60023]"></div>

        <div className="p-5 sm:p-6 text-center">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-[#fde0ec] text-[#e60023] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Lock className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-[#1a1a1a] mb-1">
            Keywords Lock Protected
          </h3>
          <p className="text-xs text-[#787671] mb-5 leading-relaxed">
            Enter your One-Time Keyword Passcode to access and modify your target SEO keywords.
          </p>

          {errorMsg && (
            <div className="mb-4 p-2.5 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-xs text-[#b91c1c] flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showCode ? 'text' : 'password'}
                autoFocus
                value={enteredCode}
                onChange={(e) => {
                  setEnteredCode(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Enter passcode..."
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-[#fafaf9] border border-[#c8c4be] rounded-lg focus:outline-none focus:border-[#5645d4] focus:bg-white text-[#1a1a1a] text-center tracking-widest font-mono font-bold"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-lg border border-[#e5e3df] text-xs font-semibold text-[#5d5b54] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-3 rounded-lg bg-[#5645d4] hover:bg-[#4534b3] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Unlock</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
