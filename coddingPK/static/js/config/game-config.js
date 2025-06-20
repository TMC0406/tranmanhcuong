// Game constants
const WEAPONS = [
  { id: 0, name: "Pistol", damage: 20, speed: 8, energy: 1, cooldown: 300 },
  { id: 1, name: "Shotgun", damage: 15, speed: 7, energy: 2, cooldown: 800 },
  { id: 2, name: "Rifle", damage: 25, speed: 10, energy: 2, cooldown: 400 },
  { id: 3, name: "Sniper", damage: 40, speed: 12, energy: 3, cooldown: 1200 },
  { id: 4, name: "Plasma", damage: 30, speed: 6, energy: 3, cooldown: 500 },
  { id: 5, name: "Rocket", damage: 50, speed: 5, energy: 4, cooldown: 1500 }
];

const SKILLS = [
  { id: 0, name: "Heal", energy: 3, duration: 0, cooldown: 5000,
    use: (player) => {
      player.hp = Math.min(MAX_HP, player.hp + 50);
      playerRef.update({ hp: player.hp });
    }
  },
  { id: 1, name: "Shield", energy: 2, duration: 5000, cooldown: 8000,
    use: (player) => {
      player.shield = Math.min(MAX_SHIELD, player.shield + 1);
      playerRef.update({ shield: player.shield });
    }
  },
  { id: 2, name: "Dash", energy: 2, duration: 500, cooldown: 3000,
    use: (player) => {
      const speed = 20;
      x += player.direction === "right" ? speed : -speed;
      playerRef.update({ x });
    }
  },
  { id: 3, name: "Energy Surge", energy: 0, duration: 3000, cooldown: 15000,
    use: (player) => {
      player.energy = MAX_ENERGY;
      playerRef.update({ energy: MAX_ENERGY });
    }
  },
  { id: 4, name: "Double Damage", energy: 4, duration: 4000, cooldown: 12000,
    use: (player) => {
      window._doubleDamage = true;
      setTimeout(() => window._doubleDamage = false, 4000);
    }
  },
  { id: 5, name: "Invisibility", energy: 5, duration: 3000, cooldown: 20000,
    use: (player) => {
      player.invisible = true;
      playerRef.update({ invisible: true });
      setTimeout(() => {
        player.invisible = false;
        playerRef.update({ invisible: false });
      }, 3000);
    }
  }
];

const ITEMS = [
  { id: 0, name: "Health", effect: "heal", amount: 50 },
  { id: 1, name: "Energy", effect: "energy", amount: 5 },
  { id: 2, name: "Speed", effect: "speed", duration: 5000 },
  { id: 3, name: "Shield", effect: "shield", amount: 1 }
];

const CHARACTERS = {
  warrior: {
    baseHp: 150,
    baseSpeed: 5,
    armorBonus: 0.2,
    speedBonus: 0,
    energyBonus: 0
  },
  scout: {
    baseHp: 100,
    baseSpeed: 6,
    armorBonus: 0,
    speedBonus: 0.2,
    energyBonus: 0
  },
  mage: {
    baseHp: 80,
    baseSpeed: 5,
    armorBonus: 0,
    speedBonus: 0,
    energyBonus: 0.3
  }
};

// Map definitions
const MAPS = [
  {
    id: 'classic',
    name: 'Classic Arena',
    background: '#222',
    obstacles: [
      { x: 100, y: 100, w: 60, h: 60 },
      { x: 640, y: 100, w: 60, h: 60 },
      { x: 370, y: 270, w: 60, h: 60 }
    ]
  },
  {
    id: 'desert',
    name: 'Desert Storm',
    background: '#a95',
    obstacles: [
      { x: 200, y: 150, w: 80, h: 40 },
      { x: 520, y: 150, w: 80, h: 40 },
      { x: 360, y: 300, w: 80, h: 40 }
    ]
  },
  {
    id: 'ice',
    name: 'Ice Field',
    background: '#adf',
    obstacles: [
      { x: 150, y: 80, w: 50, h: 100 },
      { x: 350, y: 200, w: 100, h: 50 },
      { x: 600, y: 120, w: 50, h: 80 },
      { x: 250, y: 350, w: 80, h: 50 },
      { x: 480, y: 80, w: 60, h: 60 }
    ]
  }
];

// Game constants
const MAX_HP = 200;
const MAX_ENERGY = 10;
const MAX_SHIELD = 5;

// Character and weapon data for display
const CHARACTER_INFO = {
  warrior: { name: "Warrior", stats: "HP: 150, Giáp +20%" },
  scout: { name: "Scout", stats: "Tốc độ +20%, HP: 100" },
  mage: { name: "Mage", stats: "Năng lượng +30%, HP: 80" }
};

const WEAPON_INFO = {
  pistol: { name: "Pistol", stats: "Cân bằng" },
  shotgun: { name: "Shotgun", stats: "Sát thương gần" },
  rifle: { name: "Rifle", stats: "Tấn công xa" }
};

// Export game constants
window.WEAPONS = WEAPONS;
window.SKILLS = SKILLS;
window.ITEMS = ITEMS;
window.CHARACTERS = CHARACTERS;
window.MAPS = MAPS;
window.MAX_HP = MAX_HP;
window.MAX_ENERGY = MAX_ENERGY; 
window.MAX_SHIELD = MAX_SHIELD;
window.CHARACTER_INFO = CHARACTER_INFO;
window.WEAPON_INFO = WEAPON_INFO;
