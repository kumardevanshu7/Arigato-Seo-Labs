import React, { useState } from 'react';
import type { ApiConfig } from '../types/seo';
import { X, KeyRound, Code, Cpu, CheckCircle2 } from 'lucide-react';

interface ApiIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApiConfig;
  onSaveConfig: (cfg: ApiConfig) => void;
}

export const ApiIntegrationModal: React.FC<ApiIntegrationModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<ApiConfig>({
    ...config,
    apiUrl: config.apiUrl || '/modal-api/chat/completions',
    model: config.model || 'moonshotai/Kimi-K3',
  });

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // compute full apiKey if tokenId and tokenSecret are present
    let apiKey = formData.apiKey;
    if (formData.tokenId && formData.tokenSecret) {
      apiKey = `${formData.tokenId.trim()}.${formData.tokenSecret.trim()}`;
    }
    onSaveConfig({
      ...formData,
      apiKey,
    });
    onClose();
  };

  const applyKimiPreset = () => {
    setFormData({
      ...formData,
      mode: 'custom_api',
      apiUrl: '/modal-api/chat/completions',
      model: 'moonshotai/Kimi-K3',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[#e5e3df] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#e5e3df] bg-[#0a1530] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a2a52] flex items-center justify-center text-[#ff64c8] shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                <span>Modal Kimi-K3 API Connection</span>
                <span className="text-[9px] sm:text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[#5645d4] text-white">
                  Moonshot Kimi
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-[#a4a097]">
                Connect your live Modal endpoint with Structured Outputs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#a4a097] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-left">
          {/* Checkbox Guidance Banner */}
          <div className="p-3.5 rounded-lg bg-[#fafaf9] border border-[#c8c4be] space-y-2">
            <span className="text-xs font-bold text-[#1a1a1a] block">
              📋 Modal Dashboard Checkboxes Guide:
            </span>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2 text-[#1aae39] font-medium bg-[#d9f3e1]/50 p-1.5 rounded">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span><strong>Structured Outputs: [✔ ON]</strong> — Isko zaroor tick karein! Isse clean JSON Schema milta hai.</span>
              </div>
              <div className="flex items-center gap-2 text-[#5d5b54] p-1">
                <span className="w-3.5 h-3.5 rounded-full border border-[#a4a097] flex items-center justify-center text-[9px]">ℹ</span>
                <span><strong>Thinking / Reasoning:</strong> Kimi K3 by default reasons karta hai (controls humari app automatically manage kar leti hai).</span>
              </div>
              <div className="flex items-center gap-2 text-[#5d5b54] p-1">
                <span className="w-3.5 h-3.5 rounded-full border border-[#a4a097] flex items-center justify-center text-[9px]">✕</span>
                <span><strong>Streaming: [OFF]</strong> — Complete JSON response lene ke liye off best hai (`stream: false`).</span>
              </div>
              <div className="flex items-center gap-2 text-[#5d5b54] p-1">
                <span className="w-3.5 h-3.5 rounded-full border border-[#a4a097] flex items-center justify-center text-[9px]">✕</span>
                <span><strong>Tool Calling & Sticky Sessions: [OFF]</strong> — Inki zaroorat nahi hai.</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Mode selection */}
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] mb-2">
                Active Generation Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div
                  onClick={() => setFormData({ ...formData, mode: 'custom_api' })}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.mode === 'custom_api'
                      ? 'border-[#5645d4] bg-[#5645d4]/5 shadow-xs'
                      : 'border-[#e5e3df] hover:border-[#c8c4be]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-[#ff64c8]" />
                      Modal Kimi-K3 Endpoint
                    </span>
                    {formData.mode === 'custom_api' && (
                      <span className="w-2 h-2 rounded-full bg-[#ff64c8]"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#787671]">
                    Calls your live <code>moonshotai/Kimi-K3</code> model on Modal proxy.
                  </p>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, mode: 'simulated' })}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.mode === 'simulated'
                      ? 'border-[#5645d4] bg-[#5645d4]/5 shadow-xs'
                      : 'border-[#e5e3df] hover:border-[#c8c4be]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#5645d4]" />
                      Smart Engine Fallback
                    </span>
                    {formData.mode === 'simulated' && (
                      <span className="w-2 h-2 rounded-full bg-[#5645d4]"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#787671]">
                    Built-in neural generation without external API token.
                  </p>
                </div>
              </div>
            </div>

            {/* Custom API Credentials */}
            <div className="p-3.5 sm:p-4 bg-[#fafaf9] rounded-lg border border-[#e5e3df] space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1a1a1a]">
                  Modal Proxy Credentials
                </span>
                <button
                  type="button"
                  onClick={applyKimiPreset}
                  className="text-[11px] text-[#5645d4] hover:underline font-semibold cursor-pointer"
                >
                  Reset to Kimi-K3 URL
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#5d5b54] mb-1">
                    MODAL_PROXY_TOKEN_ID
                  </label>
                  <input
                    type="text"
                    value={formData.tokenId || ''}
                    onChange={(e) => setFormData({ ...formData, tokenId: e.target.value })}
                    placeholder="e.g. t-id-..."
                    className="w-full px-3 py-2 text-sm sm:text-xs bg-white border border-[#c8c4be] rounded-md focus:outline-none focus:border-[#5645d4]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5d5b54] mb-1">
                    MODAL_PROXY_TOKEN_SECRET
                  </label>
                  <input
                    type="password"
                    value={formData.tokenSecret || ''}
                    onChange={(e) => setFormData({ ...formData, tokenSecret: e.target.value })}
                    placeholder="e.g. t-sec-..."
                    className="w-full px-3 py-2 text-sm sm:text-xs bg-white border border-[#c8c4be] rounded-md focus:outline-none focus:border-[#5645d4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5d5b54] mb-1">
                  Or Authorization Key / Combined Key (e.g. <span className="font-mono text-[10px]">Bearer ...</span> or <span className="font-mono text-[10px]">wk-xw....ws-...</span>)
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Paste Authorization key (Bearer ...) or ID.SECRET here..."
                  className="w-full px-3 py-2 text-sm sm:text-xs bg-white border border-[#c8c4be] rounded-md focus:outline-none focus:border-[#5645d4]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5d5b54] mb-1">
                  API Endpoint URL
                </label>
                <input
                  type="text"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                  placeholder="/modal-api/chat/completions"
                  className="w-full px-3 py-2 text-sm sm:text-xs bg-white border border-[#c8c4be] rounded-md focus:outline-none focus:border-[#5645d4] font-mono"
                />
                <span className="text-[10px] text-[#787671] mt-1 block">
                  Proxy endpoint routes securely to: <code className="text-[#5645d4]">https://devansh-grow--ep-kimi-k3-server.us-west.modal.direct/v1</code>
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5d5b54] mb-1">
                  Model Identifier
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="moonshotai/Kimi-K3"
                  className="w-full px-3 py-2 text-sm sm:text-xs bg-white border border-[#c8c4be] rounded-md focus:outline-none focus:border-[#5645d4] font-mono"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ede9e4]">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-[#5d5b54] hover:bg-[#f6f5f4] rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#5645d4] hover:bg-[#4534b3] text-white text-xs font-semibold rounded-md shadow-sm transition-colors cursor-pointer"
              >
                Save & Activate Endpoint
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
