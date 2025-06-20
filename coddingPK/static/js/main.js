/**
 * main.js - Central import point for all game modules
 * 
 * This file coordinates the loading of all JavaScript modules for the Mini PK Multiplayer game.
 * It ensures modules are loaded in the correct order and initializes the main game components.
 */

// Set up global game namespace to prevent polluting the window object
window.MiniPK = window.MiniPK || {};

// Initialize modules when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Mini PK Multiplayer game...');
  
  // Initialize Firebase with config
  initializeFirebase();
  
  // Set up UI components
  initializeUI();
  
  // Set up game event listeners
  setupEventListeners();
  
  // Start with login panel
  if (window.showPanel) {
    window.showPanel('login');
  }
  
  console.log('Game initialization complete');
});

/**
 * Initializes Firebase with configuration from firebase-config.js
 */
function initializeFirebase() {
  if (window.firebaseConfig) {
    // Check if Firebase is already initialized
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(window.firebaseConfig);
    }
    
    // Make database reference available globally
    window.db = window.firebase.database();
    console.log('Firebase initialized');
  } else {
    console.error('Firebase config not found');
  }
}

/**
 * Initializes UI components and panels
 */
function initializeUI() {
  // Initialize authentication handlers from auth.js
  if (window.initAuthHandlers) {
    window.initAuthHandlers();
    console.log('Auth handlers initialized');
  }
  
  // Initialize map selection panel
  if (window.initMapSelectionPanel) {
    window.initMapSelectionPanel();
    console.log('Map selection panel initialized');
  }
  
  // Setup character and weapon selection
  setupSelectionHandlers();
}

/**
 * Sets up handlers for character and weapon selection
 */
function setupSelectionHandlers() {
  // Set up character and weapon selection continue button
  const continueBtn = document.getElementById("continue-btn");
  if (continueBtn) {
    continueBtn.onclick = () => {
      // Validate character and weapon selection
      const charSelection = document.querySelector('.character-option.selected')?.dataset.char || 'warrior';
      const weapSelection = document.querySelector('.weapon-option.selected')?.dataset.weapon || 'pistol';
      
      if (!charSelection || !weapSelection) {
        return alert("Vui lòng chọn nhân vật và vũ khí!");
      }
      
      // Store selections in global scope
      window.selectedCharacter = charSelection;
      window.selectedWeapon = weapSelection;
      
      // Show room panel and load room list
      window.showPanel("room");
      window.loadRoomList();
      
      // Update current selection display in room panel
      if (window.updateCurrentSelection) {
        window.updateCurrentSelection();
      }
    };
  }
}

/**
 * Sets up game event listeners for buttons and UI elements
 */
function setupEventListeners() {
  // Set up create room button
  const createRoomBtn = document.getElementById("create-room-btn");
  if (createRoomBtn) {
    createRoomBtn.onclick = () => {
      // Show map selection panel
      window.showPanel("map");
    };
  }
  
  // Set up leave room button
  const leaveRoomBtn = document.getElementById("leave-room-btn");
  if (leaveRoomBtn) {
    leaveRoomBtn.onclick = () => {
      if (window.leaveRoom) {
        window.leaveRoom();
      }
    };
  }
  
  // Set up refresh room list button
  const refreshRoomsBtn = document.getElementById("refresh-rooms-btn");
  if (refreshRoomsBtn) {
    refreshRoomsBtn.onclick = () => {
      if (window.loadRoomList) {
        window.loadRoomList();
      }
    };
  }
  
  // Set up window resize handler
  window.addEventListener('resize', () => {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      // Update game container dimensions if needed
      // This can be expanded later for responsive design
    }
  });
}

// Make main initialization functions available globally if needed
window.MiniPK.initializeGame = function() {
  initializeFirebase();
  initializeUI();
  setupEventListeners();
};
