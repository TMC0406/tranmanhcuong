// player.js - Manages player functionality and state

// Player state variables
let playerDirection = "right";
let playerX = 0;
let playerY = 0;
let playerHp = 200;
let playerEnergy = 0;
let playerShield = 0;
let playerAttacking = false;
let playerSkillReady = false;
let playerIsDead = false;
let currentWeapon = 0;
let currentSkill = 0;
let lastShot = 0;
let lastSkillUse = 0;
let lastShieldUse = 0;

// Constants
const MAX_HP = 200;
const MAX_ENERGY = 10;
const MAX_SHIELD = 5;

/**
 * Initialize the player with character stats
 * @param {string} characterType - Type of character (warrior, scout, mage)
 */
function initializePlayer(characterType) {
  const charStats = window.CHARACTERS[characterType];
  playerHp = charStats.baseHp;
  playerEnergy = 0;
  playerShield = 0;
  playerX = Math.floor(Math.random() * 700);
  playerY = 0;
  playerDirection = "right";
  playerIsDead = false;
}

/**
 * Updates the player position based on key input and collisions
 * @param {object} keys - Object containing pressed keys state
 * @param {Array} obstacles - Array of obstacle objects to check collision with
 * @param {number} deltaTime - Time since last update in ms
 */
function updatePlayerPosition(keys, obstacles, deltaTime) {
  // Get player data from Firebase
  if (!window.playerRef) return;

  // Calculate movement speed
  const baseSpeed = 5; // Base speed
  let speedBonus = 0;
  
  window.playerRef.once('value', snap => {
    if (!snap.exists()) return;
    
    const data = snap.val();
    if (!data) return;
    
    // Update local state with server state
    playerX = data.x || 0;
    playerY = data.y || 0;
    playerDirection = data.direction || "right";
    playerHp = data.hp || 0;
    playerEnergy = data.energy || 0;
    playerShield = data.shield || 0;
    
    // Apply character speed bonus if any
    speedBonus = data.speedBonus || 0;
    
    // Calculate movement
    let dx = 0;
    let dy = 0;
    let isMoving = false;
    const speed = baseSpeed * (1 + speedBonus) * (deltaTime / 16); // Normalize for frame rate
    
    // Handle key input for movement
    if (keys["ArrowUp"] || keys["w"] || keys["W"]) {
      dy += speed;
      isMoving = true;
    }
    if (keys["ArrowDown"] || keys["s"] || keys["S"]) {
      dy -= speed;
      isMoving = true;
    }
    if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
      dx -= speed;
      playerDirection = "left";
      isMoving = true;
    }
    if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
      dx += speed;
      playerDirection = "right";
      isMoving = true;
    }
    
    // Apply movement
    if (dx !== 0 || dy !== 0) {
      // Check collision before moving
      const newX = Math.max(0, Math.min(window.innerWidth - 20, playerX + dx));
      const newY = Math.max(0, Math.min(400, playerY + dy));
      
      // Check for collisions with obstacles
      if (!checkCollision(newX, newY, obstacles)) {
        playerX = newX;
        playerY = newY;
        
        // Update player position in Firebase
        const updates = {
          x: playerX,
          y: playerY,
          direction: playerDirection,
          moving: isMoving
        };
        
        window.playerRef.update(updates);
      }
    } else if (isMoving !== data.moving) {
      // Update moving state if it changed
      window.playerRef.update({ moving: isMoving });
    }
  });
}

/**
 * Checks collision between player and obstacles
 * @param {number} x - Player x position
 * @param {number} y - Player y position
 * @param {Array} obstacles - Array of obstacle objects
 * @returns {boolean} True if collision detected
 */
function checkCollision(x, y, obstacles) {
  const playerWidth = 30; // Approximate player width
  const playerHeight = 60; // Approximate player height
  
  // Check collision with each obstacle
  for (const obs of obstacles) {
    if (x < obs.x + obs.w &&
        x + playerWidth > obs.x &&
        y < obs.y + obs.h &&
        y + playerHeight > obs.y) {
      return true; // Collision detected
    }
  }
  
  return false; // No collision
}

/**
 * Handle player shooting
 * @param {object} keys - Object containing pressed keys state
 */
