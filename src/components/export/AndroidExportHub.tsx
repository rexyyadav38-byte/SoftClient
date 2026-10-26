import React, { useState } from 'react';
import { PojavControlLayout, GameProfile, DeviceSpecs } from '../../types/launcher';
import { exportPojavJson } from '../../services/controlsService';
import { 
  Smartphone, Download, FileCode, Check, Copy, Terminal, ExternalLink, ShieldCheck, Box 
} from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface AndroidExportHubProps {
  layout: PojavControlLayout;
  activeProfile: GameProfile;
  deviceSpecs: DeviceSpecs;
}

export const AndroidExportHub: React.FC<AndroidExportHubProps> = ({
  layout,
  activeProfile,
  deviceSpecs
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadFullConfig = () => {
    const bundle = {
      launcher: 'Softly Client Android v2.4.0',
      deviceTarget: deviceSpecs.architecture,
      profile: activeProfile,
      pojavControlMap: JSON.parse(exportPojavJson(layout)),
      jvmConfig: {
        runtime: activeProfile.javaRuntime,
        ramMb: activeProfile.allocatedRamMb,
        args: activeProfile.jvmArgs,
        renderer: activeProfile.renderer
      }
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `softly_client_android_profile.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const gradleSnippet = `// Android build.gradle.kts for Softly Client & PojavLauncher Core
android {
    namespace = "net.softly.client.launcher"
    compileSdk = 34

    defaultConfig {
        applicationId = "net.softly.client.launcher"
        minSdk = 26 // Android 8.0+
        targetSdk = 34 // Android 14
        versionCode = 240
        versionName = "2.4.0-arm64"
        
        ndk {
            abiFilters.addAll(listOf("arm64-v8a", "x86_64"))
        }
    }
    
    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
            signingConfig = signingConfigs.getByName("release")
        }
    }
}`;

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            Android APK & Pojav Export Hub
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Deploy Softly Client configurations to your Android device
          </p>
        </div>

        <button
          onClick={handleDownloadFullConfig}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/30"
        >
          <Download className="w-4 h-4" />
          Export All Profiles & Controls Bundle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        {/* Card 1: PojavLauncher Direct Integration */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-cyan-950 rounded-xl border border-cyan-500/30 text-cyan-400">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Direct Pojav / Zalith Launcher Setup</h3>
              <p className="text-[11px] text-slate-400 font-mono">Instant installation without rooting</p>
            </div>
          </div>

          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>1. Copy your exported Softly control map JSON to:</p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-white/10 font-mono text-cyan-300 text-[11px] select-all flex justify-between items-center">
              <span>/sdcard/games/PojavLauncher/controlmap/</span>
              <button
                onClick={() => handleCopy('/sdcard/games/PojavLauncher/controlmap/', 'path1')}
                className="text-slate-400 hover:text-white"
              >
                {copiedType === 'path1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p>2. Softly JVM Flags for Snapdragon ARM64:</p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-white/10 font-mono text-slate-300 text-[10px] break-all select-all flex justify-between items-center">
              <span>-XX:+UseG1GC -XX:MaxGCPauseMillis=20 -Xmx{activeProfile.allocatedRamMb}M</span>
              <button
                onClick={() => handleCopy(`-XX:+UseG1GC -XX:MaxGCPauseMillis=20 -Xmx${activeProfile.allocatedRamMb}M`, 'jvm')}
                className="text-slate-400 hover:text-white"
              >
                {copiedType === 'jvm' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p>3. Select <strong className="text-white">GL4ES 1.1.5</strong> or <strong className="text-white">Zink Vulkan</strong> under Video & Renderer in Pojav settings.</p>
          </div>
        </div>

        {/* Card 2: Native Android APK Compilation Blueprint */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-950 rounded-xl border border-indigo-500/30 text-indigo-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Standalone Android APK Architecture</h3>
              <p className="text-[11px] text-slate-400 font-mono">Gradle & JNI native build configuration</p>
            </div>
          </div>

          <div className="relative">
            <pre className="bg-slate-950 p-3 rounded-xl border border-white/10 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-44">
              {gradleSnippet}
            </pre>
            <button
              onClick={() => handleCopy(gradleSnippet, 'gradle')}
              className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-300"
            >
              {copiedType === 'gradle' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Target: Android 14 (API 34) · ARM64-v8a ABI verified</span>
          </div>
        </div>

        {/* Card 3: PWA to Android APK (Bubblewrap / TWA) */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-cyan-500/30 shadow-xl space-y-4 md:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-cyan-950 rounded-xl border border-cyan-500/30 text-cyan-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Production PWA & One-Click Android APK (Bubblewrap / TWA)</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Google Trusted Web Activity standard · Standalone full-screen Android app
                </p>
              </div>
            </div>

            <PWAInstallButton showAlwaysForManual={true} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1">
              <span className="text-slate-500 text-[10px] block">Web App Manifest</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> standalone · id: /
              </span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1">
              <span className="text-slate-500 text-[10px] block">Android Icons</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 192px · 512px · Maskable
              </span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1">
              <span className="text-slate-500 text-[10px] block">Offline Service Worker</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Workbox CacheActive
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <p className="text-[11px] text-slate-400">
              To build a signed release <code className="text-cyan-300 font-mono">.apk</code> or <code className="text-cyan-300 font-mono">.aab</code> for Google Play with Bubblewrap CLI:
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-white/10 font-mono text-[11px] text-cyan-300 select-all space-y-1">
              <p># 1. Install Google Bubblewrap CLI</p>
              <p className="text-white">npm install -g @bubblewrap/cli</p>
              <p className="pt-1"># 2. Initialize project from your live PWA manifest</p>
              <p className="text-white">bubblewrap init --manifest={window.location.origin}/manifest.webmanifest</p>
              <p className="pt-1"># 3. Generate signed Android APK</p>
              <p className="text-white">bubblewrap build</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
