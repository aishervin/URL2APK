from pathlib import Path
package = 'test'
Path('settings.gradle').write_text("pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }\n" +
          "dependencyResolutionManagement { repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS); repositories { google(); mavenCentral() } }\n" +
          "rootProject.name='URL2APK'\n" +
          "include ':app'\n", encoding='utf-8')
