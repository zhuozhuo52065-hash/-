import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Stars, Loader } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import MagicTree from './components/MagicTree';
import Overlay from './components/Overlay';
import { AppState } from './types';
import { CHRISTMAS_AUDIO_URL } from './constants';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.TREE);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle Audio Autoplay workarounds
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
      // Try autoplay immediately
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented. User interaction required.
          console.log("Audio autoplay blocked by browser, waiting for interaction.");
        });
      }
    }
  }, []);

  // Ensure audio plays on first state change (interaction)
  const handleInteraction = (newState: AppState) => {
    if (!hasInteracted) {
      setHasInteracted(true);
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play();
      }
    }
    setAppState(newState);
  };

  return (
    <div className="w-full h-full relative bg-gray-900 select-none">
      <audio ref={audioRef} src={CHRISTMAS_AUDIO_URL} loop />
      
      <Overlay appState={appState} hasInteracted={hasInteracted} />
      
      <Canvas
        shadows
        camera={{ position: [0, 0, 35], fov: 45 }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#050b14']} />
          <fog attach="fog" args={['#050b14', 20, 90]} />
          
          {/* Lighting */}
          <ambientLight intensity={0.5} color="#ffd700" />
          <spotLight 
            position={[10, 10, 10]} 
            angle={0.5} 
            penumbra={1} 
            intensity={1} 
            color="#ff4400" 
            castShadow 
          />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#00ff00" />
          
          {/* Environment Map - Using direct file to avoid default preset loading errors */}
          <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr" />
          
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

          {/* Main 3D Object */}
          <MagicTree appState={appState} setAppState={handleInteraction} />

          {/* Floor Shadow */}
          <ContactShadows 
            rotation-x={Math.PI / 2} 
            position={[0, -8, 0]} 
            opacity={0.6} 
            width={40} 
            height={40} 
            blur={2} 
            far={10} 
            color="#000000"
          />

          {/* Post Processing for Glow */}
          <EffectComposer enableNormalPass={false}>
            <Bloom 
              luminanceThreshold={0.8} 
              mipmapBlur 
              intensity={1.5} 
              radius={0.4}
            />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>

          {/* Controls */}
          <OrbitControls 
            enablePan={false} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 1.5}
            minDistance={10}
            maxDistance={60}
          />
        </Suspense>
      </Canvas>
      <Loader />
    </div>
  );
};

export default App;