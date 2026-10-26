/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  MinecraftVersion, GameProfile, UserAccount, PojavControlLayout, ModItem, DeviceSpecs, ClientHudSettings 
} from './types/launcher';
import { FALLBACK_VERSIONS, fetchMojangVersionManifest } from './services/mojangService';
import { PRESET_LAYOUTS } from './services/controlsService';
import { FEATURED_MODS } from './services/modService';
import { detectDeviceSpecs } from './services/deviceService';

import { AndroidFrame, ViewportMode } from './components/common/AndroidFrame';
import { HomeScreen } from './components/home/HomeScreen';
import { VersionManager } from './components/versions/VersionManager';
import { TouchControlEditor } from './components/controls/TouchControlEditor';
import { ModManager } from './components/mods/ModManager';
import { AccountManager } from './components/account/AccountManager';
import { SettingsDashboard } from './components/settings/SettingsDashboard';
import { AndroidExportHub } from './components/export/AndroidExportHub';
import { MinecraftGameCanvas } from './game/MinecraftGameCanvas';
import { PWAInstallButton } from './components/common/PWAInstallButton';
import { OfflineIndicator } from './components/common/OfflineIndicator';

import { 
  Play, Layers, Sliders, Sparkles, User, Settings, Smartphone, Maximize2 
} from 'lucide-react';

