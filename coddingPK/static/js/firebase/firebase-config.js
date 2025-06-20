/**
 * Firebase configuration for Mini PK Multiplayer
 */

// Firebase configuration object
window.firebaseConfig = {
  apiKey: "AIzaSyDACncK2aXWvZkq6G3_swszmMRwt9jYZLI",
  authDomain: "game-85c9b.firebaseapp.com",
  databaseURL: "https://game-85c9b-default-rtdb.firebaseio.com",
  projectId: "game-85c9b",
  storageBucket: "game-85c9b.firebasestorage.app",
  messagingSenderId: "357598408482",
  appId: "1:357598408482:web:161beb0df74c7de3ceff7b",
  measurementId: "G-NQJX1LKLB2"
};

// Initialize Firebase in legacy code
// This initialization will be handled by main.js in the modular version
firebase.initializeApp(window.firebaseConfig);
window.db = firebase.database();
