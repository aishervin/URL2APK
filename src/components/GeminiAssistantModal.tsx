import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Key, RefreshCw, Check, Code, Play, CheckCircle2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import type { ProjectFile } from '../types';

interface ParsedFile {
  path: string;
  content: string;
}

interface Message {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  parsedFiles?: ParsedFile[];
  applied?: boolean;
}

interface GeminiAssistantModalProps {
  geminiKey: string;
  onUpdateKey: (key: string) => void;
  files: ProjectFile[];
  onUpdateFile: (path: string, content: string) => void;
  onCreateFile: (file: ProjectFile) => void;
  onNavigateToEditor: () => void;
  onNavigateToBuild: () => void;
}

export const GeminiAssistantModal: React.FC<GeminiAssistantModalProps> = ({
  geminiKey,
  onUpdateKey,
  files,
  onUpdateFile,
  onCreateFile,
  onNavigateToEditor,
  onNavigateToBuild,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(geminiKey);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [models, setModels] = useState<string[]>([
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-3.5-flash-lite',
  ]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'gemini',
      text: 'Hello! I am your SHΞN™DROID Android & Web Development Expert powered by Google Gemini. Ask me to build an app (e.g. "Create a cryptocurrency tracker app with HTML, CSS, and JS"), fix Gradle errors, or optimize your WebView project. I will automatically generate the files and apply them to your workspace!',
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [keySavedMsg, setKeySavedMsg] = useState(false);

  useEffect(() => {
    if (geminiKey) {
      fetchModels(geminiKey);
    }
  }, [geminiKey]);

  const fetchModels = async (key: string) => {
    setLoadingModels(true);
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.list();
      const list: string[] = [];
      for await (const model of response) {
        if (model.name && model.name.includes('gemini')) {
          list.push(model.name.replace('models/', ''));
        }
      }
      if (list.length > 0) {
        setModels(list);
        if (!list.includes(selectedModel)) {
          setSelectedModel(list[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch Gemini models:', err);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateKey(apiKeyInput.trim());
    localStorage.setItem('shendroid_gemini_key', apiKeyInput.trim());
    setKeySavedMsg(true);
    setTimeout(() => setKeySavedMsg(false), 3000);
    if (apiKeyInput.trim()) {
      fetchModels(apiKeyInput.trim());
    }
  };

  const parseFilesFromText = (text: string): ParsedFile[] => {
    const results: ParsedFile[] = [];
    const regex = /```(?:file:)?([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push({ path: match[1], content: match[2].trim() });
    }
    return results;
  };

  const applyGeneratedFiles = (msgId: string, parsedFiles: ParsedFile[]) => {
    parsedFiles.forEach((pf) => {
      const existing = files.find((f) => f.path === pf.path);
      const ext = pf.path.split('.').pop() || 'txt';
      const fileType = (['html', 'css', 'js', 'ts', 'py', 'json'].includes(ext) ? ext : 'other') as ProjectFile['type'];

      if (existing) {
        onUpdateFile(pf.path, pf.content);
      } else {
        onCreateFile({
          path: pf.path,
          name: pf.path.split('/').pop() || pf.path,
          type: fileType,
          content: pf.content,
          isModified: true,
        });
      }
    });

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, applied: true } : m))
    );
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || thinking) return;
    if (!geminiKey) {
      alert('Please enter your Gemini API Key first.');
      return;
    }

    const userText = input.trim();
    setInput('');
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: userText };
    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);

    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are SHΞN DROID AI, an expert Android developer, Gradle specialist, WebView hybrid architect, and full-stack master. 
When the user asks you to create or build an app, generate complete functional code and output each file using code blocks with file paths like \`\`\`file:src/index.html ... \`\`\` or \`\`\`file:src/app.js ... \`\`\`. 
These files will be automatically parsed and applied to the user's Android Studio workspace!
Current project files: ${files.map(f => f.path).join(', ')}

User Request: ${userText}`,
              },
            ],
          },
        ],
      });

      const replyText = response.text || 'I analyzed your request. Let me know if you need any further Android code modifications.';
      const parsedFiles = parseFilesFromText(replyText);

      const geminiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'gemini',
        text: replyText,
        parsedFiles: parsedFiles.length > 0 ? parsedFiles : undefined,
      };
      setMessages((prev) => [...prev, geminiMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'gemini',
        text: `Error communicating with Gemini API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 grid lg:grid-cols-12 gap-6 h-[calc(100vh-6rem)]">
      {/* Configuration Column */}
      <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Gemini Action Agent</h3>
              <p className="text-xs text-slate-500">Phase 11 & Autonomous Builder</p>
            </div>
          </div>

          <form onSubmit={handleSaveKey} className="space-y-4">
            <label className="block">
              <span className="flex items-center gap-1.5 mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Key size={14} /> Gemini API Key
              </span>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              />
            </label>
            <div className="flex items-center justify-between">
              {keySavedMsg && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Check size={14} /> Key saved</span>}
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm ml-auto"
              >
                Save & Connect
              </button>
            </div>
          </form>

          {geminiKey && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Gemini Model</span>
                {loadingModels && <RefreshCw size={14} className="animate-spin text-indigo-600" />}
              </div>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
              >
                {models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                Gemini automatically parses code blocks and updates your Studio workspace files instantly.
              </p>
            </div>
          )}
        </div>

        <div className="bg-indigo-50 rounded-2xl p-4 text-xs text-indigo-900 mt-6 space-y-2">
          <p className="font-bold">Autonomous App Creation</p>
          <div className="flex gap-2">
            <button
              onClick={onNavigateToEditor}
              className="flex-1 py-2 bg-white hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl border border-indigo-200 text-center transition-colors"
            >
              Open Editor
            </button>
            <button
              onClick={onNavigateToBuild}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-center transition-colors"
            >
              Build APK
            </button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-indigo-600" />
            <span className="font-bold text-sm text-slate-800">SHΞN DROID Action Agent ({selectedModel})</span>
          </div>
          <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Ready to Create Files</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'gemini' && (
                <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
              )}
              <div
                className={`max-w-2xl rounded-2xl px-5 py-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none font-mono space-y-3'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {msg.parsedFiles && msg.parsedFiles.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200 bg-white/80 p-4 rounded-xl space-y-3 text-slate-900">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5 text-indigo-700">
                        <Code size={14} /> {msg.parsedFiles.length} Generated Workspace File{msg.parsedFiles.length > 1 ? 's' : ''}
                      </span>
                      {msg.applied ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 size={13} /> Applied to Workspace
                        </span>
                      ) : (
                        <button
                          onClick={() => applyGeneratedFiles(msg.id, msg.parsedFiles!)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
                        >
                          <Sparkles size={13} /> Apply Files to Studio Workspace
                        </button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {msg.parsedFiles.map((pf) => (
                        <div key={pf.path} className="text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between font-mono">
                          <span className="font-semibold text-indigo-600">📁 {pf.path}</span>
                          <span className="text-slate-400">({pf.content.split('\n').length} lines)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {msg.sender === 'user' && (
                <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}
          {thinking && (
            <div className="flex gap-3 items-center text-slate-400 text-xs italic">
              <Bot size={16} className="animate-spin text-indigo-600" /> Gemini is generating app files & structuring workspace...
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={geminiKey ? 'Describe the app to build (e.g., "Create a crypto tracker with index.html and app.js")...' : 'Please configure Gemini API key first...'}
            disabled={!geminiKey || thinking}
            className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!geminiKey || thinking || !input.trim()}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            <Send size={16} /> Send & Generate
          </button>
        </form>
      </div>
    </div>
  );
};
