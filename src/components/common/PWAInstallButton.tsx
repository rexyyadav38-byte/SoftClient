import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, Check, X, ShieldCheck, Share, PlusSquare } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  showAlwaysForManual?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  className = '', 
  showAlwaysForManual = false 
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [guidePlatform, setGuidePlatform] = useState<'android' | 'ios'>('android');

  // If already running in standalone mode (installed PWA / APK), suppress button unless forced
  if (isInstalled && !showAlwaysForManual) {
    return null;
  }

  const handleButtonClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setShowGuideModal(true);
      }
    } else if (isIOS) {
      setGuidePlatform('ios');
      setShowGuideModal(true);
    } else {
      setGuidePlatform('android');
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-lg ${
          className || 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-cyan-500/25 active:scale-95'
        }`}
        title="Install Softly Client as Android APK / PWA"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Install App</span>
      </button>

      {/* Guided Install Modal for Android & iOS */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
          <div className="feather-card max-w-md w-full p-6 rounded-2xl border border-white/20 shadow-2xl flex flex-col space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Install Softly Client</h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Platform Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setGuidePlatform('android')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  guidePlatform === 'android'
                    ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300'
                    : 'border-white/10 bg-slate-900 text-slate-400'
                }`}
              >
                Android / Chrome
              </button>
              <button
                onClick={() => setGuidePlatform('ios')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  guidePlatform === 'ios'
                    ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300'
                    : 'border-white/10 bg-slate-900 text-slate-400'
                }`}
              >
                iOS Safari
              </button>
            </div>

            {/* Android Instructions */}
            {guidePlatform === 'android' ? (
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-3 bg-slate-950 rounded-xl border border-white/10 space-y-2">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" /> Method 1: Instant Chrome Install
                  </p>
                  <p className="text-[11px] text-slate-400">
                    1. Tap the <strong className="text-white">⋮ (Menu)</strong> icon in Google Chrome.<br />
                    2. Select <strong className="text-cyan-300">Install App</strong> or <strong className="text-cyan-300">Add to Home screen</strong>.<br />
                    3. Softly Client will install with standalone native window and offline cache.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-white/10 space-y-2">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" /> Method 2: Android APK (Bubblewrap / TWA)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    This PWA is 100% compliant with Google's Trusted Web Activity (TWA) standard. You can package it into a signed <code className="text-cyan-300 font-mono">.apk</code> using Bubblewrap or Capacitor. See the <strong className="text-white">Export APK</strong> tab for details.
                  </p>
                </div>
              </div>
            ) : (
              /* iOS Safari Instructions */
              <div className="p-4 bg-slate-950 rounded-xl border border-white/10 space-y-3 text-xs text-slate-300">
                <p className="font-bold text-white">How to Install on iPhone / iPad:</p>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-400">
                  <li>Tap the <Share className="w-3.5 h-3.5 inline text-cyan-400 mx-1" /> <strong>Share</strong> button at the bottom of Safari.</li>
                  <li>Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline text-cyan-400 mx-1" /> <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> in the top-right corner to launch in fullscreen mode.</li>
                </ol>
              </div>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
