const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /}\nstartServer\(\);\napp\.listen\(PORT, '0\.0\.0\.0', \(\) => console\.log\(`URL2APK server listening on port \$\{PORT\}`\)\);/,
  "  app.listen(PORT, '0.0.0.0', () => console.log(`URL2APK server listening on port ${PORT}`));\n}\nstartServer();"
);

fs.writeFileSync('server.ts', code);
