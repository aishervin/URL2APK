import React, { useState } from 'react';
import { Key, Save, X, Github, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ghToken: string;
  setGhToken: (token: string) => void;
  ghRepo: string;
  setGhRepo: (repo: string) => void;
  geminiKey: string;
  setGeminiKey: (key: string) => void;
  onSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  ghToken,
  setGhToken,
  ghRepo,
  setGhRepo,
  geminiKey,
  setGeminiKey,
  onSaved,
}) => {
  const [tempGhToken, setTempGhToken] = useState(ghToken);
  const [tempGhRepo, setTempGhRepo] = useState(ghRepo);
  const [tempGeminiKey, setTempGeminiKey] = useState(geminiKey);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setGhToken(tempGhToken.trim());
    setGhRepo(tempGhRepo.trim());
    setGeminiKey(tempGeminiKey.trim());
    localStorage.setItem('shendroid_gh_token', tempGhToken.trim());
    localStorage.setItem('shendroid_gh_repo', tempGhRepo.trim());
    localStorage.setItem('shendroid_gemini_key', tempGeminiKey.trim());
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Key size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Studio Security & Credentials</h3>
            <p className="text-xs text-slate-500">Client-side only storage for GitHub & Gemini API keys.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <label className="block">
            <span className="flex items-center gap-1.5 mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Github size={14} /> GitHub Personal Access Token (PAT)
            </span>
            <input
              type="password"
              value={tempGhToken}
              onChange={(e) => setTempGhToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            />
            <span className="block mt-1 text-[11px] text-slate-400">
              Requires <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">repo</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">workflow</code> scopes.
            </span>
          </label>

          <label className="block">
            <span className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">GitHub Repository (owner/repo)</span>
            <input
              type="text"
              value={tempGhRepo}
              onChange={(e) => setTempGhRepo(e.target.value)}
              placeholder="aishervin/URL2APK"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            />
          </label>

          <div className="border-t border-slate-100 pt-4"></div>

          <label className="block">
            <span className="flex items-center gap-1.5 mb-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600">
              <Sparkles size={14} /> Google Gemini API Key
            </span>
            <input
              type="password"
              value={tempGeminiKey}
              onChange={(e) => setTempGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            />
            <span className="block mt-1 text-[11px] text-slate-400">
              Used client-side for AI app generation, code editing, and Gradle debug agent.
            </span>
          </label>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-100 flex items-center gap-2"
            >
              <Save size={16} /> Save Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
