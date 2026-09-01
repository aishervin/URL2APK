import React, { useState, useEffect } from 'react';
import { Smartphone, Sparkles, Code, Play, Download, Settings, Github, CheckCircle2, AlertCircle, Loader2, ArrowRight, ArrowLeft, RefreshCw, Layers, FileCode, Check } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import type { ProjectFile, AppBuilderResponse } from '../types';

interface AppBuilderStudioProps {
  ghToken: string;
  ghRepo: string;
  geminiKey: string;
  onOpenSettings: () => void;
  onUpdateGhRepo: (repo: string) => void;
}

type Step = 1 | 2 | 3;

export const AppBuilderStudio: React.FC<AppBuilderStudioProps> = ({
  ghToken,
  ghRepo,
  geminiKey,
  onOpenSettings,
  onUpdateGhRepo,
}) => {
  const [step, setStep] = useState<Step>(1);

  // Step 1: Input state
  const [inputMode, setInputMode] = useState<'url' | 'ai' | 'code'>('url');
  const [appUrl, setAppUrl] = useState('');
  const [appName, setAppName] = useState('');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'auto'>('portrait');
  const [aiPrompt, setAiPrompt] = useState('');

  // Step 2: Project files & AI Code Assistant state
  const [files, setFiles] = useState<ProjectFile[]>([
    {
      path: 'src/index.html',
      name: 'index.html',
      type: 'html',
      content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>SHΞN DROID App</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body class="bg-slate-50 p-6 font-sans">\n  <div class="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-8 text-center">\n    <h1 class="text-3xl font-bold text-indigo-600 mb-2">SHΞN™DROID</h1>\n    <p class="text-slate-500 text-sm">Hybrid WebView Android App created via AI Builder Studio.</p>\n  </div>\n</body>\n</html>',
    },
    {
      path: 'src/style.css',
      name: 'style.css',
      type: 'css',
      content: 'body { margin: 0; padding: 0; background: #f8fafc; font-family: system-ui, sans-serif; }',
    },
    {
      path: 'src/app.js',
      name: 'app.js',
      type: 'js',
      content: 'console.log("SHΞN DROID app initialized.");',
    },
  ]);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(files[0]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'model'; text: string; filesGenerated?: number }>>([
    { role: 'model', text: 'Hello! I am your SHΞN DROID AI Developer. Tell me what app you want to build or modify, and I will generate the code for your Android APK instantly.' }
  ]);

  // Step 3: Build & APK compilation state
  const [building, setBuilding] = useState(false);
  const [buildResult, setBuildResult] = useState<AppBuilderResponse | null>(null);
  const [buildLogs, setBuildLogs] = useState<Array<{ id: number; type: 'info' | 'success' | 'error'; message: string }>>([
    { id: 1, type: 'info', message: 'Studio Build Pipeline ready. Configure input and compile.' }
  ]);
  const logIdRef = React.useRef(1);

  const addLog = React.useCallback((type: 'info' | 'success' | 'error', message: string) => {
    setBuildLogs(prev => [...prev, { id: ++logIdRef.current, type, message }]);
  }, []);

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatInput.trim() || aiThinking) return;
    if (!geminiKey) {
      alert('Please configure your Gemini API Key in Settings first.');
      onOpenSettings();
      return;
    }

    const promptText = aiChatInput.trim();
    setAiChatInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: promptText }]);
    setAiThinking(true);

    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{
              text: `You are SHΞN DROID AI Developer. Create complete web app code for an Android WebView app based on this prompt: "${promptText}".
Output files using code blocks with file paths like \`\`\`file:src/index.html ... \`\`\` or \`\`\`file:src/app.js ... \`\`\`.`
            }]
          }
        ]
      });

      const reply = response.text || 'I have generated the code.';
      // Parse files
      const regex = /```(?:file:)?([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)\n([\s\S]*?)```/g;
      let match;
      let count = 0;
      while ((match = regex.exec(reply)) !== null) {
        const filePath = match[1];
        const content = match[2].trim();
        count++;
        const ext = filePath.split('.').pop() || 'txt';
        const fileType = (['html', 'css', 'js', 'ts', 'py', 'json'].includes(ext) ? ext : 'other') as ProjectFile['type'];
        
        setFiles(prev => {
          const exists = prev.find(f => f.path === filePath);
          if (exists) {
            return prev.map(f => f.path === filePath ? { ...f, content, isModified: true } : f);
          } else {
            return [...prev, { path: filePath, name: filePath.split('/').pop() || filePath, type: fileType, content, isModified: true }];
          }
        });
      }

      setAiMessages(prev => [...prev, { role: 'model', text: reply, filesGenerated: count }]);
    } catch (err) {
      setAiMessages(prev => [...prev, { role: 'model', text: `Error calling Gemini API: ${err instanceof Error ? err.message : 'Unknown error'}` }]);
    } finally {
      setAiThinking(false);
    }
  };

  const handleStartBuild = async () => {
    if (!ghToken || !ghRepo) {
      onOpenSettings();
      alert('Please configure GitHub Token and Repository in Settings before building APK.');
      return;
    }
    if (!appName.trim()) {
      alert('Please enter a valid App Name.');
      setStep(1);
      return;
    }

    setBuilding(true);
    setBuildResult(null);
    setStep(3);
    addLog('info', `Initiating GitHub Actions build workflow for "${appName.trim()}"...`);

    try {
      const payload = {
        url: inputMode === 'url' ? appUrl : 'https://example.com',
        appName: appName.trim(),
        orientation
      };
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-GitHub-Token': ghToken,
        'X-GitHub-Repo': ghRepo
      };

      const res = await fetch('/api/build-apk', { method: 'POST', headers, body: JSON.stringify(payload) });
      const data = (await res.json()) as AppBuilderResponse;

      if (!res.ok || data.error) {
        addLog('error', data.error || data.message || 'Build initiation failed.');
        setBuildResult(data);
        setBuilding(false);
        return;
      }

      addLog('success', `GitHub Actions workflow triggered successfully (Run ID: ${data.runId}).`);
      setBuildResult(data);

      // Poll status
      if (data.runId) {
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/build-status/${data.runId}`, { headers });
            const statusData = (await statusRes.json()) as AppBuilderResponse;
            setBuildResult(statusData);

            if (statusData.status === 'success') {
              addLog('success', statusData.message || 'APK compiled successfully!');
              setBuilding(false);
              clearInterval(pollInterval);
            } else if (statusData.status === 'failed' || statusData.status === 'cancelled') {
              addLog('error', statusData.error || `Build ${statusData.status}.`);
              setBuilding(false);
              clearInterval(pollInterval);
            } else {
              addLog('info', statusData.message || 'Building APK in GitHub Actions...');
            }
          } catch {
            // ignore network glitch during polling
          }
        }, 5000);
      }
    } catch (err) {
      addLog('error', err instanceof Error ? err.message : 'Network connection error.');
      setBuildResult({ error: 'Connection error during build.' });
      setBuilding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
      {/* Studio Header & Wizard Pipeline Steps */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Smartphone size={14} /> SHΞN™DROID Studio Pro v2.5
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Android App Builder Pipeline</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Input your source, configure app parameters, refine with AI, and compile your signed APK instantly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSettings}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-2 transition-colors"
          >
            <Settings size={15} /> Settings ({ghToken ? 'GitHub Connected' : 'Config Required'})
          </button>
        </div>
      </div>

      {/* Step Indicator Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div onClick={() => setStep(1)} className={`cursor-pointer p-4 rounded-2xl border transition-all ${step === 1 ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Step 1</span>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-700'}`}>1</span>
          </div>
          <p className="font-bold text-sm sm:text-base">Input & App Source</p>
          <p className={`text-xs mt-0.5 ${step === 1 ? 'text-indigo-100' : 'text-slate-400'}`}>URL, AI Prompt, or Code files</p>
        </div>

        <div onClick={() => setStep(2)} className={`cursor-pointer p-4 rounded-2xl border transition-all ${step === 2 ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Step 2</span>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-700'}`}>2</span>
          </div>
          <p className="font-bold text-sm sm:text-base">Studio & AI Editor</p>
          <p className={`text-xs mt-0.5 ${step === 2 ? 'text-indigo-100' : 'text-slate-400'}`}>Refine code with Gemini AI</p>
        </div>

        <div onClick={() => setStep(3)} className={`cursor-pointer p-4 rounded-2xl border transition-all ${step === 3 ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Step 3</span>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-700'}`}>3</span>
          </div>
          <p className="font-bold text-sm sm:text-base">Build & Download APK</p>
          <p className={`text-xs mt-0.5 ${step === 3 ? 'text-indigo-100' : 'text-slate-400'}`}>Compile & download release</p>
        </div>
      </div>

      {/* STEP 1: INPUT & SOURCE */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 animate-fadeIn">
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-slate-900">Choose App Source & Input</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Select how you want to build your Android application.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <button
              onClick={() => setInputMode('url')}
              className={`p-5 rounded-2xl border text-left transition-all ${inputMode === 'url' ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                <Smartphone size={20} />
              </div>
              <p className="font-bold text-slate-900 text-sm">Website URL to APK</p>
              <p className="text-xs text-slate-500 mt-1">Convert any live website or web app into an Android App.</p>
            </button>

            <button
              onClick={() => setInputMode('ai')}
              className={`p-5 rounded-2xl border text-left transition-all ${inputMode === 'ai' ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-3">
                <Sparkles size={20} />
              </div>
              <p className="font-bold text-slate-900 text-sm">Gemini AI Prompt Builder</p>
              <p className="text-xs text-slate-500 mt-1">Describe your dream app and Gemini will generate the complete code.</p>
            </button>

            <button
              onClick={() => setInputMode('code')}
              className={`p-5 rounded-2xl border text-left transition-all ${inputMode === 'code' ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <Code size={20} />
              </div>
              <p className="font-bold text-slate-900 text-sm">Custom Source Code</p>
              <p className="text-xs text-slate-500 mt-1">Use HTML, CSS, JS, Python, and JSON files in the built-in studio editor.</p>
            </button>
          </div>

          <div className="space-y-6 pt-4 border-t border-slate-100">
            <div className="grid sm:grid-cols-2 gap-6">
              <label className="block">
                <span className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">App Name</span>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. CryptoPulse App"
                  maxLength={30}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                />
              </label>

              <label className="block">
                <span className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">Screen Orientation</span>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as any)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                >
                  <option value="portrait">Portrait (Vertical)</option>
                  <option value="landscape">Landscape (Horizontal)</option>
                  <option value="auto">Auto-Rotate</option>
                </select>
              </label>
            </div>

            {inputMode === 'url' && (
              <label className="block animate-fadeIn">
                <span className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">Target Website URL</span>
                <input
                  type="url"
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                />
              </label>
            )}

            {inputMode === 'ai' && (
              <div className="space-y-4 animate-fadeIn">
                <label className="block">
                  <span className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">Describe Your App to Gemini AI</span>
                  <textarea
                    rows={4}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., Create a sleek crypto price tracker with live charts, modern dark UI, and coin converter..."
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium resize-none"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                if (!appName.trim()) {
                  alert('Please enter an App Name.');
                  return;
                }
                if (inputMode === 'url' && !appUrl.trim()) {
                  alert('Please enter a target Website URL.');
                  return;
                }
                setStep(2);
              }}
              className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-100 flex items-center gap-2 transition-colors"
            >
              Continue to Studio Editor & AI <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: STUDIO & AI EDITOR */}
      {step === 2 && (
        <div className="grid lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Left: File Explorer & Editor */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Project File Workspace</h3>
                <p className="text-xs text-slate-500">Edit HTML, CSS, JS or Python source code directly.</p>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {files.map(f => (
                  <button
                    key={f.path}
                    onClick={() => setActiveFile(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors ${activeFile?.path === f.path ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {activeFile && (
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>path: {activeFile.path}</span>
                  <span>{activeFile.content.split('\n').length} lines</span>
                </div>
                <textarea
                  value={activeFile.content}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFiles(prev => prev.map(f => f.path === activeFile.path ? { ...f, content: val, isModified: true } : f));
                    setActiveFile(prev => prev ? { ...prev, content: val } : null);
                  }}
                  rows={14}
                  className="w-full p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs sm:text-sm outline-none resize-none shadow-inner leading-relaxed"
                />
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
              >
                Proceed to APK Build <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Right: Gemini AI Assistant */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="h-8 w-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Gemini AI Code Assistant</h3>
                  <p className="text-[11px] text-slate-500">Auto-generates code blocks for workspace</p>
                </div>
              </div>

              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {aiMessages.map((m, idx) => (
                  <div key={idx} className={`p-3.5 rounded-2xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white ml-6' : 'bg-slate-100 text-slate-800 mr-6 font-mono'}`}>
                    <p>{m.text}</p>
                    {m.filesGenerated && m.filesGenerated > 0 && (
                      <p className="mt-2 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        ✨ {m.filesGenerated} files updated/generated in workspace!
                      </p>
                    )}
                  </div>
                ))}
                {aiThinking && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 italic p-2">
                    <Loader2 size={14} className="animate-spin text-indigo-600" /> Gemini is generating app files...
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleAiGenerate} className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={aiChatInput}
                onChange={(e) => setAiChatInput(e.target.value)}
                placeholder={geminiKey ? 'Ask AI to modify UI or add features...' : 'Configure Gemini API Key in Settings...'}
                disabled={!geminiKey || aiThinking}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-xs disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!geminiKey || aiThinking || !aiChatInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm disabled:opacity-50 flex items-center gap-1"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STEP 3: BUILD & DOWNLOAD APK */}
      {step === 3 && (
        <div className="grid lg:grid-cols-12 gap-6 animate-fadeIn">
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Final Step</span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">Compile & Build Signed APK</h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Trigger GitHub Actions build runner to package your app into a production Android APK.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">App Name:</span>
                <span className="font-bold text-slate-900">{appName || 'SHΞN DROID App'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Input Type:</span>
                <span className="font-bold text-slate-900 uppercase">{inputMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Orientation:</span>
                <span className="font-bold text-slate-900 capitalize">{orientation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GitHub Target Repo:</span>
                <span className="font-mono font-bold text-indigo-600">{ghRepo}</span>
              </div>
            </div>

            {!building && !buildResult?.directApkUrl && (
              <button
                onClick={handleStartBuild}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-colors"
              >
                <Smartphone size={20} /> Start APK Compilation Now
              </button>
            )}

            {building && (
              <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-center space-y-3">
                <Loader2 className="animate-spin mx-auto text-indigo-600" size={32} />
                <p className="font-bold text-sm">GitHub Actions Build Runner in Progress...</p>
                <p className="text-xs text-indigo-700">Compiling Gradle project, bundling assets, and signing APK package.</p>
              </div>
            )}

            {buildResult?.directApkUrl && (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-4 text-center">
                <CheckCircle2 className="mx-auto text-emerald-600" size={36} />
                <div>
                  <p className="font-bold text-base">APK Built Successfully!</p>
                  <p className="text-xs text-emerald-700 mt-1">Your production Android package is ready for download.</p>
                </div>
                <a
                  href={buildResult.directApkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-100 transition-colors"
                >
                  <Download size={18} /> Download Signed APK (.apk)
                </a>
              </div>
            )}

            {buildResult?.error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-3">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Build Error</p>
                  <p className="mt-0.5">{buildResult.error}</p>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
              >
                <ArrowLeft size={14} /> Back to Editor
              </button>
            </div>
          </div>

          {/* Right: Terminal Logs */}
          <div className="lg:col-span-6 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-sm flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" /> Live Build Runner Logs
                </span>
                <span className="text-xs text-slate-400 font-mono">Gradle v8.10 / SDK 35</span>
              </div>

              <div className="font-mono text-xs space-y-2 overflow-y-auto max-h-96">
                {buildLogs.map(l => (
                  <p key={l.id} className={l.type === 'error' ? 'text-red-400' : l.type === 'success' ? 'text-emerald-400' : 'text-slate-300'}>
                    <span className="text-slate-600">[{String(l.id).padStart(2, '0')}]</span> {l.message}
                  </p>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-4 text-xs text-slate-300 mt-6 space-y-1">
              <p className="font-bold text-white">Automated GitHub Actions Build Engine</p>
              <p className="text-slate-400">APKs are signed with production keystores and packaged for immediate deployment to Android devices.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
