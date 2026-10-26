import React, { useState } from 'react';
import { MinecraftVersion, GameProfile, ModLoader } from '../../types/launcher';
import { 
  Layers, Download, Check, Sparkles, AlertCircle, Cpu, HardDrive, RefreshCw, Plus, Edit3, Trash2 
} from 'lucide-react';

interface VersionManagerProps {
  versions: MinecraftVersion[];
  profiles: GameProfile[];
  activeProfile: GameProfile;
  onSelectProfile: (profile: GameProfile) => void;
  onCreateProfile: (profile: GameProfile) => void;
  onInstallVersion: (versionId: string) => Promise<void>;
  installingVersionId: string | null;
  installProgress: { step: string; percent: number } | null;
}

export const VersionManager: React.FC<VersionManagerProps> = ({
  versions,
  profiles,
  activeProfile,
  onSelectProfile,
  onCreateProfile,
  onInstallVersion,
  installingVersionId,
  installProgress
}) => {
  const [tab, setTab] = useState<'profiles' | 'releases' | 'snapshots'>('profiles');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newProfileName, setNewProfileName] = useState<string>('Custom 1.21.4 (Optimized)');
  const [selectedVerId, setSelectedVerId] = useState<string>('1.21.4');
  const [selectedLoader, setSelectedLoader] = useState<ModLoader>('fabric');
  const [ramMb, setRamMb] = useState<number>(3584);

  const filteredVersions = versions.filter(v => {
    if (tab === 'releases') return v.type === 'release';
    if (tab === 'snapshots') return v.type === 'snapshot';
    return true;
  });

  const handleSaveProfile = () => {
    const newProf: GameProfile = {
      id: `prof_${Date.now()}`,
      name: newProfileName,
      versionId: selectedVerId,
      modLoader: selectedLoader,
      javaRuntime: selectedVerId.startsWith('1.8') || selectedVerId.startsWith('1.16') ? 'java-8' : selectedVerId >= '1.20.5' ? 'java-21' : 'java-17',
      allocatedRamMb: ramMb,
      jvmArgs: '-XX:+UseG1GC -XX:MaxGCPauseMillis=20',
      resolutionScale: 100,
      controlLayoutId: 'pojav_default',
      icon: '💎',
      renderer: 'gl4es'
    };
    onCreateProfile(newProf);
    setShowCreateModal(false);
  };

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6 overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Versions & Profiles Manager
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Mojang Version Manifest & Android Runtime Engine
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-cyan-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Profile
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2 mb-4 text-xs font-semibold">
        <button
          onClick={() => setTab('profiles')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            tab === 'profiles' ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          My Profiles ({profiles.length})
        </button>
        <button
          onClick={() => setTab('releases')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            tab === 'releases' ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          Official Releases
        </button>
        <button
          onClick={() => setTab('snapshots')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            tab === 'snapshots' ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          Snapshots & Betas
        </button>
      </div>

      {/* Profile List */}
      {tab === 'profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(prof => {
            const isActive = prof.id === activeProfile.id;
            return (
              <div
                key={prof.id}
                onClick={() => onSelectProfile(prof)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_20px_rgba(6,182,212,0.18)]'
                    : 'border-white/10 bg-slate-900/60 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl">{prof.icon}</span>
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 hover:text-slate-300">Click to Select</span>
                    )}
                  </div>

                  <h4 className="font-bold text-white text-base mb-1">{prof.name}</h4>
                  <p className="text-xs text-slate-400 font-mono mb-3">
                    Minecraft {prof.versionId} · {prof.modLoader.toUpperCase()}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-white/5 font-mono mb-4">
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{prof.javaRuntime.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{prof.allocatedRamMb} MB</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 border-t border-white/5 pt-2">
                  <span>Renderer: {prof.renderer.toUpperCase()}</span>
                  <span className="text-cyan-400 font-medium">Ready</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mojang Version Manifest Table */}
      {(tab === 'releases' || tab === 'snapshots') && (
        <div className="space-y-3">
          {installingVersionId && installProgress && (
            <div className="bg-cyan-950/50 p-4 rounded-xl border border-cyan-500/40 mb-4 space-y-2">
              <div className="flex justify-between text-xs text-cyan-300 font-mono font-bold">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Installing {installingVersionId}: {installProgress.step}
                </span>
                <span>{installProgress.percent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${installProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredVersions.map(ver => (
              <div
                key={ver.id}
                className="p-3.5 bg-slate-900/60 rounded-xl border border-white/10 flex items-center justify-between hover:bg-slate-800/70 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-white">{ver.id}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-white/10 uppercase">
                      {ver.type}
                    </span>
                    {ver.modLoader && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase">
                        {ver.modLoader}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mb-1">
                    {ver.description || 'Official vanilla Minecraft release from Mojang'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Java {ver.javaVersion} · ~{ver.downloadSizeMb} MB · Rec RAM: {ver.recommendedRamMb}MB
                  </p>
                </div>

                <div>
                  {ver.installed ? (
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Installed
                    </span>
                  ) : (
                    <button
                      onClick={() => onInstallVersion(ver.id)}
                      disabled={installingVersionId !== null}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Install
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Profile Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="feather-card max-w-md w-full p-6 rounded-2xl border border-white/15 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" /> Create Minecraft Profile
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Profile Name</label>
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Version</label>
                <select
                  value={selectedVerId}
                  onChange={(e) => setSelectedVerId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="1.21.4">1.21.4 (Latest)</option>
                  <option value="1.20.4">1.20.4</option>
                  <option value="1.16.5">1.16.5</option>
                  <option value="1.8.9">1.8.9 (Hypixel/PvP)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Mod Loader</label>
                <select
                  value={selectedLoader}
                  onChange={(e) => setSelectedLoader(e.target.value as ModLoader)}
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-cyan-400"
                >
                  <option value="fabric">Fabric (Recommended)</option>
                  <option value="forge">Forge</option>
                  <option value="vanilla">Vanilla</option>
                  <option value="quilt">Quilt</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-semibold">
                <span>Allocated RAM (Android Safe)</span>
                <span className="font-mono text-cyan-400">{ramMb} MB</span>
              </div>
              <input
                type="range"
                min="1536"
                max="6144"
                step="256"
                value={ramMb}
                onChange={(e) => setRamMb(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Safe range prevents Android Low Memory Killer (LMK) from closing background apps.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold"
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
