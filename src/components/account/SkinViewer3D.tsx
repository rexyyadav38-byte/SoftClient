import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SkinViewer3DProps {
  skinType: 'steve' | 'alex' | 'softly' | 'enderman';
  capeType?: 'softly' | 'lunar' | 'migrator' | 'none';
  width?: number;
  height?: number;
}

export const SkinViewer3D: React.FC<SkinViewer3DProps> = ({
  skinType,
  capeType = 'softly',
  width = 240,
  height = 320
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 3.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Studio lights
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7090b0, 0.6);
    fillLight.position.set(-2, 1, -2);
    scene.add(fillLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Build 3D Minecraft Character Group
    const character = new THREE.Group();
    scene.add(character);

    // Materials based on skinType
    let headColor = 0xb5825a;
    let shirtColor = 0x009ea0;
    let pantsColor = 0x2b388f;
    let shoeColor = 0x484848;

    if (skinType === 'alex') {
      headColor = 0xe5b887;
      shirtColor = 0x5a8f4e;
      pantsColor = 0x6e5238;
    } else if (skinType === 'softly') {
      headColor = 0xdfb489;
      shirtColor = 0x1e1b4b; // Deep navy hoodie
      pantsColor = 0x0f172a;
    } else if (skinType === 'enderman') {
      headColor = 0x161616;
      shirtColor = 0x161616;
      pantsColor = 0x111111;
    }

    const matHead = new THREE.MeshStandardMaterial({ color: headColor, roughness: 0.8 });
    const matShirt = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.8 });
    const matPants = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });
    const matShoe = new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.8 });

    // 1. Head (8x8x8 pixels = 0.5 x 0.5 x 0.5 units)
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const head = new THREE.Mesh(headGeo, matHead);
    head.position.y = 0.85;
    character.add(head);

    // Face eyes
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.04, 0.02);
    const eyeMat = new THREE.MeshBasicMaterial({ color: skinType === 'enderman' ? 0xd946ef : 0x2563eb });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.12, 0.85, 0.252);
    character.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.12, 0.85, 0.252);
    character.add(rightEye);

    // 2. Torso (8x12x4 pixels = 0.5 x 0.75 x 0.25)
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.75, 0.25);
    const torso = new THREE.Mesh(torsoGeo, matShirt);
    torso.position.y = 0.225;
    character.add(torso);

    // Softly neon logo on chest if softly skin
    if (skinType === 'softly') {
      const logoGeo = new THREE.BoxGeometry(0.2, 0.1, 0.01);
      const logoMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const logo = new THREE.Mesh(logoGeo, logoMat);
      logo.position.set(0, 0.28, 0.13);
      character.add(logo);
    }

    // 3. Right & Left Arms (4x12x4 = 0.25 x 0.75 x 0.25)
    const armGeo = new THREE.BoxGeometry(0.24, 0.75, 0.24);
    const rightArm = new THREE.Mesh(armGeo, matShirt);
    rightArm.position.set(-0.38, 0.225, 0);
    character.add(rightArm);

    const leftArm = new THREE.Mesh(armGeo, matShirt);
    leftArm.position.set(0.38, 0.225, 0);
    character.add(leftArm);

    // 4. Legs (4x12x4 = 0.25 x 0.75 x 0.25)
    const legGeo = new THREE.BoxGeometry(0.24, 0.75, 0.24);
    const rightLeg = new THREE.Mesh(legGeo, matPants);
    rightLeg.position.set(-0.13, -0.525, 0);
    character.add(rightLeg);

    const leftLeg = new THREE.Mesh(legGeo, matPants);
    leftLeg.position.set(0.13, -0.525, 0);
    character.add(leftLeg);

    // 5. Cape (Billowing behind back)
    let capeMesh: THREE.Mesh | null = null;
    if (capeType !== 'none') {
      const capeGeo = new THREE.BoxGeometry(0.48, 0.85, 0.02);
      let capeColor = 0x06b6d4; // Softly Cyan
      if (capeType === 'lunar') capeColor = 0xa855f7; // Lunar Purple
      if (capeType === 'migrator') capeColor = 0xbe123c; // Red

      const capeMat = new THREE.MeshStandardMaterial({ color: capeColor, roughness: 0.6 });
      capeMesh = new THREE.Mesh(capeGeo, capeMat);
      capeMesh.position.set(0, 0.2, -0.16);
      capeMesh.rotation.x = 0.15; // angled back
      character.add(capeMesh);
    }

    // Interactive pointer drag to rotate
    let isDragging = false;
    let prevMouseX = 0;
    let targetRotationY = 0.3;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      targetRotationY += deltaX * 0.015;
      prevMouseX = e.clientX;
    };
    const onMouseUp = () => { isDragging = false; };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Smooth rotate towards target or idle turn
      if (!isDragging) {
        targetRotationY += 0.006;
      }
      character.rotation.y += (targetRotationY - character.rotation.y) * 0.1;

      // Subtle breathing & limb sway
      head.rotation.y = Math.sin(elapsed * 1.5) * 0.08;
      rightArm.rotation.x = Math.sin(elapsed * 2) * 0.08;
      leftArm.rotation.x = -Math.sin(elapsed * 2) * 0.08;

      if (capeMesh) {
        capeMesh.rotation.x = 0.18 + Math.sin(elapsed * 3) * 0.05;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [skinType, capeType, width, height]);

  return (
    <div 
      ref={mountRef} 
      className="cursor-grab active:cursor-grabbing flex items-center justify-center select-none"
      style={{ width, height }}
      title="Click and drag to rotate skin"
    />
  );
};
