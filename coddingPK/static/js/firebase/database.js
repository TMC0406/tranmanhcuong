// database.js - Firebase database operations

/**
 * Gets a reference to the rooms in the database
 * @returns {firebase.database.Reference} Firebase reference to rooms
 */
function getRoomsRef() {
  return window.db.ref('rooms');
}

/**
 * Gets a reference to a specific room in the database
 * @param {string} roomId - The ID of the room
 * @returns {firebase.database.Reference} Firebase reference to the room
 */
function getRoomRef(roomId) {
  return window.db.ref(`rooms/${roomId}`);
}

/**
 * Gets a reference to the players in a specific room
 * @param {string} roomId - The ID of the room
 * @returns {firebase.database.Reference} Firebase reference to the room's players
 */
function getPlayersRef(roomId) {
  return window.db.ref(`rooms/${roomId}/players`);
}

/**
 * Gets a reference to a specific player in a room
 * @param {string} roomId - The ID of the room
 * @param {string} playerId - The ID of the player
 * @returns {firebase.database.Reference} Firebase reference to the player
 */
function getPlayerRef(roomId, playerId) {
  return window.db.ref(`rooms/${roomId}/players/${playerId}`);
}

/**
 * Gets a reference to the bullets in a room
 * @param {string} roomId - The ID of the room
 * @returns {firebase.database.Reference} Firebase reference to the room's bullets
 */
function getBulletsRef(roomId) {
  return window.db.ref(`rooms/${roomId}/bullets`);
}

/**
 * Gets a reference to the items in a room
 * @param {string} roomId - The ID of the room
 * @returns {firebase.database.Reference} Firebase reference to the room's items
 */
function getItemsRef(roomId) {
  return window.db.ref(`rooms/${roomId}/items`);
}

/**
 * Creates a new room with the given map
 * @param {string} roomId - The ID of the room to create
 * @param {object} mapData - The map data for the room
 * @returns {Promise} Promise that resolves when the room is created
 */
function createRoom(roomId, mapData) {
  return window.db.ref(`rooms/${roomId}`).set({
    map: mapData,
    players: {},
    bullets: {},
    items: {}
  });
}

/**
 * Deletes a room from the database
 * @param {string} roomId - The ID of the room to delete
 * @returns {Promise} Promise that resolves when the room is deleted
 */
function deleteRoom(roomId) {
  return window.db.ref(`rooms/${roomId}`).remove();
}

/**
 * Adds a player to a room
 * @param {string} roomId - The ID of the room
 * @param {string} playerId - The ID of the player
 * @param {object} playerData - The player's initial data
 * @returns {Promise} Promise that resolves when the player is added
 */
function addPlayer(roomId, playerId, playerData) {
  return window.db.ref(`rooms/${roomId}/players/${playerId}`).set(playerData);
}

/**
 * Updates a player's data in a room
 * @param {string} roomId - The ID of the room
 * @param {string} playerId - The ID of the player
 * @param {object} updates - The updates to apply to the player
 * @returns {Promise} Promise that resolves when the player is updated
 */
function updatePlayer(roomId, playerId, updates) {
  return window.db.ref(`rooms/${roomId}/players/${playerId}`).update(updates);
}

/**
 * Adds a bullet to a room
 * @param {string} roomId - The ID of the room
 * @param {object} bulletData - The bullet data
 * @returns {string} The ID of the new bullet
 */
function addBullet(roomId, bulletData) {
  const newBulletRef = window.db.ref(`rooms/${roomId}/bullets`).push();
  newBulletRef.set(bulletData);
  return newBulletRef.key;
}

/**
 * Adds an item to a room
 * @param {string} roomId - The ID of the room
 * @param {object} itemData - The item data
 * @returns {string} The ID of the new item
 */
function addItem(roomId, itemData) {
  const newItemRef = window.db.ref(`rooms/${roomId}/items`).push();
  newItemRef.set(itemData);
  return newItemRef.key;
}

/**
 * Decreases a player's HP in a transaction
 * @param {string} roomId - The ID of the room
 * @param {string} playerId - The ID of the player
 * @param {number} damage - The amount of damage to apply
 * @returns {Promise} Promise that resolves when the transaction is complete
 */
function damagePlayer(roomId, playerId, damage) {
  return window.db.ref(`rooms/${roomId}/players/${playerId}/hp`)
    .transaction(hp => Math.max(0, (hp || 0) - damage));
}

// Export functions to window for now
window.db = window.db || {};
window.db.getRoomsRef = getRoomsRef;
window.db.getRoomRef = getRoomRef;
window.db.getPlayersRef = getPlayersRef;
window.db.getPlayerRef = getPlayerRef;
window.db.getBulletsRef = getBulletsRef;
window.db.getItemsRef = getItemsRef;
window.db.createRoom = createRoom;
window.db.deleteRoom = deleteRoom;
window.db.addPlayer = addPlayer;
window.db.updatePlayer = updatePlayer;
window.db.addBullet = addBullet;
window.db.addItem = addItem;
window.db.damagePlayer = damagePlayer;
