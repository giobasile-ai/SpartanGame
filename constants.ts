
import { WeaponType, Weapon } from './types';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;

export const WORLD_WIDTH = 3000;
export const WORLD_HEIGHT = 2000;

export const PLAYER_SPEED = 4.5;
export const ROTATION_SPEED = 0.08;
export const JUMP_FORCE = -11;
export const GRAVITY = 0.75;

export const WEAPONS: Record<WeaponType, Weapon> = {
  [WeaponType.SPEAR]: {
    type: WeaponType.SPEAR,
    name: 'Dory (Spear)',
    damage: 35, // Ridotto da 60
    fireRate: 650,
    color: '#D4AF37'
  },
  [WeaponType.SHIELD]: {
    type: WeaponType.SHIELD,
    name: 'Aspis (Shield)',
    damage: 10, // Ora infligge un po' di danno da impatto
    fireRate: 0,
    color: '#8B0000'
  },
  [WeaponType.BERETTA]: {
    type: WeaponType.BERETTA,
    name: 'Beretta 92FS',
    damage: 12, // Ridotto da 25
    fireRate: 220,
    ammo: 15,
    maxAmmo: 15,
    color: '#333333'
  },
  [WeaponType.AK47]: {
    type: WeaponType.AK47,
    name: 'Kalashnikov AK47',
    damage: 8, // Ridotto da 18
    fireRate: 100,
    ammo: 30,
    maxAmmo: 30,
    color: '#4B5320'
  }
};
