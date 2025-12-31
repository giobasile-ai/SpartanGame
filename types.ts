export enum WeaponType {
  SPEAR = 'SPEAR',
  SHIELD = 'SHIELD',
  BERETTA = 'BERETTA',
  AK47 = 'AK47'
}

export enum CharacterType {
  CITIZEN = 'CITIZEN',
  SPARTAN = 'SPARTAN',
  KING = 'KING'
}

export enum ObstacleType {
  WALL = 'WALL',
  GRASS = 'GRASS',
  TELEPORT = 'TELEPORT'
}

export enum ParticleType {
  BLOOD = 'BLOOD',
  SPARK = 'SPARK',
  SMOKE = 'SMOKE',
  MAGIC = 'MAGIC',
  DUST = 'DUST',
  FIRE = 'FIRE'
}

export interface Meteor {
  id: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
}

export interface Weapon {
  type: WeaponType;
  name: string;
  damage: number;
  fireRate: number;
  ammo?: number;
  maxAmmo?: number;
  color: string;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  health: number;
  maxHealth: number;
  velocity: { x: number, y: number };
  type: CharacterType;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
  type: ParticleType;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  damage: number;
  ownerId: string;
  color: string;
  isSpear?: boolean;
}

export interface GameState {
  player: Entity & { currentWeapon: WeaponType; score: number };
  enemies: Entity[];
  projectiles: Projectile[];
  obstacles: Obstacle[];
  particles: Particle[];
  meteors: Meteor[];
  isGameOver: boolean;
  isPaused: boolean;
  isTrainingMode: boolean;
  wave: number;
}