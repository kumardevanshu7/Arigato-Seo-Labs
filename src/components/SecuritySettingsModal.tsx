import React, { useState } from 'react';
import type { SecuritySettings } from '../types/seo';
import { Shield, HelpCircle, KeyRound, Check, X, Eye, EyeOff } from 'lucide-react';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: SecuritySettings;
  onSave: (settings: SecuritySettings) => void;
}

const PRESET_QUESTIONS = [
  'What is the secret keyword only you know?',
  'What was your first childhood pet name?',
  'What is your favorite personal secret word?',
  'In which city were you born?',
  'Custom Question (Write your own)',
];

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSave,
}) => {
  const [enabled, setEnabled] = useState(currentSettings.keywordLockEnabled || false);
  const [selectedPreset, setSelectedPreset] = useState(() => {
    if (!currentSettings.securityQuestion) return PRESET_QUESTIONS[0];
    return PRESET_QUESTIONS.includes(currentSettings.securityQuestion)
      ? currentSettings.securityQuestion
      : 'Custom Question (Write your own)';
  });
  const [customQuestion, setCustomQuestion] = useState(
    PRESET_QUESTIONS.includes(currentSettings.securityQuestion || '')
      ? ''
      : currentSettings.securityQuestion || ''
  );
  const [answer, setAnswer] = useState(currentSettings.securityAnswer || '');
  const [showAnswer, setShowAnswer] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const activeQuestion =
      selectedPreset === 'Custom Question (Write your own)'
        ? customQuestion.trim()
        : selectedPreset;

    if (enabled) {
      if (!activeQuestion) {
        setErrorMsg('Please select or enter a security question.');
        return;
      }
      if (!answer.trim()) {
        setErrorMsg('Please provide an answer to your security question.');
        return;
      }
    }

    const updated: SecuritySettings = {
      keywordLockEnabled: enabled,
      securityQuestion: enabled ? activeQuestion : '',
      securityAnswer: enabled ? answer.trim() : '',
      keywordPasscode: enabled ? answer.trim() : '',
    };

    onSave(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#e5e3df] shadow-2xl max-w-md w-full overflow-hidden relative">
        {/* Top Accent Bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#5645d4] to-[#ff64c8]"></div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#e6e0f5] text-[#5645d4] flex items-center justify-center shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1a1a1a]">
                  Keywords Security Lock
                </h3>
                <p className="text-[11px] text-[#787671]">
                  One-time security question protection
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#5d5b54] mb-5 leading-relaxed">
            Protect your SEO keywords repository from accidental edits or unauthorized changes by requiring a secret answer whenever the panel is opened.
          </p>

          {errorMsg && (
            <div className="mb-4 p-2.5 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-xs text-[#b91c1c]">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#fafaf9] border border-[#ede9e4]">
              <div>
                <span className="text-xs font-bold text-[#1a1a1a] block">
                  Enable Keyword Protection
                </span>
                <span className="text-[10px] text-[#787671] block">
                  Prompt for security answer before opening keywords
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#1aae39]"></div>
              </label>
            </div>

            {enabled && (
              <div className="space-y-3.5 animate-in fade-in">
                {/* Question Select */}
                <div>
                  <label className="block text-xs font-semibold text-[#37352f] mb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#5645d4]" />
                    <span>Choose Security Question</span>
                  </label>
                  <select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#fafaf9] border border-[#c8c4be] rounded-lg focus:outline-none focus:border-[#5645d4] text-[#1a1a1a]"
                  >
                    {PRESET_QUESTIONS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Question input if selected */}
                {selectedPreset === 'Custom Question (Write your own)' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-[#37352f] mb-1">
                      Type Your Custom Question
                    </label>
                    <input
                      type="text"
                      required
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      placeholder="e.g. What is my secret launch code?"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#c8c4be] rounded-lg focus:outline-none focus:border-[#5645d4] text-[#1a1a1a]"
                    />
                  </div>
                )}

                {/* Secret Answer */}
                <div>
                  <label className="block text-xs font-semibold text-[#37352f] mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#5645d4]" />
                    <span>Your Secret Answer</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showAnswer ? 'text' : 'password'}
                      required
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type the answer only you know..."
                      className="w-full px-3.5 py-2 text-xs bg-white border border-[#c8c4be] rounded-lg focus:outline-none focus:border-[#5645d4] text-[#1a1a1a] pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAnswer(!showAnswer)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      {showAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#787671] mt-1">
                    Answer verification is case-insensitive (e.g. "Paris" matches "paris").
                  </p>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-between">
              {savedSuccess ? (
                <span className="text-xs text-[#1aae39] font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Security settings updated!
                </span>
              ) : (
                <span className="text-[10px] text-[#787671]">Saved to private Firestore</span>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 border border-[#e5e3df] text-xs font-semibold text-[#5d5b54] rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5645d4] hover:bg-[#4534b3] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
