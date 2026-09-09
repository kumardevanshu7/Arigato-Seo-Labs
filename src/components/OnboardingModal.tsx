import React, { useState } from 'react';
import type { UserGender, UserProfile } from '../types/seo';
import { saveUserProfile, signOutUser } from '../services/firebase';
import { Sparkles, User, LogOut, Check, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingModalProps {
  userUid: string;
  initialEmail: string;
  initialName: string;
  initialPhoto?: string;
  onCompleted: (updatedProfile: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  userUid,
  initialEmail,
  initialName,
  initialPhoto,
  onCompleted,
}) => {
  const [displayName, setDisplayName] = useState(initialName || '');
  const [gender, setGender] = useState<UserGender>('male');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    if (!cleanName) {
      setErrorMsg('Please enter your display name.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const now = new Date().toISOString();
      const profileData: UserProfile = {
        uid: userUid,
        email: initialEmail,
        displayName: cleanName,
        photoURL: initialPhoto,
        gender,
        onboarded: true,
        createdAt: now,
        updatedAt: now,
      };

      await saveUserProfile(userUid, profileData);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#5645d4', '#ff64c8', '#1aae39', '#f5d75e'],
      });

      onCompleted(profileData);
    } catch (err) {
      console.error('[Onboarding] Error saving profile:', err);
      setErrorMsg('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const genderOptions: {
    id: UserGender;
    label: string;
    desc: string;
    badgeBg: string;
    iconColor: string;
    icon: 'male' | 'female' | 'other' | 'private';
  }[] = [
    {
      id: 'male',
      label: 'Male',
      desc: 'He / Him',
      badgeBg: 'bg-[#3b82f6]/10 border-[#3b82f6]/30',
      iconColor: 'text-[#3b82f6]',
      icon: 'male',
    },
    {
      id: 'female',
      label: 'Female',
      desc: 'She / Her',
      badgeBg: 'bg-[#ec4899]/10 border-[#ec4899]/30',
      iconColor: 'text-[#ec4899]',
      icon: 'female',
    },
    {
      id: 'other',
      label: 'Non-Binary / Other',
      desc: 'They / Them',
      badgeBg: 'bg-[#a855f7]/10 border-[#a855f7]/30',
      iconColor: 'text-[#a855f7]',
      icon: 'other',
    },
    {
      id: 'prefer_not_to_say',
      label: 'Prefer not to say',
      desc: 'Private',
      badgeBg: 'bg-[#71717a]/10 border-[#71717a]/30',
      iconColor: 'text-[#71717a]',
      icon: 'private',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#e5e3df] shadow-2xl max-w-lg w-full overflow-hidden relative">
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#5645d4] via-[#ff64c8] to-[#1aae39]"></div>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {initialPhoto ? (
                <img
                  src={initialPhoto}
                  alt={displayName}
                  className="w-12 h-12 rounded-full border-2 border-[#5645d4] object-cover shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#e6e0f5] text-[#5645d4] flex items-center justify-center font-bold text-lg">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#1a1a1a]">
                  Complete Your Profile
                </h2>
                <p className="text-xs text-[#787671]">{initialEmail}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              className="text-[#787671] hover:text-[#e60023] p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#5d5b54] mb-6 leading-relaxed">
            Welcome to Arigato SEO Labs! Set up your studio name and gender preference to personalize your experience and private workspace.
          </p>

          {errorMsg && (
            <div className="mb-4 p-2.5 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-xs text-[#b91c1c]">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleComplete} className="space-y-5">
            {/* Display Name Input */}
            <div>
              <label className="block text-xs font-semibold text-[#37352f] mb-1.5">
                Your Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Kumar Devanshu"
                className="w-full px-3.5 py-2.5 text-sm bg-[#fafaf9] border border-[#c8c4be] rounded-lg focus:outline-none focus:border-[#5645d4] focus:bg-white text-[#1a1a1a] transition-all"
              />
            </div>

            {/* Gender Selection Cards */}
            <div>
              <label className="block text-xs font-semibold text-[#37352f] mb-2">
                Select Your Gender
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {genderOptions.map((opt) => {
                  const isSelected = gender === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setGender(opt.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-[#5645d4] bg-[#e6e0f5]/30 shadow-xs ring-1 ring-[#5645d4]'
                          : 'border-[#e5e3df] bg-[#fafaf9] hover:bg-white hover:border-[#c8c4be]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${opt.badgeBg} ${opt.iconColor}`}
                        >
                          {opt.icon === 'male' && <User className="w-4 h-4" />}
                          {opt.icon === 'female' && <User className="w-4 h-4" />}
                          {opt.icon === 'other' && <Sparkles className="w-4 h-4" />}
                          {opt.icon === 'private' && <Shield className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-[#1a1a1a] block">
                            {opt.label}
                          </span>
                          <span className="text-[10px] text-[#787671] block">
                            {opt.desc}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-[#5645d4] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className={`w-full py-3 px-4 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isSaving
                    ? 'bg-[#5645d4]/70 cursor-not-allowed'
                    : 'bg-[#5645d4] hover:bg-[#4534b3] hover:shadow-lg active:scale-[0.99]'
                }`}
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#f5d75e]" />
                    <span>Enter Arigato SEO Studio</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
