
import React from 'react';

interface MenuProps {
  title: string;
  subtitle: string;
  buttonText: string;
  trainingButtonText?: string;
  onAction: () => void;
  onTrainingAction?: () => void;
  wisdom: string;
}

export const Menu: React.FC<MenuProps> = ({ title, subtitle, buttonText, trainingButtonText, onAction, onTrainingAction, wisdom }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="max-w-lg w-full p-6 md:p-12 bg-stone-900 border-4 md:border-8 border-amber-900 text-center shadow-2xl rounded-sm">
        <h1 className="text-4xl md:text-6xl font-black text-amber-500 mb-2 tracking-tighter drop-shadow-2xl font-['Metamorphous']">
          {title}
        </h1>
        <p className="text-amber-100/70 font-bold mb-4 md:mb-8 uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-sm">
          {subtitle}
        </p>
        
        <div className="hidden md:block mb-10 p-6 border border-amber-900/30 bg-stone-950/50 rounded-lg">
          <p className="text-amber-200 italic font-serif text-lg leading-relaxed">
            "{wisdom}"
          </p>
        </div>

        <div className="flex flex-col gap-3 md:gap-4">
            <button 
              onClick={onAction}
              className="group relative px-8 py-3 md:px-12 md:py-4 bg-amber-700 hover:bg-amber-600 text-white font-black text-xl md:text-2xl uppercase transition-all border-b-4 md:border-b-8 border-amber-950 active:translate-y-1 rounded-sm"
            >
              {buttonText}
            </button>

            {onTrainingAction && (
                <button 
                  onClick={onTrainingAction}
                  className="px-8 py-2 md:px-12 md:py-3 bg-stone-800 hover:bg-stone-700 text-amber-500 font-black text-base md:text-xl uppercase transition-all border-b-2 md:border-b-4 border-amber-900/50 active:translate-y-1 rounded-sm"
                >
                  {trainingButtonText || 'Training'}
                </button>
            )}
        </div>

        <div className="mt-6 md:mt-8 grid grid-cols-2 gap-2 text-left text-[8px] md:text-[10px] text-amber-100/40 font-mono">
            <div>[W/S] MOVE</div>
            <div>[SPACE] JUMP</div>
            <div>[A/D] ROTATE</div>
            <div>[Q/E] CYCLE ARMS</div>
        </div>
      </div>
    </div>
  );
};
