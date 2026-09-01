import React from 'react';
import { Smartphone, Settings, Sparkles, Github, Code, FolderGit2, Cpu, Wrench } from 'lucide-react';
import type { StudioTab } from '../types';

interface NavbarProps {
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
  onOpenSettings: () => void;
  isConfigured: boolean;
  building: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  isConfigured,
  building,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <Smartphone className="text-white" size={22} />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
            SHΞN<span className="text-indigo-600">™</span>DROID <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 ml-1">Studio</span>
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">AI Android App Creation Studio</p>
        </div>
      </div>

      <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu size={15} /> Dashboard & Modes
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'editor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Code size={15} /> Code Editor
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'assets' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderGit2 size={15} /> Assets & Materials
        </button>
        <button
          onClick={() => setActiveTab('github')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'github' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Github size={15} /> GitHub Workspace
        </button>
        <button
          onClick={() => setActiveTab('ai-assistant')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'ai-assistant' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles size={15} className="text-violet-500" /> Gemini Agent
        </button>
        <button
          onClick={() => setActiveTab('build')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'build' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wrench size={15} /> Build & APK
        </button>
      </nav>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
            !isConfigured ? 'bg-amber-50 border-amber-300 text-amber-700 animate-pulse' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Settings size={16} /> {isConfigured ? 'Credentials' : 'Configure Keys'}
        </button>
        <div className="hidden xl:flex items-center gap-2 text-sm">
          <span className={`h-2 w-2 rounded-full ${building ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-slate-500 font-medium text-xs">{building ? 'Building APK...' : 'Ready'}</span>
        </div>
      </div>
    </header>
  );
};
