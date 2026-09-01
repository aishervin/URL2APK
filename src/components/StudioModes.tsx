import React from 'react';
import { Globe, Code2, Sparkles, FolderArchive, Layers, ArrowRight, Smartphone, ShieldCheck, Terminal } from 'lucide-react';
import type { CreationMode, StudioTab } from '../types';

interface StudioModesProps {
  onSelectMode: (mode: CreationMode, tab?: StudioTab) => void;
  isConfigured: boolean;
  onOpenSettings: () => void;
}

export const StudioModes: React.FC<StudioModesProps> = ({ onSelectMode, isConfigured, onOpenSettings }) => {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
      {/* Hero Welcome banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 overflow-hidden shadow-2xl border border-indigo-900/50">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide">
            <Sparkles size={13} /> AI-Powered Android App Creation Studio
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Build, Edit & Package <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Android APKs & AABs</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            SHΞN™DROID Studio combines advanced Android SDK tooling, Gemini AI Agent code generation, GitHub autonomous workflows, and multi-format project packaging into one ultimate studio.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onSelectMode('website', 'build')}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
            >
              <Smartphone size={18} /> Quick Website to APK <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onSelectMode('ai-gen', 'ai-assistant')}
              className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Sparkles size={18} className="text-violet-400" /> Generate App with Gemini AI
            </button>
          </div>
        </div>
      </div>

      {!isConfigured && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck size={24} className="text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">GitHub Token & Gemini API Key Not Configured</h4>
              <p className="text-xs text-amber-700">To build APKs via GitHub Actions and use Gemini AI assistant, configure your credentials.</p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-colors"
          >
            Configure Credentials Now
          </button>
        </div>
      )}

      {/* 5 Creation Modes Grid */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Select App Creation Mode</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mode 1: Website to App */}
          <div
            onClick={() => onSelectMode('website', 'build')}
            className="group bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Globe size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">1. Website To App</h4>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Convert any public website URL into a fully functional Android Trusted Web Activity (TWA) APK package.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-2 text-xs font-bold text-indigo-600">
              Launch Builder <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Mode 2: Source Code To App */}
          <div
            onClick={() => onSelectMode('source', 'editor')}
            className="group bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Code2 size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-violet-600 transition-colors">2. Source Code To App</h4>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Import or write HTML, CSS, JavaScript, TypeScript, Python scripts, and JSON configs. Automatically bundle into Android WebView hybrid apps.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-2 text-xs font-bold text-violet-600">
              Open Code Editor <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Mode 3: AI Generated App */}
          <div
            onClick={() => onSelectMode('ai-gen', 'ai-assistant')}
            className="group bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-fuchsia-600 transition-colors">3. AI Generated App</h4>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Describe your dream app prompt. Gemini AI creates the complete project, structures assets, and prepares it for APK compilation.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-2 text-xs font-bold text-fuchsia-600">
              Ask Gemini Agent <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Mode 4: Existing Android Project */}
          <div
            onClick={() => onSelectMode('import', 'github')}
            className="group bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FolderArchive size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">4. Existing Android Project</h4>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Import from GitHub repository, let AI optimize Gradle builds, fix Manifest issues, and compile release APK/AAB.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-2 text-xs font-bold text-emerald-600">
              GitHub Workspace <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Mode 5: Hybrid Studio */}
          <div
            onClick={() => onSelectMode('hybrid', 'editor')}
            className="group bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between md:col-span-2 lg:col-span-1"
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors">5. Hybrid Studio</h4>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Combined visual asset manager, multi-file code editor, GitHub repository synchronization, and real-time AI assistant debugging.
              </p>
            </div>
            <div className="pt-6 flex items-center gap-2 text-xs font-bold text-amber-600">
              Open Hybrid Studio <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Studio Quick Stats */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Terminal size={14} /> Studio Engine Status
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">Online</span>
            </div>
            <div className="grid grid-cols-3 gap-4 my-4 text-center">
              <div className="bg-slate-800/80 p-3 rounded-2xl">
                <div className="text-2xl font-black text-indigo-400">v2.5</div>
                <div className="text-[11px] text-slate-400">Android SDK 35</div>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl">
                <div className="text-2xl font-black text-violet-400">Gradle</div>
                <div className="text-[11px] text-slate-400">8.7 & TWA</div>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl">
                <div className="text-2xl font-black text-fuchsia-400">Gemini</div>
                <div className="text-[11px] text-slate-400">AI Agent Live</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center">SHΞN™DROID Studio is fully synchronized with GitHub Actions automated APK packaging.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
