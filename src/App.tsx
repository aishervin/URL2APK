import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, Link as LinkIcon, Loader2, Smartphone, Terminal, CheckCircle2, AlertCircle, RotateCcw, Settings, Key, Save, Check, X } from 'lucide-react';
import type { AppBuilderRequest, AppBuilderResponse } from './types';

type LogType = 'info' | 'success' | 'error';
type Log = { id: number; type: LogType; message: string };

export default function App() {
  const [url, setUrl] = useState('');
  const [appName, setAppName] = useState('');
  const [orientation, setOrientation] = useState<AppBuilderRequest['orientation']>('portrait');
  const [building, setBuilding] = useState(false);
  const [result, setResult] = useState<AppBuilderResponse | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  
  // GitHub Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [ghToken, setGhToken] = useState(() => localStorage.getItem('url2apk_gh_token') || '');
  const [ghRepo, setGhRepo] = useState(() => localStorage.getItem('url2apk_gh_repo') || 'aishervin/URL2APK');
  const [isConfigured, setIsConfigured] = useState(false);
  const [savedSettingsMsg, setSavedSettingsMsg] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useRef(0);

  const log = useCallback((type: LogType, message: string) => {
    setLogs((items) => [...items, { id: ++id.current, type, message }]);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Check server configuration health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (ghToken) headers['X-GitHub-Token'] = ghToken;
        if (ghRepo) headers['X-GitHub-Repo'] = ghRepo;
        const res = await fetch('/api/health', { headers });
        const data = await res.json();
        setIsConfigured(data.configured);
      } catch {
        setIsConfigured(Boolean(ghToken && ghRepo));
      }
    };
    void checkHealth();
  }, [ghToken, ghRepo]);

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('url2apk_gh_token', ghToken.trim());
    localStorage.setItem('url2apk_gh_repo', ghRepo.trim());
    setIsConfigured(Boolean(ghToken.trim() && ghRepo.trim()));
    setSavedSettingsMsg(true);
    setTimeout(() => setSavedSettingsMsg(false), 3000);
    setShowSettings(false);
  };

  const poll = useCallback(async (runId: number) => {
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (ghToken) headers['X-GitHub-Token'] = ghToken;
      if (ghRepo) headers['X-GitHub-Repo'] = ghRepo;

      const response = await fetch(`/api/build-status/${runId}`, { headers });
      const data = (await response.json()) as AppBuilderResponse;
      if (!response.ok || (data.error && !data.status)) throw new Error(data.message || data.error || 'Status request failed');
      setResult(data);
      if (data.status === 'success') {
        log('success', data.message || 'APK generated successfully.');
        setBuilding(false);
      } else if (data.status === 'failed' || data.status === 'cancelled') {
        log('error', data.error || `Build ${data.status}.`);
        setBuilding(false);
      } else {
        log('info', data.message || 'Build is still running...');
        timer.current = setTimeout(() => void poll(runId), 5000);
      }
    } catch (error) {
      log('error', error instanceof Error ? error.message : 'Connection to build server was lost.');
      setResult({ error: 'Could not check build status.' });
      setBuilding(false);
    }
  }, [log, ghToken, ghRepo]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (building || !url.trim() || !appName.trim()) return;
    if (!ghToken.trim() || !ghRepo.trim()) {
      setShowSettings(true);
      log('error', 'Please configure your GitHub Token and Repository in Settings.');
      return;
    }

    setBuilding(true); setResult(null); setLogs([]); id.current = 0;
    log('info', `Starting ${appName.trim()} from ${url.trim()}`);
    try {
      const payload: AppBuilderRequest = { url: url.trim(), appName: appName.trim(), orientation };
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (ghToken) headers['X-GitHub-Token'] = ghToken;
      if (ghRepo) headers['X-GitHub-Repo'] = ghRepo;

      const response = await fetch('/api/build-apk', { method: 'POST', headers, body: JSON.stringify(payload) });
      const data = (await response.json()) as AppBuilderResponse;
      if (!response.ok || data.error) {
        log('error', data.error || data.message || 'Build request failed.'); setResult(data); setBuilding(false); return;
      }
      if (!data.runId) { log('error', 'GitHub accepted the request but no run ID was returned.'); setResult(data); setBuilding(false); return; }
      setResult(data); log('success', `GitHub Actions run #${data.runId} started.`); void poll(data.runId);
    } catch (error) {
      log('error', error instanceof Error ? error.message : 'Network error.');
      setResult({ error: 'Unable to connect to the build server.' }); setBuilding(false);
    }
  };

  const reset = () => { if (timer.current) clearTimeout(timer.current); setBuilding(false); setResult(null); setLogs([]); };
  const statusText = result?.status === 'success' ? 'Build complete' : building ? 'Building APK…' : 'Ready';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="h-20 bg-white border-b border-slate-200 px-5 sm:px-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100"><Smartphone className="text-white" size={22}/></div>
          <div><h1 className="text-xl sm:text-2xl font-bold">Web2APK<span className="text-indigo-600">Pro</span></h1><p className="hidden sm:block text-[10px] uppercase tracking-widest text-slate-400">URL → Android APK</p></div>
        </div>
        <div className="flex items-center gap-4">
          {savedSettingsMsg && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Check size={14}/> Settings saved</span>}
          <button onClick={() => setShowSettings(true)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${!isConfigured ? 'bg-amber-50 border-amber-300 text-amber-700 animate-pulse' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Settings size={16}/> {isConfigured ? 'GitHub Settings' : 'Configure GitHub Token'}
          </button>
          <div className="hidden sm:flex items-center gap-2 text-sm"><span className={`h-2 w-2 rounded-full ${building ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}/><span className="text-slate-500">{statusText}</span></div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button onClick={() => setShowSettings(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600"><X size={20}/></button>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Key size={20}/></div>
              <div><h3 className="text-xl font-bold">GitHub Credentials</h3><p className="text-xs text-slate-500">Required for triggering GitHub Actions APK builds.</p></div>
            </div>
            <form onSubmit={saveSettings} className="space-y-4">
              <label className="block">
                <span className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">GitHub Personal Access Token (PAT)</span>
                <input type="password" value={ghToken} onChange={(e) => setGhToken(e.target.value)} placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"/>
                <span className="block mt-1 text-[11px] text-slate-400">Needs <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">repo</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">workflow</code> scopes.</span>
              </label>
              <label className="block">
                <span className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">Repository (owner/repo)</span>
                <input type="text" value={ghRepo} onChange={(e) => setGhRepo(e.target.value)} placeholder="aishervin/URL2APK" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"/>
              </label>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowSettings(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-100 flex items-center gap-2"><Save size={16}/> Save Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="w-full max-w-7xl mx-auto flex-1 p-4 sm:p-8 grid lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-9">
          <div className="max-w-xl mx-auto">
            <h2 className="text-3xl font-bold mb-2">Create New App</h2>
            <p className="text-slate-500 mb-8">Enter a website and GitHub Actions will build the Android package for you.</p>
            
            {!isConfigured && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3">
                <AlertCircle size={20} className="mt-0.5 text-amber-600 shrink-0"/>
                <div className="text-sm">
                  <p className="font-semibold">GitHub Token not configured</p>
                  <p className="text-amber-700 mt-0.5">Please click <button onClick={() => setShowSettings(true)} className="underline font-semibold hover:text-amber-900">Configure GitHub Token</button> above to add your Personal Access Token before building APKs.</p>
                </div>
              </div>
            )}

            <form onSubmit={submit} className="space-y-5">
              <label className="block"><span className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Website URL</span><div className="relative"><LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input value={url} onChange={(e) => setUrl(e.target.value)} type="url" required disabled={building} placeholder="https://example.com" className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"/></div></label>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block"><span className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">App Name</span><input value={appName} onChange={(e) => setAppName(e.target.value)} maxLength={30} minLength={2} required disabled={building} placeholder="My App" className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"/></label>
                <label className="block"><span className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Orientation</span><select value={orientation} onChange={(e) => setOrientation(e.target.value as AppBuilderRequest['orientation'])} disabled={building} className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"><option value="portrait">Portrait</option><option value="landscape">Landscape</option><option value="auto">Auto-Rotate</option></select></label>
              </div>
              <button disabled={building || !url || !appName} className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-100 disabled:opacity-60 flex justify-center items-center gap-3 transition-colors">{building ? <><Loader2 className="animate-spin" size={20}/>Building APK…</> : <><Smartphone size={20}/>Build APK Now</>}</button>
            </form>
            {result && <div className={`mt-6 rounded-2xl border p-4 ${result.status === 'success' ? 'border-emerald-200 bg-emerald-50' : result.error ? 'border-red-200 bg-red-50' : 'border-indigo-200 bg-indigo-50'}`}>
              <div className="flex gap-3"><div className="mt-0.5">{result.status === 'success' ? <CheckCircle2 className="text-emerald-600" size={20}/> : result.error ? <AlertCircle className="text-red-600" size={20}/> : <Loader2 className="text-indigo-600 animate-spin" size={20}/>}</div><div className="min-w-0 flex-1"><p className="font-semibold">{result.error || result.message || 'Processing…'}</p>{result.runUrl && <a href={result.runUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-sm text-indigo-600 hover:underline">Open GitHub run <ExternalLink size={13}/></a>}{result.directApkUrl && <a href={result.directApkUrl} target="_blank" rel="noreferrer" className="ml-4 inline-flex items-center gap-1 mt-2 text-sm font-bold text-emerald-700 hover:underline"><Download size={14}/> Download APK</a>}{result.downloadUrl && <a href={result.downloadUrl} target="_blank" rel="noreferrer" className="ml-4 inline-flex items-center gap-1 mt-2 text-sm font-medium text-emerald-600 opacity-80 hover:underline"><Download size={14}/> Backup ZIP</a>}</div></div>
            </div>}
          </div>
        </section>

        <aside className="lg:col-span-5 flex flex-col gap-6">
          <section className="rounded-3xl bg-slate-900 text-white p-5 sm:p-6 min-h-[250px] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3"><div className="flex items-center gap-2"><Terminal size={16}/><span className="text-sm font-semibold">Build Console</span></div><button onClick={reset} className="text-slate-500 hover:text-white" title="Clear console"><RotateCcw size={15}/></button></div>
            <div className="font-mono text-xs sm:text-sm mt-4 space-y-2 overflow-auto max-h-64">{logs.length === 0 ? <p className="text-slate-500">Ready for next build session.</p> : logs.map((entry) => <p key={entry.id} className={entry.type === 'error' ? 'text-red-400' : entry.type === 'success' ? 'text-emerald-400' : 'text-slate-300'}><span className="text-slate-600">[{String(entry.id).padStart(2, '0')}]</span> {entry.message}</p>)}</div>
          </section>
          <section className="bg-indigo-600 text-white rounded-3xl p-6 flex-1"><h3 className="font-bold text-xl mb-2">How it works</h3><ol className="text-sm text-indigo-100 space-y-3 list-decimal list-inside"><li>Configure your GitHub Personal Access Token in Settings.</li><li>Enter your public website URL and App Name.</li><li>GitHub Actions builds the TWA package.</li><li>Download the generated APK artifact.</li></ol></section>
        </aside>
      </main>
      <footer className="border-t border-slate-200 bg-white px-5 sm:px-8 py-4 text-xs text-slate-400 flex justify-between"><span>URL2APK · Build Engine</span><span>GitHub Actions powered</span></footer>
    </div>
  );
}