export default function App() {
  // 1. Initial State Definitions
  const [deviceSpecs] = useState<DeviceSpecs>(() => detectDeviceSpecs());
  const [viewportMode, setViewportMode] = useState<ViewportMode>('phone_landscape');
  const [currentNav, setCurrentNav] = useState<'home' | 'versions' | 'controls' | 'mods' | 'settings' | 'export'>('home');
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);

  // Versions and Profiles
  const [versions, setVersions] = useState<MinecraftVersion[]>(FALLBACK_VERSIONS);
  const [profiles, setProfiles] = useState<GameProfile[]>([
    {
      id: 'prof_fabric_1214',
      name: '1.21.4 (Softly Optimized)',
      versionId: '1.21.4',
      modLoader: 'fabric',
      javaRuntime: 'java-21',
      allocatedRamMb: 3584,
      jvmArgs: '-XX:+UseG1GC -XX:MaxGCPauseMillis=20',
      resolutionScale: 100,
      controlLayoutId: 'pojav_default',
      icon: '💎',
      renderer: 'gl4es'
    },
    {
      id: 'prof_pvp_189',
      name: '1.8.9 (Hypixel & Bedwars)',
      versionId: '1.8.9',
      modLoader: 'vanilla',
      javaRuntime: 'java-8',
      allocatedRamMb: 2048,
      jvmArgs: '-XX:+UseG1GC',
      resolutionScale: 100,
      controlLayoutId: 'softly_pvp',
      icon: '⚔️',
      renderer: 'gl4es'
    }
  ]);
  const [activeProfileId, setActiveProfileId] = useState<string>('prof_fabric_1214');

  // Accounts
  const [accounts, setAccounts] = useState<UserAccount[]>([
    {
      id: 'acc_default_offline',
      username: 'SoftlyHero',
      uuid: '4f620202-0000-4000-9000-000000000001',
      type: 'offline',
      skinUrl: 'softly',
      capeUrl: 'softly',
      modelType: 'classic',
      active: true
    }
  ]);
  const [activeAccountId, setActiveAccountId] = useState<string>('acc_default_offline');

  // Touch Controls Layout
  const [currentLayout, setCurrentLayout] = useState<PojavControlLayout>(PRESET_LAYOUTS[0]);

  // Mods
  const [mods, setMods] = useState<ModItem[]>(FEATURED_MODS);

  // HUD Settings
  const [hudSettings, setHudSettings] = useState<ClientHudSettings>({
    showFps: true,
    showCps: true,
    showKeystrokes: true,
    showCoords: true,
    showArmor: true,
    showPotion: true,
    showDirection: true,
    crosshairStyle: 'classic',
    accentColor: '#06b6d4'
  });

  // Game Engine Launch State
  const [isGameRunning, setIsGameRunning] = useState<boolean>(false);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [launchStep, setLaunchStep] = useState<string>('Initializing');
  const [installingVersionId, setInstallingVersionId] = useState<string | null>(null);
  const [installProgress, setInstallProgress] = useState<{ step: string; percent: number } | null>(null);

  // 2. Fetch live Mojang Version Manifest on mount
  useEffect(() => {
    fetchMojangVersionManifest().then(fetched => {
      setVersions(fetched);
    });
  }, []);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];
  const currentVersion = versions.find(v => v.id === activeProfile.versionId) || versions[0];

  // 3. Launch Game Simulation Sequence
  const handleLaunchGame = () => {
    setIsLaunching(true);
    setLaunchStep('Verifying Account Session...');

    setTimeout(() => {
      setLaunchStep('Resolving Mojang Libraries (68/68)...');
      setTimeout(() => {
        setLaunchStep('Validating ARM64 OpenJDK Natives...');
        setTimeout(() => {
          setLaunchStep('Starting JVM Runtime & 3D Voxel Engine...');
          setTimeout(() => {
            setIsLaunching(false);
            setIsGameRunning(true);
          }, 600);
        }, 600);
      }, 700);
    }, 600);
  };

  const handleInstallVersion = async (versionId: string) => {
    setInstallingVersionId(versionId);
    setInstallProgress({ step: 'Downloading version.json manifest', percent: 15 });
    await new Promise(r => setTimeout(r, 600));

    setInstallProgress({ step: 'Fetching Minecraft client.jar', percent: 45 });
    await new Promise(r => setTimeout(r, 700));

    setInstallProgress({ step: 'Extracting lwjgl3-natives for ARM64', percent: 80 });
    await new Promise(r => setTimeout(r, 600));

    setInstallProgress({ step: 'Verifying asset checksums', percent: 100 });
    await new Promise(r => setTimeout(r, 400));

    setVersions(prev => prev.map(v => v.id === versionId ? { ...v, installed: true } : v));
    setInstallingVersionId(null);
    setInstallProgress(null);
  };

  const handleToggleMod = (modId: string) => {
    setMods(prev => prev.map(m => m.id === modId ? { ...m, enabled: !m.enabled } : m));
  };

  const handleImportMod = (modName: string) => {
    const newMod: ModItem = {
      id: `custom_mod_${Date.now()}`,
      name: modName,
      version: '1.0.0',
      description: 'Custom imported user mod/shader pack installed into .minecraft/mods',
      category: 'rendering',
      author: 'User',
      compatibleLoaders: ['fabric', 'forge'],
      compatibleVersions: ['1.21.4', '1.20.4'],
      enabled: true,
      fileSizeMb: 3.5,
      installed: true
    };
    setMods(prev => [newMod, ...prev]);
  };

  return (
    <div className="w-screen h-screen bg-[#07090e] text-slate-100 flex flex-col overflow-hidden">
      <AndroidFrame mode={viewportMode} onChangeMode={setViewportMode}>
        {/* If the 3D Voxel Game is launched, render the interactive 3D Minecraft canvas! */}
        {isGameRunning ? (
          <MinecraftGameCanvas
            layout={currentLayout}
            hudSettings={hudSettings}
            versionName={activeProfile.versionId}
            onExit={() => setIsGameRunning(false)}
            onOpenControlsEditor={() => {
              setIsGameRunning(false);
              setCurrentNav('controls');
            }}
          />
        ) : (
          /* Normal Launcher Workstation */
          <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#0c0e14]">
            {/* Top Navigation Bar (Feather / Lunar Client Style) */}
            <header className="h-14 bg-slate-950/80 border-b border-white/10 px-4 flex items-center justify-between select-none z-30 backdrop-blur-md">
              {/* Softly Client Logo */}
              <div 
                onClick={() => setCurrentNav('home')}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-cyan-600 border border-cyan-400/50 flex items-center justify-center font-black text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover:scale-105 transition-transform">
                  S
                </div>
                <div>
                  <span className="font-black text-sm tracking-wider text-white">
                    SOFTLY<span className="text-cyan-400">CLIENT</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block -mt-1">
                    Java Edition Android
                  </span>
                </div>
              </div>

              {/* Navigation Items (Icons & Labels) */}
              <nav className="flex items-center gap-1 sm:gap-2">
                {[
                  { id: 'home', label: 'Play', icon: Play },
                  { id: 'versions', label: 'Versions', icon: Layers },
                  { id: 'controls', label: 'Controls', icon: Sliders },
                  { id: 'mods', label: 'Mods', icon: Sparkles },
                  { id: 'settings', label: 'Settings', icon: Settings },
                  { id: 'export', label: 'Export APK', icon: Smartphone },
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = currentNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentNav(item.id as any)}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isActive
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Right Profile, Skin & PWA Install Button */}
              <div className="flex items-center gap-2">
                <PWAInstallButton />
                <button
                  onClick={() => setShowAccountModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden md:inline font-mono">{activeAccount.username}</span>
                </button>
              </div>
            </header>

            {/* Main Launcher View Content */}
            <main className="flex-1 relative overflow-hidden">
              {currentNav === 'home' && (
                <HomeScreen
                  activeProfile={activeProfile}
                  activeAccount={activeAccount}
                  version={currentVersion}
                  onLaunchGame={handleLaunchGame}
                  isLaunching={isLaunching}
                  launchStep={launchStep}
                  onOpenVersions={() => setCurrentNav('versions')}
                  onOpenControls={() => setCurrentNav('controls')}
                  onOpenMods={() => setCurrentNav('mods')}
                  onOpenAccounts={() => setShowAccountModal(true)}
                />
              )}

              {currentNav === 'versions' && (
                <VersionManager
                  versions={versions}
                  profiles={profiles}
                  activeProfile={activeProfile}
                  onSelectProfile={(p) => setActiveProfileId(p.id)}
                  onCreateProfile={(newP) => {
                    setProfiles(prev => [newP, ...prev]);
                    setActiveProfileId(newP.id);
                  }}
                  onInstallVersion={handleInstallVersion}
                  installingVersionId={installingVersionId}
                  installProgress={installProgress}
                />
              )}

              {currentNav === 'controls' && (
                <TouchControlEditor
                  layout={currentLayout}
                  onSaveLayout={(saved) => {
                    setCurrentLayout(saved);
                    setCurrentNav('home');
                  }}
                  onClose={() => setCurrentNav('home')}
                  onTestInGame={() => setIsGameRunning(true)}
                />
              )}

              {currentNav === 'mods' && (
                <ModManager
                  mods={mods}
                  onToggleMod={handleToggleMod}
                  onImportMod={handleImportMod}
                />
              )}

              {currentNav === 'settings' && (
                <SettingsDashboard
                  activeProfile={activeProfile}
                  deviceSpecs={deviceSpecs}
                  hudSettings={hudSettings}
                  onUpdateProfile={(updates) => {
                    setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, ...updates } : p));
                  }}
                  onUpdateHudSettings={(updates) => {
                    setHudSettings(prev => ({ ...prev, ...updates }));
                  }}
                />
              )}

              {currentNav === 'export' && (
                <AndroidExportHub
                  layout={currentLayout}
                  activeProfile={activeProfile}
                  deviceSpecs={deviceSpecs}
                />
              )}
            </main>
          </div>
        )}
      </AndroidFrame>

      {/* Account & 3D Skin Manager Modal */}
      {showAccountModal && (
        <AccountManager
          accounts={accounts}
          activeAccount={activeAccount}
          onSelectAccount={(acc) => setActiveAccountId(acc.id)}
          onAddAccount={(newAcc) => {
            setAccounts(prev => [...prev, newAcc]);
            setActiveAccountId(newAcc.id);
          }}
          onClose={() => setShowAccountModal(false)}
        />
      )}

      {/* Offline connectivity indicator */}
      <OfflineIndicator />
    </div>
  );
}
