import React, { useState } from 'react';
import { FileCode, Plus, Save, Trash2, Play, Sparkles, FileText, FileJson, Cpu } from 'lucide-react';
import type { ProjectFile } from '../types';

interface CodeEditorPanelProps {
  files: ProjectFile[];
  activeFile: ProjectFile | null;
  setActiveFile: (file: ProjectFile) => void;
  onUpdateFile: (path: string, content: string) => void;
  onCreateFile: (file: ProjectFile) => void;
  onDeleteFile: (path: string) => void;
  onAiAssist: (file: ProjectFile) => void;
}

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
  files,
  activeFile,
  setActiveFile,
  onUpdateFile,
  onCreateFile,
  onDeleteFile,
  onAiAssist,
}) => {
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<ProjectFile['type']>('html');
  const [showNewModal, setShowNewModal] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const path = `src/main/${newFileName.trim()}`;
    if (files.some((f) => f.path === path)) return;

    let defaultContent = '';
    if (newFileType === 'html') defaultContent = '<!DOCTYPE html>\n<html>\n<head>\n  <title>App</title>\n</head>\n<body>\n  <h1>Hello SHΞN DROID</h1>\n</body>\n</html>';
    if (newFileType === 'css') defaultContent = 'body { font-family: sans-serif; background: #f8fafc; }';
    if (newFileType === 'js' || newFileType === 'ts') defaultContent = 'console.log("SHΞN DROID App initialized");';
    if (newFileType === 'py') defaultContent = '# Python Helper Script\ndef main():\n    print("Hello from Python Runtime")\n\nif __name__ == "__main__":\n    main()';
    if (newFileType === 'json') defaultContent = '{\n  "version": "1.0.0"\n}';

    const newFile: ProjectFile = {
      path,
      name: newFileName.trim(),
      type: newFileType,
      content: defaultContent,
    };

    onCreateFile(newFile);
    setActiveFile(newFile);
    setNewFileName('');
    setShowNewModal(false);
  };

  const saveCurrent = () => {
    if (!activeFile) return;
    onUpdateFile(activeFile.path, activeFile.content);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)]">
      {/* Sidebar File Tree */}
      <div className="w-full lg:w-80 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-col shrink-0">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileCode size={18} className="text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Project Workspace</h3>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
            title="New File"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-1">
          {files.map((file) => {
            const isActive = activeFile?.path === file.path;
            return (
              <div
                key={file.path}
                onClick={() => setActiveFile(file)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {file.type === 'json' ? <FileJson size={14} /> : file.type === 'py' ? <Cpu size={14} /> : <FileText size={14} />}
                  <span className="truncate">{file.name}</span>
                </div>
                {files.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.path);
                    }}
                    className={`p-1 rounded opacity-60 hover:opacity-100 ${isActive ? 'text-white' : 'text-slate-400 hover:text-red-500'}`}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
          Supports HTML, CSS, JS, TS, Python, JSON
        </div>
      </div>

      {/* Main Editor & Preview Area */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {activeFile ? (
          <>
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-sm text-slate-800">{activeFile.path}</span>
                {savedNotice && <span className="text-xs text-emerald-600 font-semibold">Saved successfully</span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    previewMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Play size={13} /> {previewMode ? 'Editor' : 'Live Preview'}
                </button>
                <button
                  onClick={() => onAiAssist(activeFile)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-semibold border border-violet-200 transition-colors"
                >
                  <Sparkles size={13} /> Gemini AI Fix/Refine
                </button>
                <button
                  onClick={saveCurrent}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <Save size={13} /> Save File
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col relative overflow-hidden">
              {previewMode && activeFile.type === 'html' ? (
                <div className="flex-1 bg-white p-4">
                  <iframe
                    srcDoc={activeFile.content}
                    title="Live Preview"
                    className="w-full h-full border border-slate-200 rounded-2xl"
                    sandbox="allow-scripts"
                  />
                </div>
              ) : (
                <textarea
                  value={activeFile.content}
                  onChange={(e) => onUpdateFile(activeFile.path, e.target.value)}
                  className="flex-1 w-full p-6 font-mono text-xs sm:text-sm bg-slate-900 text-slate-100 outline-none resize-none leading-relaxed"
                  spellCheck={false}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Select a file from the workspace sidebar or create a new file.
          </div>
        )}
      </div>

      {/* New File Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold mb-4">Create New Project File</h3>
            <form onSubmit={handleCreateNew} className="space-y-4">
              <label className="block">
                <span className="block mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">File Name</span>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="index.html, script.py, styles.css"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </label>
              <label className="block">
                <span className="block mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">File Type</span>
                <select
                  value={newFileType}
                  onChange={(e) => setNewFileType(e.target.value as ProjectFile['type'])}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="js">JavaScript</option>
                  <option value="ts">TypeScript</option>
                  <option value="py">Python Script</option>
                  <option value="json">JSON Config</option>
                  <option value="asset">Asset / Other</option>
                </select>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
                >
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
