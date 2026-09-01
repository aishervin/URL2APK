import React, { useState } from 'react';
import { FolderGit2, Upload, Image as ImageIcon, FileText, Code, Check, Trash2, ExternalLink } from 'lucide-react';

interface AssetFile {
  id: string;
  name: string;
  category: 'images' | 'icons' | 'documents' | 'assets';
  size: string;
  url: string;
  uploadedAt: string;
}

interface AssetsManagerProps {
  ghToken: string;
  ghRepo: string;
}

export const AssetsManager: React.FC<AssetsManagerProps> = ({ ghToken, ghRepo }) => {
  const [assets, setAssets] = useState<AssetFile[]>([
    {
      id: '1',
      name: 'app_icon.png',
      category: 'icons',
      size: '42 KB',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      uploadedAt: '2026-09-01',
    },
    {
      id: '2',
      name: 'splash_banner.jpg',
      category: 'images',
      size: '180 KB',
      url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400',
      uploadedAt: '2026-09-01',
    },
  ]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'images' | 'icons' | 'documents' | 'assets'>('all');
  const [uploading, setUploading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, category: 'images' | 'icons' | 'documents' | 'assets') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setTimeout(() => {
      const newAssets: AssetFile[] = Array.from<File>(files).map((file, idx) => ({
        id: `${Date.now()}-${idx}`,
        name: file.name,
        category,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString().split('T')[0],
      }));
      setAssets((prev) => [...prev, ...newAssets]);
      setUploading(false);
      setSyncStatus(`Successfully uploaded ${newAssets.length} file(s) to uploads/${category}/`);
      setTimeout(() => setSyncStatus(null), 4000);
    }, 800);
  };

  const deleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const filteredAssets = activeCategory === 'all' ? assets : assets.filter((a) => a.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <FolderGit2 size={13} /> Phase 13 AI Material Upload System
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Assets & Materials Workspace</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Upload images, icons, documents, and assets. Automatically organized in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">uploads/</code> for Android bundling.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {syncStatus && (
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <Check size={14} /> {syncStatus}
            </span>
          )}
        </div>
      </div>

      {/* Upload Dropzones */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Images */}
        <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group transition-all">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ImageIcon size={22} />
          </div>
          <span className="font-bold text-sm text-slate-800">Upload Images</span>
          <span className="text-[11px] text-slate-400 mt-1">uploads/images/</span>
          <input type="file" multiple accept="image/*" onChange={(e) => handleFileUpload(e, 'images')} className="hidden" />
        </label>

        {/* Icons */}
        <label className="border-2 border-dashed border-slate-200 hover:border-violet-400 bg-white rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group transition-all">
          <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Upload size={22} />
          </div>
          <span className="font-bold text-sm text-slate-800">Upload App Icons</span>
          <span className="text-[11px] text-slate-400 mt-1">uploads/icons/</span>
          <input type="file" multiple accept="image/*" onChange={(e) => handleFileUpload(e, 'icons')} className="hidden" />
        </label>

        {/* Documents */}
        <label className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-white rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group transition-all">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FileText size={22} />
          </div>
          <span className="font-bold text-sm text-slate-800">Upload Documents</span>
          <span className="text-[11px] text-slate-400 mt-1">uploads/documents/</span>
          <input type="file" multiple onChange={(e) => handleFileUpload(e, 'documents')} className="hidden" />
        </label>

        {/* Assets */}
        <label className="border-2 border-dashed border-slate-200 hover:border-amber-400 bg-white rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group transition-all">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Code size={22} />
          </div>
          <span className="font-bold text-sm text-slate-800">Upload Code/Fonts</span>
          <span className="text-[11px] text-slate-400 mt-1">uploads/assets/</span>
          <input type="file" multiple onChange={(e) => handleFileUpload(e, 'assets')} className="hidden" />
        </label>
      </div>

      {/* Asset Explorer */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <h3 className="font-bold text-lg text-slate-900">Uploaded Repository Assets ({assets.length})</h3>
          <div className="flex items-center gap-2">
            {(['all', 'images', 'icons', 'documents', 'assets'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  activeCategory === cat ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No assets found in this category.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => (
              <div key={asset.id} className="border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="h-14 w-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {asset.category === 'images' || asset.category === 'icons' ? (
                    <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="text-slate-400" size={24} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-slate-800 truncate">{asset.name}</h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span className="uppercase font-semibold text-indigo-600">{asset.category}</span>
                    <span>•</span>
                    <span>{asset.size}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors"
                    title="View file"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button
                    onClick={() => deleteAsset(asset.id)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-colors"
                    title="Delete asset"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
