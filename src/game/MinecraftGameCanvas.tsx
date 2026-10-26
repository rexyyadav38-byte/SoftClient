import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { VoxelWorld } from './world';
import { MinecraftPlayer } from './player';
import { BlockType } from './textures';
import { PojavControlLayout, ClientHudSettings } from '../types/launcher';
import { sound } from './audio';
import { 
  Compass, Eye, Play, Shield, Zap, RefreshCw, X, Settings2, Sliders, Volume2, VolumeX, Maximize2, Move 
} from 'lucide-react';

interface MinecraftGameCanvasProps {
  layout: PojavControlLayout;
  hudSettings: ClientHudSettings;
  versionName: string;
  onExit: () => void;
  onOpenControlsEditor: () => void;
}

export const MinecraftGameCanvas: React.FC<MinecraftGameCanvasProps> = ({
  layout,
  hudSettings,
  versionName,
  onExit,
  onOpenControlsEditor
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<MinecraftPlayer | null>(null);
  const isPointerLocked = useRef<boolean>(false);
  const activeTouches = useRef<Map<number, { startX: number; startY: number; lastX: number; lastY: number; isLook: boolean }>>(new Map());

  // HUD and telemetry state
  const [fps, setFps] = useState<number>(60);
  const [cpsLmb, setCpsLmb] = useState<number>(0);
  const [cpsRmb, setCpsRmb] = useState<number>(0);
  const [coords, setCoords] = useState<{ x: string; y: string; z: string; facing: string }>({ x: '0', y: '10', z: '0', facing: 'South' });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showF3, setShowF3] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted());
  const [selectedSlot, setSelectedSlot] = useState<number>(0);

  // CPS Click tracking timestamps
  const lmbClicks = useRef<number[]>([]);
  const rmbClicks = useRef<number[]>([]);

  // Keystrokes state for real-time visual feedback
  const [heldKeys, setHeldKeys] = useState<{
    w: boolean;
    a: boolean;
    s: boolean;
    d: boolean;
    space: boolean;
    lmb: boolean;
    rmb: boolean;
  }>({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    lmb: false,
    rmb: false
  });

  // Hotbar items
  const hotbarItems: Array<{ type: BlockType | 'sword'; name: string; count: number; icon: string }> = [
    { type: 'diamond', name: 'Diamond Block', count: 64, icon: '💎' },
    { type: 'grass', name: 'Grass Block', count: 64, icon: '🟩' },
    { type: 'planks', name: 'Oak Planks', count: 64, icon: '🪵' },
    { type: 'stone', name: 'Stone', count: 64, icon: '🪨' },
    { type: 'log', name: 'Oak Log', count: 32, icon: '🌲' },
    { type: 'leaves', name: 'Oak Leaves', count: 64, icon: '🍃' },
    { type: 'sand', name: 'Sand', count: 64, icon: '🏖️' },
    { type: 'dirt', name: 'Dirt', count: 64, icon: '🟫' },
    { type: 'sword', name: 'Diamond Sword', count: 1, icon: '🗡️' },
  ];

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // 1. Detect software WebGL as instructed by threejs skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Three.js scene & renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x82b5e8); // Sky blue
    scene.fog = new THREE.Fog(0x82b5e8, 20, 48);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. PMREM Studio environment reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig
    const sunLight = new THREE.DirectionalLight(0xfff4e0, 1.4);
    sunLight.position.set(25, 40, 20);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 80;
    const d = 20;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x82b5e8, 0x556b2f, 0.7);
    scene.add(hemiLight);

    // 5. Initialize World and Player
    const world = new VoxelWorld(scene);
    const player = new MinecraftPlayer(world);
    player.camera.aspect = width / height;
    player.camera.updateProjectionMatrix();
    scene.add(player.camera);
    playerRef.current = player;

    // 6. Animation Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();

    const tick = (currentTime: number) => {
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const dt = Math.min(rawDt, 0.05);

      // FPS calculation
      frameCount++;
      if (currentTime - fpsTimer >= 500) {
        setFps(Math.round((frameCount * 1000) / (currentTime - fpsTimer)));
        frameCount = 0;
        fpsTimer = currentTime;

        // Clean up CPS clicks older than 1000ms
        const now = Date.now();
        lmbClicks.current = lmbClicks.current.filter(t => now - t <= 1000);
        rmbClicks.current = rmbClicks.current.filter(t => now - t <= 1000);
        setCpsLmb(lmbClicks.current.length);
        setCpsRmb(rmbClicks.current.length);

        // Update player coordinates
        const px = player.position.x.toFixed(1);
        const py = player.position.y.toFixed(1);
        const pz = player.position.z.toFixed(1);
        const deg = ((player.yaw * 180) / Math.PI + 360) % 360;
        let facing = 'South';
        if (deg >= 45 && deg < 135) facing = 'West';
        else if (deg >= 135 && deg < 225) facing = 'North';
        else if (deg >= 225 && deg < 315) facing = 'East';

        setCoords({ x: px, y: py, z: pz, facing });
      }

      if (!isPaused) {
        player.update(dt);
        world.updateParticles(dt);
      }

      renderer.render(scene, player.camera);
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    // 7. Resize handling
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      player.camera.aspect = w / h;
      player.camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 8. Desktop Keyboard Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'Escape') {
        setIsPaused(prev => !prev);
        return;
      }
      if (e.key === 'F3') {
        setShowF3(prev => !prev);
        e.preventDefault();
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'w') { player.input.forward = true; setHeldKeys(k => ({ ...k, w: true })); }
      if (key === 's') { player.input.backward = true; setHeldKeys(k => ({ ...k, s: true })); }
      if (key === 'a') { player.input.left = true; setHeldKeys(k => ({ ...k, a: true })); }
      if (key === 'd') { player.input.right = true; setHeldKeys(k => ({ ...k, d: true })); }
      if (key === ' ') { player.input.jump = true; setHeldKeys(k => ({ ...k, space: true })); }
      if (e.shiftKey) player.input.sneak = true;
      if (e.ctrlKey) player.input.sprint = true;

      // Number keys 1-9 for hotbar selection
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        setSelectedSlot(num - 1);
        player.setSelectedBlock(hotbarItems[num - 1].type);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w') { player.input.forward = false; setHeldKeys(k => ({ ...k, w: false })); }
      if (key === 's') { player.input.backward = false; setHeldKeys(k => ({ ...k, s: false })); }
      if (key === 'a') { player.input.left = false; setHeldKeys(k => ({ ...k, a: false })); }
      if (key === 'd') { player.input.right = false; setHeldKeys(k => ({ ...k, d: false })); }
      if (key === ' ') { player.input.jump = false; setHeldKeys(k => ({ ...k, space: false })); }
      if (!e.shiftKey) player.input.sneak = false;
      if (!e.ctrlKey) player.input.sprint = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 9. Pointer Lock for Desktop Mouse Look
    const canvasEl = renderer.domElement;
    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvasEl;
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    const handleMouseMove = (e: MouseEvent) => {
      if (isPointerLocked.current && !isPaused) {
        const sensitivity = 0.0022 * layout.mouseSpeed;
        player.setRotation(e.movementX * sensitivity, e.movementY * sensitivity);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleMouseDown = (e: MouseEvent) => {
      if (!isPointerLocked.current && !isPaused) {
        canvasEl.requestPointerLock?.();
      }
      if (e.button === 0) { // Left Click
        player.input.attack = true;
        lmbClicks.current.push(Date.now());
        setHeldKeys(k => ({ ...k, lmb: true }));
      } else if (e.button === 2) { // Right Click
        e.preventDefault();
        player.input.use = true;
        rmbClicks.current.push(Date.now());
        setHeldKeys(k => ({ ...k, rmb: true }));
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        player.input.attack = false;
        setHeldKeys(k => ({ ...k, lmb: false }));
      } else if (e.button === 2) {
        player.input.use = false;
        setHeldKeys(k => ({ ...k, rmb: false }));
      }
    };

    canvasEl.addEventListener('mousedown', handleMouseDown);
    canvasEl.addEventListener('mouseup', handleMouseUp);
    canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('mousemove', handleMouseMove);
      canvasEl.removeEventListener('mousedown', handleMouseDown);
      canvasEl.removeEventListener('mouseup', handleMouseUp);
      world.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [layout.mouseSpeed]);

  // Touch Swipe for Mobile Camera Look (Touch Screen gesture look)
  const handleTouchStart = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // If touch is on right half or center of screen and not on a button, use it for camera look
      activeTouches.current.set(touch.identifier, {
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        lastY: touch.clientY,
        isLook: true
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!playerRef.current || isPaused) return;
    const sensitivity = 0.0035 * layout.mouseSpeed;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const entry = activeTouches.current.get(touch.identifier);
      if (entry && entry.isLook) {
        const dx = touch.clientX - entry.lastX;
        const dy = touch.clientY - entry.lastY;
        playerRef.current.setRotation(dx * sensitivity, dy * sensitivity);
        entry.lastX = touch.clientX;
        entry.lastY = touch.clientY;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      activeTouches.current.delete(e.changedTouches[i].identifier);
    }
  };

  // Trigger button actions from on-screen Pojav buttons
  const triggerTouchAction = (key: string, active: boolean) => {
    if (!playerRef.current) return;
    if (layout.hapticFeedback && active && navigator.vibrate) {
      navigator.vibrate(12);
    }

    switch (key) {
      case 'W':
        playerRef.current.input.forward = active;
        setHeldKeys(k => ({ ...k, w: active }));
        break;
      case 'S':
        playerRef.current.input.backward = active;
        setHeldKeys(k => ({ ...k, s: active }));
        break;
      case 'A':
        playerRef.current.input.left = active;
        setHeldKeys(k => ({ ...k, a: active }));
        break;
      case 'D':
        playerRef.current.input.right = active;
        setHeldKeys(k => ({ ...k, d: active }));
        break;
      case 'SPACE':
        playerRef.current.input.jump = active;
        setHeldKeys(k => ({ ...k, space: active }));
        break;
      case 'SHIFT':
        playerRef.current.input.sneak = active;
        break;
      case 'CTRL':
        playerRef.current.input.sprint = active;
        break;
      case 'LMB':
        playerRef.current.input.attack = active;
        if (active) lmbClicks.current.push(Date.now());
        setHeldKeys(k => ({ ...k, lmb: active }));
        break;
      case 'RMB':
        playerRef.current.input.use = active;
        if (active) rmbClicks.current.push(Date.now());
        setHeldKeys(k => ({ ...k, rmb: active }));
        break;
      case 'F3':
        if (active) setShowF3(prev => !prev);
        break;
      case 'ESC':
        if (active) setIsPaused(prev => !prev);
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none touch-control-area">
      {/* 3D WebGL Canvas Mount Container */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-crosshair"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* --- IN-GAME CLIENT HUD OVERLAY (FEATHER / LUNAR STYLE) --- */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
        {/* Top Header Cluster */}
        <div className="flex justify-between items-start">
          {/* Top-Left: FPS, Frame Time, Coords */}
          <div className="flex flex-col gap-1.5 font-mono text-xs">
            {hudSettings.showFps && (
              <div className="px-2.5 py-1 bg-slate-900/80 rounded border border-white/10 text-emerald-400 font-bold backdrop-blur-sm flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="tabular-nums">{fps}</span> FPS
                <span className="text-slate-400 font-normal ml-1">({(1000 / (fps || 60)).toFixed(1)}ms)</span>
              </div>
            )}

            {hudSettings.showCoords && (
              <div className="px-2.5 py-1 bg-slate-900/80 rounded border border-white/10 text-slate-200 backdrop-blur-sm shadow-lg flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>XYZ: <span className="text-cyan-300 font-bold tabular-nums">{coords.x} / {coords.y} / {coords.z}</span></span>
                <span className="text-slate-400">({coords.facing})</span>
              </div>
            )}

            {/* F3 Debug Screen if toggled */}
            {showF3 && (
              <div className="p-2.5 bg-black/85 rounded border border-emerald-500/30 text-emerald-300 text-[11px] leading-tight max-w-sm backdrop-blur-sm space-y-1 shadow-2xl">
                <p className="font-bold text-white">Softly Client 2.4.0 (Minecraft {versionName})</p>
                <p>JVM: OpenJDK 64-Bit Server VM 21.0.3 (ARM64-v8a)</p>
                <p>Mem: 34% 1392/4096MB (Allocated: Safe Android)</p>
                <p>Renderer: Adreno 740 (GL4ES / Zink Vulkan)</p>
                <p>Chunk: 24x24 Voxel Mesh · Biome: Plains</p>
                <p>Light: 15 (15 sky, 0 block)</p>
              </div>
            )}
          </div>

          {/* Top-Right: Keystrokes & CPS Display */}
          <div className="flex flex-col items-end gap-2">
            {hudSettings.showKeystrokes && (
              <div className="bg-slate-950/80 p-2 rounded-lg border border-white/10 shadow-xl backdrop-blur-sm flex flex-col items-center gap-1 font-mono">
                {/* W key */}
                <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm transition-colors ${
                  heldKeys.w ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'bg-slate-800/90 text-white border border-white/15'
                }`}>
                  W
                </div>
                {/* A S D keys */}
                <div className="flex gap-1">
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm transition-colors ${
                    heldKeys.a ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'bg-slate-800/90 text-white border border-white/15'
                  }`}>
                    A
                  </div>
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm transition-colors ${
                    heldKeys.s ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'bg-slate-800/90 text-white border border-white/15'
                  }`}>
                    S
                  </div>
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm transition-colors ${
                    heldKeys.d ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'bg-slate-800/90 text-white border border-white/15'
                  }`}>
                    D
                  </div>
                </div>
                {/* LMB / RMB with CPS */}
                {hudSettings.showCps && (
                  <div className="flex gap-1 w-full text-[10px]">
                    <div className={`flex-1 py-1 px-1 rounded flex flex-col items-center justify-center font-bold transition-colors ${
                      heldKeys.lmb ? 'bg-cyan-500 text-black' : 'bg-slate-800/90 text-white border border-white/15'
                    }`}>
                      <span>LMB</span>
                      <span className="tabular-nums text-[9px]">{cpsLmb} CPS</span>
                    </div>
                    <div className={`flex-1 py-1 px-1 rounded flex flex-col items-center justify-center font-bold transition-colors ${
                      heldKeys.rmb ? 'bg-cyan-500 text-black' : 'bg-slate-800/90 text-white border border-white/15'
                    }`}>
                      <span>RMB</span>
                      <span className="tabular-nums text-[9px]">{cpsRmb} CPS</span>
                    </div>
                  </div>
                )}
                {/* Space bar */}
                <div className={`w-full h-4 rounded flex items-center justify-center font-bold text-[9px] transition-colors ${
                  heldKeys.space ? 'bg-cyan-500 text-black' : 'bg-slate-800/90 text-slate-300 border border-white/15'
                }`}>
                  ─────
                </div>
              </div>
            )}

            {/* Armor HUD */}
            {hudSettings.showArmor && (
              <div className="bg-slate-900/75 p-1.5 rounded border border-white/10 shadow-lg text-xs flex gap-2 items-center">
                <span title="Diamond Helmet">🪖 98%</span>
                <span title="Diamond Chestplate">🦺 94%</span>
                <span title="Diamond Leggings">👖 92%</span>
                <span title="Diamond Boots">👢 89%</span>
              </div>
            )}
          </div>
        </div>

        {/* Center Custom Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          {hudSettings.crosshairStyle === 'dot' ? (
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_black]"></div>
          ) : hudSettings.crosshairStyle === 'circle' ? (
            <div className="w-5 h-5 rounded-full border border-white/80 shadow-[0_0_4px_black]"></div>
          ) : (
            <div className="relative w-4 h-4 flex items-center justify-center">
              <div className="absolute w-4 h-0.5 bg-white shadow-[0_0_2px_black]"></div>
              <div className="absolute h-4 w-0.5 bg-white shadow-[0_0_2px_black]"></div>
            </div>
          )}
        </div>

        {/* Bottom Cluster: Health, Hunger, and Minecraft Hotbar */}
        <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
          {/* Hearts and Food row */}
          <div className="flex justify-between w-72 text-sm select-none">
            <div className="flex text-rose-500 text-xs">
              {'❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️'}
            </div>
            <div className="text-amber-500 text-xs">
              {'🍗🍗🍗🍗🍗🍗🍗🍗🍗🍗'}
            </div>
          </div>

          {/* Minecraft 9-slot Hotbar */}
          <div className="bg-slate-950/85 p-1 rounded-xl border-2 border-slate-700 shadow-2xl flex gap-1 items-center backdrop-blur-md">
            {hotbarItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedSlot(idx);
                  playerRef.current?.setSelectedBlock(item.type);
                }}
                className={`relative w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                  selectedSlot === idx
                    ? 'border-2 border-cyan-400 bg-cyan-950/60 shadow-[0_0_12px_rgba(6,182,212,0.5)] scale-105'
                    : 'border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80'
                }`}
              >
                <span>{item.icon}</span>
                {item.count > 1 && (
                  <span className="absolute bottom-0.5 right-1 text-[10px] font-mono font-bold text-white mc-text-shadow">
                    {item.count}
                  </span>
                )}
                <span className="absolute top-0.5 left-1 text-[8px] font-mono text-slate-400">
                  {idx + 1}
                </span>
              </button>
            ))}
          </div>

          {/* Flat hint line as mandated by game craft guidelines */}
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-1">
            <span>WASD Move · Space Jump · Click / Touch Break & Place · Esc Pause</span>
          </div>
        </div>
      </div>

      {/* --- POJAVLAUNCHER TOUCH BUTTONS OVERLAY --- */}
      <div className="absolute inset-0 pointer-events-none">
        {layout.buttons.map(btn => (
          <button
            key={btn.id}
            onPointerDown={(e) => {
              e.preventDefault();
              triggerTouchAction(btn.key, true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              triggerTouchAction(btn.key, false);
            }}
            onPointerLeave={() => triggerTouchAction(btn.key, false)}
            style={{
              position: 'absolute',
              left: `${btn.x}%`,
              top: `${btn.y}%`,
              width: `${btn.width}px`,
              height: `${btn.height}px`,
              opacity: btn.opacity,
              borderRadius: btn.shape === 'circle' ? '9999px' : '8px',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
            }}
            className="bg-slate-900/70 border border-white/30 text-white font-mono text-xs font-bold active:bg-cyan-500/60 active:border-cyan-300 active:scale-95 flex items-center justify-center shadow-lg transition-transform backdrop-blur-[2px]"
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* --- PAUSE / ESC MENU MODAL --- */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="feather-card max-w-md w-full p-6 rounded-2xl border border-white/15 text-center shadow-2xl flex flex-col items-center">
            <h2 className="text-2xl font-black text-white tracking-wide mb-1">
              GAME PAUSED
            </h2>
            <p className="text-xs text-slate-400 font-mono mb-6">
              Softly Client · Java 21 · {versionName}
            </p>

            <div className="w-full space-y-3 font-semibold text-sm">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Back to Game
              </button>

              <button
                onClick={() => {
                  setIsPaused(false);
                  onOpenControlsEditor();
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Move className="w-4 h-4 text-cyan-400" />
                Customize Touch Controls
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const next = !isMuted;
                    sound.setMuted(next);
                    setIsMuted(next);
                  }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 text-xs"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  {isMuted ? 'Unmute Audio' : 'Mute Audio'}
                </button>

                <button
                  onClick={() => setShowF3(prev => !prev)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  Toggle F3 Debug
                </button>
              </div>

              <button
                onClick={onExit}
                className="w-full py-3 bg-rose-950/70 hover:bg-rose-900 text-rose-200 rounded-xl border border-rose-500/30 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <X className="w-4 h-4" />
                Save and Quit to Softly Launcher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
