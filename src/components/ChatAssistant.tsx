import React, { useState, useRef, useEffect } from 'react';
import { sendChatAssistantMessage } from '../services/seoService';
import {
  X,
  Send,
  Trash2,
  Code2,
  ChevronDown,
  ChevronUp,
  Activity,
  Image as ImageIcon,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  latencyMs?: number;
  rawJson?: string;
  isLiveApi?: boolean;
  timestamp: string;
}

// Helper to format inline bold, code, and links cleanly
const formatInlineTokens = (text: string, isUser: boolean = false) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className={`font-semibold ${isUser ? 'text-white' : 'text-[#1a1a1a]'}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className={`px-1 py-0.5 rounded font-mono text-[10px] ${
            isUser ? 'bg-white/20 text-white' : 'bg-[#e5e3df]/60 text-[#5645d4] border border-[#d8d5ce]'
          }`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

// Rich structured message renderer
const renderFormattedContent = (content: string, isUser: boolean = false) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5 select-text text-xs">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Heading markdown
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
          const headingText = trimmed.replace(/^#+\s*/, '');
          return (
            <h4 key={idx} className={`font-bold text-xs pt-1 ${isUser ? 'text-white' : 'text-[#0a1530]'}`}>
              {formatInlineTokens(headingText, isUser)}
            </h4>
          );
        }

        // Bullet point markdown
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletText = trimmed.slice(2);
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className={`font-bold text-xs leading-relaxed ${isUser ? 'text-[#f5d75e]' : 'text-[#5645d4]'}`}>•</span>
              <span className="flex-1 leading-relaxed">{formatInlineTokens(bulletText, isUser)}</span>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className={`font-semibold text-[11px] ${isUser ? 'text-[#f5d75e]' : 'text-[#5645d4]'}`}>
                {numMatch[1]}.
              </span>
              <span className="flex-1 leading-relaxed">{formatInlineTokens(numMatch[2], isUser)}</span>
            </div>
          );
        }

        // Standard line / paragraph
        return (
          <p key={idx} className="leading-relaxed">
            {formatInlineTokens(line, isUser)}
          </p>
        );
      })}
    </div>
  );
};

export const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '👋 Kya bolti Arigato public! Main hoon aapka **DeepSeek V4.1 Vision Assistant**.\n\nDeepSeek-V4.1-Flash Vision endpoint direct hooked up hai! Koi bhi image **attach / paste (Ctrl+V)** karein visual analysis ke liye, latency check karein, ya schema test run karein — *batao bhai, let\'s cook!* 🔥',
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedJsonId, setExpandedJsonId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle image paste from clipboard (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setAttachedImage(reader.result as string);
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  // Handle file input upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText.trim();
    if ((!textToSend && !attachedImage) || isLoading) return;

    const stagedImage = attachedImage;
    const promptForThisMsg =
      textToSend ||
      (stagedImage
        ? 'Analyze this image in detail: identify subject, clothing, style, lighting, setting, and generate a comprehensive reverse prompt.'
        : '');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptForThisMsg,
      imageUrl: stagedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputText('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const res = await sendChatAssistantMessage(promptForThisMsg, history, stagedImage || undefined);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        latencyMs: res.latencyMs,
        rawJson: res.rawJson,
        isLiveApi: res.isLiveApi,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Connection Error: ${err.message || 'Failed to call endpoint'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: 'Chat cleared! DeepSeek Vision test ke liye image attach karein ya prompt bhejein.',
        timestamp: 'Just now',
      },
    ]);
  };

  return (
    <>
      {/* Floating Launcher Button (Bottom-Right) */}
      <div className="fixed bottom-5 right-4 sm:right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-[#5645d4] hover:bg-[#4534b3] text-white rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer border border-[#7b3ff2]/40"
        >
          <div className="relative">
            <img
              src="/apple-touch-icon.png"
              alt="DeepSeek Vision Assistant"
              className="w-5 h-5 rounded-full object-contain bg-white p-0.5"
            />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#1aae39] animate-pulse"></span>
          </div>
          <span className="text-xs font-semibold tracking-wide hidden xs:inline">
            DeepSeek Vision Test
          </span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-white/20 text-white">
            V4.1
          </span>
        </button>
      </div>

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div
          onPaste={handlePaste}
          className="fixed bottom-20 right-3 sm:right-6 w-[calc(100vw-24px)] xs:w-[400px] sm:w-[450px] h-[580px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-[#e5e3df] z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-[#0a1530] text-white border-b border-[#1a2a52] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center p-0.5 overflow-hidden shadow-xs border border-white/20">
                <img
                  src="/apple-touch-icon.png"
                  alt="DeepSeek Assistant"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white tracking-tight">
                    DeepSeek Vision Assistant
                  </h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1aae39]"></span>
                </div>
                <p className="text-[10px] text-[#a4a097] font-mono">
                  DeepSeek V4.1 Flash Vision & SEO Studio
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1 text-[#a4a097] hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
                title="Clear Chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-[#a4a097] hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Preset Test Buttons */}
          <div className="px-3 py-2 bg-[#f6f5f4] border-b border-[#ede9e4] flex items-center gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap">
            <span className="text-[10px] text-[#787671] font-semibold shrink-0">Quick Tests:</span>
            <button
              onClick={() => handleSendMessage('Extract the name, age, and city: Ada, 36, London.')}
              disabled={isLoading}
              className="px-2 py-1 bg-white border border-[#c8c4be] hover:border-[#5645d4] hover:bg-[#e6e0f5]/30 rounded text-[#37352f] text-[10px] font-medium transition-colors cursor-pointer shrink-0"
            >
              🧪 Ada Schema Test
            </button>
            <button
              onClick={() =>
                handleSendMessage(
                  'Bhai, is image ke visual elements, lighting, composition, and model style ko analyze karke ek photorealistic reverse prompt generate karo!'
                )
              }
              disabled={isLoading}
              className="px-2 py-1 bg-white border border-[#c8c4be] hover:border-[#5645d4] hover:bg-[#e6e0f5]/30 rounded text-[#37352f] text-[10px] font-medium transition-colors cursor-pointer shrink-0"
            >
              👁️ DeepSeek Vision Scan
            </button>
            <button
              onClick={() =>
                handleSendMessage('Bhai, latency test run kar aur bata DeepSeek-V4.1-Flash kitna fast respond kar raha hai!')
              }
              disabled={isLoading}
              className="px-2 py-1 bg-white border border-[#c8c4be] hover:border-[#5645d4] hover:bg-[#e6e0f5]/30 rounded text-[#37352f] text-[10px] font-medium transition-colors cursor-pointer shrink-0"
            >
              ⚡ Latency Test
            </button>
            <button
              onClick={() =>
                handleSendMessage('Bhai ek mast cyberpunk futuristic digital art prompt idea de detail ke sath!')
              }
              disabled={isLoading}
              className="px-2 py-1 bg-white border border-[#c8c4be] hover:border-[#5645d4] hover:bg-[#e6e0f5]/30 rounded text-[#37352f] text-[10px] font-medium transition-colors cursor-pointer shrink-0"
            >
              🔥 Prompt Idea
            </button>
            <button
              onClick={() =>
                handleSendMessage(
                  'Apne GF ya BF ko surprise karne ke liye Gemini/ChatGPT me try karne layak ek cute aesthetic couple prompt suggest karo.'
                )
              }
              disabled={isLoading}
              className="px-2 py-1 bg-white border border-[#c8c4be] hover:border-[#5645d4] hover:bg-[#e6e0f5]/30 rounded text-[#37352f] text-[10px] font-medium transition-colors cursor-pointer shrink-0"
            >
              ❤️ Couple Prompt
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#fafaf9]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#5645d4] text-white rounded-br-xs shadow-xs'
                      : 'bg-white text-[#1a1a1a] border border-[#e5e3df] rounded-bl-xs shadow-2xs'
                  }`}
                >
                  {/* Render attached thumbnail if present */}
                  {m.imageUrl && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-white/20 max-w-[240px]">
                      <img
                        src={m.imageUrl}
                        alt="Uploaded Visual"
                        className="w-full h-auto object-cover max-h-48 rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => {
                          const w = window.open('');
                          w?.document.write(`<img src="${m.imageUrl}" style="max-width:100%; height:auto;" />`);
                        }}
                      />
                    </div>
                  )}

                  {renderFormattedContent(m.content, m.role === 'user')}

                  {/* Raw JSON toggle if available */}
                  {m.rawJson && (
                    <div className="mt-2 pt-2 border-t border-[#ede9e4]">
                      <button
                        onClick={() =>
                          setExpandedJsonId(expandedJsonId === m.id ? null : m.id)
                        }
                        className="flex items-center gap-1 text-[10px] text-[#5645d4] font-mono hover:underline cursor-pointer"
                      >
                        <Code2 className="w-3 h-3" />
                        <span>{expandedJsonId === m.id ? 'Hide Raw JSON' : 'View API Raw JSON'}</span>
                        {expandedJsonId === m.id ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                      {expandedJsonId === m.id && (
                        <pre className="mt-1.5 p-2 bg-[#0a1530] text-[#f5d75e] text-[10px] font-mono rounded overflow-x-auto max-h-48">
                          {m.rawJson}
                        </pre>
                      )}
                    </div>
                  )}
                </div>

                {/* Sub-meta tags (latency & timestamp) */}
                <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-[#787671]">
                  <span>{m.timestamp}</span>
                  {m.latencyMs !== undefined && (
                    <span className="flex items-center gap-0.5 font-mono text-[#1aae39] font-medium bg-[#d9f3e1] px-1.5 py-0.2 rounded">
                      <Activity className="w-2.5 h-2.5" />
                      <span>{m.latencyMs}ms</span>
                    </span>
                  )}
                  {m.isLiveApi !== undefined && (
                    <span
                      className={`text-[9px] font-semibold uppercase px-1 py-0.2 rounded ${
                        m.isLiveApi
                          ? 'bg-[#e6e0f5] text-[#391c57]'
                          : 'bg-[#ffe8d4] text-[#793400]'
                      }`}
                    >
                      {m.isLiveApi ? 'Live API' : 'Simulated'}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 bg-white border border-[#e5e3df] p-2.5 rounded-xl max-w-[130px] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#5645d4] animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-[#ff64c8] animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-[#2a9d99] animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-[10px] text-[#787671] ml-1">DeepSeek AI...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Staged Image Preview Bar (Above Input) */}
          {attachedImage && (
            <div className="px-3 py-1.5 bg-[#f6f5f4] border-t border-[#ede9e4] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <img
                  src={attachedImage}
                  alt="Staged for DeepSeek"
                  className="w-8 h-8 rounded object-cover border border-[#c8c4be]"
                />
                <div className="truncate">
                  <p className="text-[11px] text-[#5645d4] font-semibold truncate">
                    Image attached for DeepSeek Vision scan
                  </p>
                  <p className="text-[9px] text-[#787671]">Press send to analyze</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="text-[#787671] hover:text-[#d32f2f] p-1 rounded hover:bg-white transition-colors cursor-pointer"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-[#ede9e4] flex items-center gap-2"
          >
            {/* Attach Image Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className={`p-2 rounded-md transition-colors cursor-pointer shrink-0 ${
                attachedImage
                  ? 'bg-[#e6e0f5] text-[#5645d4]'
                  : 'text-[#787671] hover:text-[#5645d4] hover:bg-[#f0edf9]'
              }`}
              title="Attach image (or press Ctrl+V to paste)"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                attachedImage
                  ? 'Add instructions for image analysis or press send...'
                  : 'Ask DeepSeek, paste image (Ctrl+V), or test prompt...'
              }
              className="flex-1 px-3 py-2 text-xs bg-[#fafaf9] border border-[#c8c4be] rounded-md focus:outline-none focus:border-[#5645d4] focus:bg-white text-[#1a1a1a]"
            />

            <button
              type="submit"
              disabled={isLoading || (!inputText.trim() && !attachedImage)}
              className="p-2 bg-[#5645d4] hover:bg-[#4534b3] disabled:opacity-50 text-white rounded-md transition-colors cursor-pointer shrink-0"
              title="Send Message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
