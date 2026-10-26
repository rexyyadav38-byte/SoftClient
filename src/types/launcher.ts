export type ModLoader = 'vanilla' | 'fabric' | 'forge' | 'quilt' | 'neoforge';

export interface MinecraftVersion {
  id: string;
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
  url: string;
  time: string;
  releaseTime: string;
  modLoader?: ModLoader;
  javaVersion: number;
  recommendedRamMb: number;
  installed?: boolean;
  downloadSizeMb?: number;
  description?: string;
}

export interface GameProfile {
  id: string;
  name: string;
  versionId: string;
  modLoader: ModLoader;
  javaRuntime: 'java-8' | 'java-17' | 'java-21';
  allocatedRamMb: number;
  jvmArgs: string;
  resolutionScale: number; // e.g. 100% or 75% for performance
  controlLayoutId: string;
  icon: string;
  lastPlayed?: string;
  renderer: 'gl4es' | 'zink' | 'virgl' | 'angle';
}

export interface UserAccount {
  id: string;
  username: string;
  uuid: string;
  type: 'microsoft' | 'offline';
  skinUrl: string;
  capeUrl?: string;
  modelType: 'classic' | 'slim';
  active: boolean;
}

export interface TouchButton {
  id: string;
  name: string;
  key: string; // 'W' | 'A' | 'S' | 'D' | 'LMB' | 'RMB' | 'SPACE' | 'SHIFT' | 'CTRL' | 'E' | 'T' | 'F5' | 'F3' | 'ESC' | 'ZOOM' | 'Q' | 'F'
  label: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // px or %
  height: number;
  opacity: number; // 0.1 to 1.0
  shape: 'circle' | 'rect' | 'pill';
  toggle?: boolean;
  bgColor?: string;
}

export interface PojavControlLayout {
  id: string;
  name: string;
  version: number;
  buttons: TouchButton[];
  mouseSpeed: number;
  hapticFeedback: boolean;
}

export interface ModItem {
  id: string;
  name: string;
  version: string;
  description: string;
  category: 'performance' | 'rendering' | 'hud' | 'utility';
  author: string;
  compatibleLoaders: ModLoader[];
  compatibleVersions: string[];
  enabled: boolean;
  fileSizeMb: number;
  iconUrl?: string;
  installed: boolean;
}

export interface DeviceSpecs {
  model: string;
  os: string;
  architecture: 'aarch64' | 'x86_64' | 'armv7l';
  totalRamMb: number;
  recommendedRamMb: number;
  cpuCores: number;
  gpuRenderer: string;
  thermalStatus: 'nominal' | 'fair' | 'serious';
  storageFreeGb: number;
}

export interface ClientHudSettings {
  showFps: boolean;
  showCps: boolean;
  showKeystrokes: boolean;
  showCoords: boolean;
  showArmor: boolean;
  showPotion: boolean;
  showDirection: boolean;
  crosshairStyle: 'classic' | 'dot' | 'circle' | 'plus';
  accentColor: string;
}
