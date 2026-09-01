const fs = require('fs');
let code = fs.readFileSync('myrepo/.github/workflows/build.yml', 'utf8');

code = code.replace(
  '          Path(\'settings.gradle\').write_text("""pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }\ndependencyResolutionManagement { repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS); repositories { google(); mavenCentral() } }\nrootProject.name=\'URL2APK\'\ninclude \':app\'\n""", encoding=\'utf-8\')',
  '          Path(\'settings.gradle\').write_text("pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }\\n" +\n          "dependencyResolutionManagement { repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS); repositories { google(); mavenCentral() } }\\n" +\n          "rootProject.name=\'URL2APK\'\\n" +\n          "include \':app\'\\n", encoding=\'utf-8\')'
);

fs.writeFileSync('myrepo/.github/workflows/build.yml', code);
