// panels.js - Manages all panels in the UI

/**
 * Shows a specific panel with animation
 * @param {string} panel - The panel to show ("login", "character", "room", "map", "game")
 */
function showPanel(panel) {
  const loginPanel = document.getElementById("login-panel");
  const characterPanel = document.getElementById("character-selection-panel");
  const roomPanel = document.getElementById("room-panel");
  const mapSelectionPanel = document.getElementById("map-selection-panel");
  const gameUI = document.getElementById("game-ui");
  
  // Set body class for CSS targeting and ensure we clear previous classes
  document.body.className = '';
  if (panel === "login") {
    document.body.classList.add("login-mode");
  } else if (panel === "character") {
    document.body.classList.add("character-mode");
  } else if (panel === "room") {
    document.body.classList.add("room-mode");
  } else if (panel === "map") {
    document.body.classList.add("map-mode");
  } else if (panel === "game") {
    document.body.classList.add("game-mode");
  }
  
  console.log("Showing panel:", panel);
  
  // Hide all panels first - explicit display:none
  loginPanel.style.display = "none";
  characterPanel.style.display = "none";
  roomPanel.style.display = "none";
  mapSelectionPanel.style.display = "none";
  gameUI.style.display = "none";
  
  // Remove any existing animations
  loginPanel.style.animation = "none";
  characterPanel.style.animation = "none";
  roomPanel.style.animation = "none";
  mapSelectionPanel.style.animation = "none";
  gameUI.style.animation = "none";
  
  // Force a reflow to ensure styles are applied
  loginPanel.offsetHeight;
  characterPanel.offsetHeight;
  roomPanel.offsetHeight;
  mapSelectionPanel.offsetHeight;
  gameUI.offsetHeight;
  
  // Add flag to track that panels have been explicitly shown
  window.panelShown = true;
  
  // Show the requested panel with animation
  setTimeout(() => {
    if (panel === "login") {
      loginPanel.style.display = "block";
      loginPanel.style.animation = "slideInUp 0.6s ease-out";
    } else if (panel === "character") {
      characterPanel.style.display = "block";
      characterPanel.style.animation = "slideInUp 0.6s ease-out";
    } else if (panel === "room") {
      roomPanel.style.display = "block";
      roomPanel.style.animation = "slideInUp 0.6s ease-out";
      // Load danh sách phòng khi vào panel rooms
      loadRoomList();
      // Update the current selection display
      updateCurrentSelection();
    } else if (panel === "map") {
      mapSelectionPanel.style.display = "block";
      mapSelectionPanel.style.animation = "slideInUp 0.6s ease-out";
      // Reset selection state
      resetMapSelection();
    } else if (panel === "game") {
      gameUI.style.display = "block";
      gameUI.style.animation = "slideInUp 0.6s ease-out";
    }
  }, 50);
}

/**
 * Reset map selection state when entering map selection panel
 */
function resetMapSelection() {
  window.selectedMap = null;
  // Clear selected class from all map options
  const mapOptions = document.querySelectorAll('#map-selection-panel .map-option');
  mapOptions.forEach(opt => opt.classList.remove('selected'));
}

/**
 * Opens the character selection modal
 */
function openCharacterModal() {
  const modal = document.getElementById("character-modal");
  modal.style.display = "flex";
  
  // Apply selected class based on current selection
  const selectedChar = window.selectedCharacter || 'warrior';
  document.querySelectorAll('#character-modal .char-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.char === selectedChar);
  });
}

/**
 * Closes the character selection modal
 */
function closeCharacterModal() {
  const modal = document.getElementById("character-modal");
  modal.style.display = "none";
}

/**
 * Opens the weapon selection modal
 */
function openWeaponModal() {
  const modal = document.getElementById("weapon-modal");
  modal.style.display = "flex";
  
  // Apply selected class based on current selection
  const selectedWeapon = window.selectedWeapon || 'pistol';
  document.querySelectorAll('#weapon-modal .weapon-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.weapon === selectedWeapon);
  });
}

/**
 * Closes the weapon selection modal
 */
function closeWeaponModal() {
  const modal = document.getElementById("weapon-modal");
  modal.style.display = "none";
}

/**
 * Updates the current selection display in the room panel
 */
function updateCurrentSelection() {
  // Character preview
  const charPreview = document.getElementById("current-char-preview");
  charPreview.className = "selection-preview char-preview " + window.selectedCharacter;
  
  // Character name and stats
  document.getElementById("current-char-name").textContent = 
    window.selectedCharacter.charAt(0).toUpperCase() + window.selectedCharacter.slice(1);
  
  const charData = window.CHARACTERS[window.selectedCharacter];
  let statsText = `HP: ${charData.baseHp}`;
  
  if (charData.armorBonus) statsText += `, Giáp +${charData.armorBonus * 100}%`;
  if (charData.speedBonus) statsText += `, Tốc độ +${charData.speedBonus * 100}%`;
  if (charData.energyBonus) statsText += `, Năng lượng +${charData.energyBonus * 100}%`;
  
  document.getElementById("current-char-stats").textContent = statsText;
  
  // Weapon preview
  const weaponPreview = document.getElementById("current-weapon-preview");
  weaponPreview.className = "selection-preview weapon-preview " + window.selectedWeapon;
  
  // Weapon name and stats
  document.getElementById("current-weapon-name").textContent = 
    window.selectedWeapon.charAt(0).toUpperCase() + window.selectedWeapon.slice(1);
  
  // Map weapon name to stats description (simplified for now)
  const weaponStats = {
    'pistol': 'Cân bằng',
    'shotgun': 'Sát thương gần',
    'rifle': 'Tấn công xa',
    'sniper': 'Sát thương cao, chậm',
    'plasma': 'Năng lượng cao',
    'rocket': 'Sát thương diện rộng'
  };
  
  document.getElementById("current-weapon-stats").textContent = 
    weaponStats[window.selectedWeapon] || 'Cân bằng';
}

// Export functions to window for now
window.showPanel = showPanel;
window.openCharacterModal = openCharacterModal;
window.closeCharacterModal = closeCharacterModal;
window.openWeaponModal = openWeaponModal;
window.closeWeaponModal = closeWeaponModal;
window.updateCurrentSelection = updateCurrentSelection;