function handlePlayerShooting(keys) {
  // Get the current time for cooldown calculation
  const now = Date.now();
  
  // Check if player is trying to shoot
  if ((keys["j"] || keys["J"] || keys["0"]) && now - lastShot > window.WEAPONS[currentWeapon].cooldown) {
    // Get current weapon data
    const weapon = window.WEAPONS[currentWeapon];
    
    // Check if player has enough energy
    if (playerEnergy >= weapon.energy) {
      // Create bullet data
      const bulletData = {
        x: playerX + (playerDirection === "right" ? 30 : 0),
        y: playerY + 30,
        directionX: playerDirection === "right" ? 1 : -1,
        speed: weapon.speed,
        damage: weapon.damage * (window._doubleDamage ? 2 : 1),
        owner: window.playerId,
        timestamp: now
      };
      
      // Add bullet to Firebase
      window.db.ref(`rooms/${window.roomId}/bullets`).push(bulletData);
      
      // Update last shot time
      lastShot = now;
      
      // Consume energy
      const energyBonus = window.CHARACTERS[window.selectedCharacter].energyBonus || 0;
      const energyCost = Math.max(1, Math.floor(weapon.energy * (1 - energyBonus)));
      
      playerEnergy = Math.max(0, playerEnergy - energyCost);
      window.playerRef.update({ energy: playerEnergy });
    }
  }
}

/**
 * Handle player skill usage
 * @param {object} keys - Object containing pressed keys state
 */
function handlePlayerSkill(keys) {
  // Get the current time for cooldown calculation
  const now = Date.now();
  
  // Check if player is trying to use a skill
  if ((keys["k"] || keys["K"] || keys["1"]) && now - lastSkillUse > window.SKILLS[currentSkill].cooldown) {
    // Get current skill data
    const skill = window.SKILLS[currentSkill];
    
    // Check if player has enough energy
    const energyBonus = window.CHARACTERS[window.selectedCharacter].energyBonus || 0;
    const energyCost = Math.floor(skill.energy * (1 - energyBonus));
    
    if (playerEnergy >= energyCost) {
      // Use the skill
      skill.use({ hp: playerHp, energy: playerEnergy, direction: playerDirection, shield: playerShield });
      
      // Update last skill use time
      lastSkillUse = now;
      
      // Consume energy (if not an energy skill)
      if (skill.id !== 3) { // Energy Surge
        playerEnergy = Math.max(0, playerEnergy - energyCost);
        window.playerRef.update({ energy: playerEnergy });
      }
    }
  }
}

/**
 * Handle shield creation
 * @param {object} keys - Object containing pressed keys state
 */
function handleShieldCreation(keys) {
  const now = Date.now();
  
  // Check if player is trying to create a shield
  if ((keys["l"] || keys["L"] || keys["2"]) && now - lastShieldUse > 1000 && playerShield < MAX_SHIELD) {
    // Check if player has enough energy
    if (playerEnergy >= 2) {
      // Create a shield
      playerShield = Math.min(MAX_SHIELD, playerShield + 1);
      playerEnergy = Math.max(0, playerEnergy - 2);
      
      // Update player data in Firebase
      window.playerRef.update({
        shield: playerShield,
        energy: playerEnergy
      });
      
      // Update last shield use time
      lastShieldUse = now;
    }
  }
}

/**
 * Update player energy over time
 * @param {number} deltaTime - Time since last update in ms 
 */
function updatePlayerEnergy(deltaTime) {
  // Regenerate energy over time
  if (playerEnergy < MAX_ENERGY) {
    // Energy regeneration rate: 1 per 2 seconds
    const regenerationRate = deltaTime / 2000;
    playerEnergy = Math.min(MAX_ENERGY, playerEnergy + regenerationRate);
    
    // Update energy in Firebase every 0.5 energy to reduce updates
    if (Math.floor(playerEnergy * 2) > Math.floor((playerEnergy - regenerationRate) * 2)) {
      window.playerRef.update({ energy: playerEnergy });
    }
  }
}

/**
 * Handle all player updates in the game loop
 * @param {object} keys - Object containing pressed keys state
 * @param {Array} obstacles - Array of obstacle objects
 * @param {number} deltaTime - Time since last update in ms
 */
function updatePlayer(keys, obstacles, deltaTime) {
  if (playerIsDead || !window.playerRef) return;
  
  updatePlayerPosition(keys, obstacles, deltaTime);
  handlePlayerShooting(keys);
  handlePlayerSkill(keys);
  handleShieldCreation(keys);
  updatePlayerEnergy(deltaTime);
  
  // Check if player is dead
  if (playerHp <= 0 && !playerIsDead) {
    playerIsDead = true;
    
    // Notify and clean up
    window.playerRef.remove().then(() => {
      setTimeout(() => {
        alert("Bạn đã chết!");
        window.leaveRoom();
        playerIsDead = false;
      }, 500);
    });
  }
}

// Export functions to window
window.initializePlayer = initializePlayer;
window.updatePlayer = updatePlayer;
window.checkCollision = checkCollision;
