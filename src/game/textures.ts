import * as THREE from 'three';

// Procedurally generate 16x16 pixel-art textures using HTML5 canvas
function createPixelTexture(
  drawFn: (ctx: CanvasRenderingContext2D, size: number) => void,
  size = 32
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  drawFn(ctx, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 1. Grass Top
export const grassTopTexture = createPixelTexture((ctx, size) => {
  const p = size / 16;
  const colors = ['#5b8f32', '#4e7b2b', '#6ba33b', '#54832e', '#477027'];
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const idx = Math.floor(Math.random() * colors.length);
      ctx.fillStyle = colors[idx];
      ctx.fillRect(x * p, y * p, p, p);
    }
  }
});

// 2. Dirt
export const dirtTexture = createPixelTexture((ctx, size) => {
  const p = size / 16;
  const colors = ['#866043', '#77543a', '#684832', '#91694a', '#5c3e29'];
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const idx = Math.floor(Math.random() * colors.length);
      ctx.fillStyle = colors[idx];
      ctx.fillRect(x * p, y * p, p, p);
    }
  }
});

// 3. Grass Side (Dirt with dripping grass top)
export const grassSideTexture = createPixelTexture((ctx, size) => {
  const p = size / 16;
  const dirtColors = ['#866043', '#77543a', '#684832', '#91694a'];
  const grassColors = ['#5b8f32', '#4e7b2b', '#6ba33b'];

  for (let x = 0; x < 16; x++) {
    const grassDepth = 3 + Math.floor(Math.sin(x * 1.5) * 1.8 + Math.random() * 1.5);
    for (let y = 0; y < 16; y++) {
      if (y <= grassDepth) {
        ctx.fillStyle = grassColors[Math.floor(Math.random() * grassColors.length)];
      } else {
        ctx.fillStyle = dirtColors[Math.floor(Math.random() * dirtColors.length)];
      }
      ctx.fillRect(x * p, y * p, p, p);
    }
  }
});

// 4. Stone
export const stoneTexture = createPixelTexture((ctx, size) => {
  const p = size / 16;
  const colors = ['#757575', '#6b6b6b', '#828282', '#5e5e5e', '#8c8c8c'];
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const idx = Math.floor(Math.random() * colors.length);
      ctx.fillStyle = colors[idx];
      ctx.fillRect(x * p, y * p, p, p);
    }
  }
});

// 5. Oak Planks
export const planksTexture = createPixelTexture((ctx, size) => {
  const p = size / 16;
  const base = ['#b8945f', '#a98553', '#c29d66', '#9c7b4c'];
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const isDivider = y % 4 === 0 || ((x % 8 === 0) && (Math.floor(y / 4) % 2 === 0));
      if (isDivider) {
        ctx.fillStyle = '#6e5330';
      } else {
        ctx.fillStyle = base[Math.floor(Math.random() * base.length)];
      }
      ctx.fillRect(x * p, y * p, p, p);
    }
  }
});

// 6. Oak Leaves
export const leavesTexture = createPixelTexture((ctx, size) => {
  const p = size / 16;
  const colors = ['#2e6b20', '#3b8529', '#245719', '#469c31'];
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      if (Math.random() > 0.15) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(x * p, y * p, p, p);
      }
    }
  }
});

// 7. Oak Log Side
export const logSideTexture = createPixelTexture((ctx, size) => {
  const p = size / 16;
  const barks = ['#6b5333', '#574227', '#7a603c', '#46351e'];
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      ctx.fillStyle = barks[Math.floor(Math.random() * barks.length)];
      ctx.fillRect(x * p, y * p, p, p);
    }
  }
});

// 8. Diamond Block
export const diamondTexture = createPixelTexture((ctx, size) => {
  const p = size / 16;
  const colors = ['#5cf2e3', '#4de0d1', '#7af8ec', '#3bc4b6', '#2aa89b'];
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const isBorder = x === 0 || x === 15 || y === 0 || y === 15;
      if (isBorder) {
        ctx.fillStyle = '#268a7f';
      } else {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      }
      ctx.fillRect(x * p, y * p, p, p);
    }
  }
});

// 9. Sand
export const sandTexture = createPixelTexture((ctx, size) => {
  const p = size / 16;
  const colors = ['#dbcb9e', '#cfbe8f', '#e6d8ae', '#c4b281'];
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillRect(x * p, y * p, p, p);
    }
  }
});

export type BlockType = 'grass' | 'dirt' | 'stone' | 'planks' | 'log' | 'leaves' | 'diamond' | 'sand';

export interface BlockDef {
  id: BlockType;
  name: string;
  materials: THREE.Material[];
  iconColor: string;
}

export function createBlockMaterials(): Record<BlockType, THREE.Material[]> {
  const rough = 0.9;
  const metal = 0.05;

  const matGrassTop = new THREE.MeshStandardMaterial({ map: grassTopTexture, roughness: rough, metalness: metal });
  const matGrassSide = new THREE.MeshStandardMaterial({ map: grassSideTexture, roughness: rough, metalness: metal });
  const matDirt = new THREE.MeshStandardMaterial({ map: dirtTexture, roughness: rough, metalness: metal });
  const matStone = new THREE.MeshStandardMaterial({ map: stoneTexture, roughness: 0.8, metalness: 0.1 });
  const matPlanks = new THREE.MeshStandardMaterial({ map: planksTexture, roughness: rough, metalness: metal });
  const matLeaves = new THREE.MeshStandardMaterial({ map: leavesTexture, roughness: 0.7, transparent: true, alphaTest: 0.5 });
  const matLogSide = new THREE.MeshStandardMaterial({ map: logSideTexture, roughness: rough, metalness: metal });
  const matLogTop = new THREE.MeshStandardMaterial({ map: planksTexture, roughness: rough, metalness: metal });
  const matDiamond = new THREE.MeshStandardMaterial({ map: diamondTexture, roughness: 0.3, metalness: 0.6 });
  const matSand = new THREE.MeshStandardMaterial({ map: sandTexture, roughness: 0.95, metalness: 0.0 });

  return {
    grass: [matGrassSide, matGrassSide, matGrassTop, matDirt, matGrassSide, matGrassSide],
    dirt: [matDirt, matDirt, matDirt, matDirt, matDirt, matDirt],
    stone: [matStone, matStone, matStone, matStone, matStone, matStone],
    planks: [matPlanks, matPlanks, matPlanks, matPlanks, matPlanks, matPlanks],
    log: [matLogSide, matLogSide, matLogTop, matLogTop, matLogSide, matLogSide],
    leaves: [matLeaves, matLeaves, matLeaves, matLeaves, matLeaves, matLeaves],
    diamond: [matDiamond, matDiamond, matDiamond, matDiamond, matDiamond, matDiamond],
    sand: [matSand, matSand, matSand, matSand, matSand, matSand],
  };
}
