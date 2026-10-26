import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-3 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/90 text-black px-3 py-1.5 text-xs font-bold shadow-2xl backdrop-blur-md border border-amber-300">
      <WifiOff className="w-4 h-4 stroke-[2.5]" />
      <span>Offline Mode — Cached Minecraft assets & local profiles active</span>
    </div>
  );
};
