import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, WeaponType, CharacterType, Projectile, Entity, Obstacle, Particle, ObstacleType, ParticleType, Meteor } from '../types';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, 
  WORLD_WIDTH, WORLD_HEIGHT,
  PLAYER_SPEED, ROTATION_SPEED, 
  JUMP_FORCE, GRAVITY, WEAPONS 
} from '../constants';
import { playSound } from '../utils/audio';

interface GameCanvasProps {
  gameState: GameState;
  updateGameState: (updater: (state: GameState) => GameState) => void;
  externalInputs?: Record<string, boolean>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, updateGameState, externalInputs }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const lastShotRef = useRef<number>(0);
  const requestRef = useRef<number>(0);
  const teleportCooldownRef = useRef<Record<string, number>>({});
  const muzzleFlashRef = useRef<{ x: number, y: number, angle: number, life: number } | null>(null);
  const prevGpButtonsRef = useRef<boolean[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    const handleMouseDown = () => { keysRef.current['Mouse0'] = true; };
    const handleMouseUp = () => { keysRef.current['Mouse0'] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (externalInputs) {
      Object.entries(externalInputs).forEach(([code, pressed]) => {
        keysRef.current[code] = pressed;
      });
    }
  }, [externalInputs]);

  const pollGamepad = useCallback(() => {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (!gp) return;
    const threshold = 0.2;
    if (Math.abs(gp.axes[1]) > threshold) {
      keysRef.current['KeyW'] = gp.axes[1] < -threshold;
      keysRef.current['KeyS'] = gp.axes[1] > threshold;
    } else {
      if (!externalInputs?.['KeyW']) keysRef.current['KeyW'] = false;
      if (!externalInputs?.['KeyS']) keysRef.current['KeyS'] = false;
    }
    if (Math.abs(gp.axes[0]) > threshold) {
      keysRef.current['KeyA'] = gp.axes[0] < -threshold;
      keysRef.current['KeyD'] = gp.axes[0] > threshold;
    } else {
      if (!externalInputs?.['KeyA']) keysRef.current['KeyA'] = false;
      if (!externalInputs?.['KeyD']) keysRef.current['KeyD'] = false;
    }
    keysRef.current['Space'] = gp.buttons[0].pressed;
    keysRef.current['Mouse0'] = gp.buttons[7].pressed;
    if (gp.buttons[4].pressed && !prevGpButtonsRef.current[4]) keysRef.current['KeyQ'] = true;
    if (gp.buttons[5].pressed && !prevGpButtonsRef.current[5]) keysRef.current['KeyE'] = true;
    prevGpButtonsRef.current = gp.buttons.map(b => b.pressed);
  }, [externalInputs]);

  const createParticles = (x: number, y: number, count: number, type: ParticleType, color: string): Particle[] => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      let vx = (Math.random() - 0.5) * 8;
      let vy = (Math.random() - 0.5) * 8;
      let size = 2 + Math.random() * 4;
      let life = 1.0;
      if (type === ParticleType.SPARK) { vx *= 2; vy *= 2; size = 1 + Math.random() * 2; }
      else if (type === ParticleType.BLOOD) { vx *= 1.5; vy *= 1.5; size = 3 + Math.random() * 3; }
      else if (type === ParticleType.FIRE) { vx *= 2; vy -= 4; size = 4 + Math.random() * 6; life = 0.8; }
      else if (type === ParticleType.DUST) { vx *= 0.5; vy *= 0.5; size = 5 + Math.random() * 8; life = 0.6; }
      particles.push({ id: Math.random().toString(), x, y, vx, vy, life, size, color, type });
    }
    return particles;
  };

  const spawnEnemy = useCallback((playerX: number, playerY: number) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 600 + Math.random() * 300;
    const rand = Math.random();
    let type = CharacterType.CITIZEN, health = 30, width = 36;
    if (rand > 0.85) { type = CharacterType.KING; health = 180; width = 50; }
    else if (rand > 0.4) { type = CharacterType.SPARTAN; health = 70; width = 40; }
    let ex = (playerX + Math.cos(angle) * dist + WORLD_WIDTH) % WORLD_WIDTH;
    let ey = (playerY + Math.sin(angle) * dist + WORLD_HEIGHT) % WORLD_HEIGHT;
    return { id: Math.random().toString(36).substr(2, 9), x: ex, y: ey, width, height: width, angle: 0, health, maxHealth: health, velocity: { x: 0, y: 0 }, type };
  }, []);

  const spawnMeteor = useCallback(() => {
    return {
      id: Math.random().toString(),
      x: Math.random() * WORLD_WIDTH,
      y: -100,
      size: 15 + Math.random() * 25,
      speed: 8 + Math.random() * 6,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.5
    };
  }, []);

  const checkSolidCollision = (x: number, y: number, r: number, obstacles: Obstacle[]) => {
    for (const obs of obstacles) {
      if (obs.type !== ObstacleType.WALL) continue;
      if (x + r > obs.x - obs.width/2 && x - r < obs.x + obs.width/2 &&
          y + r > obs.y - obs.height/2 && y - r < obs.y + obs.height/2) return true;
    }
    return false;
  };

  const getOverlapObstacle = (x: number, y: number, obstacles: Obstacle[]) => {
    for (const obs of obstacles) {
      if (x > obs.x - obs.width/2 && x < obs.x + obs.width/2 &&
          y > obs.y - obs.height/2 && y < obs.y + obs.height/2) return obs;
    }
    return null;
  };

  const gameLoop = useCallback(() => {
    if (gameState.isPaused || gameState.isGameOver) return;
    pollGamepad();
    if (muzzleFlashRef.current) {
      muzzleFlashRef.current.life -= 0.15;
      if (muzzleFlashRef.current.life <= 0) muzzleFlashRef.current = null;
    }

    updateGameState((prev) => {
      let next = { ...prev };
      const player = { ...next.player };
      const nowTs = Date.now();
      
      // Controllo Spawn Meteore
      if (Math.random() < 0.008 + (next.wave * 0.002)) {
        next.meteors.push(spawnMeteor());
      }

      // Aggiornamento Movimento Player
      if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) player.angle -= ROTATION_SPEED;
      if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) player.angle += ROTATION_SPEED;
      const dx = Math.cos(player.angle);
      const dy = Math.sin(player.angle);
      let moveX = 0, moveY = 0;
      if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) { moveX += dx * PLAYER_SPEED; moveY += dy * PLAYER_SPEED; }
      if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) { moveX -= dx * PLAYER_SPEED; moveY -= dy * PLAYER_SPEED; }
      let nextX = (player.x + moveX + WORLD_WIDTH) % WORLD_WIDTH;
      let nextY = (player.y + moveY + WORLD_HEIGHT) % WORLD_HEIGHT;
      if (!checkSolidCollision(nextX, nextY, 18, next.obstacles)) { player.x = nextX; player.y = nextY; }

      // Logica Meteore
      next.meteors = next.meteors.filter(m => {
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;

        // Scia meteora
        if (Math.random() < 0.3) {
          next.particles.push({
            id: Math.random().toString(), x: m.x, y: m.y, vx: -Math.cos(m.angle)*2, vy: -Math.sin(m.angle)*2,
            life: 0.5, size: m.size / 2, color: Math.random() > 0.5 ? '#FF4500' : '#8B0000', type: ParticleType.FIRE
          });
        }

        const hitObstacle = checkSolidCollision(m.x, m.y, m.size/2, next.obstacles);
        const distToPlayer = Math.sqrt((m.x - player.x)**2 + (m.y - player.y)**2);
        
        if (hitObstacle || m.y > WORLD_HEIGHT || distToPlayer < m.size + 10) {
          playSound('bash'); // Usiamo bash come placeholder per il botto
          next.particles.push(...createParticles(m.x, m.y, 15, ParticleType.FIRE, '#FF4500'));
          next.particles.push(...createParticles(m.x, m.y, 10, ParticleType.SMOKE, '#333333'));
          
          if (distToPlayer < 80 && !next.isTrainingMode) {
             player.health -= 50;
             playSound('hurt');
             next.particles.push(...createParticles(player.x, player.y, 10, ParticleType.BLOOD, '#8B0000'));
          }

          next.enemies.forEach(e => {
            const dist = Math.sqrt((m.x - e.x)**2 + (m.y - e.y)**2);
            if (dist < 100) {
              e.health -= 100;
              next.particles.push(...createParticles(e.x, e.y, 10, ParticleType.BLOOD, '#8B0000'));
            }
          });
          return false;
        }
        return true;
      });

      // Il resto della logica originale (Salto, Armi, Nemici, Proiettili)
      if (keysRef.current['Space'] && player.velocity.y === 0) {
        player.velocity.y = JUMP_FORCE;
        playSound('jump');
      }
      player.velocity.y += GRAVITY;
      if (player.velocity.y > 15) player.velocity.y = 0;

      const weapons = [WeaponType.SPEAR, WeaponType.SHIELD, WeaponType.BERETTA, WeaponType.AK47];
      if (keysRef.current['KeyQ']) { player.currentWeapon = weapons[(weapons.indexOf(player.currentWeapon) - 1 + weapons.length) % weapons.length]; keysRef.current['KeyQ'] = false; }
      if (keysRef.current['KeyE']) { player.currentWeapon = weapons[(weapons.indexOf(player.currentWeapon) + 1) % weapons.length]; keysRef.current['KeyE'] = false; }

      const weapon = WEAPONS[player.currentWeapon];
      const now = Date.now();
      if ((keysRef.current['Mouse0'] || keysRef.current['KeyF']) && player.currentWeapon !== WeaponType.SHIELD && now - lastShotRef.current > weapon.fireRate) {
        lastShotRef.current = now;
        playSound(player.currentWeapon === WeaponType.SPEAR ? 'spear' : 'gun');
        next.projectiles.push({
          id: Math.random().toString(), x: player.x + dx * 30, y: player.y + dy * 30,
          angle: player.angle, speed: player.currentWeapon === WeaponType.SPEAR ? 14 : 22,
          damage: weapon.damage, ownerId: 'player', color: weapon.color, isSpear: player.currentWeapon === WeaponType.SPEAR
        });
      }

      if (next.enemies.length < next.wave + 4 && Math.random() < 0.012) next.enemies.push(spawnEnemy(player.x, player.y));
      next.enemies = next.enemies.map(e => {
        const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
        const speed = 2.0;
        let ex = (e.x + Math.cos(angleToPlayer) * speed + WORLD_WIDTH) % WORLD_WIDTH;
        let ey = (e.y + Math.sin(angleToPlayer) * speed + WORLD_HEIGHT) % WORLD_HEIGHT;
        if (!checkSolidCollision(ex, ey, 18, next.obstacles)) { e.x = ex; e.y = ey; }
        e.angle = angleToPlayer;
        if (Math.random() < 0.0025) next.projectiles.push({ id: Math.random().toString(), x: e.x, y: e.y, angle: e.angle, speed: 7, damage: 6, ownerId: 'enemy', color: '#FF4444' });
        return e;
      });

      next.projectiles = next.projectiles.filter(p => {
        p.x = (p.x + Math.cos(p.angle) * p.speed + WORLD_WIDTH) % WORLD_WIDTH;
        p.y = (p.y + Math.sin(p.angle) * p.speed + WORLD_HEIGHT) % WORLD_HEIGHT;
        if (checkSolidCollision(p.x, p.y, 4, next.obstacles)) return false;
        if (p.ownerId === 'player') {
          for (let enemy of next.enemies) {
            if (Math.sqrt((p.x - enemy.x)**2 + (p.y - enemy.y)**2) < 28) { 
              enemy.health -= p.damage;
              if (enemy.health <= 0) player.score += 150;
              return false; 
            }
          }
        } else if (Math.sqrt((p.x - player.x)**2 + (p.y - player.y)**2) < 28) {
          if (!prev.isTrainingMode) { player.health -= p.damage; playSound('hurt'); }
          return false;
        }
        return true;
      });

      next.particles = next.particles.filter(p => {
        p.x += p.vx; p.y += p.vy;
        p.life -= 0.04; return p.life > 0;
      });

      next.enemies = next.enemies.filter(e => e.health > 0);
      if (player.health <= 0 && !next.isTrainingMode) next.isGameOver = true;
      next.player = player; return next;
    });

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.isPaused, gameState.isGameOver, spawnEnemy, spawnMeteor, updateGameState, pollGamepad]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameLoop]);

  const drawCharacter = (ctx: CanvasRenderingContext2D, entity: Entity, isPlayer: boolean) => {
    ctx.save(); ctx.translate(entity.x, entity.y);
    ctx.rotate(entity.angle);
    let primary = isPlayer ? '#8B0000' : '#5D4037';
    ctx.fillStyle = primary; ctx.fillRect(-18, -18, 36, 36);
    if (isPlayer) {
        if (gameState.player.currentWeapon === WeaponType.SHIELD) {
            ctx.fillStyle = '#D4AF37'; ctx.beginPath(); ctx.arc(15, 0, 30, -Math.PI/2, Math.PI/2); ctx.fill();
        } else if (gameState.player.currentWeapon === WeaponType.SPEAR) {
            ctx.fillStyle = '#5D4037'; ctx.fillRect(10, -3, 65, 6);
        } else {
            ctx.fillStyle = '#212121'; ctx.fillRect(15, -4, 28, 10);
        }
    }
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const { player, obstacles, particles, meteors, projectiles, enemies } = gameState;
    let camX = Math.max(0, Math.min(WORLD_WIDTH - CANVAS_WIDTH, player.x - CANVAS_WIDTH/2));
    let camY = Math.max(0, Math.min(WORLD_HEIGHT - CANVAS_HEIGHT, player.y - CANVAS_HEIGHT/2));
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.save(); ctx.translate(-camX, -camY);
    ctx.fillStyle = '#1c1610'; ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    
    obstacles.forEach(o => {
      ctx.fillStyle = '#5c4d3e'; ctx.fillRect(o.x - o.width/2, o.y - o.height/2, o.width, o.height);
    });

    meteors.forEach(m => {
      ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.angle);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, m.size);
      g.addColorStop(0, '#FFF'); g.addColorStop(0.3, '#FFD700'); g.addColorStop(1, '#FF4500');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, m.size, 0, Math.PI*2); ctx.fill();
      // Effetto alone
      ctx.shadowBlur = 20; ctx.shadowColor = '#FF4500'; ctx.stroke();
      ctx.restore();
    });

    particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); });
    ctx.globalAlpha = 1;
    projectiles.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x-4, p.y-4, 8, 8); });
    enemies.forEach(e => drawCharacter(ctx, e, false));
    drawCharacter(ctx, player, true);
    ctx.restore();
  }, [gameState]);

  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full object-contain cursor-crosshair" />;
};