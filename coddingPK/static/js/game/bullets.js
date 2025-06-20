// bullets.js - Manages bullet functionality and rendering

let bullets = [];

/**
 * Handle bullet updates from the Firebase database
 * @param {object} snapshot - The Firebase snapshot containing bullet data
 */
function bulletsListener(snapshot) {
  bullets = [];
  snapshot.forEach(bullet => {
    const bulletData = bullet.val();
    bulletData._key = bullet.key; // Store the Firebase key for reference
    bullets.push(bulletData);
  });
}

/**
 * Renders all bullets in the game container
 */
function renderBullets() {
  const container = document.getElementById("game-container");
  if (!container) return;
  
  // Remove existing bullets
  const existingBullets = container.querySelectorAll('.bullet');
  existingBullets.forEach(b => b.remove());
  
  // Render each bullet
  bullets.forEach(bullet => {
    const bulletElem = document.createElement("div");
    bulletElem.className = "bullet";
    bulletElem.style.left = bullet.x + "px";
    bulletElem.style.bottom = bullet.y + "px";
    
    // Apply different styles based on bullet type or owner
    if (bullet.owner === window.playerId) {
      bulletElem.classList.add("player-bullet");
    }
    
    container.appendChild(bulletElem);
  });
}

/**
 * Update all bullets (position and collision detection)
 * @param {number} deltaTime - Time since last update in ms
 * @param {Array} obstacles - Array of obstacle objects for collision detection
 */
function updateBullets(deltaTime) {
  if (!window.roomId) return;
  
  const bulletsRef = window.db.ref(`rooms/${window.roomId}/bullets`);
  const now = Date.now();
  
  // Process each bullet
  bullets.forEach(bullet => {
    // Skip processing if bullet is too old (3 seconds)
    if (now - bullet.timestamp > 3000) {
      bulletsRef.child(bullet._key).remove();
      return;
    }
    
    // Update position
    const newX = bullet.x + bullet.directionX * bullet.speed;
    const newY = bullet.y;
    
    // Check for out of bounds
    if (newX < -10 || newX > window.innerWidth + 10) {
      bulletsRef.child(bullet._key).remove();
      return;
    }
    
    // Check for obstacle collisions
    if (window.obstacles && window.obstacles.length > 0) {
      for (const obstacle of window.obstacles) {
        if (checkBulletObstacleCollision(newX, newY, obstacle)) {
          bulletsRef.child(bullet._key).remove();
          return;
        }
      }
    }
    
    // Check for player collisions
    const playersRef = window.db.ref(`rooms/${window.roomId}/players`);
    playersRef.once('value', playersSnapshot => {
      playersSnapshot.forEach(playerSnapshot => {
        const player = playerSnapshot.val();
        const playerKey = playerSnapshot.key;
        
        // Skip collision with bullet owner
        if (playerKey === bullet.owner) return;
        
        // Check collision
        if (checkBulletPlayerCollision(newX, newY, player)) {
          // Apply damage to player
          applyDamageToPlayer(playerKey, bullet.damage, player);
          // Remove the bullet
          bulletsRef.child(bullet._key).remove();
          return;
        }
      });
    });
    
    // Update bullet position if it still exists
    bulletsRef.child(bullet._key).update({
      x: newX,
      y: newY
    });
  });
}

/**
 * Check collision between a bullet and a player
 * @param {number} bulletX - Bullet X position
 * @param {number} bulletY - Bullet Y position
 * @param {object} player - Player object with position data
 * @returns {boolean} True if collision detected
 */
function checkBulletPlayerCollision(bulletX, bulletY, player) {
  const bulletSize = 10;
  const playerWidth = 30;
  const playerHeight = 60;
  
  return (
    bulletX + bulletSize > player.x &&
    bulletX < player.x + playerWidth &&
    bulletY + bulletSize > player.y &&
    bulletY < player.y + playerHeight
  );
}

/**
 * Check collision between a bullet and an obstacle
 * @param {number} bulletX - Bullet X position
 * @param {number} bulletY - Bullet Y position
 * @param {object} obstacle - Obstacle object with position and size data
 * @returns {boolean} True if collision detected
 */
function checkBulletObstacleCollision(bulletX, bulletY, obstacle) {
  const bulletSize = 10;
  
  return (
    bulletX + bulletSize > obstacle.x &&
    bulletX < obstacle.x + obstacle.w &&
    bulletY + bulletSize > obstacle.y &&
    bulletY < obstacle.y + obstacle.h
  );
}

/**
 * Apply damage to a player when hit by a bullet
 * @param {string} playerKey - Firebase key of the player
 * @param {number} damage - Amount of damage to apply
 * @param {object} playerData - Current player data
 */
function applyDamageToPlayer(playerKey, damage, playerData) {
  if (!window.roomId) return;
  
  const playerRef = window.db.ref(`rooms/${window.roomId}/players/${playerKey}`);
  
  // Calculate damage reduction based on shield
  let actualDamage = damage;
  let newShield = playerData.shield || 0;
  
  if (newShield > 0) {
    // Shield reduces damage by 10% per shield level
    const reduction = Math.min(0.9, newShield * 0.1);
    actualDamage = Math.floor(damage * (1 - reduction));
  }
  
  // Apply damage to health
  const newHp = Math.max(0, (playerData.hp || 0) - actualDamage);
  
  // Update player data
  playerRef.update({
    hp: newHp,
    lastDamageTime: Date.now()
  });
}

// Export to window
window.bulletsListener = bulletsListener;
window.renderBullets = renderBullets;
window.updateBullets = updateBullets;
