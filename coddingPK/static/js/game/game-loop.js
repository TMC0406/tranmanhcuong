// game-loop.js - Manages the main game loop and controls

// Game state variables
let lastFrameTime = 0;
let gameLoopRunning = false;
let keys = {};

/**
 * Main game loop function
 * @param {number} timestamp - Current timestamp from requestAnimationFrame
 */
function gameLoop(timestamp) {
  // Handle first frame
  if (!lastFrameTime) lastFrameTime = timestamp;
  
  // Calculate time since last frame
  const deltaTime = timestamp - lastFrameTime;
  lastFrameTime = timestamp;
  
  // Skip if not connected to a room
  if (!window.roomId || !window.playerRef) {
    requestAnimationFrame(gameLoop);
    return;
  }
  
  // Update player movement and actions
  if (window.updatePlayer) {
    window.updatePlayer(keys, window.obstacles || [], deltaTime);
  }
  
  // Update bullets
  if (window.updateBullets) {
    window.updateBullets(deltaTime);
  }
  
  // Render bullets
  if (window.renderBullets) {
    window.renderBullets();
  }
  
  // Continue the loop
  requestAnimationFrame(gameLoop);
}

/**
 * Set up keyboard event listeners
 */
function setupKeyListeners() {
  // Key down event
  window.onkeydown = event => {
    keys[event.key] = true;
    
    // Set direction based on movement keys
    if (["a", "ArrowLeft", "ф", "Ф", "щ", "Щ"].includes(event.key)) {
      window.playerDirection = "left";
    }
    else if (["d", "ArrowRight", "в", "В"].includes(event.key)) {
      window.playerDirection = "right";
    }
    
    // Weapon switch keys
    if (event.key === "1" || event.key === "2" || event.key === "3") {
      const weaponIndex = parseInt(event.key) - 1;
      if (weaponIndex >= 0 && weaponIndex < window.WEAPONS.length) {
        window.currentWeapon = weaponIndex;
      }
    }
    
    // Skill switch keys
    if (["q", "Q"].includes(event.key)) {
      window.currentSkill = (window.currentSkill + 1) % window.SKILLS.length;
      // Update UI to show selected skill
      updateSelectedSkillUI();
    }
  };
  
  // Key up event
  window.onkeyup = event => {
    keys[event.key] = false;
  };
}

/**
 * Update the UI to show the currently selected skill
 */
function updateSelectedSkillUI() {
  // Implementation depends on how the UI is structured
  // This is a placeholder function that should be implemented
  // based on the actual UI design
  console.log("Selected skill: " + window.SKILLS[window.currentSkill].name);
}

/**
 * Start the game loop if not already running
 */
function startGameLoop() {
  if (!gameLoopRunning) {
    gameLoopRunning = true;
    requestAnimationFrame(gameLoop);
  }
}

/**
 * Listen for obstacles in the current room
 */
function listenObstacles() {
  if (!window.roomId) return;
  
  // Listen for room data to get obstacles
  window.db.getRoomRef(window.roomId).on('value', snapshot => {
    const roomData = snapshot.val();
    if (roomData) {
      // Update obstacles array
      window.obstacles = roomData.obstacles || [];
      
      // Render obstacles
      if (window.renderObstacles) {
        window.renderObstacles(window.obstacles);
      }
      
      // Apply map background if available
      if (roomData.mapId) {
        const mapData = window.MAPS.find(m => m.id === roomData.mapId);
        if (mapData) {
          const gameContainer = document.getElementById('game-container');
          if (gameContainer) {
            gameContainer.style.background = mapData.background;
          }
        }
      }
    }
  });
}

/**
 * Set up event listeners for game window resizing
 */
function setupGameResizeListeners() {
  window.addEventListener('resize', () => {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      // Adjust game size as needed
      // This is a placeholder for any specific resizing logic
    }
  });
}

// Game initialization function
function initGame() {
  // Set up event listeners
  setupKeyListeners();
  setupGameResizeListeners();
  
  // Start game loop
  startGameLoop();
  
  // Set up leave room button handler
  const leaveRoomBtn = document.getElementById('leave-room-btn');
  if (leaveRoomBtn) {
    leaveRoomBtn.onclick = window.leaveRoom;
  }
}

// Export functions to window
window.gameLoop = gameLoop;
window.setupKeyListeners = setupKeyListeners;
window.startGameLoop = startGameLoop;
window.listenObstacles = listenObstacles;
window.initGame = initGame;

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // The game will be fully initialized when joining a room
  // This just sets up the initial event listeners
  setupKeyListeners();
});
