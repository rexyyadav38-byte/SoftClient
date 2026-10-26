import React, { useState } from 'react';
import { ModItem } from '../../types/launcher';
import { FEATURED_MODS } from '../../services/modService';
import { 
  Cpu, Check, Download, ToggleLeft, ToggleRight, Sparkles, FolderUp, Search, ShieldAlert 
} from 'lucide-react';

interface ModManagerProps {
  mods: ModItem[];
  onToggleMod: (modId: string) => void;
  onImportMod: (modName: string) => void;
}

export const ModManager: React.FC<ModManagerProps> = ({
  mods,
  onToggleMod,
  onImportMod
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredMods = mods.filter(m => {
    const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSimulateFileSelect = () => {
    const customMod = prompt('Enter the name of the .jar mod or shader pack to import into /sdcard/games/PojavLauncher/mods/:', 'ComplementaryReimagined_r5.2.zip');
    if (customMod) {
      onImportMod(customMod);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Mods & Shader Packs
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Optimized for Android GPUs (Adreno / Mali / Immortalis)
          </p>
        </div>

        <button
          onClick={handleSimulateFileSelect}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center gap-2 shadow-lg"
        >
          <FolderUp className="w-4 h-4 text-cyan-400" />
          Import Local .JAR / .ZIP
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search mods, shaders, optimization tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-medium"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'performance', label: 'Performance' },
            { id: 'rendering', label: 'Rendering/Shaders' },
            { id: 'hud', label: 'HUD & Client' },
            { id: 'utility', label: 'Utility' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filterCategory === cat.id
                  ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900/60 text-slate-400 border border-white/5 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMods.map(mod => (
          <div
            key={mod.id}
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
              mod.enabled
                ? 'border-cyan-500/30 bg-slate-900/80 shadow-lg'
                : 'border-white/5 bg-slate-950/40 opacity-70'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    {mod.name}
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/10">
                      v{mod.version}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">By {mod.author}</p>
                </div>

                <button
                  onClick={() => onToggleMod(mod.id)}
                  className="text-cyan-400 hover:text-cyan-300 transition-transform"
                  title={mod.enabled ? 'Disable Mod' : 'Enable Mod'}
                >
                  {mod.enabled ? (
                    <ToggleRight className="w-8 h-8 text-cyan-400" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-600" />
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {mod.description}
              </p>
            </div>

            <div className="flex justify-between items-center text-[11px] font-mono border-t border-white/5 pt-2 text-slate-400">
              <span className="capitalize">{mod.category} · {mod.fileSizeMb} MB</span>
              <span className={`font-semibold ${mod.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                {mod.enabled ? '● Active in JVM' : '○ Disabled'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
