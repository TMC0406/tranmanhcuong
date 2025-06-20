// rooms.js - Manages room functionality and state

// Module variables
let currentRoomId = null;
let playerId = null;
let playerRef = null;

// Clean up rooms without players
function cleanupOldRooms() {
  window.db.getRoomsRef().once('value', snap => {
    snap.forEach(room => {
      const roomData = room.val();
      if (!roomData.players || Object.keys(roomData.players).length === 0) {
        window.db.getRoomRef(room.key).remove();
      }
    });
  });
}

// Setup auto cleanup for a room
function setupRoomAutoCleanup(roomId) {
  const roomRef = window.db.getRoomRef(roomId);
  const playersRef = window.db.getPlayersRef(roomId);
  
  // Cleanup when no players left
  playersRef.on('value', snap => {
    if (snap.numChildren() === 0) {
      // Wait 500ms to ensure onDisconnect has executed
      setTimeout(() => {
        playersRef.once('value', s2 => {
          if (s2.numChildren() === 0) {
            roomRef.remove();
          }
        });
      }, 500);
    }
  });

  // Clean up old rooms when joining a new one
  cleanupOldRooms();
}

/**
 * Creates a new room with the selected map
 */
function createRoomWithSelectedMap() {
  const newRoomId = "room-" + Math.floor(Math.random() * 100000);
  
  // Get the selected map data
  const mapData = window.MAPS.find(m => m.id === window.selectedMap) || window.MAPS[0];
  const obstacles = JSON.parse(JSON.stringify(mapData.obstacles));
  
  // Create the room with the selected map
  window.db.getRoomRef(newRoomId).set({
    created: Date.now(), 
    obstacles, 
    players: {},
    mapId: window.selectedMap,
    mapName: mapData.name
  }).then(() => {
    // Join the room
    joinRoom(newRoomId);
  });
}

/**
 * Leaves the current room
 */
function leaveRoom() {
  if (playerRef) {
    // First, update room-id display to show we're leaving
    window.displayRoomId("");

    // Remove all event listeners first
    if (window._playersListener) {
      window._playersListener.off();
      window._playersListener = null;
    }
    if (window._bulletsListener) {
      window._bulletsListener.off();
      window._bulletsListener = null;
    }

    // Remove the player from Firebase and clear handlers
    playerRef.onDisconnect().cancel(); // Cancel onDisconnect handler
    playerRef.remove()
      .then(() => {
        // Clear all local state
        currentRoomId = null;
        playerId = null;
        playerRef = null;
        window.bullets = [];
        window.obstacles = [];
        window.isDead = false; // Reset death state
        window.hp = window.CHARACTERS[window.selectedCharacter].baseHp; // Reset HP

        // Switch to room panel and refresh room list
        window.showPanel("room");
        window.loadRoomList();
      })
      .catch(error => {
        console.error("Error leaving room:", error);
        // Still clean up UI even if Firebase fails
        window.showPanel("room");
        window.loadRoomList();
      });
  }
}

/**
 * Joins a specified room
 * @param {string} rid - The ID of the room to join
 */
function joinRoom(rid) {
  // Reset state
  window.isDead = false;
  currentRoomId = rid;
  playerId = "player-" + Math.floor(Math.random() * 10000);
  
  // Initialize position randomly
  window.x = Math.floor(Math.random() * 700);
  window.y = 0;
  
  // Apply stats based on character
  const charStats = window.CHARACTERS[window.selectedCharacter];
  window.hp = charStats.baseHp;
  const maxHp = charStats.baseHp;
  window.energy = 0;
  const baseSpeed = charStats.baseSpeed;
  window.direction = "right";
  window.shield = 0;
  
  // Create new player reference
  playerRef = window.db.getPlayerRef(currentRoomId, playerId);
  
  // Display room ID
  window.displayRoomId(currentRoomId);
  
  // Update player data on Firebase
  playerRef.set({ 
    x: window.x, 
    y: window.y, 
    hp: window.hp, 
    maxHp,
    energy: window.energy, 
    name: window.getCurrentUserName(), // Get username from auth.js
    character: window.selectedCharacter,
    weapon: window.selectedWeapon,
    attacking: false, 
    skill_ready: false, 
    direction: window.direction,
    shield: window.shield,
    baseSpeed,
    armorBonus: window.CHARACTERS[window.selectedCharacter].armorBonus || 0,
    speedBonus: window.CHARACTERS[window.selectedCharacter].speedBonus || 0,
    energyBonus: window.CHARACTERS[window.selectedCharacter].energyBonus || 0
  });
  
  // Setup cleanup on disconnect
  playerRef.onDisconnect().remove();
  setupRoomAutoCleanup(currentRoomId);
  
  // Switch to game panel
  window.showPanel("game");
  
  // Register listeners
  registerGameListeners();
  
  // Start game loop if not already running
  if (!window._gameStarted) { 
    window._gameStarted = true; 
    window.gameLoop(); 
  }
  
  // Setup key listeners
  window.setupKeyListeners();
  window.listenObstacles();
}

/**
 * Registers all game data listeners
 */
function registerGameListeners() {
  // Remove existing listeners
  if (window._playersListener) window._playersListener.off();
  if (window._bulletsListener) window._bulletsListener.off();
  if (window._itemsListener) window._itemsListener.off();
  
  // Create new listeners
  window._playersListener = window.db.getPlayersRef(currentRoomId);
  window._bulletsListener = window.db.getBulletsRef(currentRoomId);
  window._itemsListener = window.db.getItemsRef(currentRoomId);
  
  // Attach listeners
  window._playersListener.on("value", window.renderPlayers);
  window._bulletsListener.on("value", window.bulletsListener);
  if (window.renderItems) {
    window._itemsListener.on("value", window.renderItems);
  }
}

/**
 * Deletes a room
 * @param {string} roomId - The ID of the room to delete
 */
function deleteRoom(roomId) {
  if (confirm('Bạn có chắc muốn xóa phòng ' + roomId + ' không?')) {
    window.db.deleteRoom(roomId).then(() => {
      window.loadRoomList();
    });
  }
}

// Export functions to window for now
window.createRoomWithSelectedMap = createRoomWithSelectedMap;
window.leaveRoom = leaveRoom;
window.joinRoom = joinRoom;
window.deleteRoom = deleteRoom;
