// renderer.js - Handles rendering of game elements

/**
 * Renders all players from the Firebase snapshot
 * @param {object} snapshot - Firebase snapshot with player data
 */
function renderPlayers(snapshot) {
  const container = document.getElementById("game-container");
  if (!container) return;
  
  // Remove existing players
  const oldPlayers = container.querySelectorAll('.player, .enemy');
  oldPlayers.forEach(p => p.remove());
  
  // Track the current player data
  let currentPlayer = null;
  
  // Render each player
  snapshot.forEach(playerSnap => {
    const playerKey = playerSnap.key;
    const playerData = playerSnap.val();
    
    // Skip rendering invisible players (except our own)
    if (playerData.invisible && playerKey !== window.playerId) {
      return;
    }
    
    // Create player element
    const playerElement = document.createElement("div");
    const isCurrentPlayer = playerKey === window.playerId;
    
    // Set classes
    const directionClass = playerData.direction === "left" ? " left" : " right";
    const characterClass = " " + playerData.character;
    playerElement.className = (isCurrentPlayer ? "player" : "enemy") + 
                             (playerData.moving ? " moving" : "") + 
                             directionClass +
                             characterClass;
    
    // Set position
    playerElement.style.left = playerData.x + "px";
    playerElement.style.bottom = playerData.y + "px";
    
    // Create character visual components
    createCharacterVisuals(playerElement, playerData);
    
    // Add name tag
    const nameTag = document.createElement("div");
    nameTag.className = "player-name";
    nameTag.textContent = playerData.name;
    playerElement.appendChild(nameTag);
    
    // Add health bar
    createHealthBar(playerElement, playerData);
    
    // Add energy bar for current player
    if (isCurrentPlayer) {
      createEnergyBar(playerElement, playerData);
    }
    
    // Add shield indicator if player has shield
    if (playerData.shield && playerData.shield > 0) {
      createShieldEffect(playerElement, playerData);
    }
    
    // Add to container
    container.appendChild(playerElement);
    
    // Store current player data
    if (isCurrentPlayer) {
      currentPlayer = playerData;
      window.playerShield = playerData.shield || 0;
      
      // Check for player death
      if (playerData.hp <= 0 && !window.playerIsDead) {
        window.playerIsDead = true;
        
        // Remove player and notify
        window.playerRef.remove().then(() => {
          setTimeout(() => {
            alert("Bạn đã chết!");
            window.leaveRoom();
            window.playerIsDead = false;
          }, 500);
        });
      }
    }
  });
  
  // Update stats display if current player exists
  if (currentPlayer) {
    updateStatsDisplay(currentPlayer);
  }
}

/**
 * Creates the visual components for a character
 * @param {HTMLElement} playerElement - The player element to add components to
 * @param {object} playerData - Player data from Firebase
 */
function createCharacterVisuals(playerElement, playerData) {
  // Create head
  const head = document.createElement("div");
  head.className = "head";
  
  // Create eyes
  const eyeLeft = document.createElement("div");
  eyeLeft.className = "eye left";
  const eyeRight = document.createElement("div");
  eyeRight.className = "eye right";
  
  head.appendChild(eyeLeft);
  head.appendChild(eyeRight);
  
  // Create body
  const body = document.createElement("div");
  body.className = "body";
  
  // Create weapon
  const weapon = document.createElement("div");
  weapon.className = "weapon " + playerData.weapon;
  
  // Add all components to player element
  playerElement.appendChild(head);
  playerElement.appendChild(body);
  playerElement.appendChild(weapon);
}

/**
 * Creates a health bar for a player
 * @param {HTMLElement} playerElement - The player element
 * @param {object} playerData - Player data from Firebase
 */
function createHealthBar(playerElement, playerData) {
  const healthBar = document.createElement("div");
  healthBar.className = "health-bar";
  
  const healthInner = document.createElement("div");
  healthInner.className = "health-inner";
  
  // Calculate health percentage
  const healthPercent = Math.max(0, Math.min(100, (playerData.hp / playerData.maxHp) * 100));
  healthInner.style.width = healthPercent + "%";
  
  // Color based on health amount
  if (healthPercent < 30) {
    healthInner.style.backgroundColor = "#f44";
  } else if (healthPercent < 60) {
    healthInner.style.backgroundColor = "#fa4";
  } else {
    healthInner.style.backgroundColor = "#4f4";
  }
  
  healthBar.appendChild(healthInner);
  playerElement.appendChild(healthBar);
}

/**
 * Creates an energy bar for the player
 * @param {HTMLElement} playerElement - The player element
 * @param {object} playerData - Player data from Firebase
 */
function createEnergyBar(playerElement, playerData) {
  const energyBar = document.createElement("div");
  energyBar.className = "energy-bar";
  
  const energyInner = document.createElement("div");
  energyInner.className = "energy-inner";
  
  // Calculate energy percentage
  const energyPercent = Math.max(0, Math.min(100, (playerData.energy / window.MAX_ENERGY) * 100));
  energyInner.style.width = energyPercent + "%";
  energyInner.style.backgroundColor = "#0af";
  
  energyBar.appendChild(energyInner);
  playerElement.appendChild(energyBar);
}

/**
 * Creates shield effect circles around a player
 * @param {HTMLElement} playerElement - The player element
 * @param {object} playerData - Player data from Firebase
 */
