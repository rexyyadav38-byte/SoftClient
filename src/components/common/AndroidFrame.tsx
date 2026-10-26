import React from 'react';
import { Smartphone, Tablet, Monitor, Wifi, Battery, Signal } from 'lucide-react';

export type ViewportMode = 'fullscreen' | 'phone_landscape' | 'phone_portrait' | 'tablet';

interface AndroidFrameProps {
  mode: ViewportMode;
  onChangeMode: (mode: ViewportMode) => void;
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  mode,
  onChangeMode,
  children
}) => {
  if (mode === 'fullscreen') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#0c0e14]">
        {/* Floating subtle toggle button in top corner to exit fullscreen */}
        <div className="absolute top-2 right-4 z-50">
          <button
            onClick={() => onChangeMode('phone_landscape')}
            className="px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-full text-[10px] text-slate-300 backdrop-blur-md flex items-center gap-1.5 shadow-lg transition-colors"
            title="Switch to Android Phone Bezel Mode"
          >
            <Smartphone className="w-3 h-3 text-cyan-400 rotate-90" />
            <span>Mobile Frame</span>
          </button>
        </div>
        {children}
      </div>
    );
  }

  // Device simulation wrapper
  return (
    <div className="w-full h-full bg-[#05070a] flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Device Mode Switcher Pill */}
      <div className="mb-2 bg-slate-900/90 border border-white/10 rounded-full px-3 py-1 flex items-center gap-2 text-xs z-40 backdrop-blur-md shadow-lg">
        <span className="text-[10px] text-slate-500 font-mono uppercase mr-1">Android View:</span>
        <button
          onClick={() => onChangeMode('phone_landscape')}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-colors ${
            mode === 'phone_landscape' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
          }`}
          title="Phone Landscape (Gaming Mode)"
        >
          <Smartphone className="w-3.5 h-3.5 rotate-90" /> Landscape
        </button>
        <button
          onClick={() => onChangeMode('tablet')}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-colors ${
            mode === 'tablet' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
          }`}
          title="Tablet 4:3 Mode"
        >
          <Tablet className="w-3.5 h-3.5" /> Tablet
        </button>
        <button
          onClick={() => onChangeMode('fullscreen')}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-slate-400 hover:text-white transition-colors"
          title="Fullscreen Launcher"
        >
          <Monitor className="w-3.5 h-3.5" /> Fullscreen
        </button>
      </div>

      {/* Realistic Bezel Frame */}
      <div
        className={`relative transition-all duration-300 bg-slate-950 rounded-[36px] p-2.5 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_20px_rgba(56,189,248,0.15)] border-4 border-slate-700/80 flex flex-col overflow-hidden ${
          mode === 'phone_landscape'
            ? 'w-[94vw] max-w-[1080px] h-[85vh] max-h-[580px]'
            : mode === 'tablet'
            ? 'w-[92vw] max-w-[960px] h-[86vh] max-h-[720px]'
            : 'w-[420px] h-[86vh] max-h-[820px]'
        }`}
      >
        {/* Android Punch Hole Camera */}
        <div className="absolute top-4 left-6 w-3 h-3 rounded-full bg-black border border-white/20 z-50 pointer-events-none" />

        {/* Android Status Bar */}
        <div className="w-full h-6 px-7 flex justify-between items-center text-[10px] text-slate-400 font-mono z-40 select-none bg-black/60 pointer-events-none">
          <span>09:41 · SoftlyOS</span>
          <div className="flex items-center gap-2">
            <Signal className="w-3 h-3 text-slate-300" />
            <Wifi className="w-3 h-3 text-cyan-400" />
            <span className="font-bold text-slate-200">94%</span>
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* App Inner Content */}
        <div className="flex-1 relative rounded-[26px] overflow-hidden bg-[#0c0e14]">
          {children}
        </div>

        {/* Android Bottom Navigation Pill */}
        <div className="w-full h-3 flex items-center justify-center pointer-events-none bg-black/60">
          <div className="w-32 h-1 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  );
};
