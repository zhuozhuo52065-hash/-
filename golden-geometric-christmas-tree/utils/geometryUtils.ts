import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { PositionData } from '../types';

// Helper to get random point in cone (Tree shape)
export const getConePosition = (radius: number, height: number): PositionData => {
  const y = Math.random() * height; // Height from 0 to h
  const relativeY = y / height; // 0 at bottom, 1 at top
  const currentRadius = radius * (1 - relativeY); // Taper to top
  
  const theta = Math.random() * Math.PI * 2;
  const r = Math.random() * currentRadius; // Dist from center
  
  const x = r * Math.cos(theta);
  const z = r * Math.sin(theta);
  
  // Center the tree vertically around 0 roughly
  return { x, y: y - height / 2, z };
};

// Helper for explosion (Sphere volume)
export const getSpherePosition = (radius: number): PositionData => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  
  return { x, y, z };
};

// Helper to sample points from Text Geometry
export const getTextPositions = (text: string, font: Font, count: number): PositionData[] => {
  const geometry = new TextGeometry(text, {
    font: font,
    size: 4,
    depth: 0.5,
    curveSegments: 24,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.05,
    bevelOffset: 0,
    bevelSegments: 8,
  });

  geometry.center();
  geometry.computeBoundingBox();
  
  // We need to sample points from the faces of the text mesh
  // Since Three.js geometries are vertices, we can just sample vertices for simplicity
  // or use MeshSurfaceSampler (but that requires a mesh). 
  // For simplicity and performance without extra deps, we use the position attribute vertices.
  
  const posAttribute = geometry.attributes.position;
  const vertexCount = posAttribute.count;
  const positions: PositionData[] = [];

  for (let i = 0; i < count; i++) {
    // Pick a random vertex
    const index = Math.floor(Math.random() * vertexCount);
    positions.push({
      x: posAttribute.getX(index),
      y: posAttribute.getY(index),
      z: posAttribute.getZ(index)
    });
  }
  
  geometry.dispose();
  return positions;
};