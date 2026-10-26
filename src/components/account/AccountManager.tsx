import React, { useState } from 'react';
import { UserAccount } from '../../types/launcher';
import { SkinViewer3D } from './SkinViewer3D';
import { 
  User, Check, Plus, ShieldCheck, Globe, KeyRound, ExternalLink, X, RefreshCw 
} from 'lucide-react';

interface AccountManagerProps {
  accounts: UserAccount[];
  activeAccount: UserAccount;
  onSelectAccount: (account: UserAccount) => void;
  onAddAccount: (account: UserAccount) => void;
  onClose: () => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({
  accounts,
  activeAccount,
  onSelectAccount,
  onAddAccount,
  onClose
}) => {
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'microsoft' | 'offline'>('microsoft');
  const [offlineName, setOfflineName] = useState<string>('');
  const [skinType, setSkinType] = useState<'steve' | 'alex' | 'softly' | 'enderman'>('softly');
  const [capeType, setCapeType] = useState<'softly' | 'lunar' | 'migrator' | 'none'>('softly');
  
  // Microsoft Device Code flow simulation
  const [msStep, setMsStep] = useState<'code' | 'waiting' | 'success'>('code');
  const [userCode] = useState<string>('SF-78K2-9MC');

  const handleCreateOffline = () => {
    if (!offlineName.trim()) return;
    const newAcc: UserAccount = {
      id: `acc_offline_${Date.now()}`,
      username: offlineName.trim(),
      uuid: `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
      type: 'offline',
      skinUrl: skinType,
      capeUrl: capeType,
      modelType: 'classic',
      active: true
    };
    onAddAccount(newAcc);
    setIsAdding(false);
  };

  const handleCompleteMicrosoftLogin = () => {
    setMsStep('waiting');
    setTimeout(() => {
      setMsStep('success');
      setTimeout(() => {
        const msAccount: UserAccount = {
          id: `acc_ms_${Date.now()}`,
          username: 'SoftlyHero_MS',
          uuid: 'c06f8906-4c8a-4911-9c29-ea1dbd1aab82',
          type: 'microsoft',
          skinUrl: 'softly',
          capeUrl: 'softly',
          modelType: 'classic',
          active: true
        };
        onAddAccount(msAccount);
        setIsAdding(false);
      }, 1200);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="feather-card max-w-2xl w-full p-6 rounded-2xl border border-white/15 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-950/60 rounded-xl border border-cyan-500/30 text-cyan-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Minecraft Accounts & Skins</h3>
              <p className="text-xs text-slate-400 font-mono">Microsoft OAuth & Offline Profiles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isAdding ? (
          <div className="space-y-6">
            {/* Account List and 3D preview split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Accounts list */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Stored Profiles ({accounts.length})
                  </span>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Account
                  </button>
                </div>

                <div className="space-y-2">
                  {accounts.map(acc => {
                    const isActive = acc.id === activeAccount.id;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => onSelectAccount(acc)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isActive
                            ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                            : 'border-white/10 bg-slate-900/60 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-sm text-cyan-300">
                            {acc.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white flex items-center gap-1.5">
                              {acc.username}
                              {acc.type === 'microsoft' ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                                  Microsoft
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950 text-amber-400 border border-amber-500/30">
                                  Offline
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              UUID: {acc.uuid.slice(0, 16)}...
                            </p>
                          </div>
                        </div>

                        {isActive && (
                          <div className="p-1 rounded-full bg-cyan-500 text-black">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3D Skin preview container */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-white/10 flex flex-col items-center">
                <div className="text-center mb-1">
                  <span className="text-xs font-bold text-slate-200">Active Skin & Cape Preview</span>
                  <p className="text-[11px] text-slate-400 font-mono">Drag to inspect in 3D</p>
                </div>

                <SkinViewer3D
                  skinType={(activeAccount.skinUrl as any) || 'softly'}
                  capeType={(activeAccount.capeUrl as any) || 'softly'}
                  width={200}
                  height={240}
                />

                <div className="mt-2 text-center text-[11px] text-cyan-400 font-mono">
                  {activeAccount.username} · Softly Cape Active
                </div>
              </div>
            </div>

            {/* Skin style picker */}
            <div className="pt-4 border-t border-white/10">
              <label className="text-xs font-semibold text-slate-400 mb-2 block">
                Choose Skin & Cape Outfit
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'softly', label: 'Softly Hoodie' },
                  { id: 'steve', label: 'Classic Steve' },
                  { id: 'alex', label: 'Modern Alex' },
                  { id: 'enderman', label: 'Cyber Enderman' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectAccount({ ...activeAccount, skinUrl: s.id });
                    }}
                    className={`p-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                      activeAccount.skinUrl === s.id
                        ? 'border-cyan-400 bg-cyan-950/50 text-cyan-300'
                        : 'border-white/10 bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Add Account Flow */
          <div className="space-y-5">
            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setAuthTab('microsoft')}
                className={`flex-1 py-2.5 font-semibold text-xs border-b-2 flex items-center justify-center gap-2 ${
                  authTab === 'microsoft'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Microsoft Account (Official)
              </button>
              <button
                onClick={() => setAuthTab('offline')}
                className={`flex-1 py-2.5 font-semibold text-xs border-b-2 flex items-center justify-center gap-2 ${
                  authTab === 'offline'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-4 h-4" />
                Offline / Local Mode
              </button>
            </div>

            {authTab === 'microsoft' ? (
              <div className="bg-slate-950/60 p-4 rounded-xl border border-white/10 space-y-4">
                <div className="text-center space-y-1">
                  <h4 className="font-bold text-white text-sm">Microsoft Device Code Authentication</h4>
                  <p className="text-xs text-slate-400">
                    To authenticate with your genuine Minecraft license, complete the OAuth flow:
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-white/15 flex flex-col items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">1. Visit the verification URL:</span>
                  <a
                    href="https://microsoft.com/link"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 font-bold hover:underline flex items-center gap-1 text-xs"
                  >
                    https://microsoft.com/link <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <span className="text-[11px] text-slate-400 font-mono mt-1">2. Enter your secure device code:</span>
                  <div className="px-4 py-2 bg-black rounded-lg border border-cyan-500/40 font-mono text-lg font-black text-cyan-300 tracking-widest select-all">
                    {userCode}
                  </div>
                </div>

                <button
                  onClick={handleCompleteMicrosoftLogin}
                  disabled={msStep === 'waiting'}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2"
                >
                  {msStep === 'waiting' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying with Mojang & Xbox Live...
                    </>
                  ) : msStep === 'success' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" /> Authenticated Successfully!
                    </>
                  ) : (
                    'Confirm Login Completion'
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-slate-950/60 p-4 rounded-xl border border-white/10 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">
                    Offline Username
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SoftlyGamer"
                    value={offlineName}
                    onChange={(e) => setOfflineName(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 outline-none font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Offline mode lets you play singleplayer and local offline servers without logging into Microsoft.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateOffline}
                    disabled={!offlineName.trim()}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl"
                  >
                    Create Offline Account
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
