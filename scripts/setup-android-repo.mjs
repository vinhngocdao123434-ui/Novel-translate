import fs from 'fs';
import path from 'path';
import { NATIVE_PROJECT_FILES } from '../src/native-project-data.ts';

const rootDir = process.cwd();
const androidDir = path.join(rootDir, 'android');
const githubWorkflowsDir = path.join(rootDir, '.github', 'workflows');

// Ensure base directories exist
fs.mkdirSync(androidDir, { recursive: true });
fs.mkdirSync(githubWorkflowsDir, { recursive: true });
fs.mkdirSync(path.join(androidDir, 'gradle', 'wrapper'), { recursive: true });

// 1. Settings.gradle (Modern & conflict-free)
const settingsGradleContent = `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "DroidTranslator"
include ':app'
`;

// 2. Root build.gradle (AGP 8.4.2)
const rootBuildGradleContent = `plugins {
    id 'com.android.application' version '8.4.2' apply false
}

tasks.register('clean', Delete) {
    delete rootProject.layout.buildDirectory
}
`;

// 3. gradle.properties
const gradlePropertiesContent = `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
`;

// 4. gradle-wrapper.properties
const gradleWrapperPropsContent = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;

// 5. app/build.gradle
const appBuildGradleContent = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.droidtranslator.app'
    compileSdk 34

    defaultConfig {
        applicationId "com.droidtranslator.app"
        minSdk 26
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            debuggable true
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'com.google.android.material:material:1.12.0'
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'com.google.code.gson:gson:2.11.0'
}
`;

// 6. GitHub Actions Workflow (.github/workflows/build-apk.yml)
const githubWorkflowContent = `name: Build Android APK

on:
  push:
    branches: [ main, master, '**' ]
    tags:
      - 'v*'
  pull_request:
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build:
    name: Build Debug APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Gradle 8.7
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.7'
          cache-read-only: false

      - name: Make Gradlew Executable
        run: |
          if [ -f android/gradlew ]; then
            chmod +x android/gradlew
          fi

      - name: Build Debug APK with Gradle
        run: |
          cd android
          if [ -f ./gradlew ]; then
            ./gradlew assembleDebug --no-daemon --stacktrace
          else
            gradle assembleDebug --no-daemon --stacktrace
          fi

      - name: Locate Generated APK
        id: find_apk
        run: |
          APK_PATH=$(find android/app/build/outputs/apk/debug -name "*.apk" | head -n 1)
          if [ -z "$APK_PATH" ]; then
            echo "Error: APK not found!"
            exit 1
          fi
          echo "Found APK: $APK_PATH"
          echo "apk_path=$APK_PATH" >> $GITHUB_OUTPUT

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: DroidTranslator-Debug-APK
          path: \${{ steps.find_apk.outputs.apk_path }}
          retention-days: 30

      - name: Create GitHub Release
        if: startsWith(github.ref, 'refs/tags/v')
        uses: softprops/action-gh-release@v2
        with:
          files: \${{ steps.find_apk.outputs.apk_path }}
          name: Release \${{ github.ref_name }}
          generate_release_notes: true
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;

// Write core configuration files
fs.writeFileSync(path.join(androidDir, 'settings.gradle'), settingsGradleContent, 'utf8');
fs.writeFileSync(path.join(androidDir, 'build.gradle'), rootBuildGradleContent, 'utf8');
fs.writeFileSync(path.join(androidDir, 'gradle.properties'), gradlePropertiesContent, 'utf8');
fs.writeFileSync(path.join(androidDir, 'gradle', 'wrapper', 'gradle-wrapper.properties'), gradleWrapperPropsContent, 'utf8');
fs.writeFileSync(path.join(githubWorkflowsDir, 'build-apk.yml'), githubWorkflowContent, 'utf8');

// Write app build.gradle and other files from NATIVE_PROJECT_FILES
let writtenCount = 0;
for (const file of NATIVE_PROJECT_FILES) {
  if (file.path.startsWith('.github/')) {
    continue; // handled directly
  }

  let targetRelative = file.path;
  let fileContent = file.content;

  if (targetRelative === 'build.gradle' || targetRelative === 'settings.gradle' || targetRelative === 'gradle.properties') {
    continue; // already written with optimal configs above
  }

  if (targetRelative === 'app/build.gradle') {
    fileContent = appBuildGradleContent;
  }

  const destPath = path.join(androidDir, targetRelative);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, fileContent, 'utf8');
  writtenCount++;
}

console.log(`Successfully generated Android structure with ${writtenCount} files.`);
