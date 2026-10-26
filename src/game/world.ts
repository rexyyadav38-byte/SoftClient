import * as THREE from 'three';
import { BlockType, createBlockMaterials } from './textures';
import { sound } from './audio';

export interface VoxelKey {
  x: number;
  y: number;
  z: number;
}

export class VoxelWorld {
  public scene: THREE.Scene;
  public blocks: Map<string, { type: BlockType; mesh: THREE.Mesh }>;
  public blockMaterials: Record<BlockType, THREE.Material[]>;
  public selectionBox: THREE.LineSegments;
  public particleGroup: THREE.Group;
  private particles: Array<{ mesh: THREE.Mesh; vel: THREE.Vector3; life: number }> = [];

  public static readonly WORLD_SIZE = 24; // 24x24 chunk
  public static readonly WORLD_HEIGHT = 16;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.blocks = new Map();
    this.blockMaterials = createBlockMaterials();

    // Block selection wireframe outline
    const boxGeo = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    this.selectionBox = new THREE.LineSegments(edgesGeo, lineMat);
    this.selectionBox.visible = false;
    this.scene.add(this.selectionBox);

    // Particle group for crumbling blocks
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    this.generateTerrain();
  }

  private getKey(x: number, y: number, z: number): string {
    return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  }

  public getBlock(x: number, y: number, z: number): BlockType | null {
    const entry = this.blocks.get(this.getKey(x, y, z));
    return entry ? entry.type : null;
  }

  public setBlock(x: number, y: number, z: number, type: BlockType | null) {
    const key = this.getKey(x, y, z);
    const existing = this.blocks.get(key);

    if (existing) {
      this.scene.remove(existing.mesh);
      existing.mesh.geometry.dispose();
      this.blocks.delete(key);
    }

    if (type !== null) {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const mats = this.blockMaterials[type];
      const mesh = new THREE.Mesh(geo, mats);
      mesh.position.set(Math.floor(x) + 0.5, Math.floor(y) + 0.5, Math.floor(z) + 0.5);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { voxelPos: { x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) }, type };
      
      this.scene.add(mesh);
      this.blocks.set(key, { type, mesh });
    }
  }

  public breakBlock(x: number, y: number, z: number): BlockType | null {
    const type = this.getBlock(x, y, z);
    if (!type) return null;

    sound.playBreak();
    this.spawnBreakParticles(x, y, z, type);
    this.setBlock(x, y, z, null);
    return type;
  }

  public placeBlock(x: number, y: number, z: number, type: BlockType): boolean {
    if (this.getBlock(x, y, z)) return false; // spot occupied
    sound.playPlace();
    this.setBlock(x, y, z, type);
    return true;
  }

  private spawnBreakParticles(x: number, y: number, z: number, type: BlockType) {
    const particleGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    const colorMap: Record<BlockType, number> = {
      grass: 0x5b8f32,
      dirt: 0x866043,
      stone: 0x757575,
      planks: 0xb8945f,
      log: 0x6b5333,
      leaves: 0x2e6b20,
      diamond: 0x5cf2e3,
      sand: 0xdbcb9e
    };

    const mat = new THREE.MeshBasicMaterial({ color: colorMap[type] || 0x888888 });

    for (let i = 0; i < 10; i++) {
      const mesh = new THREE.Mesh(particleGeo, mat);
      mesh.position.set(
        x + 0.5 + (Math.random() - 0.5) * 0.7,
        y + 0.5 + (Math.random() - 0.5) * 0.7,
        z + 0.5 + (Math.random() - 0.5) * 0.7
      );
      this.particleGroup.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 3
      );

      this.particles.push({ mesh, vel, life: 0.6 });
    }
  }

  public updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particleGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.vel.y -= 9.8 * dt; // gravity
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += dt * 4;
      p.mesh.rotation.y += dt * 5;
    }
  }

  private generateTerrain() {
    const half = Math.floor(VoxelWorld.WORLD_SIZE / 2);

    for (let x = -half; x < half; x++) {
      for (let z = -half; z < half; z++) {
        // Natural gentle hills
        const distFromCenter = Math.sqrt(x * x + z * z);
        const elevation = Math.floor(
          3 + Math.sin(x * 0.25) * 1.5 + Math.cos(z * 0.25) * 1.5 + Math.sin((x + z) * 0.15) * 1.0
        );

        for (let y = 0; y <= elevation; y++) {
          if (y === elevation) {
            // Top layer is grass or sand near edges
            if (distFromCenter > half - 2) {
              this.setBlock(x, y, z, 'sand');
            } else {
              this.setBlock(x, y, z, 'grass');
            }
          } else if (y >= elevation - 2) {
            this.setBlock(x, y, z, 'dirt');
          } else {
            // Deeper is stone, with rare diamond ore
            if (y === 0 && Math.random() < 0.05) {
              this.setBlock(x, y, z, 'diamond');
            } else {
              this.setBlock(x, y, z, 'stone');
            }
          }
        }
      }
    }

    // Place natural Oak Trees
    const treePositions = [
      { x: -5, z: -4 },
      { x: 4, z: 6 },
      { x: -6, z: 5 },
      { x: 5, z: -5 },
    ];

    for (const pos of treePositions) {
      this.growTree(pos.x, pos.z);
    }
  }

  private growTree(x: number, z: number) {
    // Find highest block
    let groundY = 0;
    for (let y = VoxelWorld.WORLD_HEIGHT; y >= 0; y--) {
      if (this.getBlock(x, y, z)) {
        groundY = y + 1;
        break;
      }
    }

    // Trunk 4 blocks high
    const trunkHeight = 4;
    for (let y = 0; y < trunkHeight; y++) {
      this.setBlock(x, groundY + y, z, 'log');
    }

    // Foliage crown
    const crownBase = groundY + trunkHeight - 1;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = 0; dy <= 2; dy++) {
          if (Math.abs(dx) === 2 && Math.abs(dz) === 2 && (dy === 2 || Math.random() > 0.4)) {
            continue; // round corners
          }
          const lx = x + dx;
          const ly = crownBase + dy;
          const lz = z + dz;
          if (!this.getBlock(lx, ly, lz)) {
            this.setBlock(lx, ly, lz, 'leaves');
          }
        }
      }
    }
  }

  public dispose() {
    this.blocks.forEach(({ mesh }) => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    });
    this.blocks.clear();
    this.scene.remove(this.selectionBox);
    this.selectionBox.geometry.dispose();
    this.scene.remove(this.particleGroup);
  }
}
