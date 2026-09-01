const fs = require('fs');
let code = fs.readFileSync('.github/workflows/build.yml', 'utf8');

const target1 = `- name: Build signed debug APK
        run: gradle --no-daemon :app:assembleDebug`;

const replace1 = `- name: Build signed debug APK
        run: gradle --no-daemon --info :app:assembleDebug 2>&1 | tail -100`;

const target2 = `- name: Verify APK is valid and signed
        shell: bash
        run: |
          set -euo pipefail
          APK="app/build/outputs/apk/debug/app-debug.apk"
          test -f "$APK"
          SIZE=$(stat -c%s "$APK")
          echo "APK size: $SIZE bytes"
          if [ "$SIZE" -lt 10000 ]; then
            echo "APK is suspiciously small"
            exit 1
          fi
          command -v apksigner
          apksigner verify --verbose "$APK"
          unzip -t "$APK" >/dev/null
          echo "APK verification passed"`;

const replace2 = `- name: Verify APK is valid and signed
        shell: bash
        run: |
          set -euo pipefail
          APK="app/build/outputs/apk/debug/app-debug.apk"
          test -f "$APK"
          SIZE=$(stat -c%s "$APK")
          echo "APK size: $SIZE bytes"
          
          echo "APK contents:"
          unzip -l "$APK" | head -20
          
          if [ "$SIZE" -lt 100000 ]; then
            echo "ERROR: APK is suspiciously small (< 100KB)"
            echo "Build directory contents:"
            find app/build/outputs -type f -ls
            exit 1
          fi
          
          command -v apksigner
          apksigner verify --verbose "$APK"
          unzip -t "$APK" >/dev/null
          echo "APK verification passed"`;

code = code.replace(target1, replace1);
code = code.replace(target2, replace2);
fs.writeFileSync('.github/workflows/build.yml', code);
