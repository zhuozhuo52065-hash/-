import React from 'react';
import { AppState } from '../types';

interface OverlayProps {
  appState: AppState;
  hasInteracted: boolean;
}

const Overlay: React.FC<OverlayProps> = ({ appState, hasInteracted }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 flex flex-col justify-between p-8 text-white">
      
      {/* Header */}
      <header className="w-full text-center mt-4">
        <h1 className="text-4xl md:text-6xl font-serif text-yellow-400 tracking-widest drop-shadow-[0_2px_10px_rgba(255,215,0,0.5)]">
          MERRY CHRISTMAS
        </h1>
        <p className="mt-2 text-yellow-100/70 font-light text-sm tracking-widest uppercase">
          Interactive 3D Art
        </p>
      </header>

      {/* Instructions / Status */}
      <div className="w-full text-center mb-8">
        {!hasInteracted ? (
          <div className="animate-pulse bg-black/40 backdrop-blur-sm inline-block px-6 py-3 rounded-full border border-yellow-500/30">
            <span className="text-yellow-300 font-serif text-lg">Click the tree to start magic & music</span>
          </div>
        ) : (
          <div className="transition-opacity duration-500 opacity-70 hover:opacity-100">
             <p className="text-sm font-serif italic text-yellow-200">
              {appState === AppState.TREE && "Click to Explode"}
              {appState === AppState.EXPLODE && "Click to Reveal Message"}
              {appState === AppState.TEXT && "Click to Rebuild Tree"}
             </p>
             <p className="text-xs text-white/40 mt-1">Drag to rotate • Pinch to zoom</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overlay;
