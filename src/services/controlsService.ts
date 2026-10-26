import { PojavControlLayout, TouchButton } from '../types/launcher';

export const POJAV_DEFAULT_BUTTONS: TouchButton[] = [
  // Movement D-pad left side
  { id: 'btn_w', name: 'Forward', key: 'W', label: '▲', x: 12, y: 58, width: 56, height: 56, opacity: 0.65, shape: 'circle' },
  { id: 'btn_s', name: 'Back', key: 'S', label: '▼', x: 12, y: 78, width: 56, height: 56, opacity: 0.65, shape: 'circle' },
  { id: 'btn_a', name: 'Left', key: 'A', label: '◀', x: 5, y: 68, width: 56, height: 56, opacity: 0.65, shape: 'circle' },
  { id: 'btn_d', name: 'Right', key: 'D', label: '▶', x: 19, y: 68, width: 56, height: 56, opacity: 0.65, shape: 'circle' },
  { id: 'btn_sprint', name: 'Sprint', key: 'CTRL', label: 'SPRINT', x: 12, y: 68, width: 48, height: 48, opacity: 0.7, shape: 'circle', toggle: true },

  // Right side Action buttons
  { id: 'btn_jump', name: 'Jump', key: 'SPACE', label: 'JUMP', x: 88, y: 68, width: 68, height: 68, opacity: 0.8, shape: 'circle' },
  { id: 'btn_sneak', name: 'Sneak', key: 'SHIFT', label: 'SNEAK', x: 88, y: 84, width: 54, height: 54, opacity: 0.7, shape: 'circle', toggle: true },
  { id: 'btn_attack', name: 'Attack (LMB)', key: 'LMB', label: 'PRI', x: 80, y: 54, width: 60, height: 60, opacity: 0.75, shape: 'circle' },
  { id: 'btn_use', name: 'Use (RMB)', key: 'RMB', label: 'SEC', x: 72, y: 68, width: 60, height: 60, opacity: 0.75, shape: 'circle' },

  // Utility Top Row
  { id: 'btn_esc', name: 'Menu/Esc', key: 'ESC', label: 'ESC', x: 4, y: 6, width: 52, height: 34, opacity: 0.6, shape: 'rect' },
  { id: 'btn_f3', name: 'Debug (F3)', key: 'F3', label: 'DEBUG', x: 16, y: 6, width: 64, height: 34, opacity: 0.5, shape: 'rect' },
  { id: 'btn_f5', name: 'Perspective (F5)', key: 'F5', label: '3RD', x: 28, y: 6, width: 52, height: 34, opacity: 0.5, shape: 'rect' },
  { id: 'btn_chat', name: 'Chat (T)', key: 'T', label: 'CHAT', x: 74, y: 6, width: 56, height: 34, opacity: 0.5, shape: 'rect' },
  { id: 'btn_keyboard', name: 'Keyboard', key: 'KEYBOARD', label: 'KBD', x: 85, y: 6, width: 52, height: 34, opacity: 0.6, shape: 'rect' },
  
  // Inventory and Drop
  { id: 'btn_inv', name: 'Inventory (E)', key: 'E', label: 'INV', x: 92, y: 38, width: 54, height: 54, opacity: 0.75, shape: 'rect' },
  { id: 'btn_drop', name: 'Drop Item (Q)', key: 'Q', label: 'DROP', x: 92, y: 24, width: 48, height: 36, opacity: 0.55, shape: 'rect' },
  { id: 'btn_zoom', name: 'Zoom (C)', key: 'ZOOM', label: 'ZOOM', x: 6, y: 44, width: 52, height: 38, opacity: 0.55, shape: 'rect' },
];

export const PVP_CLAW_BUTTONS: TouchButton[] = [
  ...POJAV_DEFAULT_BUTTONS.map(b => {
    if (b.id === 'btn_attack') return { ...b, x: 76, y: 36, width: 72, height: 72, opacity: 0.85 };
    if (b.id === 'btn_jump') return { ...b, x: 88, y: 55, width: 72, height: 72, opacity: 0.85 };
    if (b.id === 'btn_use') return { ...b, x: 65, y: 52, width: 64, height: 64, opacity: 0.8 };
    return b;
  })
];

export const PRESET_LAYOUTS: PojavControlLayout[] = [
  {
    id: 'pojav_default',
    name: 'PojavLauncher Standard',
    version: 4,
    buttons: POJAV_DEFAULT_BUTTONS,
    mouseSpeed: 1.0,
    hapticFeedback: true
  },
  {
    id: 'softly_pvp',
    name: 'Softly PvP Claw 4-Finger',
    version: 4,
    buttons: PVP_CLAW_BUTTONS,
    mouseSpeed: 1.25,
    hapticFeedback: true
  },
  {
    id: 'casual_tablet',
    name: 'Tablet Wide Screen',
    version: 4,
    buttons: POJAV_DEFAULT_BUTTONS.map(b => ({ ...b, opacity: 0.5, width: b.width * 1.1, height: b.height * 1.1 })),
    mouseSpeed: 0.9,
    hapticFeedback: false
  }
];

export function exportPojavJson(layout: PojavControlLayout): string {
  // Generates JSON structure compatible with PojavLauncher controlmap
  const pojavData = {
    version: layout.version || 4,
    mControlDataVersion: 1,
    name: layout.name,
    mouseSpeed: layout.mouseSpeed,
    haptic: layout.hapticFeedback,
    mControlDataList: layout.buttons.map(b => ({
      name: b.name,
      keycodes: [mapKeyToPojavCode(b.key)],
      properties: [
        b.x, // posX
        b.y, // posY
        b.width, // width
        b.height, // height
        Math.round(b.opacity * 100), // opacity
        b.shape === 'circle' ? 1 : 0, // isRound
        b.toggle ? 1 : 0 // isToggle
      ]
    }))
  };
  return JSON.stringify(pojavData, null, 2);
}

function mapKeyToPojavCode(key: string): number {
  const codes: Record<string, number> = {
    'W': 87, 'A': 65, 'S': 83, 'D': 68,
    'SPACE': 32, 'SHIFT': 16, 'CTRL': 17,
    'LMB': -100, 'RMB': -99, 'E': 69, 'T': 84,
    'Q': 81, 'F': 70, 'F3': 114, 'F5': 116,
    'ESC': 27, 'ZOOM': 67
  };
  return codes[key] || 0;
}