function createShieldEffect(playerElement, playerData) {
  const shieldLevels = playerData.shield;
  
  for (let i = 0; i < shieldLevels; i++) {
    const shieldCircle = document.createElement("div");
    shieldCircle.className = "shield-circle";
    
    // Shield size increases with level
    const size = 70 + i * 8;
    shieldCircle.style.width = size + "px";
    shieldCircle.style.height = size + "px";
    
    // Position in center
    shieldCircle.style.left = "50%";
    shieldCircle.style.bottom = "30px";
    shieldCircle.style.transform = "translateX(-50%)";
    
    // Styling
    shieldCircle.style.border = "2px solid #08a";
    shieldCircle.style.borderRadius = "50%";
    shieldCircle.style.position = "absolute";
    shieldCircle.style.boxSizing = "border-box";
    shieldCircle.style.pointerEvents = "none";
    shieldCircle.style.opacity = (0.18 + 0.18 * i).toFixed(2); // Outer layers more opaque
    shieldCircle.style.zIndex = 10 + i;
    shieldCircle.style.filter = `blur(${2 * (playerData.shield - i - 1)}px)`;
    
    playerElement.appendChild(shieldCircle);
  }
}

/**
 * Renders obstacles in the game container
 * @param {Array} obstacles - Array of obstacle objects
 */
function renderObstacles(obstacles) {
  const container = document.getElementById("game-container");
  if (!container) return;
  
  // Remove existing obstacles
  const oldObstacles = container.querySelectorAll('.obstacle');
  oldObstacles.forEach(o => o.remove());
  
  // Render each obstacle
  obstacles.forEach(obstacle => {
    const obstacleElement = document.createElement('div');
    obstacleElement.className = 'obstacle';
    obstacleElement.style.left = obstacle.x + 'px';
    obstacleElement.style.bottom = obstacle.y + 'px';
    obstacleElement.style.width = obstacle.w + 'px';
    obstacleElement.style.height = obstacle.h + 'px';
    obstacleElement.style.background = '#444';
    obstacleElement.style.border = '2px solid #888';
    obstacleElement.style.position = 'absolute';
    obstacleElement.style.borderRadius = '8px';
    obstacleElement.style.opacity = '0.85';
    
    container.appendChild(obstacleElement);
  });
}

/**
 * Renders all items in the game container
 * @param {object} snapshot - Firebase snapshot with item data
 */
function renderItems(snapshot) {
  const container = document.getElementById("game-container");
  if (!container) return;
  
  // Remove existing items
  const oldItems = container.querySelectorAll('.item');
  oldItems.forEach(i => i.remove());
  
  // Render each item
  snapshot.forEach(itemSnap => {
    const itemData = itemSnap.val();
    
    const itemElement = document.createElement('div');
    itemElement.className = 'item';
    itemElement.dataset.itemId = itemSnap.key;
    
    // Position the item
    itemElement.style.left = itemData.x + 'px';
    itemElement.style.bottom = itemData.y + 'px';
    
    // Set item type class
    itemElement.classList.add('item-' + itemData.type);
    
    // Add icon based on item type
    const icon = document.createElement('div');
    icon.className = 'item-icon';
    
    switch (itemData.type) {
      case 0: // Health
        icon.textContent = '❤️';
        break;
      case 1: // Energy
        icon.textContent = '⚡';
        break;
      case 2: // Speed
        icon.textContent = '🏃';
        break;
      case 3: // Shield
        icon.textContent = '🛡️';
        break;
      default:
        icon.textContent = '?';
    }
    
    itemElement.appendChild(icon);
    container.appendChild(itemElement);
  });
}

/**
 * Updates the stats display with current player data
 * @param {object} playerData - Current player data
 */
function updateStatsDisplay(playerData) {
  const statsElement = document.getElementById("stats");
  if (!statsElement) return;
  
  const weaponName = window.WEAPONS[playerData.weaponId || 0].name;
  const skillName = window.SKILLS[playerData.skillId || 0].name;
  
  statsElement.innerHTML = `
    <div class="stat-bar">
      <span>HP: ${Math.floor(playerData.hp)}/${playerData.maxHp}</span>
      <div class="bar-bg">
        <div class="bar-fill" style="width:${(playerData.hp / playerData.maxHp) * 100}%; background:#4f4"></div>
      </div>
    </div>
    <div class="stat-bar">
      <span>Energy: ${Math.floor(playerData.energy)}/${window.MAX_ENERGY}</span>
      <div class="bar-bg">
        <div class="bar-fill" style="width:${(playerData.energy / window.MAX_ENERGY) * 100}%; background:#0af"></div>
      </div>
    </div>
    <div class="stat-info">
      <span>Shield: ${playerData.shield || 0}/${window.MAX_SHIELD}</span>
      <span style="margin-left:10px;">Giáp: +${Math.floor((playerData.armorBonus || 0) * 100)}%</span>
    </div>
    <div class="stat-info">
      <span>Vũ khí: ${weaponName}</span>
      <span style="margin-left:10px;">Kỹ năng: ${skillName}</span>
    </div>
  `;
}

// Export to window
window.renderPlayers = renderPlayers;
window.renderObstacles = renderObstacles;
window.renderItems = renderItems;
window.updateStatsDisplay = updateStatsDisplay;
