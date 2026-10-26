import * as THREE from 'three';
import { VoxelWorld } from './world';
import { PlayerHand } from './hand';
import { sound } from './audio';
import { BlockType } from './textures';

export interface PlayerInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sneak: boolean;
  sprint: boolean;
  attack: boolean;
  use: boolean;
}

export class MinecraftPlayer {
  public camera: THREE.PerspectiveCamera;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public hand: PlayerHand;
  public world: VoxelWorld;

  public yaw: number = 0;
  public pitch: number = 0;
  public isGrounded: boolean = false;
  private stepDistance: number = 0;
  private raycaster: THREE.Raycaster;

  public targetedBlock: { x: number; y: number; z: number; normal: THREE.Vector3 } | null = null;
  public selectedBlockType: BlockType | 'sword' = 'diamond';

  public input: PlayerInput = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sneak: false,
    sprint: false,
    attack: false,
    use: false
  };

  private prevAttack: boolean = false;
  private prevUse: boolean = false;

  constructor(world: VoxelWorld) {
    this.world = world;
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    this.position = new THREE.Vector3(0, 10, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.hand = new PlayerHand();
    this.camera.add(this.hand.group);

    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 5.5; // Minecraft 5 block reach distance
  }

  public setRotation(deltaYaw: number, deltaPitch: number) {
    this.yaw -= deltaYaw;
    this.pitch -= deltaPitch;
    // Clamp vertical look to -89..+89 degrees
    this.pitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, this.pitch));
  }

  public update(dt: number) {
    // 1. Update Camera orientation
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // 2. Compute Movement Vectors
    const speed = this.input.sprint ? 6.5 : this.input.sneak ? 2.0 : 4.5;
    const moveDir = new THREE.Vector3();

    if (this.input.forward) moveDir.z -= 1;
    if (this.input.backward) moveDir.z += 1;
    if (this.input.left) moveDir.x -= 1;
    if (this.input.right) moveDir.x += 1;

    const isMoving = moveDir.lengthSq() > 0;
    if (isMoving) {
      moveDir.normalize();
      // Rotate by player yaw
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      this.velocity.x = moveDir.x * speed;
      this.velocity.z = moveDir.z * speed;
    } else {
      this.velocity.x *= 0.6; // friction
      this.velocity.z *= 0.6;
    }

    // 3. Jump and Gravity
    if (this.input.jump && this.isGrounded) {
      this.velocity.y = 8.0;
      this.isGrounded = false;
      sound.playStep(false);
    }

    this.velocity.y -= 22 * dt; // Gravity
    if (this.velocity.y < -30) this.velocity.y = -30; // Terminal velocity

    // 4. Collision with Voxel World
    this.moveWithCollision(dt);

    // 5. Camera Position
    const eyeHeight = this.input.sneak ? 1.45 : 1.62;
    this.camera.position.set(this.position.x, this.position.y + eyeHeight, this.position.z);

    // 6. Walking Audio
    if (this.isGrounded && isMoving) {
      this.stepDistance += Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z) * dt;
      if (this.stepDistance > (this.input.sprint ? 1.8 : 2.2)) {
        sound.playStep(false);
        this.stepDistance = 0;
      }
    }

    // 7. Raycast for targeted block
    this.updateTargetedBlock();

    // 8. Action inputs (Attack / Break & Use / Place)
    if (this.input.attack && !this.prevAttack) {
      this.hand.swing();
      sound.playSwing();
      if (this.targetedBlock) {
        this.world.breakBlock(this.targetedBlock.x, this.targetedBlock.y, this.targetedBlock.z);
        this.updateTargetedBlock(); // recheck
      }
    }

    if (this.input.use && !this.prevUse) {
      this.hand.swing();
      if (this.targetedBlock && this.selectedBlockType !== 'sword') {
        const placeX = this.targetedBlock.x + this.targetedBlock.normal.x;
        const placeY = this.targetedBlock.y + this.targetedBlock.normal.y;
        const placeZ = this.targetedBlock.z + this.targetedBlock.normal.z;

        // Check if placement intersects player body bounding box
        const playerMinX = this.position.x - 0.3;
        const playerMaxX = this.position.x + 0.3;
        const playerMinY = this.position.y;
        const playerMaxY = this.position.y + 1.8;
        const playerMinZ = this.position.z - 0.3;
        const playerMaxZ = this.position.z + 0.3;

        const intersectsPlayer = (
          placeX + 1 > playerMinX && placeX < playerMaxX &&
          placeY + 1 > playerMinY && placeY < playerMaxY &&
          placeZ + 1 > playerMinZ && placeZ < playerMaxZ
        );

        if (!intersectsPlayer) {
          this.world.placeBlock(placeX, placeY, placeZ, this.selectedBlockType);
          this.updateTargetedBlock();
        }
      }
    }

    this.prevAttack = this.input.attack;
    this.prevUse = this.input.use;

    // 9. Hand animation
    this.hand.update(dt, isMoving && this.isGrounded);
  }

  private moveWithCollision(dt: number) {
    const radius = 0.3;
    const height = 1.8;

    // Y Axis movement & collision
    this.position.y += this.velocity.y * dt;
    if (this.velocity.y < 0) {
      // Falling down: check blocks beneath player
      const blockUnderY = Math.floor(this.position.y);
      let hitGround = false;

      for (let dx = -radius; dx <= radius; dx += radius * 2) {
        for (let dz = -radius; dz <= radius; dz += radius * 2) {
          const bx = Math.floor(this.position.x + dx);
          const bz = Math.floor(this.position.z + dz);
          if (this.world.getBlock(bx, blockUnderY, bz)) {
            this.position.y = blockUnderY + 1.0;
            this.velocity.y = 0;
            hitGround = true;
            break;
          }
        }
        if (hitGround) break;
      }
      this.isGrounded = hitGround;
    } else if (this.velocity.y > 0) {
      // Jumping up: check blocks above head
      const blockAboveY = Math.floor(this.position.y + height);
      for (let dx = -radius; dx <= radius; dx += radius * 2) {
        for (let dz = -radius; dz <= radius; dz += radius * 2) {
          const bx = Math.floor(this.position.x + dx);
          const bz = Math.floor(this.position.z + dz);
          if (this.world.getBlock(bx, blockAboveY, bz)) {
            this.position.y = blockAboveY - height;
            this.velocity.y = 0;
            break;
          }
        }
      }
    }

    // X Axis movement & simple voxel pushout
    this.position.x += this.velocity.x * dt;
    const px = Math.floor(this.position.x);
    const py = Math.floor(this.position.y);
    const pz = Math.floor(this.position.z);
    if (this.world.getBlock(px, py, pz) || this.world.getBlock(px, py + 1, pz)) {
      this.position.x -= this.velocity.x * dt;
      this.velocity.x = 0;
    }

    // Z Axis movement & simple voxel pushout
    this.position.z += this.velocity.z * dt;
    const npx = Math.floor(this.position.x);
    const npz = Math.floor(this.position.z);
    if (this.world.getBlock(npx, py, npz) || this.world.getBlock(npx, py + 1, npz)) {
      this.position.z -= this.velocity.z * dt;
      this.velocity.z = 0;
    }

    // Void reset safeguard
    if (this.position.y < -10) {
      this.position.set(0, 12, 0);
      this.velocity.set(0, 0, 0);
    }
  }

  private updateTargetedBlock() {
    this.raycaster.set(this.camera.position, this.camera.getWorldDirection(new THREE.Vector3()));
    
    // Test against block meshes
    const meshes: THREE.Mesh[] = [];
    this.world.blocks.forEach(({ mesh }) => meshes.push(mesh));

    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const voxel = (hit.object as any).userData.voxelPos;
      const normal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);

      this.targetedBlock = {
        x: voxel.x,
        y: voxel.y,
        z: voxel.z,
        normal
      };

      this.world.selectionBox.visible = true;
      this.world.selectionBox.position.set(voxel.x + 0.5, voxel.y + 0.5, voxel.z + 0.5);
    } else {
      this.targetedBlock = null;
      this.world.selectionBox.visible = false;
    }
  }

  public setSelectedBlock(type: BlockType | 'sword') {
    this.selectedBlockType = type;
    this.hand.setHeldBlock(type);
  }
}
