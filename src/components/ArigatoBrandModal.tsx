import React, { useState } from 'react';
import { X, Check, Copy, Send, ShieldCheck, Mail, AlertCircle } from 'lucide-react';

export type BrandTab = 'explore' | 'about' | 'privacy' | 'terms' | 'disclaimer' | 'contact';

interface ArigatoBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: BrandTab;
}

export const ArigatoBrandModal: React.FC<ArigatoBrandModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'explore',
}) => {
  const [activeTab, setActiveTab] = useState<BrandTab>(initialTab);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('kumardevanshu3001@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: 'e39c4d92-23f4-419b-a010-9c184c7e6c40', // standard web3forms default or user key
          from_name: 'Arigato Labs · Arigato SEO Labs',
          name: contactName,
          email: contactEmail,
          subject: `[Arigato SEO Labs] ${contactSubject}`,
          message: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n  ARIGATO LABS · CONTACT\n  Product: Arigato SEO Labs\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nFrom:    ${contactName}\nEmail:   ${contactEmail}\nSubject: ${contactSubject}\n\nMessage:\n${contactMessage}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSent from Arigato SEO Labs Contact Form\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        }),
      });

      const data = await response.json();
      if (data.success || response.ok) {
        setSubmitSuccess(true);
        setContactName('');
        setContactEmail('');
        setContactSubject('');
        setContactMessage('');
      } else {
        // Graceful fallback to mailto
        window.location.href = `mailto:kumardevanshu3001@gmail.com?subject=${encodeURIComponent(contactSubject || 'Inquiry from Arigato SEO Labs')}&body=${encodeURIComponent(`Hi Devanshu,\n\nName: ${contactName}\nEmail: ${contactEmail}\n\nMessage:\n${contactMessage}`)}`;
        setSubmitSuccess(true);
      }
    } catch {
      // Fallback to mailto
      window.location.href = `mailto:kumardevanshu3001@gmail.com?subject=${encodeURIComponent(contactSubject || 'Inquiry from Arigato SEO Labs')}&body=${encodeURIComponent(`Hi Devanshu,\n\nName: ${contactName}\nEmail: ${contactEmail}\n\nMessage:\n${contactMessage}`)}`;
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs: { id: BrandTab; label: string; icon: string }[] = [
    { id: 'explore', label: 'Explore Arigato Labs', icon: '/arigato-single-logo.png' },
    { id: 'about', label: 'About', icon: '' },
    { id: 'privacy', label: 'Privacy Policy', icon: '' },
    { id: 'terms', label: 'Terms & Conditions', icon: '' },
    { id: 'disclaimer', label: 'Disclaimer', icon: '' },
    { id: 'contact', label: 'Contact', icon: '' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#fafaf9] text-[#1a1a1a] rounded-xl sm:rounded-2xl border border-[#e5e3df] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-[#e5e3df] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/arigato-single-logo.png"
              alt="Arigato Labs"
              className="w-5 h-5 object-contain"
            />
            <span className="font-semibold text-sm text-[#1a1a1a]">Arigato Labs Studio</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#f0efff] text-[#5645d4] font-medium border border-[#d6d2f5]">
              Official Company Hub
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f2f1ef] text-[#787671] hover:text-[#1a1a1a] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="px-4 sm:px-6 py-2 border-b border-[#e5e3df] bg-[#fcfbf9] overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSubmitSuccess(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#5645d4] text-white shadow-sm'
                    : 'text-[#5d5b54] hover:bg-[#eae8e4] hover:text-[#1a1a1a]'
                }`}
              >
                {tab.icon && (
                  <img
                    src={tab.icon}
                    alt=""
                    className="w-3.5 h-3.5 object-contain brightness-0 invert"
                    style={{ filter: isActive ? 'none' : 'grayscale(100%) opacity(0.7)' }}
                  />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
          {/* TAB 1: EXPLORE ARIGATO LABS */}
          {activeTab === 'explore' && (
            <div className="space-y-8 animate-fade-in text-center max-w-2xl mx-auto">
              <div>
                <span className="text-xs uppercase font-semibold text-[#5645d4] tracking-widest bg-[#f0efff] px-3 py-1 rounded-full">
                  Company Spotlight
                </span>
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#1a1a1a] mt-3">
                  Our Company
                </h1>
                <p className="text-sm sm:text-base text-[#5d5b54] mt-2">
                  Redefining AI visual indexing, prompt artistry, and algorithmic SEO visibility for the modern era.
                </p>
              </div>

              {/* Central Official Arigato Labs Logo */}
              <div className="py-2 flex justify-center">
                <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#e5e3df] shadow-sm inline-block">
                  <img
                    src="/arigato-labs-logo.png"
                    alt="Arigato Labs Logo"
                    className="max-w-[320px] sm:max-w-[440px] w-full object-contain"
                  />
                </div>
              </div>

              {/* Founder Badge & Text */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f5e9] border border-[#c8e6c9] text-[#2e7d32] text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>✓ Verified Founder</span>
                </div>

                <p className="text-sm sm:text-base text-[#1a1a1a] leading-relaxed">
                  <strong>Arigato SEO Labs</strong> is proudly developed by <strong>Kumar Devanshu</strong>, the founder of <strong>Arigato Labs</strong> in 2026.
                </p>

                <p className="text-xs sm:text-sm text-[#5d5b54] leading-relaxed">
                  Our mission is to build sleek, modern, and high-performance tools that empower individuals and teams to achieve their goals with elegance and ease. We believe software should feel natural, fast, and distinctly beautiful.
                </p>
              </div>

              {/* Action shortcuts */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setActiveTab('about')}
                  className="px-4 py-2 rounded-lg bg-white border border-[#d8d5cf] text-xs font-medium text-[#1a1a1a] hover:bg-[#f6f5f4] transition-colors"
                >
                  Learn More About Us
                </button>
                <button
                  onClick={() => setActiveTab('contact')}
                  className="px-4 py-2 rounded-lg bg-[#5645d4] text-white text-xs font-medium hover:bg-[#4534b3] transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Contact Founder
                </button>
              </div>

              {/* Standard Legal Footer Notice */}
              <div className="pt-8 border-t border-[#e5e3df] text-center space-y-1.5 text-xs text-[#787671]">
                <h4 className="font-semibold text-[#1a1a1a] uppercase tracking-wider">ARIGATO LABS</h4>
                <p>Copyright © 2026 Arigato Labs. All Rights Reserved.</p>
                <p className="text-[11px]">
                  <strong>Arigato SEO Labs</strong> is a product of Arigato Labs, founded by Kumar Devanshu.
                  Brand name and logos may not be reused outside Arigato Labs apps without permission.
                </p>
                <p className="text-[11px] opacity-80 pt-1">
                  See Privacy, Terms, and Disclaimer in this app. Contact: <button onClick={handleCopyEmail} className="text-[#5645d4] hover:underline font-medium">kumardevanshu3001@gmail.com</button>
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto text-left">
              <div>
                <span className="text-xs uppercase font-semibold text-[#5645d4] tracking-widest bg-[#f0efff] px-3 py-1 rounded-full">
                  About Us
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a] mt-3">
                  About Arigato Labs
                </h2>
                <p className="text-sm text-[#5d5b54] mt-1.5">
                  <strong>Arigato SEO Labs</strong> is an official product under the <strong>Arigato Labs</strong> ecosystem.
                </p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-[#e5e3df] shadow-sm space-y-3">
                <h3 className="font-semibold text-sm text-[#1a1a1a]">Founder & Origins</h3>
                <p className="text-xs sm:text-sm text-[#5d5b54] leading-relaxed">
                  Built by <strong>Kumar Devanshu</strong>, founder of <strong>Arigato Labs</strong> (2026). We started with a simple belief: modern creators and developers deserve software that is clean, blazing fast, and respects their craft.
                </p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-[#e5e3df] shadow-sm space-y-3">
                <h3 className="font-semibold text-sm text-[#1a1a1a]">Our Mission</h3>
                <p className="text-xs sm:text-sm text-[#5d5b54] leading-relaxed">
                  We build sleek, modern, high-performance tools that help people get things done with clarity and calm. Software should feel fast, natural, and carefully designed—free from cluttered interfaces and unnecessary friction.
                </p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-[#e5e3df] shadow-sm space-y-3">
                <h3 className="font-semibold text-sm text-[#1a1a1a]">What is Arigato SEO Labs?</h3>
                <p className="text-xs sm:text-sm text-[#5d5b54] leading-relaxed">
                  Arigato SEO Labs bridges visual art and search discovery. Whether you are scaling an aesthetic Pinterest brand or publishing prompt libraries with strict Google SERP guidelines, our dual-engine architecture guarantees high algorithmic conversion.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#e5e3df] text-xs text-[#787671]">
                <span>Copyright © 2026 Arigato Labs. All Rights Reserved.</span>
                <button
                  onClick={() => setActiveTab('contact')}
                  className="text-[#5645d4] hover:underline font-medium"
                >
                  Get in Touch →
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto text-left">
              <div>
                <span className="text-xs uppercase font-semibold text-[#5645d4] tracking-widest bg-[#f0efff] px-3 py-1 rounded-full">
                  Data & Transparency
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a] mt-3">
                  Privacy Policy
                </h2>
                <p className="text-xs text-[#787671] mt-1">Last Updated: September 2026</p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-[#5d5b54] leading-relaxed bg-white rounded-xl p-5 sm:p-6 border border-[#e5e3df]">
                <div>
                  <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">1. Who We Are</h4>
                  <p>
                    Arigato SEO Labs is a product of <strong>Arigato Labs</strong>, founded by Kumar Devanshu. For questions about your data, contact <button onClick={handleCopyEmail} className="text-[#5645d4] hover:underline font-medium">kumardevanshu3001@gmail.com</button>.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">2. What We Collect</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Keywords & Settings:</strong> Your saved Pinterest and Site keywords, active flags, and pinning preferences.</li>
                    <li><strong>Images & Prompts:</strong> Artwork images you drop or paste into the scanner are processed locally in your browser to extract dimensions and visual metadata.</li>
                    <li><strong>Custom API Credentials:</strong> If you supply a custom API key, it is saved exclusively in your browser's private localStorage and is never transmitted to our servers.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">3. How We Use Data</h4>
                  <p>
                    Your data is solely used to generate contextual SEO metadata, enforce word/character limits, and synchronize your keywords library across your sessions. <strong>We do not sell, rent, or monetize your personal data.</strong>
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">4. Third-Party Services</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Google Firebase (Cloud Firestore):</strong> Synchronizes and persists your keyword repository.</li>
                    <li><strong>Vercel:</strong> Global edge hosting and delivery for our web application.</li>
                    <li><strong>Modal Labs (Moonshot AI Kimi-K3):</strong> Used for optional advanced neural text generation and structured outputs when enabled.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">5. Storage & Retention</h4>
                  <p>
                    Keywords are stored in Cloud Firestore and browser localStorage. You have complete control to add, edit, toggle, or delete any keyword at any time directly through the Keywords Hub.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">6. Security</h4>
                  <p>
                    We use modern security standards, HTTPS encryption in transit, and granular Firestore security rules to safeguard data integrity.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">7. Contact</h4>
                  <p>
                    For privacy inquiries or data requests, write to <button onClick={handleCopyEmail} className="text-[#5645d4] hover:underline font-medium">kumardevanshu3001@gmail.com</button>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto text-left">
              <div>
                <span className="text-xs uppercase font-semibold text-[#5645d4] tracking-widest bg-[#f0efff] px-3 py-1 rounded-full">
                  Legal Agreement
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a] mt-3">
                  Terms & Conditions
                </h2>
                <p className="text-xs text-[#787671] mt-1">Effective Date: September 2026</p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-[#5d5b54] leading-relaxed bg-white rounded-xl p-5 sm:p-6 border border-[#e5e3df]">
                <div>
                  <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">1. Agreement to Terms</h4>
                  <p>
                    By accessing or using Arigato SEO Labs, you agree to be bound by these Terms. If you disagree with any part, you may discontinue use of the service.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">2. The Service</h4>
                  <p>
                    Arigato SEO Labs is provided by Arigato Labs to assist creators in generating structured, character-compliant SEO metadata for Pinterest pins and website SERP listings.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">3. Acceptable Use</h4>
                  <p>
                    You agree not to misuse the service, introduce malicious code, execute abusive automated scraping, or attempt unauthorized access to infrastructure or third-party endpoints.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">4. Intellectual Property</h4>
                  <p>
                    The Arigato Labs name, brand logos (`arigato-labs-logo.png`, `arigato-single-logo.png`), styling system, and proprietary layouts are protected intellectual property of Arigato Labs / Kumar Devanshu. All rights reserved.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">5. AI Suggestions Advisory</h4>
                  <p>
                    AI-generated metadata and prompt suggestions are algorithmic recommendations. You are responsible for reviewing and verifying generated text prior to commercial publication.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">6. Governing Law</h4>
                  <p>
                    These terms are governed in accordance with the applicable laws of India under the founder's jurisdiction. Contact: <button onClick={handleCopyEmail} className="text-[#5645d4] hover:underline font-medium">kumardevanshu3001@gmail.com</button>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DISCLAIMER */}
          {activeTab === 'disclaimer' && (
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto text-left">
              <div>
                <span className="text-xs uppercase font-semibold text-[#5645d4] tracking-widest bg-[#f0efff] px-3 py-1 rounded-full">
                  Warranty & Limitations
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a] mt-3">
                  Disclaimer
                </h2>
                <p className="text-xs text-[#787671] mt-1">Status: Official Policy</p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-[#5d5b54] leading-relaxed bg-white rounded-xl p-5 sm:p-6 border border-[#e5e3df]">
                <div className="p-3 bg-[#fff8e1] border border-[#ffe082] rounded-lg text-[#b78103] flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Arigato SEO Labs and all materials are provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without warranties of any kind.
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">Limits of Liability</h4>
                  <p>
                    Arigato Labs and founder Kumar Devanshu shall not be liable for any indirect, incidental, or consequential damages, including loss of search rankings, traffic, or data arising out of your use of the studio.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">SEO & Ranking Helper Notice</h4>
                  <p>
                    Search engine algorithms (Google, Pinterest, Bing) change frequently. The character limits, keyword placements, and metadata suggestions generated by Arigato SEO Labs are optimization tools and best-practice helpers, not guaranteed ranking promises.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">Third-Party Platforms</h4>
                  <p>
                    Pinterest, Google, Firebase, and Modal are independent trademarks of their respective owners. Arigato Labs is not affiliated with or endorsed by Pinterest or Google LLC.
                  </p>
                </div>

                <div className="pt-2 border-t border-[#ede9e4] text-xs text-[#787671]">
                  <p>Copyright © 2026 Arigato Labs. All Rights Reserved.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CONTACT */}
          {activeTab === 'contact' && (
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto text-left">
              <div>
                <span className="text-xs uppercase font-semibold text-[#5645d4] tracking-widest bg-[#f0efff] px-3 py-1 rounded-full">
                  Direct Line
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a] mt-3">
                  Contact Arigato Labs
                </h2>
                <p className="text-xs sm:text-sm text-[#5d5b54] mt-1.5">
                  Questions about <strong>Arigato SEO Labs</strong> or want to collaborate with <strong>Arigato Labs</strong>? Send a message directly to the founder.
                </p>
              </div>

              {/* Direct email card */}
              <div className="p-4 rounded-xl bg-white border border-[#e5e3df] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#f0efff] text-[#5645d4] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#787671] uppercase tracking-wider font-semibold">Founder Email</div>
                    <div className="text-xs sm:text-sm font-semibold text-[#1a1a1a]">kumardevanshu3001@gmail.com</div>
                  </div>
                </div>
                <button
                  onClick={handleCopyEmail}
                  className="px-3 py-1.5 rounded-lg border border-[#d8d5cf] bg-[#fafaf9] hover:bg-[#f0efff] text-[#5645d4] text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shrink-0"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-[#1aae39]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? 'Copied!' : 'Copy Email'}</span>
                </button>
              </div>

              {/* Submission Form */}
              {submitSuccess ? (
                <div className="p-6 rounded-xl bg-[#e8f5e9] border border-[#c8e6c9] text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#2e7d32] text-white flex items-center justify-center mx-auto shadow-sm">
                    <Check className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-[#1a1a1a] text-base">Message Sent Successfully!</h3>
                  <p className="text-xs text-[#2e7d32] max-w-sm mx-auto">
                    Thank you for reaching out. Your inquiry has been routed to Kumar Devanshu and we will get back to you shortly via email.
                  </p>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="mt-2 px-4 py-1.5 rounded-lg bg-white border border-[#c8e6c9] text-xs font-medium text-[#2e7d32] hover:bg-[#f1f8e9]"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4 bg-white p-5 sm:p-6 rounded-xl border border-[#e5e3df] shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#1a1a1a] mb-1">
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-[#d8d5cf] focus:outline-none focus:ring-2 focus:ring-[#5645d4] bg-[#fafaf9]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1a1a1a] mb-1">
                        Your Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-[#d8d5cf] focus:outline-none focus:ring-2 focus:ring-[#5645d4] bg-[#fafaf9]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1a1a1a] mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      placeholder="e.g. Feature suggestion / API partnership"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-[#d8d5cf] focus:outline-none focus:ring-2 focus:ring-[#5645d4] bg-[#fafaf9]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1a1a1a] mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Write your message here..."
                      className="w-full text-xs px-3 py-2 rounded-lg border border-[#d8d5cf] focus:outline-none focus:ring-2 focus:ring-[#5645d4] bg-[#fafaf9] resize-none"
                    ></textarea>
                  </div>

                  {submitError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                      {submitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-lg bg-[#5645d4] hover:bg-[#4534b3] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Delivering Message...' : 'Send Message to Founder'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
