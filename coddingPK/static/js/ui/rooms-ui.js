// rooms-ui.js - Manages room-related UI functionality

/**
 * Loads and displays the room list
 */
function loadRoomList() {
  const listDiv = document.getElementById("room-list");
  listDiv.innerHTML = `
    <div style="margin-bottom: 10px;">
      <button id="refresh-rooms-btn" style="margin-right: 10px;">Làm mới danh sách</button>
    </div>
    <div id="rooms-content">Đang tải...</div>
  `;
  
  // Gắn sự kiện click cho nút refresh
  document.getElementById("refresh-rooms-btn").onclick = loadRoomList;
  
  // Lấy danh sách phòng từ Firebase
  const roomsContent = document.getElementById("rooms-content");
  window.db.ref("rooms").once("value", snap => {
    const rooms = [];
    snap.forEach(r => {
      const roomData = r.val();
      // Chỉ thêm phòng có người chơi
      if (r.key && r.key.startsWith("room-") && roomData.players && Object.keys(roomData.players).length > 0) {
        rooms.push(r.key);
      }
    });
    if (rooms.length === 0) roomsContent.innerHTML = "Không có phòng nào.";
    else roomsContent.innerHTML = rooms.map(r =>
      `<div>${r} 
        <button onclick="window.joinRoom('${r}')">Tham gia</button>
        <button onclick="window.deleteRoom('${r}')" style='color:#fff;background:#c00;border:none;padding:4px 10px;border-radius:5px;margin-left:6px;cursor:pointer;'>Xóa phòng</button>
      </div>`
    ).join("");
  });
}

/**
 * Initializes the map selection panel event handlers
 */
function initMapSelectionPanel() {
  const mapOptions = document.querySelectorAll('#map-selection-panel .map-option');
  const confirmMapBtn = document.getElementById('confirm-map-btn');
  const cancelMapBtn = document.getElementById('cancel-map-btn');

  // Lắng nghe sự kiện chọn bản đồ
  mapOptions.forEach(option => {
    option.onclick = () => {
      // Bỏ selected từ tất cả options
      mapOptions.forEach(opt => opt.classList.remove('selected'));
      // Thêm selected cho option được chọn
      option.classList.add('selected');
      window.selectedMap = option.dataset.map;
    };
  });

  // Lắng nghe nút xác nhận
  confirmMapBtn.onclick = () => {
    if (!window.selectedMap) {
      alert('Vui lòng chọn bản đồ!');
      return;
    }
    window.createRoomWithSelectedMap();
  };

  // Lắng nghe nút quay lại
  cancelMapBtn.onclick = () => {
    // Quay lại panel chọn phòng
    window.showPanel("room");
  };
}

/**
 * Displays the room ID in the UI
 * @param {string} id - The room ID to display
 */
function displayRoomId(id) {
  const roomIdElement = document.getElementById("room-id");
  if (roomIdElement) {
    roomIdElement.textContent = id || "";
  }
}

/**
 * Shows the weapon and character selection modal when clicked in room panel
 */
function setupSelectionModals() {
  // Setup character modal events
  const characterOptions = document.querySelectorAll('#character-modal .char-option');
  characterOptions.forEach(option => {
    option.onclick = () => {
      characterOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      window.selectedCharacter = option.dataset.char;
    };
  });

  // Setup confirm character button
  const confirmCharBtn = document.getElementById('confirm-char-btn');
  if (confirmCharBtn) {
    confirmCharBtn.onclick = () => {
      closeCharacterModal();
      updateCurrentSelection();
    };
  }

  // Setup weapon modal events
  const weaponOptions = document.querySelectorAll('#weapon-modal .weapon-option');
  weaponOptions.forEach(option => {
    option.onclick = () => {
      weaponOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      window.selectedWeapon = option.dataset.weapon;
    };
  });

  // Setup confirm weapon button
  const confirmWeaponBtn = document.getElementById('confirm-weapon-btn');
  if (confirmWeaponBtn) {
    confirmWeaponBtn.onclick = () => {
      closeWeaponModal();
      updateCurrentSelection();
    };
  }
}

// Export functions to window for now
window.loadRoomList = loadRoomList;
window.initMapSelectionPanel = initMapSelectionPanel;
window.displayRoomId = displayRoomId;
window.setupSelectionModals = setupSelectionModals;
