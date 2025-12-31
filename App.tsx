import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { Menu } from './components/Menu';
import { TouchControls } from './components/TouchControls';
import { GameState, WeaponType, Obstacle, ObstacleType, CharacterType } from './types';
import { WORLD_WIDTH, WORLD_HEIGHT } from './constants';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    player: {
      id: 'player',
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
      width: 40,
      height: 40,
      angle: -Math.PI / 2,
      health: 100,
      maxHealth: 100,
      velocity: { x: 0, y: 0 },
      currentWeapon: WeaponType.SPEAR,
      score: 0,
      type: CharacterType.SPARTAN
    },
    enemies: [],
    projectiles: [],
    obstacles: [],
    particles: [],
    meteors: [],
    isGameOver: false,
    isPaused: true,
    isTrainingMode: false,
    wave: 1
  } as unknown as GameState);

  const [spartanWisdom, setSpartanWisdom] = useState("THIS IS SPARTA!");
  const [touchInputs, setTouchInputs] = useState<Record<string, boolean>>({});

  const fetchWisdom = useCallback(async () => {
    if (!process.env.API_KEY) return;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Write a short, gritty, one-sentence Spartan battle cry about stars falling and fire.",
      });
      if (response && response.text) {
        setSpartanWisdom(response.text.trim());
      }
    } catch (e) {
      setSpartanWisdom("The heavens rain fire, yet we stand!");
    }
  }, []);

  useEffect(() => {
    fetchWisdom();
  }, [fetchWisdom]);

  const generateLevel = () => {
    const obs: Obstacle[] = [];
    for (let i = 0; i < 20; i++) {
      obs.push({
        id: `wall-${i}`,
        x: Math.random() * (WORLD_WIDTH - 200) + 100,
        y: Math.random() * (WORLD_HEIGHT - 200) + 100,
        width: Math.random() > 0.5 ? 120 : 60,
        height: Math.random() > 0.5 ? 40 : 120,
        type: ObstacleType.WALL
      });
    }
    return obs;
  };

  const startGame = (training: boolean = false) => {
    setGameState(prev => ({
      ...prev,
      isPaused: false,
      isGameOver: false,
      isTrainingMode: training,
      player: {
        ...prev.player,
        health: 100,
        score: 0,
        x: WORLD_WIDTH / 2,
        y: WORLD_HEIGHT / 2,
        velocity: { x: 0, y: 0 }
      },
      enemies: [],
      projectiles: [],
      particles: [],
      meteors: [],
      obstacles: generateLevel(),
      wave: 1
    }));
  };

  const exitToMenu = () => {
    setGameState(prev => ({
      ...prev,
      isPaused: true,
      isTrainingMode: false,
      isGameOver: false
    }));
  };

  const handleTouchInput = (code: string, pressed: boolean) => {
    setTouchInputs(prev => ({ ...prev, [code]: pressed }));
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-stone-950 flex items-center justify-center overflow-hidden touch-none">
      <div className="relative w-full h-full max-w-[1200px] max-h-[800px] bg-stone-900 md:border-4 md:border-amber-900 md:rounded-lg shadow-2xl overflow-hidden aspect-video">
        <GameCanvas 
          gameState={gameState} 
          updateGameState={(updater) => setGameState(updater)} 
          externalInputs={touchInputs}
        />
        
        <UIOverlay 
          gameState={gameState} 
          wisdom={spartanWisdom}
          onExitTraining={exitToMenu}
        />

        {!gameState.isPaused && (
          <TouchControls onInput={handleTouchInput} />
        )}

        {gameState.isPaused && !gameState.isGameOver && (
          <Menu 
            title="SPARTAN FRONTLINE" 
            subtitle="Meteors Update"
            buttonText="Start War" 
            trainingButtonText="Training Mode"
            onAction={() => startGame(false)}
            onTrainingAction={() => startGame(true)}
            wisdom={spartanWisdom}
          />
        )}

        {gameState.isGameOver && (
          <Menu 
            title="FALLEN HERO" 
            subtitle={`You survived Wave ${gameState.wave} | Final Score: ${gameState.player.score}`}
            buttonText="Revenge" 
            onAction={() => startGame(false)}
            wisdom="Spartans never die, they just regroup in Hades."
          />
        )}
      </div>
    </div>
  );
};

export default App;