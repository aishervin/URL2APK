const fs = require('fs');
let code = fs.readFileSync('myrepo/src/App.tsx', 'utf8');

const targetStr = "{result.downloadUrl && <a href={result.downloadUrl} target=\"_blank\" rel=\"noreferrer\" className=\"ml-4 inline-flex items-center gap-1 mt-2 text-sm font-bold text-emerald-700 hover:underline\"><Download size={14}/> Download artifact</a>}";

const replaceStr = `{result.directApkUrl && <a href={result.directApkUrl} target="_blank" rel="noreferrer" className="ml-4 inline-flex items-center gap-1 mt-2 text-sm font-bold text-emerald-700 hover:underline"><Download size={14}/> Download APK</a>}{result.downloadUrl && <a href={result.downloadUrl} target="_blank" rel="noreferrer" className="ml-4 inline-flex items-center gap-1 mt-2 text-sm font-medium text-emerald-600 opacity-80 hover:underline"><Download size={14}/> Backup ZIP</a>}`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('myrepo/src/App.tsx', code);
fs.writeFileSync('src/App.tsx', code);
