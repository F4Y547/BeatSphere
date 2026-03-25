import React, { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { AudioData, VisualConfig } from '../types';

interface Ripple {
  id: number;
  position: THREE.Vector3;
  startTime: number;
  duration: number;
}

interface VisualizerProps {
  audioData: AudioData | null;
  config: VisualConfig;
}

export const Visualizer: React.FC<VisualizerProps> = ({ audioData, config }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const rippleGroupRef = useRef<THREE.Group>(null);
  const { clock } = useThree();
  
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const isInteractingRef = useRef(false);
  const interactionGlowRef = useRef(0);
  const nextRippleId = useRef(0);

  const particles = useMemo(() => {
    const count = config.particleCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const initialPositions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2 + Math.random() * 0.5;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      initialPositions[i * 3] = x;
      initialPositions[i * 3 + 1] = y;
      initialPositions[i * 3 + 2] = z;

      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;

      sizes[i] = Math.random() * 2;
    }

    return { positions, colors, sizes, initialPositions };
  }, [config.particleCount]);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const colors = pointsRef.current.geometry.attributes.color.array as Float32Array;
    
    const bass = audioData?.bass || 0;
    const mid = audioData?.mid || 0;
    const high = audioData?.high || 0;

    const bassImpact = bass * config.sensitivity.bass;
    const midImpact = mid * config.sensitivity.mid;
    const highImpact = high * config.sensitivity.high;

    // Interaction Glow
    if (isInteractingRef.current) {
      interactionGlowRef.current = THREE.MathUtils.lerp(interactionGlowRef.current, 1, 0.1);
    } else {
      interactionGlowRef.current = THREE.MathUtils.lerp(interactionGlowRef.current, 0, 0.1);
    }

    for (let i = 0; i < config.particleCount; i++) {
      const idx = i * 3;
      const ix = particles.initialPositions[idx];
      const iy = particles.initialPositions[idx + 1];
      const iz = particles.initialPositions[idx + 2];

      let x = ix;
      let y = iy;
      let z = iz;

      if (config.shape === 'sphere') {
        const dist = Math.sqrt(x * x + y * y + z * z);
        const noise = Math.sin(time * 0.5 + dist * 2) * 0.05;
        const scale = 1 + bassImpact * 0.6 + noise;
        x *= scale;
        y *= scale;
        z *= scale;
      } else if (config.shape === 'galaxy') {
        const angle = time * config.speed * 0.15 + i * 0.005;
        const r = Math.sqrt(ix * ix + iy * iy) * (1 + bassImpact * 0.8);
        const spiral = Math.sin(r * 2 + time) * 0.1;
        x = Math.cos(angle + spiral) * r;
        y = Math.sin(angle + spiral) * r;
        z = iz * (1 + midImpact * 1.2);
      } else if (config.shape === 'tornado') {
        const angle = time * config.speed + iy * 1.5;
        const r = (1 + bassImpact) * (2.5 - Math.abs(iy) / 4);
        const wobble = Math.sin(time * 2 + iy) * 0.2;
        x = Math.cos(angle) * (r + wobble);
        z = Math.sin(angle) * (r + wobble);
        y = iy + Math.sin(time + i) * midImpact;
      } else if (config.shape === 'wave') {
        const waveX = Math.sin(ix + time * config.speed) * midImpact;
        const waveY = Math.cos(iy + time * config.speed) * bassImpact;
        x = ix + waveX;
        y = iy + waveY;
        z = iz + Math.sin(ix * iy + time) * highImpact;
      }

      if (highImpact > 0.4 && Math.random() > 0.95) {
        const sparkle = 1 + highImpact * 0.5;
        x *= sparkle;
        y *= sparkle;
        z *= sparkle;
      }

      // Interaction displacement
      if (interactionGlowRef.current > 0.1) {
        x *= (1 + interactionGlowRef.current * 0.05);
        y *= (1 + interactionGlowRef.current * 0.05);
        z *= (1 + interactionGlowRef.current * 0.05);
      }

      positions[idx] = x * config.size;
      positions[idx + 1] = y * config.size;
      positions[idx + 2] = z * config.size;

      if (config.colorMode === 'auto') {
        const hue = (time * 0.05 + bass * 0.1) % 1;
        const c = new THREE.Color().setHSL(hue, 0.8, 0.5 + high * 0.3);
        if (interactionGlowRef.current > 0) {
          c.lerp(new THREE.Color('#ffffff'), interactionGlowRef.current * 0.3);
        }
        colors[idx] = THREE.MathUtils.lerp(colors[idx], c.r, 0.1);
        colors[idx + 1] = THREE.MathUtils.lerp(colors[idx + 1], c.g, 0.1);
        colors[idx + 2] = THREE.MathUtils.lerp(colors[idx + 2], c.b, 0.1);
      } else {
        const c1 = new THREE.Color(config.primaryColor);
        const c2 = new THREE.Color(config.secondaryColor);
        const mixed = c1.clone().lerp(c2, mid);
        mixed.multiplyScalar(1 + high * 0.5 + interactionGlowRef.current * 0.5);
        colors[idx] = THREE.MathUtils.lerp(colors[idx], mixed.r, 0.1);
        colors[idx + 1] = THREE.MathUtils.lerp(colors[idx + 1], mixed.g, 0.1);
        colors[idx + 2] = THREE.MathUtils.lerp(colors[idx + 2], mixed.b, 0.1);
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
    
    pointsRef.current.rotation.y += 0.002 * config.speed;
    pointsRef.current.rotation.x += 0.001 * config.speed;

    // Update Ripples
    const now = state.clock.getElapsedTime();
    if (ripples.length > 0) {
      const activeRipples = ripples.filter(r => now - r.startTime < r.duration);
      if (activeRipples.length !== ripples.length) {
        setRipples(activeRipples);
      }
      
      if (rippleGroupRef.current) {
        rippleGroupRef.current.children.forEach((child, i) => {
          const ripple = ripples[i];
          if (!ripple) return;
          
          const age = now - ripple.startTime;
          const progress = age / ripple.duration;
          const scale = 0.1 + progress * 8;
          const opacity = 1 - progress;
          
          child.scale.set(scale, scale, scale);
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
            child.material.opacity = opacity;
          }
        });
      }
    }
  });

  const handlePointerDown = (e: any) => {
    isInteractingRef.current = true;
    const point = e.point;
    const time = clock.getElapsedTime();
    
    setRipples(prev => [
      ...prev,
      {
        id: nextRippleId.current++,
        position: point.clone(),
        startTime: time,
        duration: 1.0
      }
    ]);
  };

  return (
    <group>
      <points 
        ref={pointsRef}
        onPointerDown={handlePointerDown}
        onPointerUp={() => isInteractingRef.current = false}
        onPointerOut={() => isInteractingRef.current = false}
      >
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={config.particleCount}
            array={particles.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={config.particleCount}
            array={particles.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      <group ref={rippleGroupRef}>
        {ripples.map(ripple => (
          <mesh key={ripple.id} position={ripple.position}>
            <ringGeometry args={[0.1, 0.12, 32]} />
            <meshBasicMaterial transparent opacity={1} color="white" side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
