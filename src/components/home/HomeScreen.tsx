import React from 'react';
import { GameProfile, UserAccount, MinecraftVersion } from '../../types/launcher';
import { 
  Play, Sparkles, Sliders, Layers, Cpu, ShieldCheck, ChevronRight, Zap, RefreshCw, Terminal, ExternalLink 
} from 'lucide-react';

interface HomeScreenProps {
  activeProfile: GameProfile;
  activeAccount: UserAccount;
  version: MinecraftVersion;
  onLaunchGame: () => void;
  isLaunching: boolean;
  launchStep: string;
  onOpenVersions: () => void;
  onOpenControls: () => void;
  onOpenMods: () => void;
  onOpenAccounts: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  activeProfile,
  activeAccount,
  version,
  onLaunchGame,
  isLaunching,
  launchStep,
  onOpenVersions,
  onOpenControls,
  onOpenMods,
  onOpenAccounts
}) => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-8 overflow-y-auto select-none">
      {/* Background Cinematic Atmosphere */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 bg-cover bg-center"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, rgba(6,182,212,0.15) 0%, transparent 70%), linear-gradient(to bottom, rgba(12,14,20,0.6) 0%, #0c0e14 100%)`
        }}
      />

      {/* Floating subtle particle dots */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #38bdf8 1.5px, transparent 1.5px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Top Section: Branding & Profile Chip */}
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold mb-2 shadow-lg">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SOFTLY CLIENT · ANDROID EDITION</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
            MINECRAFT <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">JAVA</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
            High-Performance Launcher for Android · Pojav Engine Interop
          </p>
        </div>

        {/* User Account Card */}
        <div 
          onClick={onOpenAccounts}
          className="feather-card p-2.5 sm:px-4 sm:py-2.5 rounded-2xl cursor-pointer hover:border-cyan-500/50 transition-all flex items-center gap-3 shadow-xl group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-indigo-800 flex items-center justify-center font-black text-white text-sm shadow-md">
            {activeAccount.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-cyan-300 transition-colors">
              {activeAccount.username}
              {activeAccount.type === 'microsoft' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="text-[9px] px-1 bg-amber-950 text-amber-400 rounded">OFFLINE</span>
              )}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">Change Skin & Cape</p>
          </div>
        </div>
      </div>

      {/* Middle Center: News & Quick Specs Bar */}
      <div className="relative z-10 my-4 sm:my-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Banner 1: Fast Launch Info */}
        <div className="feather-card p-4 rounded-2xl border border-white/10 flex items-center gap-3.5 shadow-lg">
          <div className="p-3 bg-cyan-950/80 rounded-xl border border-cyan-500/30 text-cyan-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Sodium & Iris Pre-loaded</h4>
            <p className="text-[11px] text-slate-400 font-mono">120+ FPS on ARM64 Snapdragon & Mali</p>
          </div>
        </div>

        {/* Banner 2: Controls */}
        <div 
          onClick={onOpenControls}
          className="feather-card p-4 rounded-2xl border border-white/10 flex items-center justify-between cursor-pointer hover:border-cyan-500/40 transition-all shadow-lg group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-950/80 rounded-xl border border-indigo-500/30 text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                Touch Controls Editor
              </h4>
              <p className="text-[11px] text-slate-400 font-mono">Pojav-Compatible Virtual Pad</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
        </div>

        {/* Banner 3: Mods */}
        <div 
          onClick={onOpenMods}
          className="feather-card p-4 rounded-2xl border border-white/10 flex items-center justify-between cursor-pointer hover:border-cyan-500/40 transition-all shadow-lg group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-950/80 rounded-xl border border-purple-500/30 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                Mods & Shaders
              </h4>
              <p className="text-[11px] text-slate-400 font-mono">7 Mobile-Tuned Mods Active</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
        </div>
      </div>

      {/* Bottom Main Action Bar: Profile Selector + Big Launch Button */}
      <div className="relative z-10 feather-card p-4 sm:p-5 rounded-2xl border border-white/15 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Active Profile Info */}
        <div 
          onClick={onOpenVersions}
          className="w-full md:w-auto flex items-center gap-4 cursor-pointer p-2 rounded-xl hover:bg-slate-800/40 transition-colors group"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
            {activeProfile.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                {activeProfile.name}
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase">
                {activeProfile.modLoader}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Minecraft {activeProfile.versionId} · {activeProfile.allocatedRamMb}MB RAM · {activeProfile.javaRuntime.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Big Launch Button */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onLaunchGame}
            disabled={isLaunching}
            className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl ${
              isLaunching
                ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 cursor-wait'
                : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isLaunching ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                <span className="font-mono text-xs text-cyan-200">{launchStep}</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>PLAY MINECRAFT JAVA</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
