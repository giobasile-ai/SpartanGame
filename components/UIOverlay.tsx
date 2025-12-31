import React from 'react';
import { GameState, WeaponType } from '../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';

interface UIOverlayProps {
  gameState: GameState;
  wisdom: string;
  onExitTraining: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ gameState, wisdom, onExitTraining }) => {
  const { player, wave, enemies, isTrainingMode, isPaused } = gameState;

  if (isPaused) return null;

  return (
    <div className="absolute inset-0 pointer-events-none p-2 md:p-6 flex flex-col justify-between overflow-hidden">
      <div className="flex justify-between items-start">
        {/* Radar */}
        <div className="relative w-24 h-24 md:w-40 md:h-40 bg-black/60 border-2 border-amber-900 rounded-lg overflow-hidden backdrop-blur-sm shadow-xl">
           <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
              <div className="w-full h-px bg-amber-500"></div>
              <div className="h-full w-px bg-amber-500"></div>
           </div>
           <div className="absolute w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_5px_white]"
             style={{ left: `${(player.x/WORLD_WIDTH)*100}%`, top: `${(player.y/WORLD_HEIGHT)*100}%`, transform: 'translate(-50%, -50%)' }}
           />
           {enemies.map(e => (
             <div key={e.id} className="absolute w-1 h-1 bg-red-600 rounded-full"
               style={{ left: `${(e.x/WORLD_WIDTH)*100}%`, top: `${(e.y/WORLD_HEIGHT)*100}%`, transform: 'translate(-50%, -50%)' }}
             />
           ))}
           {gameState.meteors.map(m => (
             <div key={m.id} className="absolute w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"
               style={{ left: `${(m.x/WORLD_WIDTH)*100}%`, top: `${(m.y/WORLD_HEIGHT)*100}%`, transform: 'translate(-50%, -50%)' }}
             />
           ))}
        </div>

        {/* Status & Exit Button */}
        <div className="text-right space-y-1 md:space-y-4 pointer-events-auto">
          {isTrainingMode && (
            <button 
              onClick={onExitTraining}
              className="bg-red-900 border-2 border-amber-500 text-white font-black px-4 py-2 rounded-sm shadow-lg mb-2 hover:bg-red-700 active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              Exit Training [X]
            </button>
          )}

          <div className="bg-stone-900/80 border-2 border-amber-900 p-2 md:p-4 rounded-sm shadow-lg w-40 md:w-64 backdrop-blur-sm ml-auto">
            <div className="flex justify-between items-center mb-1">
              <span className="text-amber-500 font-bold text-xs md:text-lg uppercase">
                {isTrainingMode ? "GOD" : "HP"}
              </span>
              <span className="text-amber-100 font-bold text-xs md:text-base">{Math.ceil(player.health)}%</span>
            </div>
            <div className="h-2 md:h-4 bg-stone-800 rounded-full overflow-hidden border border-amber-950">
              <div 
                className={`h-full transition-all duration-300 ${isTrainingMode ? 'bg-amber-400' : 'bg-red-700'}`}
                style={{ width: `${player.health}%` }}
              />
            </div>
          </div>
          <div className="text-xl md:text-3xl font-black text-amber-500 tracking-widest drop-shadow-lg">
            WAVE {wave}
          </div>
          <div className="text-amber-100/60 font-mono text-xs uppercase">
            Score: {player.score}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end w-full">
          <div className="hidden md:block text-amber-100/60 italic text-sm max-w-xs drop-shadow-md pb-4">
            "{wisdom}"
          </div>
          
          {/* Weapon Selector */}
          <div className="bg-stone-900/90 border-2 md:border-4 border-amber-900 px-2 md:px-8 py-1 md:py-4 rounded-lg md:rounded-xl flex items-end gap-2 md:gap-6 shadow-2xl backdrop-blur-md mb-2">
            {Object.values(WeaponType).map((wType) => {
              const isActive = player.currentWeapon === wType;
              return (
                <div key={wType} className={`flex flex-col items-center transition-all ${isActive ? 'scale-110 opacity-100' : 'scale-90 opacity-30'}`}>
                  <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full border flex items-center justify-center mb-1 ${isActive ? 'border-amber-500 bg-amber-900/30' : 'border-stone-700 bg-stone-800'}`}>
                     {wType === WeaponType.SPEAR && <div className="w-0.5 h-6 md:h-8 bg-amber-400 rotate-45" />}
                     {wType === WeaponType.SHIELD && <div className="w-5 h-5 md:w-8 md:h-8 rounded-full border-2 border-amber-600 bg-red-900" />}
                     {wType === WeaponType.BERETTA && <div className="w-4 h-3 bg-gray-400 rounded-sm" />}
                     {wType === WeaponType.AK47 && <div className="w-6 h-2 bg-green-900 rounded-sm" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden lg:block w-48 text-amber-100/40 text-[9px] font-mono text-center mb-4 leading-tight">
              [X] EXIT TRAINING<br/>
              [W/S] MOVE | [SPACE] JUMP
          </div>
      </div>
    </div>
  );
};