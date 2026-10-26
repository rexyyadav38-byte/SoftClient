import React, { useState } from 'react';
import { PojavControlLayout, TouchButton } from '../../types/launcher';
import { PRESET_LAYOUTS, exportPojavJson } from '../../services/controlsService';
import { 
  Plus, Trash2, Download, Upload, Sliders, Smartphone, Check, RotateCcw, Copy, Play
} from 'lucide-react';

interface TouchControlEditorProps {
  layout: PojavControlLayout;
  onSaveLayout: (newLayout: PojavControlLayout) => void;
  onClose: () => void;
  onTestInGame?: () => void;
}

export const TouchControlEditor: React.FC<TouchControlEditorProps> = ({
  layout: initialLayout,
  onSaveLayout,
  onClose,
  onTestInGame
}) => {
  const [layout, setLayout] = useState<PojavControlLayout>(initialLayout);
  const [selectedBtnId, setSelectedBtnId] = useState<string | null>(layout.buttons[0]?.id || null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedBtn = layout.buttons.find(b => b.id === selectedBtnId);

  const updateSelectedBtn = (updates: Partial<TouchButton>) => {
    if (!selectedBtnId) return;
    setLayout(prev => ({
      ...prev,
      buttons: prev.buttons.map(b => b.id === selectedBtnId ? { ...b, ...updates } : b)
    }));
  };

  const handleAddButton = () => {
    const newBtn: TouchButton = {
      id: `btn_custom_${Date.now()}`,
      name: 'Custom',
      key: 'F',
      label: 'CUSTOM',
      x: 50,
      y: 50,
      width: 54,
      height: 54,
      opacity: 0.7,
      shape: 'circle'
    };
    setLayout(prev => ({ ...prev, buttons: [...prev.buttons, newBtn] }));
    setSelectedBtnId(newBtn.id);
  };

  const handleDeleteButton = () => {
    if (!selectedBtnId) return;
    setLayout(prev => ({
      ...prev,
      buttons: prev.buttons.filter(b => b.id !== selectedBtnId)
    }));
    setSelectedBtnId(null);
  };

  const loadPreset = (presetId: string) => {
    const found = PRESET_LAYOUTS.find(p => p.id === presetId);
    if (found) {
      setLayout(JSON.parse(JSON.stringify(found)));
      setSelectedBtnId(found.buttons[0]?.id || null);
    }
  };

  const handleCopyJson = () => {
    const jsonStr = exportPojavJson(layout);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const jsonStr = exportPojavJson(layout);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layout.name.toLowerCase().replace(/\s+/g, '_')}_pojav.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full h-full bg-[#0a0d14] flex flex-col md:flex-row overflow-hidden text-slate-100">
      {/* Top / Left Header Bar on Small screens */}
      <div className="md:hidden p-3 bg-slate-900 border-b border-white/10 flex justify-between items-center">
        <span className="font-bold text-sm flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" /> Touch Control Editor
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onSaveLayout(layout)}
            className="px-3 py-1 bg-cyan-600 rounded text-xs font-semibold"
          >
            Save & Exit
          </button>
        </div>
      </div>

      {/* Main Interactive Screen Canvas */}
      <div className="flex-1 relative bg-black/60 flex items-center justify-center p-4 overflow-hidden">
        {/* Android Device Mock Border */}
        <div className="relative w-full h-full max-w-5xl max-h-[82vh] bg-slate-950/80 rounded-2xl border-2 border-slate-700 shadow-2xl overflow-hidden select-none">
          {/* Subtle grid background */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none" 
            style={{ 
              backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)', 
              backgroundSize: '24px 24px' 
            }} 
          />

          {/* Android Punch Hole & Status bar */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-black border border-white/20 z-20 pointer-events-none" />
          <div className="absolute top-1 left-4 text-[10px] text-slate-500 font-mono pointer-events-none">
            Softly Touch Layout Canvas · 20:9 Aspect
          </div>

          {/* Render draggable / clickable touch buttons */}
          {layout.buttons.map(btn => {
            const isSelected = btn.id === selectedBtnId;
            return (
              <div
                key={btn.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBtnId(btn.id);
                }}
                style={{
                  position: 'absolute',
                  left: `${btn.x}%`,
                  top: `${btn.y}%`,
                  width: `${btn.width}px`,
                  height: `${btn.height}px`,
                  opacity: btn.opacity,
                  borderRadius: btn.shape === 'circle' ? '9999px' : '8px',
                  transform: 'translate(-50%, -50%)',
                }}
                className={`cursor-pointer flex items-center justify-center font-mono text-xs font-bold transition-all shadow-md ${
                  isSelected
                    ? 'border-2 border-cyan-400 bg-cyan-900/60 shadow-[0_0_15px_rgba(6,182,212,0.8)] scale-105 z-30'
                    : 'border border-white/30 bg-slate-800/80 text-white hover:border-white/70'
                }`}
              >
                {btn.label}
              </div>
            );
          })}

          {/* Center drag crosshair hint */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <span className="text-[11px] text-slate-500 font-mono">
              [ Camera Touch / Trackpad Area ]
            </span>
          </div>
        </div>
      </div>

      {/* Right Properties & Preset Sidebar */}
      <div className="w-full md:w-80 bg-slate-900/95 border-l border-white/10 p-4 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Button Properties
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Pojav-Compatible Controls</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleAddButton}
                title="Add Button"
                className="p-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white"
              >
                <Plus className="w-4 h-4" />
              </button>
              {selectedBtn && (
                <button
                  onClick={handleDeleteButton}
                  title="Delete Selected"
                  className="p-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Preset Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Control Preset</label>
            <div className="grid grid-cols-1 gap-1.5">
              {PRESET_LAYOUTS.map(p => (
                <button
                  key={p.id}
                  onClick={() => loadPreset(p.id)}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    layout.id === p.id
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                      : 'border-white/5 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Button Settings */}
          {selectedBtn ? (
            <div className="space-y-3 bg-slate-950/60 p-3 rounded-xl border border-white/10 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-cyan-300">{selectedBtn.name} ({selectedBtn.key})</span>
                <span className="text-[10px] text-slate-500 font-mono">{selectedBtn.id}</span>
              </div>

              {/* Label */}
              <div>
                <label className="text-slate-400 block mb-1">Display Label</label>
                <input
                  type="text"
                  value={selectedBtn.label}
                  onChange={(e) => updateSelectedBtn({ label: e.target.value })}
                  className="w-full bg-slate-900 border border-white/15 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:border-cyan-400 outline-none"
                />
              </div>

              {/* Key Mapping */}
              <div>
                <label className="text-slate-400 block mb-1">Key Binding</label>
                <select
                  value={selectedBtn.key}
                  onChange={(e) => updateSelectedBtn({ key: e.target.value })}
                  className="w-full bg-slate-900 border border-white/15 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:border-cyan-400 outline-none"
                >
                  <option value="W">W (Forward)</option>
                  <option value="S">S (Backward)</option>
                  <option value="A">A (Strafe Left)</option>
                  <option value="D">D (Strafe Right)</option>
                  <option value="SPACE">SPACE (Jump)</option>
                  <option value="SHIFT">SHIFT (Sneak)</option>
                  <option value="CTRL">CTRL (Sprint)</option>
                  <option value="LMB">LMB (Attack / Break)</option>
                  <option value="RMB">RMB (Use / Place)</option>
                  <option value="E">E (Inventory)</option>
                  <option value="T">T (Chat)</option>
                  <option value="F3">F3 (Debug Screen)</option>
                  <option value="F5">F5 (Change Perspective)</option>
                  <option value="ESC">ESC (Pause Menu)</option>
                  <option value="ZOOM">C (OptiFine / Iris Zoom)</option>
                  <option value="Q">Q (Drop Item)</option>
                </select>
              </div>

              {/* Position X Slider */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Horizontal Pos (X)</span>
                  <span className="font-mono text-cyan-400">{selectedBtn.x}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="98"
                  value={selectedBtn.x}
                  onChange={(e) => updateSelectedBtn({ x: parseInt(e.target.value, 10) })}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Position Y Slider */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Vertical Pos (Y)</span>
                  <span className="font-mono text-cyan-400">{selectedBtn.y}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="98"
                  value={selectedBtn.y}
                  onChange={(e) => updateSelectedBtn({ y: parseInt(e.target.value, 10) })}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Size Slider */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Size</span>
                  <span className="font-mono text-cyan-400">{selectedBtn.width}px</span>
                </div>
                <input
                  type="range"
                  min="32"
                  max="96"
                  value={selectedBtn.width}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    updateSelectedBtn({ width: val, height: selectedBtn.shape === 'circle' ? val : selectedBtn.height });
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Opacity Slider */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Opacity</span>
                  <span className="font-mono text-cyan-400">{Math.round(selectedBtn.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="100"
                  value={Math.round(selectedBtn.opacity * 100)}
                  onChange={(e) => updateSelectedBtn({ opacity: parseInt(e.target.value, 10) / 100 })}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Shape */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => updateSelectedBtn({ shape: 'circle' })}
                  className={`flex-1 py-1.5 rounded font-semibold border ${
                    selectedBtn.shape === 'circle' ? 'border-cyan-400 bg-cyan-900/40 text-cyan-300' : 'border-white/10 bg-slate-900 text-slate-400'
                  }`}
                >
                  Circular
                </button>
                <button
                  onClick={() => updateSelectedBtn({ shape: 'rect' })}
                  className={`flex-1 py-1.5 rounded font-semibold border ${
                    selectedBtn.shape === 'rect' ? 'border-cyan-400 bg-cyan-900/40 text-cyan-300' : 'border-white/10 bg-slate-900 text-slate-400'
                  }`}
                >
                  Rectangular
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs">
              Click any button on the screen to adjust position, size, and mapping.
            </div>
          )}

          {/* Pojav JSON Export / Import buttons */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <button
              onClick={() => setShowExportModal(true)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 border border-white/10 flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Export PojavLauncher JSON
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          {onTestInGame && (
            <button
              onClick={onTestInGame}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Test Controls In 3D World
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium text-slate-400 border border-white/10"
            >
              Cancel
            </button>
            <button
              onClick={() => onSaveLayout(layout)}
              className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Save Layout
            </button>
          </div>
        </div>
      </div>

      {/* Pojav JSON Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="feather-card max-w-lg w-full p-5 rounded-2xl border border-white/20 shadow-2xl flex flex-col space-y-3">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-400" />
              PojavLauncher Control Map JSON
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              This file matches the PojavLauncher schema and can be placed into your Android phone at:
              <br />
              <code className="text-cyan-300 font-mono text-[11px]">/sdcard/games/PojavLauncher/controlmap/</code>
            </p>

            <textarea
              readOnly
              value={exportPojavJson(layout)}
              className="w-full h-48 bg-slate-950 p-3 rounded-lg border border-white/10 font-mono text-[11px] text-cyan-300/90 outline-none select-all"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleCopyJson}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-white/10 flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={handleDownloadJson}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download .JSON
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
