/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Link as LinkIcon, Download, Loader2, AlertCircle, Settings, CheckCircle2 } from 'lucide-react';
import { AppBuilderResponse } from './types';

export default function App() {
  const [url, setUrl] = useState('');
  const [appName, setAppName] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [response, setResponse] = useState<AppBuilderResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !appName) return;

    setIsBuilding(true);
    setResponse(null);

    try {
      const res = await fetch('/api/build-apk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, appName }),
      });
      
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({ error: 'A network error occurred while connecting to the build server.' });
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <header className="h-20 bg-white border-b border-slate-200 px-6 sm:px-10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Web2APK<span className="text-indigo-600">Pro</span>
          </h1>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-500">
          <a className="text-indigo-600 border-b-2 border-indigo-600 pb-1 cursor-pointer">Dashboard</a>
          <a className="cursor-pointer hover:text-slate-800 transition-colors">Build History</a>
          <a className="cursor-pointer hover:text-slate-800 transition-colors">Documentation</a>
        </nav>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">Build Balance</p>
            <p className="text-sm font-bold text-slate-700">Unlimited</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
            <Settings className="w-5 h-5 text-slate-500" />
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto w-full">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex-1 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Create New App</h2>
              <p className="text-slate-500 mb-8">Transform any URL into a high-performance Android package.</p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="url" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Website URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <LinkIcon className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <input
                      id="url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      required
                      disabled={isBuilding}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="appName" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      App Name
                    </label>
                    <input
                      id="appName"
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="My App"
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      required
                      disabled={isBuilding}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Orientation
                    </label>
                    <select className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl appearance-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800" disabled={isBuilding}>
                      <option>Portrait (Default)</option>
                      <option>Landscape</option>
                      <option>Auto-Rotate</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBuilding || !url || !appName}
                  className="w-full py-4 mt-2 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {isBuilding ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Building APK...</span>
                    </>
                  ) : (
                    <>
                      <Settings className="w-5 h-5" />
                      <span>Build APK Now</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 shadow-2xl h-48 overflow-y-auto font-mono text-sm relative">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2 sticky top-0 bg-slate-900 z-10">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-slate-500 text-xs ml-2">Build Console</span>
            </div>
            <div className="text-emerald-400 space-y-1">
              {!isBuilding && !response && (
                 <p><span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> <span className="text-white">Ready for next build session.</span></p>
              )}
              {isBuilding && (
                <>
                  <p><span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> Initializing cloud build engine...</p>
                  <p className="animate-pulse"><span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> Fetching manifest data from {url || 'URL'}...</p>
                </>
              )}
              {response && response.error && (
                 <div className="text-red-400">
                   <p><span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> ERROR: {response.error}</p>
                   {response.message && <p className="text-red-300 mt-1 pl-[104px] sm:pl-[120px]">{response.message}</p>}
                 </div>
              )}
              {response && !response.error && (
                 <div>
                   <p className="text-emerald-400"><span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> SUCCESS: {response.message}</p>
                   {response.downloadUrl && response.downloadUrl !== '#' && (
                     <a 
                       href={response.downloadUrl}
                       target="_blank"
                       rel="noreferrer"
                       className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-emerald-900/50 hover:bg-emerald-800/80 rounded border border-emerald-800 text-emerald-300 transition-colors"
                     >
                       <Download className="w-3 h-3" /> Download APK
                     </a>
                   )}
                 </div>
              )}
              <p className="animate-pulse">_</p>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Pro Feature: Live Update</h3>
              <p className="text-indigo-100 text-sm opacity-90">Updates to your website are reflected in the app instantly without reinstalling the APK.</p>
            </div>
            <Smartphone className="absolute -right-4 -bottom-4 w-32 h-32 text-indigo-500 opacity-20" strokeWidth={1} />
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex-1">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span>Recent Builds</span>
              <span className="text-xs text-indigo-600 cursor-pointer hover:underline">View All</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500">SHOP</div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">mystore.com</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Created 2h ago</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-slate-200 rounded-lg text-indigo-600 transition-colors">
                  <Download className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500">PORT</div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">portfolio-v3.io</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Created 1d ago</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-slate-200 rounded-lg text-indigo-600 transition-colors">
                  <Download className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500">CRM</div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">internal-crm.app</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Created 5d ago</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                  <Download className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </main>
      
      <footer className="h-12 bg-white border-t border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 text-[11px] text-slate-400 font-medium uppercase tracking-widest mt-auto">
        <div className="flex gap-4 sm:gap-6">
          <span>Engine v4.2.0-Stable</span>
          <span className="hidden sm:inline">Server Status: Online</span>
        </div>
        <div>
          &copy; {new Date().getFullYear()} Web2APK Software Inc.
        </div>
      </footer>
    </div>
  );
}

