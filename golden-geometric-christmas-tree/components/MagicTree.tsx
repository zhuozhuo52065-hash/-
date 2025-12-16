import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { AppState } from '../types';
import { 
  SPHERE_COUNT, 
  CUBE_COUNT, 
  COLOR_GOLD, 
  COLOR_RED, 
  COLOR_GREEN, 
  COLOR_DARK_GOLD,
  FONT_URL 
} from '../constants';
import { getConePosition, getSpherePosition, getTextPositions } from '../utils/geometryUtils';

interface MagicTreeProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

const MagicTree: React.FC<MagicTreeProps> = ({ appState, setAppState }) => {
  const font = useLoader(FontLoader, FONT_URL);
  
  const spheresRef = useRef<THREE.InstancedMesh>(null);
  const cubesRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const starRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  // Temporary object for matrix calculations
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // -- Data Generation --
  
  // 1. Target positions for TREE state
  const treePositions = useMemo(() => {
    const arr = [];
    const total = SPHERE_COUNT + CUBE_COUNT;
    for (let i = 0; i < total; i++) {
      arr.push(getConePosition(6, 14)); // Radius 6, Height 14
    }
    return arr;
  }, []);

  // 2. Target positions for EXPLODE state
  const explodePositions = useMemo(() => {
    const arr = [];
    const total = SPHERE_COUNT + CUBE_COUNT;
    for (let i = 0; i < total; i++) {
      arr.push(getSpherePosition(25)); // Explosion radius 25
    }
    return arr;
  }, []);

  // 3. Target positions for TEXT state
  const textPositions = useMemo(() => {
    if (!font) return [];
    // Scale text based on viewport to fit
    // We generate enough points for all particles
    return getTextPositions("MERRY\nCHRISTMAS", font, SPHERE_COUNT + CUBE_COUNT);
  }, [font]);

  // Current animated positions (start with Tree)
  // We use a ref array to store current simulated physics positions
  const particles = useMemo(() => {
    const data = [];
    const total = SPHERE_COUNT + CUBE_COUNT;
    for (let i = 0; i < total; i++) {
      data.push({
        x: treePositions[i].x,
        y: treePositions[i].y,
        z: treePositions[i].z,
        rotX: Math.random() * Math.PI,
        rotY: Math.random() * Math.PI,
        rotZ: Math.random() * Math.PI,
        scale: Math.random() * 0.4 + 0.1, // Random size
        speed: Math.random() * 0.05 + 0.02 // Random lerp speed
      });
    }
    return data;
  }, [treePositions]);

  // Define colors for instances
  const sphereColors = useMemo(() => {
    const colors = new Float32Array(SPHERE_COUNT * 3);
    const c1 = new THREE.Color(COLOR_GOLD);
    const c2 = new THREE.Color(COLOR_RED);
    // Increase saturation/brightness of base colors slightly for vividness
    c1.offsetHSL(0, 0.1, 0.1); 
    c2.offsetHSL(0, 0.1, 0.1);

    for (let i = 0; i < SPHERE_COUNT; i++) {
      const color = Math.random() > 0.6 ? c1 : c2;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return colors;
  }, []);

  const cubeColors = useMemo(() => {
    const colors = new Float32Array(CUBE_COUNT * 3);
    const c1 = new THREE.Color(COLOR_DARK_GOLD);
    const c2 = new THREE.Color(COLOR_GREEN);
    c1.offsetHSL(0, 0.1, 0.1);
    c2.offsetHSL(0, 0.1, 0.1);
    
    for (let i = 0; i < CUBE_COUNT; i++) {
      const color = Math.random() > 0.5 ? c1 : c2;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return colors;
  }, []);

  // -- Interaction Handler --
  const handleClick = (e: any) => {
    e.stopPropagation();
    // Cycle state: 0 (Tree) -> 1 (Explode) -> 2 (Text) -> 0 (Tree)
    let nextState = AppState.TREE;
    if (appState === AppState.TREE) nextState = AppState.EXPLODE;
    else if (appState === AppState.EXPLODE) nextState = AppState.TEXT;
    else if (appState === AppState.TEXT) nextState = AppState.TREE;
    
    setAppState(nextState);
  };

  // -- Animation Loop --
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // 1. Group Rotation (Slow spin)
    if (groupRef.current) {
      // Rotate faster if exploded, slower if tree/text
      const rotSpeed = appState === AppState.EXPLODE ? 0.2 : 0.05;
      groupRef.current.rotation.y += rotSpeed * 0.01;
    }
    
    // Star Pulse and Visibility
    if (starRef.current) {
      starRef.current.rotation.y = time;
      const scale = 1 + Math.sin(time * 3) * 0.1;
      
      // Star should hide if forming text
      const targetScale = appState === AppState.TEXT ? 0 : scale;
      starRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    // 2. Update Instances
    const spheres = spheresRef.current;
    const cubes = cubesRef.current;

    let targetArr: any[] = [];
    
    switch (appState) {
      case AppState.TREE:
        targetArr = treePositions;
        break;
      case AppState.EXPLODE:
        targetArr = explodePositions;
        break;
      case AppState.TEXT:
        targetArr = textPositions.length > 0 ? textPositions : treePositions;
        break;
    }

    if (spheres && cubes) {
      let sphereIdx = 0;
      let cubeIdx = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const target = targetArr[i] || treePositions[i]; // Fallback

        // Interpolate position
        // We use a simpler lerp here for performance over 1600 items than React-Spring
        // Adjust lerp factor based on state for snap vs float feel
        const lerpFactor = appState === AppState.EXPLODE ? 0.05 : 0.08;

        p.x += (target.x - p.x) * lerpFactor;
        p.y += (target.y - p.y) * lerpFactor;
        p.z += (target.z - p.z) * lerpFactor;

        // Add some floating noise
        const noise = Math.sin(time + i) * 0.02;

        dummy.position.set(p.x, p.y + noise, p.z);
        
        // Rotate individual pieces
        dummy.rotation.set(
          p.rotX + time * 0.5,
          p.rotY + time * 0.5,
          p.rotZ
        );
        
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();

        if (i < SPHERE_COUNT) {
          spheres.setMatrixAt(sphereIdx++, dummy.matrix);
        } else {
          cubes.setMatrixAt(cubeIdx++, dummy.matrix);
        }
      }

      spheres.instanceMatrix.needsUpdate = true;
      cubes.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} onClick={handleClick}>
      {/* The Top Star - Only visible in Tree/Explode mode mostly */}
      <mesh ref={starRef} position={[0, 7.5, 0]}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial 
          color="#FFFF00" 
          emissive="#FFAA00" 
          emissiveIntensity={2} 
          roughness={0.2} 
          metalness={0.8} 
        />
        <pointLight intensity={2} distance={10} color="orange" />
      </mesh>

      <instancedMesh
        ref={spheresRef}
        args={[undefined, undefined, SPHERE_COUNT]}
      >
        <sphereGeometry args={[0.3, 32, 32]}>
          <instancedBufferAttribute 
            attach="attributes-color" 
            args={[sphereColors, 3]} 
          />
        </sphereGeometry>
        <meshStandardMaterial 
          vertexColors 
          roughness={0.05} 
          metalness={0.95} 
          envMapIntensity={3}
        />
      </instancedMesh>

      <instancedMesh
        ref={cubesRef}
        args={[undefined, undefined, CUBE_COUNT]}
      >
        <boxGeometry args={[0.45, 0.45, 0.45]}>
          <instancedBufferAttribute 
            attach="attributes-color" 
            args={[cubeColors, 3]} 
          />
        </boxGeometry>
        <meshStandardMaterial 
          vertexColors 
          roughness={0.05} 
          metalness={0.9} 
          envMapIntensity={3}
        />
      </instancedMesh>
    </group>
  );
};

export default MagicTree;