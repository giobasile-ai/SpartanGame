import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, WeaponType, CharacterType, Projectile, Entity, Obstacle, Particle, ObstacleType, ParticleType } from '../types';
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
      const weapons = [WeaponType.SPEAR, WeaponType.SHIELD, WeaponType.BERETTA, WeaponType.AK47];
      
      if (keysRef.current['Delete'] && prev.isTrainingMode) {
          next.enemies = []; next.projectiles = []; keysRef.current['Delete'] = false;
      }

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

      const standingOn = getOverlapObstacle(player.x, player.y, next.obstacles);
      const nowTs = Date.now();
      if (standingOn?.type === ObstacleType.TELEPORT && (!teleportCooldownRef.current[player.id] || nowTs - teleportCooldownRef.current[player.id] > 2000)) {
        playSound('teleport');
        next.particles.push(...createParticles(player.x, player.y, 25, ParticleType.MAGIC, '#00FFFF'));
        player.x = Math.random() * (WORLD_WIDTH - 200) + 100;
        player.y = Math.random() * (WORLD_HEIGHT - 200) + 100;
        next.particles.push(...createParticles(player.x, player.y, 25, ParticleType.MAGIC, '#00FFFF'));
        teleportCooldownRef.current[player.id] = nowTs;
      }

      if (keysRef.current['Space'] && player.velocity.y === 0) {
        player.velocity.y = JUMP_FORCE;
        playSound('jump');
        next.particles.push(...createParticles(player.x, player.y + 15, 8, ParticleType.DUST, 'rgba(120, 100, 80, 0.4)'));
      }
      player.velocity.y += GRAVITY;
      if (player.velocity.y > 15) {
        if (player.velocity.y > 0) next.particles.push(...createParticles(player.x, player.y + 15, 6, ParticleType.DUST, 'rgba(120, 100, 80, 0.3)'));
        player.velocity.y = 0;
      }

      if (keysRef.current['KeyQ']) {
        const idx = (weapons.indexOf(player.currentWeapon) - 1 + weapons.length) % weapons.length;
        player.currentWeapon = weapons[idx]; keysRef.current['KeyQ'] = false;
      }
      if (keysRef.current['KeyE']) {
        const idx = (weapons.indexOf(player.currentWeapon) + 1) % weapons.length;
        player.currentWeapon = weapons[idx]; keysRef.current['KeyE'] = false;
      }

      const weapon = WEAPONS[player.currentWeapon];
      const now = Date.now();
      if ((keysRef.current['Mouse0'] || keysRef.current['KeyF']) && player.currentWeapon !== WeaponType.SHIELD && now - lastShotRef.current > weapon.fireRate) {
        lastShotRef.current = now;
        playSound(player.currentWeapon === WeaponType.SPEAR ? 'spear' : 'gun');
        if (player.currentWeapon === WeaponType.BERETTA || player.currentWeapon === WeaponType.AK47) {
          muzzleFlashRef.current = { x: player.x + dx * 45, y: player.y + dy * 45, angle: player.angle, life: 1.0 };
          next.particles.push(...createParticles(player.x + dx * 45, player.y + dy * 45, 3, ParticleType.SMOKE, 'rgba(150, 150, 150, 0.5)'));
        }
        next.projectiles.push({
          id: Math.random().toString(), x: player.x + dx * 30, y: player.y + dy * 30,
          angle: player.angle, speed: player.currentWeapon === WeaponType.SPEAR ? 14 : 22,
          damage: weapon.damage, ownerId: 'player', color: weapon.color, isSpear: player.currentWeapon === WeaponType.SPEAR
        });
      }

      if (next.enemies.length < next.wave + 4 && Math.random() < 0.012) next.enemies.push(spawnEnemy(player.x, player.y));

      next.enemies = next.enemies.map(e => {
        const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
        const speed = e.type === CharacterType.KING ? 1.5 : (e.type === CharacterType.SPARTAN ? 2.2 : 1.8);
        let ex = (e.x + Math.cos(angleToPlayer) * speed + WORLD_WIDTH) % WORLD_WIDTH;
        let ey = (e.y + Math.sin(angleToPlayer) * speed + WORLD_HEIGHT) % WORLD_HEIGHT;
        if (!checkSolidCollision(ex, ey, 18, next.obstacles)) { e.x = ex; e.y = ey; }
        e.angle = angleToPlayer;

        const eStandingOn = getOverlapObstacle(e.x, e.y, next.obstacles);
        if (eStandingOn?.type === ObstacleType.TELEPORT && (!teleportCooldownRef.current[e.id] || nowTs - teleportCooldownRef.current[e.id] > 5000)) {
           next.particles.push(...createParticles(e.x, e.y, 10, ParticleType.MAGIC, '#00FFFF'));
           e.x = Math.random() * (WORLD_WIDTH - 200) + 100; e.y = Math.random() * (WORLD_HEIGHT - 200) + 100;
           next.particles.push(...createParticles(e.x, e.y, 10, ParticleType.MAGIC, '#00FFFF'));
           teleportCooldownRef.current[e.id] = nowTs;
        }
        if (Math.random() < 0.0025) next.projectiles.push({ id: Math.random().toString(), x: e.x, y: e.y, angle: e.angle, speed: 7, damage: e.type === CharacterType.KING ? 12 : 6, ownerId: 'enemy', color: '#FF4444' });
        return e;
      });

      if (player.currentWeapon === WeaponType.SHIELD) {
        next.enemies = next.enemies.filter(e => {
          if (Math.sqrt((player.x - e.x)**2 + (player.y - e.y)**2) < 42) {
            playSound('bash'); e.health -= 15;
            next.particles.push(...createParticles(e.x, e.y, 8, ParticleType.SPARK, '#D4AF37'));
            if (e.health <= 0) {
              playSound('death');
              next.particles.push(...createParticles(e.x, e.y, 25, ParticleType.BLOOD, '#8B0000'));
              player.score += (e.type === CharacterType.KING ? 500 : 150); return false;
            }
            const pushAngle = Math.atan2(e.y - player.y, e.x - player.x);
            e.x = (e.x + Math.cos(pushAngle) * 20 + WORLD_WIDTH) % WORLD_WIDTH;
            e.y = (e.y + Math.sin(pushAngle) * 20 + WORLD_HEIGHT) % WORLD_HEIGHT;
          }
          return true;
        });
      }

      next.projectiles = next.projectiles.filter(p => {
        p.x = (p.x + Math.cos(p.angle) * p.speed + WORLD_WIDTH) % WORLD_WIDTH;
        p.y = (p.y + Math.sin(p.angle) * p.speed + WORLD_HEIGHT) % WORLD_HEIGHT;
        if (checkSolidCollision(p.x, p.y, 4, next.obstacles)) { next.particles.push(...createParticles(p.x, p.y, 5, ParticleType.SPARK, '#D4AF37')); return false; }
        if (p.ownerId === 'player') {
          for (let enemy of next.enemies) {
            if (Math.sqrt((p.x - enemy.x)**2 + (p.y - enemy.y)**2) < 28) { 
              enemy.health -= p.damage; next.particles.push(...createParticles(p.x, p.y, 6, ParticleType.BLOOD, '#8B0000'));
              if (enemy.health <= 0) { 
                playSound('death');
                next.particles.push(...createParticles(enemy.x, enemy.y, 25, ParticleType.BLOOD, '#800000')); 
                player.score += (enemy.type === CharacterType.KING ? 500 : 150); 
              }
              return false; 
            }
          }
        } else if (Math.sqrt((p.x - player.x)**2 + (p.y - player.y)**2) < 28) {
          let finalDamage = p.damage;
          if (player.currentWeapon === WeaponType.SHIELD) {
            let diff = Math.abs(player.angle - Math.atan2(p.y - player.y, p.x - player.x));
            if (diff > Math.PI) diff = 2 * Math.PI - diff;
            if (diff < 1.2) { finalDamage *= 0.2; playSound('bash'); next.particles.push(...createParticles(p.x, p.y, 10, ParticleType.SPARK, '#D4AF37')); }
          }
          if (!prev.isTrainingMode) { 
            player.health -= finalDamage; 
            playSound('hurt');
            next.particles.push(...createParticles(player.x, player.y, 4, ParticleType.BLOOD, '#8B0000')); 
          }
          return false;
        }
        return true;
      });

      next.particles = next.particles.filter(p => {
        p.x = (p.x + p.vx + WORLD_WIDTH) % WORLD_WIDTH;
        p.y = (p.y + p.vy + WORLD_HEIGHT) % WORLD_HEIGHT;
        if (p.type === ParticleType.BLOOD || p.type === ParticleType.DUST) p.vy += 0.15;
        p.life -= (p.type === ParticleType.SPARK ? 0.08 : 0.04); return p.life > 0;
      });

      next.enemies = next.enemies.filter(e => e.health > 0);
      if (player.score > next.wave * 2000) {
        next.wave += 1;
        playSound('levelUp');
      }
      if (player.health <= 0 && !next.isTrainingMode) next.isGameOver = true;
      next.player = player; return next;
    });

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.isPaused, gameState.isGameOver, spawnEnemy, updateGameState, pollGamepad]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameLoop]);

  const drawCharacter = (ctx: CanvasRenderingContext2D, entity: Entity, isPlayer: boolean) => {
    const { type, angle, velocity } = entity;
    ctx.save(); ctx.translate(entity.x, entity.y);
    if (isPlayer && velocity.y < 0) { ctx.translate(0, velocity.y * 1.5); ctx.scale(1 + Math.abs(velocity.y)/40, 1 + Math.abs(velocity.y)/40); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 5, 22, 12, 0, 0, Math.PI*2); ctx.fill();
    ctx.rotate(angle);
    let primary = '#8B0000', secondary = '#D4AF37', accent = '#600000';
    if (type === CharacterType.KING) { primary = '#4B0082'; accent = '#2B0042'; }
    else if (type === CharacterType.CITIZEN) { primary = '#5D4037'; secondary = '#8D6E63'; accent = '#3E2723'; }
    ctx.fillStyle = primary; ctx.fillRect(-18, -18, 36, 36); ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.strokeRect(-18, -18, 36, 36);
    if (type === CharacterType.KING || type === CharacterType.SPARTAN) {
        ctx.fillStyle = primary; ctx.beginPath(); ctx.moveTo(-18, -18); ctx.lineTo(-30, 0); ctx.lineTo(-18, 18); ctx.fill();
        ctx.fillStyle = secondary; ctx.fillRect(-10, -5, 20, 10);
        ctx.fillStyle = '#FF4500'; ctx.fillRect(-12, -2, 2, 4); ctx.fillRect(8, -2, 2, 4);
    }
    if (type === CharacterType.KING) { ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(0, -20); ctx.lineTo(10, -10); ctx.fill(); }
    if (isPlayer) {
        if (gameState.player.currentWeapon === WeaponType.SHIELD) {
            ctx.beginPath(); ctx.arc(15, 0, 30, -Math.PI/2, Math.PI/2);
            const g = ctx.createRadialGradient(15, 0, 5, 15, 0, 30); g.addColorStop(0, '#B22222'); g.addColorStop(1, '#800000');
            ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = secondary; ctx.lineWidth = 3; ctx.stroke();
            ctx.strokeStyle = secondary; ctx.beginPath(); ctx.moveTo(20, 12); ctx.lineTo(32, 0); ctx.lineTo(20, -12); ctx.stroke();
        } else if (gameState.player.currentWeapon === WeaponType.SPEAR) {
            ctx.fillStyle = '#5D4037'; ctx.fillRect(10, -3, 65, 6); ctx.fillStyle = '#C0C0C0'; ctx.beginPath(); ctx.moveTo(75, -8); ctx.lineTo(95, 0); ctx.lineTo(75, 8); ctx.fill();
        } else if (gameState.player.currentWeapon === WeaponType.BERETTA) { ctx.fillStyle = '#212121'; ctx.fillRect(15, -4, 28, 10); }
        else if (gameState.player.currentWeapon === WeaponType.AK47) { ctx.fillStyle = '#3E2723'; ctx.fillRect(10, 2, 15, 8); ctx.fillStyle = '#212121'; ctx.fillRect(20, -4, 50, 10); }
    } else { ctx.fillStyle = '#5D4037'; if (type === CharacterType.KING) { ctx.fillStyle = '#C0C0C0'; ctx.fillRect(10, -2, 40, 4); } else ctx.fillRect(10, -1, 30, 2); }
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const { player, isTrainingMode, obstacles, particles } = gameState;
    let camX = Math.max(0, Math.min(WORLD_WIDTH - CANVAS_WIDTH, player.x - CANVAS_WIDTH/2));
    let camY = Math.max(0, Math.min(WORLD_HEIGHT - CANVAS_HEIGHT, player.y - CANVAS_HEIGHT/2));
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.save(); ctx.translate(-camX, -camY);
    ctx.fillStyle = '#1c1610'; ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    obstacles.forEach(o => {
      ctx.save(); ctx.translate(o.x, o.y);
      if (o.type === ObstacleType.WALL) { ctx.fillStyle = '#5c4d3e'; ctx.fillRect(-o.width/2, -o.height/2, o.width, o.height); ctx.strokeStyle = '#3d3228'; ctx.lineWidth = 4; ctx.strokeRect(-o.width/2, -o.height/2, o.width, o.height); }
      else if (o.type === ObstacleType.GRASS) { ctx.fillStyle = '#2e5a1c'; ctx.fillRect(-o.width/2, -o.height/2, o.width, o.height); ctx.strokeStyle = '#1a3a0e'; ctx.lineWidth = 2; ctx.strokeRect(-o.width/2, -o.height/2, o.width, o.height); }
      else if (o.type === ObstacleType.TELEPORT) { ctx.fillStyle = 'rgba(0, 255, 255, 0.1)'; ctx.fillRect(-o.width/2, -o.height/2, o.width, o.height); ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'; ctx.lineWidth = 2; ctx.strokeRect(-o.width/2, -o.height/2, o.width, o.height); ctx.rotate(Date.now() / 600); ctx.strokeStyle = '#00FFFF'; ctx.strokeRect(-o.width/4, -o.height/4, o.width/2, o.height/2); }
      ctx.restore();
    });
    if (muzzleFlashRef.current) {
        const f = muzzleFlashRef.current; ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.angle); ctx.globalAlpha = f.life;
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 30); g.addColorStop(0, '#FFF'); g.addColorStop(0.2, '#FF0'); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI*2); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
    }
    particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; if (p.type === ParticleType.SMOKE || p.type === ParticleType.DUST) { ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 + (1 - p.life)), 0, Math.PI*2); ctx.fill(); } else ctx.fillRect(p.x, p.y, p.size, p.size); });
    ctx.globalAlpha = 1;
    gameState.projectiles.forEach(p => { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle); if (p.isSpear) { ctx.fillStyle = '#5c4033'; ctx.fillRect(-20, -2, 40, 4); ctx.fillStyle = '#D4AF37'; ctx.beginPath(); ctx.moveTo(20, -5); ctx.lineTo(32, 0); ctx.lineTo(20, 5); ctx.fill(); } else { ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = p.color; ctx.fillRect(-4, -1.5, 8, 3); } ctx.restore(); });
    gameState.enemies.forEach(e => { drawCharacter(ctx, e, false); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - 20, e.y - 35, 40, 4); ctx.fillStyle = e.type === CharacterType.KING ? '#9370DB' : '#FF4444'; ctx.fillRect(e.x - 20, e.y - 35, (e.health/e.maxHealth)*40, 4); });
    drawCharacter(ctx, player, true);
    if (isTrainingMode) { ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(player.x, player.y, 50, 0, Math.PI*2); ctx.stroke(); }
    ctx.restore();
  }, [gameState]);

  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full object-contain cursor-crosshair" />;
};