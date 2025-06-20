// debug.js - Debugging utilities for Mini PK Multiplayer

// Setup console logging helper
window.debug = {
  log: function() {
    console.log('[DEBUG]', ...arguments);
  },
  error: function() {
    console.error('[ERROR]', ...arguments);
  },
  warn: function() {
    console.warn('[WARNING]', ...arguments);
  },
  info: function() {
    console.info('[INFO]', ...arguments);
  }
};

// Log loaded modules
document.addEventListener('DOMContentLoaded', () => {
  window.debug.log('Starting debugging...');
  
  // Check if key modules are loaded
  window.debug.info('Game config loaded:', !!window.WEAPONS);
  window.debug.info('Firebase config loaded:', !!window.firebaseConfig);
  window.debug.info('Firebase initialized:', !!window.firebase);
  window.debug.info('Database reference:', !!window.db);
  window.debug.info('Auth functions loaded:', !!window.initAuthHandlers);
  window.debug.info('UI Panels loaded:', !!window.showPanel);
  window.debug.info('Rooms UI loaded:', !!window.loadRoomList);
  window.debug.info('Player module loaded:', !!window.initializePlayer);
  window.debug.info('Game loop loaded:', !!window.gameLoop);
  window.debug.info('Main.js loaded:', !!window.MiniPK);

  // Setup error catching
  window.onerror = function(message, source, lineno, colno, error) {
    window.debug.error('JavaScript error:', message);
    window.debug.error('Source:', source);
    window.debug.error('Line:', lineno, 'Column:', colno);
    window.debug.error('Error object:', error);
    return false; // Let the default error handler run too
  };
  
  // Check DOM elements
  setTimeout(() => {
    window.debug.log('Checking DOM elements...');
    
    const loginPanel = document.getElementById('login-panel');
    window.debug.info('Login panel found:', !!loginPanel);
    
    const characterPanel = document.getElementById('character-selection-panel');
    window.debug.info('Character selection panel found:', !!characterPanel);
    
    const roomPanel = document.getElementById('room-panel');
    window.debug.info('Room panel found:', !!roomPanel);
    
    const gameUI = document.getElementById('game-ui');
    window.debug.info('Game UI found:', !!gameUI);
    
    const continueBtn = document.getElementById('continue-btn');
    window.debug.info('Continue button found:', !!continueBtn);
    
    const createRoomBtn = document.getElementById('create-room-btn');
    window.debug.info('Create room button found:', !!createRoomBtn);
  }, 500);
});
