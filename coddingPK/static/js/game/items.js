// items.js - Handles game items and pickups

/**
 * Handles the spawning of items in the game
 * @param {string} roomId - The current room ID
 * @param {number} chance - Chance of spawning an item (0-1)
 * @param {Array} obstacles - Obstacles to avoid when spawning 
 */
function handleItemSpawning(roomId, chance = 0.005, obstacles = []) {
  if (Math.random() > chance || !roomId) return;
  
  // Get a reference to the items in this room
  const itemsRef = window.db.ref(`rooms/${roomId}/items`);
  
  // Check how many items already exist
  itemsRef.once('value', snapshot => {
    // Limit total items to 5 at a time
    if (snapshot.numChildren() >= 5) return;
    
    // Generate item data
    const itemType = Math.floor(Math.random() * window.ITEMS.length);
    const itemData = {
      type: itemType,
      x: 30 + Math.floor(Math.random() * (window.innerWidth - 60)),
      y: 30 + Math.floor(Math.random() * 340),
      spawnTime: Date.now()
    };
    
    // Check for collision with obstacles
    if (obstacles.some(obs => isColliding(itemData.x, itemData.y, 20, 20, obs.x, obs.y, obs.w, obs.h))) {
      // Try again next time if there's a collision
      return;
    }
    
    // Add the item to Firebase
    itemsRef.push(itemData);
  });
}

/**
 * Check for collision between an item and a player
 * @param {string} roomId - The current room ID
 * @param {string} playerId - The player's ID
 * @param {number} playerX - Player's X position
 * @param {number} playerY - Player's Y position
 */
function checkItemPickups(roomId, playerId, playerX, playerY) {
  if (!roomId || !playerId) return;
  
  // Get items and player references
  const itemsRef = window.db.ref(`rooms/${roomId}/items`);
  const playerRef = window.db.ref(`rooms/${roomId}/players/${playerId}`);
  
  // Check current items
  itemsRef.once('value', snapshot => {
    snapshot.forEach(itemSnap => {
      const itemKey = itemSnap.key;
      const item = itemSnap.val();
      
      // Check if player collides with this item
      if (isColliding(playerX, playerY, 30, 60, item.x, item.y, 20, 20)) {
        // Remove the item first to prevent double pickup
        itemsRef.child(itemKey).remove();
        
        // Apply the item effect to the player
        applyItemEffect(item, playerRef);
      }
    });
  });
}

/**
 * Apply an item's effect to the player
 * @param {object} item - The item data
 * @param {object} playerRef - Firebase reference to the player
 */
function applyItemEffect(item, playerRef) {
  // Get current player data
  playerRef.once('value', snapshot => {
    const playerData = snapshot.val();
    if (!playerData) return;
    
    let updates = {};
    
    // Apply effect based on item type
    switch (item.type) {
      case 0: // Health
        updates.hp = Math.min(playerData.maxHp, playerData.hp + window.ITEMS[0].amount);
        break;
        
      case 1: // Energy
        updates.energy = Math.min(window.MAX_ENERGY, playerData.energy + window.ITEMS[1].amount);
        break;
        
      case 2: // Speed Boost
        // Apply temporary speed boost
        updates.speedBoost = (playerData.speedBoost || 0) + 0.5;
        
        // Remove the boost after duration
        setTimeout(() => {
          playerRef.transaction(player => {
            if (player) {
              player.speedBoost = (player.speedBoost || 0) - 0.5;
              if (player.speedBoost <= 0) {
                player.speedBoost = 0;
              }
            }
            return player;
          });
        }, window.ITEMS[2].duration);
        break;
        
      case 3: // Shield
        updates.shield = Math.min(window.MAX_SHIELD, (playerData.shield || 0) + window.ITEMS[3].amount);
        break;
    }
    
    // Apply updates to the player
    playerRef.update(updates);
  });
}

/**
 * Clean up expired items (older than 30 seconds)
 * @param {string} roomId - The current room ID
 */
function cleanupExpiredItems(roomId) {
  if (!roomId) return;
  
  const itemsRef = window.db.ref(`rooms/${roomId}/items`);
  const currentTime = Date.now();
  const maxAge = 30000; // 30 seconds
  
  itemsRef.once('value', snapshot => {
    snapshot.forEach(itemSnap => {
      const item = itemSnap.val();
      
      // Remove items that have been around too long
      if (item.spawnTime && currentTime - item.spawnTime > maxAge) {
        itemsRef.child(itemSnap.key).remove();
      }
    });
  });
}

/**
 * Check for collision between two rectangles
 * @param {number} x1 - First rectangle X position
 * @param {number} y1 - First rectangle Y position
 * @param {number} w1 - First rectangle width
 * @param {number} h1 - First rectangle height
 * @param {number} x2 - Second rectangle X position
 * @param {number} y2 - Second rectangle Y position
 * @param {number} w2 - Second rectangle width
 * @param {number} h2 - Second rectangle height
 * @returns {boolean} True if collision detected
 */
function isColliding(x1, y1, w1, h1, x2, y2, w2, h2) {
  return (
    x1 < x2 + w2 &&
    x1 + w1 > x2 &&
    y1 < y2 + h2 &&
    y1 + h1 > y2
  );
}

// Export functions to window
window.handleItemSpawning = handleItemSpawning;
window.checkItemPickups = checkItemPickups;
window.cleanupExpiredItems = cleanupExpiredItems;
