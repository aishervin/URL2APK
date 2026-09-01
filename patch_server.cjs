const fs = require('fs');
let code = fs.readFileSync('myrepo/server.ts', 'utf8');

code = code.replace(/attachment; filename=app-release.zip/g, 'attachment; filename=URL2APK.zip');

const targetStr = "downloadUrl, artifactId: artifact.id, runId, runUrl: run.html_url });";
const replacementStr = "downloadUrl, directApkUrl: `https://raw.githubusercontent.com/${GITHUB_REPO}/main/downloads/URL2APK-latest.apk`, artifactId: artifact.id, runId, runUrl: run.html_url });";

code = code.replace(targetStr, replacementStr);

fs.writeFileSync('myrepo/server.ts', code);
fs.writeFileSync('server.ts', code);
