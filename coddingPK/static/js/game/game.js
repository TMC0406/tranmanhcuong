/**
 * game.js - Core game functionality and coordination
 * 
 * This file is responsible for implementing the core game mechanics and
 * coordinating between different game modules. It provides key functions
 * needed by other modules and handles main game state.
 */

// Core game variables
let selectedCharacter = "warrior"; 
let selectedWeapon = "pistol"; 
let roomId = null;
let playerId = null;
let playerRef = null;
let obstacles = [];
let isDead = false;

// Initialize game functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Make key functions available globally
  window.selectedCharacter = selectedCharacter;
  window.selectedWeapon = selectedWeapon;
  window.roomId = roomId;
  window.playerId = playerId;
  window.playerRef = playerRef;
  window.obstacles = obstacles;
  window.isDead = isDead;

  // Initialize game components
  setupComponentInteractions();
});

/**
 * Sets up interactions between different components
 */
function setupComponentInteractions() {
  // Join room function - called when joining an existing room or after creating one
  window.joinRoom = function(rid) {
    // Reset game state
    isDead = false;
    roomId = rid;
    window.roomId = rid;
    
    // Generate player ID
    playerId = "player-" + Math.floor(Math.random() * 10000);
    window.playerId = playerId;
    
    // Initialize player with selected character
    if (window.initializePlayer) {
      window.initializePlayer(selectedCharacter);
    }
    
    // Create player reference
    playerRef = window.db.ref("rooms/" + roomId + "/players/" + playerId);
    window.playerRef = playerRef;
    
    // Display room ID
    if (window.displayRoomId) {
      window.displayRoomId(roomId);
    }
    
    // Get character stats
    const charStats = window.CHARACTERS[selectedCharacter];
    
    // Set player data in Firebase
    playerRef.set({ 
      x: Math.floor(Math.random() * 700), 
      y: 0, 
      hp: charStats.baseHp,
      maxHp: charStats.baseHp,
      energy: 0,
      name: window.getCurrentUserName(),
      character: selectedCharacter,
      weapon: selectedWeapon,
      weaponId: window.WEAPONS.findIndex(w => w.name.toLowerCase() === selectedWeapon),
      attacking: false, 
      skill_ready: false, 
      direction: "right",
      shield: 0,
      baseSpeed: charStats.baseSpeed,
      armorBonus: charStats.armorBonus || 0,
      speedBonus: charStats.speedBonus || 0,
      energyBonus: charStats.energyBonus || 0
    });
    
    // Set up cleanup when disconnected
    playerRef.onDisconnect().remove();
    if (window.setupRoomAutoCleanup) {
      window.setupRoomAutoCleanup(roomId);
    }
    
    // Show game UI
    window.showPanel("game");
    
    // Set up Firebase listeners
    setupFirebaseListeners();
    
    // Start the game loop if not already running
    if (window.startGameLoop) {
      window.startGameLoop();
    }
    
    // Set up keyboard listeners
    if (window.setupKeyListeners) {
      window.setupKeyListeners();
    }
    
    // Listen for obstacles
    if (window.listenObstacles) {
      window.listenObstacles();
    }
  };

  // Leave room function
  window.leaveRoom = function() {
    if (playerRef) {
      // Clear room ID display
      if (window.displayRoomId) {
        window.displayRoomId("");
      }

      // Remove all event listeners
      removeFirebaseListeners();

      // Remove the player from Firebase
      playerRef.onDisconnect().cancel(); // Cancel onDisconnect handler
      playerRef.remove()
        .then(() => {
          // Clear local state
          roomId = null;
          window.roomId = null;
          playerId = null;
          window.playerId = null;
          playerRef = null;
          window.playerRef = null;
          obstacles = [];
          window.obstacles = [];
          isDead = false;
          window.isDead = false;

          // Switch to room panel
          window.showPanel("room");
          if (window.loadRoomList) {
            window.loadRoomList();
          }
        })
        .catch(err => {
          console.error("Error leaving room:", err);
          
          // Still try to clean up UI even if Firebase fails
          window.showPanel("room");
          if (window.loadRoomList) {
            window.loadRoomList();
          }
        });
    }
  };

  // Delete room function
  window.deleteRoom = function(rid) {
    if (confirm('Bạn có chắc muốn xóa phòng ' + rid + ' không?')) {
      window.db.ref('rooms/' + rid).remove().then(() => {
        if (window.loadRoomList) {
          window.loadRoomList();
        }
      });
    }
  };
}

/**
 * Set up all Firebase listeners for the game
 */
function setupFirebaseListeners() {
  // Remove any existing listeners
  removeFirebaseListeners();
  
  // Set up players listener
  if (window.renderPlayers) {
    window._playersListener = window.db.ref("rooms/" + roomId + "/players");
    window._playersListener.on("value", window.renderPlayers);
  }
  
  // Set up bullets listener
  if (window.bulletsListener) {
    window._bulletsListener = window.db.ref("rooms/" + roomId + "/bullets");
    window._bulletsListener.on("value", window.bulletsListener);
  }
  
  // Set up items listener
  if (window.renderItems) {
    window._itemsListener = window.db.ref("rooms/" + roomId + "/items");
    window._itemsListener.on("value", window.renderItems);
  }
  
  // Set up interval for item spawning and cleanup
  if (window.handleItemSpawning && window.cleanupExpiredItems && window.checkItemPickups) {
    window._itemInterval = setInterval(() => {
      window.handleItemSpawning(roomId, 0.005, obstacles);
      window.cleanupExpiredItems(roomId);
      
      // Check for item pickups if player exists
      if (playerId && playerRef) {
        playerRef.once('value', snap => {
          const data = snap.val();
          if (data) {
            window.checkItemPickups(roomId, playerId, data.x, data.y);
          }
        });
      }
    }, 1000);
  }
}

/**
 * Remove all Firebase listeners
 */
function removeFirebaseListeners() {
  if (window._playersListener) {
    window._playersListener.off();
    window._playersListener = null;
  }
  
  if (window._bulletsListener) {
    window._bulletsListener.off();
    window._bulletsListener = null;
  }
  
  if (window._itemsListener) {
    window._itemsListener.off();
    window._itemsListener = null;
  }
  
  if (window._itemInterval) {
    clearInterval(window._itemInterval);
    window._itemInterval = null;
  }
}
