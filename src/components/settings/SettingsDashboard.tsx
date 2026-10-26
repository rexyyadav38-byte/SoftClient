import React, { useState } from 'react';
import { GameProfile, DeviceSpecs, ClientHudSettings } from '../../types/launcher';
import { generateOptimizedJvmArgs } from '../../services/deviceService';
import { 
  Settings, Cpu, HardDrive, Monitor, Sliders, Smartphone, ShieldCheck, Check, RotateCcw, Zap, Terminal 
} from 'lucide-react';

interface SettingsDashboardProps {
  activeProfile: GameProfile;
  deviceSpecs: DeviceSpecs;
  hudSettings: ClientHudSettings;
  onUpdateProfile: (updates: Partial<GameProfile>) => void;
  onUpdateHudSettings: (updates: Partial<ClientHudSettings>) => void;
}

export const SettingsDashboard: React.FC<SettingsDashboardProps> = ({
  activeProfile,
  deviceSpecs,
  hudSettings,
  onUpdateProfile,
  onUpdateHudSettings
}) => {
  const [activeTab, setActiveTab] = useState<'jvm' | 'graphics' | 'hud' | 'android'>('jvm');
  const [copiedJvm, setCopiedJvm] = useState<boolean>(false);

  const handleApplyPresetJvm = (preset: 'g1gc' | 'shenandoah' | 'zgc') => {
    let args = '';
    if (preset === 'g1gc') {
      args = generateOptimizedJvmArgs(activeProfile.allocatedRamMb, deviceSpecs.architecture);
    } else if (preset === 'shenandoah') {
      args = `-Xms${Math.floor(activeProfile.allocatedRamMb * 0.4)}M -Xmx${activeProfile.allocatedRamMb}M -XX:+UseShenandoahGC -XX:ShenandoahGCMode=iu -XX:+AlwaysPreTouch`;
    } else {
      args = `-Xms${Math.floor(activeProfile.allocatedRamMb * 0.4)}M -Xmx${activeProfile.allocatedRamMb}M -XX:+UseZGC -XX:+ZGenerational -XX:+AlwaysPreTouch`;
    }
    onUpdateProfile({ jvmArgs: args });
  };

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            Launcher & Android Settings
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Device: {deviceSpecs.model} · {deviceSpecs.os} ({deviceSpecs.architecture})
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2 mb-6 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('jvm')}
          className={`px-4 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'jvm' ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" /> Java & Memory (RAM)
        </button>
        <button
          onClick={() => setActiveTab('graphics')}
          className={`px-4 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'graphics' ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Monitor className="w-4 h-4" /> Renderer & Graphics
        </button>
        <button
          onClick={() => setActiveTab('hud')}
          className={`px-4 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'hud' ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" /> Client HUD Overlay
        </button>
        <button
          onClick={() => setActiveTab('android')}
          className={`px-4 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'android' ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4" /> Device Diagnostics
        </button>
      </div>

      {/* Tab 1: JVM & Memory */}
      {activeTab === 'jvm' && (
        <div className="space-y-6 max-w-3xl">
          {/* RAM Allocation */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-white text-sm">Allocated RAM to Minecraft</h4>
                <p className="text-xs text-slate-400">
                  Total Device RAM: <span className="text-cyan-300 font-mono">{deviceSpecs.totalRamMb} MB</span>
                </p>
              </div>
              <span className="text-lg font-mono font-black text-cyan-400 px-3 py-1 bg-cyan-950/70 rounded-xl border border-cyan-500/30">
                {activeProfile.allocatedRamMb} MB
              </span>
            </div>

            <input
              type="range"
              min="1024"
              max={Math.min(deviceSpecs.totalRamMb - 1024, 8192)}
              step="256"
              value={activeProfile.allocatedRamMb}
              onChange={(e) => onUpdateProfile({ allocatedRamMb: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />

            {/* RAM Safety status notice */}
            <div className="flex items-center gap-2 text-xs p-2.5 rounded-xl bg-slate-950 border border-white/5 font-mono">
              <span className={`w-2.5 h-2.5 rounded-full ${
                activeProfile.allocatedRamMb <= deviceSpecs.recommendedRamMb ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              <span className="text-slate-300">
                {activeProfile.allocatedRamMb <= deviceSpecs.recommendedRamMb
                  ? `Safe Android range (<= ${deviceSpecs.recommendedRamMb}MB). Background tasks and notifications will run stably.`
                  : 'High allocation warning: May cause Android system Low-Memory Killer (LMK) to stop background apps.'}
              </span>
            </div>
          </div>

          {/* Java Runtime Selector */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 space-y-4">
            <div>
              <h4 className="font-bold text-white text-sm mb-1">Installed Java Runtime (JVM)</h4>
              <p className="text-xs text-slate-400">
                Softly Client bundles genuine OpenJDK binaries compiled for ARM64 and x86_64 Android.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'java-21', name: 'OpenJDK 21 LTS', desc: 'Required for 1.20.5+ & 1.21.x' },
                { id: 'java-17', name: 'OpenJDK 17 LTS', desc: 'Standard for 1.17 to 1.20.4' },
                { id: 'java-8', name: 'OpenJDK 8u412', desc: 'Fastest for 1.8.9 & 1.12.2' }
              ].map(j => (
                <button
                  key={j.id}
                  onClick={() => onUpdateProfile({ javaRuntime: j.id as any })}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    activeProfile.javaRuntime === j.id
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'border-white/5 bg-slate-950/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <p className="font-bold text-white text-xs">{j.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{j.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* JVM Flags */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-white text-sm">Custom JVM Launch Arguments</h4>
                <p className="text-xs text-slate-400">Tuned garbage collection flags for mobile CPUs</p>
              </div>

              <div className="flex gap-1.5 text-xs">
                <button
                  onClick={() => handleApplyPresetJvm('g1gc')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium"
                >
                  G1GC Mobile
                </button>
                <button
                  onClick={() => handleApplyPresetJvm('shenandoah')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium"
                >
                  Shenandoah
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={activeProfile.jvmArgs}
              onChange={(e) => onUpdateProfile({ jvmArgs: e.target.value })}
              className="w-full bg-slate-950 p-3 rounded-xl border border-white/10 font-mono text-xs text-cyan-300/90 outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      )}

      {/* Tab 2: Graphics & Renderer */}
      {activeTab === 'graphics' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 space-y-4">
            <h4 className="font-bold text-white text-sm">OpenGL Graphics Backend</h4>
            <p className="text-xs text-slate-400">
              Select the rendering translator for your device GPU driver (Adreno / Mali).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'gl4es', title: 'GL4ES 1.1.5 (Recommended)', desc: 'Translates OpenGL 2.1 to OpenGLES 2.0. Maximum FPS on Snapdragon Adreno.' },
                { id: 'zink', title: 'Zink Vulkan (Mesa 24.2)', desc: 'Translates full OpenGL 4.6 to Vulkan 1.3. Supports modern shader packs.' },
                { id: 'virgl', title: 'VirGL Renderer', desc: 'Hardware virtualized renderer for compatible kernels.' },
                { id: 'angle', title: 'Google ANGLE', desc: 'Direct GLES translation layer with strict conformance.' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => onUpdateProfile({ renderer: r.id as any })}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    activeProfile.renderer === r.id
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'border-white/5 bg-slate-950/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <p className="font-bold text-white text-xs">{r.title}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-1 leading-snug">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution Scaling */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-white text-sm">In-Game Resolution Scaling</h4>
                <p className="text-xs text-slate-400">Lower scaling provides massive FPS boosts on 1080p+ mobile screens</p>
              </div>
              <span className="text-sm font-mono font-bold text-cyan-400">{activeProfile.resolutionScale}%</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[60, 75, 100, 125].map(scale => (
                <button
                  key={scale}
                  onClick={() => onUpdateProfile({ resolutionScale: scale })}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    activeProfile.resolutionScale === scale
                      ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300'
                      : 'border-white/5 bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {scale}% {scale === 75 ? '(Balanced)' : scale === 100 ? '(Native)' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Client HUD Settings */}
      {activeTab === 'hud' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 space-y-4">
            <h4 className="font-bold text-white text-sm">Feather & Lunar Style In-Game HUD Elements</h4>
            <p className="text-xs text-slate-400">Toggle client mods overlays rendered directly in the game loop</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'showFps', label: 'FPS & Frame Time Counter', desc: 'Displays real-time render performance' },
                { key: 'showKeystrokes', label: 'Keystrokes (WASD & Space)', desc: 'Visual press feedback with glowing keys' },
                { key: 'showCps', label: 'Clicks Per Second (CPS)', desc: 'Real-time LMB & RMB click speed meter' },
                { key: 'showCoords', label: 'Coordinates (XYZ & Facing)', desc: 'Compass orientation and block position' },
                { key: 'showArmor', label: 'Armor & Durability Status', desc: 'Equipped gear with remaining percentage' },
              ].map(item => {
                const isEnabled = (hudSettings as any)[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => onUpdateHudSettings({ [item.key]: !isEnabled })}
                    className={`p-3.5 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${
                      isEnabled
                        ? 'border-cyan-400/50 bg-cyan-950/30'
                        : 'border-white/5 bg-slate-950/50 opacity-70'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{item.label}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{item.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                      isEnabled ? 'bg-cyan-500 border-cyan-400 text-black' : 'border-slate-700 bg-slate-900'
                    }`}>
                      {isEnabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Crosshair Selector */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 space-y-3">
            <h4 className="font-bold text-white text-sm">Custom Crosshair Style</h4>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'classic', label: 'Classic Plus (+)' },
                { id: 'dot', label: 'Precise Dot (•)' },
                { id: 'circle', label: 'Hollow Circle (○)' },
                { id: 'plus', label: 'Crosshair' }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => onUpdateHudSettings({ crosshairStyle: c.id as any })}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    hudSettings.crosshairStyle === c.id
                      ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300'
                      : 'border-white/5 bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Android Diagnostics */}
      {activeTab === 'android' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 space-y-4">
            <h4 className="font-bold text-white text-sm">Android Hardware & Runtime Environment</h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-500 text-[10px] block">CPU Architecture</span>
                <span className="font-bold text-white">{deviceSpecs.architecture}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-500 text-[10px] block">CPU Cores</span>
                <span className="font-bold text-white">{deviceSpecs.cpuCores} Threads</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-500 text-[10px] block">Total Physical RAM</span>
                <span className="font-bold text-cyan-300">{deviceSpecs.totalRamMb} MB</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-500 text-[10px] block">GPU Driver Probe</span>
                <span className="font-bold text-slate-200 line-clamp-1">{deviceSpecs.gpuRenderer}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-500 text-[10px] block">Thermal Status</span>
                <span className="font-bold text-emerald-400 uppercase">{deviceSpecs.thermalStatus}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-500 text-[10px] block">Free Storage</span>
                <span className="font-bold text-slate-200">{deviceSpecs.storageFreeGb} GB Free</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 space-y-2">
            <h4 className="font-bold text-white text-sm">PojavLauncher Compatibility Notes</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Softly Client configuration folders and control maps are 100% interoperable with PojavLauncher, Zalith Launcher 2, and Mj Launcher. Game directories default to:
              <br />
              <code className="text-cyan-300 font-mono text-[11px]">/sdcard/Android/data/net.kdt.pojavlaunch/files/.minecraft/</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
