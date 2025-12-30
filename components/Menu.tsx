
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
  // Questa è la stessa immagine dell'elmo usata nel manifest
  const SpartanIcon = () => (
    <div className="mb-6 relative group">
      <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full group-hover:bg-amber-500/40 transition-all duration-700"></div>
      <svg className="w-32 h-32 md:w-40 md:h-40 relative drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <circle cx="256" cy="256" r="240" fill="#1c1610" stroke="#D4AF37" strokeWidth="15"/>
        {/* Cimiero Rosso */}
        <path d="M256 80c-40 0-80 20-100 60v40h200v-40c-20-40-60-60-100-60z" fill="#8B0000"/>
        {/* Maschera Dorata */}
        <path d="M180 180v120c0 60 40 100 76 100s76-40 76-100V180H180zM256 340c-25 0-40-20-40-40s15-40 40-40 40 20 40 40-15 40-40 40z" fill="#D4AF37"/>
        <path d="M256 180l-30 40h60z" fill="#600000"/>
      </svg>
    </div>
  );

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <div className="max-w-lg w-full p-6 md:p-12 bg-stone-900 border-4 md:border-8 border-amber-900 text-center shadow-[0_0_50px_rgba(0,0,0,1)] rounded-sm flex flex-col items-center">
        
        <SpartanIcon />

        <h1 className="text-4xl md:text-6xl font-black text-amber-500 mb-2 tracking-tighter drop-shadow-2xl font-['Metamorphous'] uppercase">
          {title}
        </h1>
        <p className="text-amber-100/70 font-bold mb-4 md:mb-8 uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-sm">
          {subtitle}
        </p>
        
        <div className="hidden md:block mb-8 p-6 border border-amber-900/30 bg-stone-950/50 rounded-lg">
          <p className="text-amber-200 italic font-serif text-lg leading-relaxed">
            "{wisdom}"
          </p>
        </div>

        <div className="flex flex-col gap-3 md:gap-4 w-full">
            <button 
              onClick={onAction}
              className="group relative px-8 py-3 md:px-12 md:py-4 bg-amber-700 hover:bg-amber-600 text-white font-black text-xl md:text-2xl uppercase transition-all border-b-4 md:border-b-8 border-amber-950 active:translate-y-1 rounded-sm shadow-xl"
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

        <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-2 text-left text-[9px] md:text-[11px] text-amber-100/40 font-mono border-t border-amber-900/20 pt-6">
            <div className="flex items-center gap-2"><span className="text-amber-600 font-bold">[W/S]</span> MOVE</div>
            <div className="flex items-center gap-2"><span className="text-amber-600 font-bold">[SPACE]</span> JUMP</div>
            <div className="flex items-center gap-2"><span className="text-amber-600 font-bold">[A/D]</span> ROTATE</div>
            <div className="flex items-center gap-2"><span className="text-amber-600 font-bold">[Q/E]</span> ARMS</div>
        </div>
      </div>
    </div>
  );
};
