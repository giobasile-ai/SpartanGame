
import React from 'react';

interface TouchControlsProps {
  onInput: (code: string, pressed: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInput }) => {
  // Funzione helper per creare pulsanti direzionali
  const DirButton = ({ code, label, className }: { code: string, label: string, className: string }) => (
    <button
      className={`w-16 h-16 md:w-20 md:h-20 bg-stone-800/80 border-2 border-amber-900/50 rounded-xl flex items-center justify-center active:scale-95 active:bg-amber-900/40 active:border-amber-500 transition-all pointer-events-auto shadow-lg select-none touch-none ${className}`}
      onTouchStart={(e) => { e.preventDefault(); onInput(code, true); }}
      onTouchEnd={(e) => { e.preventDefault(); onInput(code, false); }}
      onMouseDown={(e) => { e.preventDefault(); onInput(code, true); }}
      onMouseUp={(e) => { e.preventDefault(); onInput(code, false); }}
    >
      <span className="text-amber-500 font-black text-2xl select-none">{label}</span>
    </button>
  );

  return (
    <div className="absolute inset-0 z-40 pointer-events-none select-none flex items-end justify-between p-4 pb-10 md:p-10">
      
      {/* D-PAD DI MOVIMENTO (SINISTRA) */}
      <div className="flex flex-col items-center gap-1">
        <DirButton code="KeyW" label="▲" className="" />
        <div className="flex gap-1">
          <DirButton code="KeyA" label="◀" className="" />
          <div className="w-16 h-16 md:w-20 md:h-20" /> {/* Spazio centrale vuoto */}
          <DirButton code="KeyD" label="▶" className="" />
        </div>
        <DirButton code="KeyS" label="▼" className="" />
      </div>

      {/* PULSANTI AZIONE (DESTRA) */}
      <div className="flex flex-col gap-4 items-end pointer-events-auto">
        <div className="flex gap-3">
          <button 
            className="w-16 h-16 bg-stone-800/80 border-2 border-amber-900/50 rounded-full flex items-center justify-center active:scale-90 active:bg-amber-900/50 shadow-md"
            onTouchStart={(e) => { e.preventDefault(); onInput('KeyQ', true); }}
            onTouchEnd={(e) => { e.preventDefault(); onInput('KeyQ', false); }}
          >
            <span className="text-amber-500 font-bold text-xs">SWAP</span>
          </button>
          
          <button 
            className="w-20 h-20 bg-stone-800/80 border-2 border-amber-600/50 rounded-full flex items-center justify-center active:scale-90 active:bg-amber-700/50 shadow-md"
            onTouchStart={(e) => { e.preventDefault(); onInput('Space', true); }}
            onTouchEnd={(e) => { e.preventDefault(); onInput('Space', false); }}
          >
            <span className="text-amber-100 font-black text-xs">JUMP</span>
          </button>
        </div>
        
        <button 
          className="w-28 h-28 bg-red-900/60 border-4 border-amber-500 rounded-full flex items-center justify-center active:scale-95 active:bg-red-600/80 shadow-[0_0_30px_rgba(185,28,28,0.4)] relative"
          onTouchStart={(e) => { e.preventDefault(); onInput('Mouse0', true); }}
          onTouchEnd={(e) => { e.preventDefault(); onInput('Mouse0', false); }}
        >
          <div className="w-full h-full border-4 border-amber-200/20 rounded-full animate-pulse absolute" />
          <span className="text-amber-100 font-black text-2xl tracking-tighter drop-shadow-md">FIRE</span>
        </button>
      </div>
    </div>
  );
};
