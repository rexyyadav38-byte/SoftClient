import * as THREE from 'three';
import { BlockType } from './textures';

// First person Steve Arm and Item
export class PlayerHand {
  public group: THREE.Group;
  private armMesh: THREE.Mesh;
  private heldItemMesh: THREE.Mesh | null = null;
  private swingProgress: number = 0;
  private isSwinging: boolean = false;
  private bobTime: number = 0;

  constructor() {
    this.group = new THREE.Group();

    // Procedural Steve Arm
    const armGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    // Steve skin tone / cyan shirt sleeve
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xb5825a, roughness: 0.8 });
    const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x009ea0, roughness: 0.8 });
    
    // Top is sleeve, rest is arm
    const mats = [skinMat, skinMat, sleeveMat, skinMat, skinMat, skinMat];
    this.armMesh = new THREE.Mesh(armGeo, mats);
    this.armMesh.position.set(0.35, -0.35, -0.6);
    this.armMesh.rotation.set(-0.3, 0.2, -0.15);
    this.group.add(this.armMesh);

    // Initial item: Diamond Sword
    this.setHeldBlock('diamond');
  }

  public setHeldBlock(blockType: BlockType | 'sword') {
    if (this.heldItemMesh) {
      this.armMesh.remove(this.heldItemMesh);
      this.heldItemMesh = null;
    }

    if (blockType === 'sword') {
      // Procedural Diamond Sword
      const swordGroup = new THREE.Group();
      const bladeGeo = new THREE.BoxGeometry(0.06, 0.5, 0.02);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x4be3d5, roughness: 0.3, metalness: 0.6 });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(0, 0.35, 0);

      const crossbarGeo = new THREE.BoxGeometry(0.22, 0.04, 0.04);
      const crossbarMat = new THREE.MeshStandardMaterial({ color: 0x227870, roughness: 0.5 });
      const crossbar = new THREE.Mesh(crossbarGeo, crossbarMat);
      crossbar.position.set(0, 0.1, 0);

      const handleGeo = new THREE.BoxGeometry(0.04, 0.16, 0.04);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
      const handle = new THREE.Mesh(handleGeo, handleMat);

      swordGroup.add(blade);
      swordGroup.add(crossbar);
      swordGroup.add(handle);
      swordGroup.position.set(0, 0.3, -0.1);
      swordGroup.rotation.set(-0.4, 0, 0);

      this.armMesh.add(swordGroup);
      this.heldItemMesh = swordGroup as any;
    } else {
      // Mini voxel block in hand
      const miniGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
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
      const miniMat = new THREE.MeshStandardMaterial({
        color: colorMap[blockType] || 0x5cf2e3,
        roughness: 0.6
      });
      const miniBlock = new THREE.Mesh(miniGeo, miniMat);
      miniBlock.position.set(-0.02, 0.35, -0.05);
      miniBlock.rotation.set(0.3, 0.5, 0.2);
      this.armMesh.add(miniBlock);
      this.heldItemMesh = miniBlock;
    }
  }

  public swing() {
    this.isSwinging = true;
    this.swingProgress = 0;
  }

  public update(dt: number, isMoving: boolean) {
    // Walking hand bobbing
    if (isMoving) {
      this.bobTime += dt * 10;
    } else {
      this.bobTime += dt * 2; // subtle idle breathing
    }

    const bobX = Math.sin(this.bobTime * 0.5) * (isMoving ? 0.02 : 0.005);
    const bobY = Math.abs(Math.sin(this.bobTime)) * (isMoving ? 0.03 : 0.008);

    // Swing animation
    let swingRotX = 0;
    let swingRotY = 0;
    let swingPosZ = 0;

    if (this.isSwinging) {
      this.swingProgress += dt * 5; // ~0.2s duration
      if (this.swingProgress >= 1) {
        this.swingProgress = 0;
        this.isSwinging = false;
      } else {
        const sinProg = Math.sin(this.swingProgress * Math.PI);
        swingRotX = -sinProg * 0.9;
        swingRotY = sinProg * 0.4;
        swingPosZ = sinProg * 0.15;
      }
    }

    this.armMesh.position.set(0.35 + bobX, -0.35 - bobY, -0.6 + swingPosZ);
    this.armMesh.rotation.set(-0.3 + swingRotX, 0.2 + swingRotY, -0.15);
  }
}
