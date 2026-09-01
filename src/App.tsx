import React, { useState } from 'react';
import { AppBuilderStudio } from './components/AppBuilderStudio';
import { SettingsModal } from './components/SettingsModal';
import { Smartphone, Settings, Sparkles } from 'lucide-react';

export default function App() {
  const [ghToken, setGhToken] = useState(() => localStorage.getItem('shendroid_gh_token') || localStorage.getItem('url2apk_gh_token') || '');
  const [ghRepo, setGhRepo] = useState(() => localStorage.getItem('shendroid_gh_repo') || localStorage.getItem('url2apk_gh_repo') || 'aishervin/URL2APK');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('shendroid_gemini_key') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [isConfigured, setIsConfigured] = useState(Boolean(ghToken && ghRepo));

  const handleSavedCredentials = () => {
    setIsConfigured(Boolean(ghToken && ghRepo));
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
            <Smartphone size={22} />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">SHΞN™DROID Studio</span>
            <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">
              Android App Builder
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            <span className={`h-2.5 w-2.5 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isConfigured ? ghRepo : 'Credentials Required'}
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
          >
            <Settings size={15} /> Settings
          </button>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <main className="flex-1 py-6">
        <AppBuilderStudio
          ghToken={ghToken}
          ghRepo={ghRepo}
          geminiKey={geminiKey}
          onOpenSettings={() => setShowSettings(true)}
          onUpdateGhRepo={setGhRepo}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        SHΞN™DROID Studio &bull; Professional Android App Builder Pipeline &bull; Powered by Google Gemini & GitHub Actions
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        ghToken={ghToken}
        setGhToken={setGhToken}
        ghRepo={ghRepo}
        setGhRepo={setGhRepo}
        geminiKey={geminiKey}
        setGeminiKey={setGeminiKey}
        onSaved={handleSavedCredentials}
      />
    </div>
  );
}
