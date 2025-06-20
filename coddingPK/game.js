// Game constants
const WEAPONS = [
  { id: 0, name: "Pistol", damage: 20, speed: 8, energy: 1, cooldown: 300 },
  { id: 1, name: "Shotgun", damage: 15, speed: 7, energy: 2, cooldown: 800 },
  { id: 2, name: "Rifle", damage: 25, speed: 10, energy: 2, cooldown: 400 },
  { id: 3, name: "Sniper", damage: 40, speed: 12, energy: 3, cooldown: 1200 },
  { id: 4, name: "Plasma", damage: 30, speed: 6, energy: 3, cooldown: 500 },
  { id: 5, name: "Rocket", damage: 50, speed: 5, energy: 4, cooldown: 1500 }
];

const SKILLS = [
  { id: 0, name: "Heal", energy: 3, duration: 0, cooldown: 5000,
    use: (player) => {
      player.hp = Math.min(MAX_HP, player.hp + 50);
      playerRef.update({ hp: player.hp });
    }
  },
  { id: 1, name: "Shield", energy: 2, duration: 5000, cooldown: 8000,
    use: (player) => {
      player.shield = Math.min(MAX_SHIELD, player.shield + 1);
      playerRef.update({ shield: player.shield });
    }
  },
  { id: 2, name: "Dash", energy: 2, duration: 500, cooldown: 3000,
    use: (player) => {
      const speed = 20;
      x += player.direction === "right" ? speed : -speed;
      playerRef.update({ x });
    }
  },
  { id: 3, name: "Energy Surge", energy: 0, duration: 3000, cooldown: 15000,
    use: (player) => {
      player.energy = MAX_ENERGY;
      playerRef.update({ energy: MAX_ENERGY });
    }
  },
  { id: 4, name: "Double Damage", energy: 4, duration: 4000, cooldown: 12000,
    use: (player) => {
      window._doubleDamage = true;
      setTimeout(() => window._doubleDamage = false, 4000);
    }
  },
  { id: 5, name: "Invisibility", energy: 5, duration: 3000, cooldown: 20000,
    use: (player) => {
      player.invisible = true;
      playerRef.update({ invisible: true });
      setTimeout(() => {
        player.invisible = false;
        playerRef.update({ invisible: false });
      }, 3000);
    }
  }
];

const ITEMS = [
  { id: 0, name: "Health", effect: "heal", amount: 50 },
  { id: 1, name: "Energy", effect: "energy", amount: 5 },
  { id: 2, name: "Speed", effect: "speed", duration: 5000 },
  { id: 3, name: "Shield", effect: "shield", amount: 1 }
];

const CHARACTERS = {
  warrior: {
    baseHp: 150,
    baseSpeed: 5,
    armorBonus: 0.2, // +20% armor
    speedBonus: 0,
    energyBonus: 0
  },
  scout: {
    baseHp: 100,
    baseSpeed: 6, // +20% speed
    armorBonus: 0,
    speedBonus: 0.2,
    energyBonus: 0
  },
  mage: {
    baseHp: 80,
    baseSpeed: 5,
    armorBonus: 0,
    speedBonus: 0,
    energyBonus: 0.3 // -30% energy cost
  }
};

let userName = "";
let selectedCharacter = "warrior"; // Mặc định warrior
let selectedWeapon = "pistol"; // Mặc định pistol
let roomId = null;
let playerId = null;
let playerRef = null;
let x = 0, y = 0, hp = 200, energy = 0, direction = "right";  // Tăng máu lên 200
const MAX_HP = 200;  // Thêm hằng số cho máu tối đa
const MAX_ENERGY = 10;  // Thêm hằng số cho năng lượng tối đa
let keys = {}, bullets = [];
let isDead = false;  // Thêm biến này
let shield = 0; // Số lớp giáp hiện tại
const MAX_SHIELD = 5;

// Ẩn/hiện UI với animation control
function showPanel(panel) {
  const loginPanel = document.getElementById("login-panel");
  const characterPanel = document.getElementById("character-selection-panel");
  const roomPanel = document.getElementById("room-panel");
  const gameUI = document.getElementById("game-ui");
  
  // Set body class for CSS targeting
  document.body.className = '';
  if (panel === "login") {
    document.body.classList.add("login-mode");
  } else if (panel === "character") {
    document.body.classList.add("character-mode");
  } else if (panel === "room") {
    document.body.classList.add("room-mode");
  } else if (panel === "game") {
    document.body.classList.add("game-mode");
  }
  
  // Hide all panels first
  loginPanel.style.display = "none";
  characterPanel.style.display = "none";
  roomPanel.style.display = "none";
  gameUI.style.display = "none";
  
  // Remove any existing animations
  loginPanel.style.animation = "none";
  characterPanel.style.animation = "none";
  roomPanel.style.animation = "none";
  gameUI.style.animation = "none";
  
  // Force a reflow to ensure styles are applied
  loginPanel.offsetHeight;
  characterPanel.offsetHeight;
  roomPanel.offsetHeight;
  gameUI.offsetHeight;
  
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
    } else if (panel === "game") {
      gameUI.style.display = "block";
      gameUI.style.animation = "slideInUp 0.6s ease-out";
    }
  }, 50);
}
showPanel("login");

// Đăng nhập
const loginBtn = document.getElementById("login-btn");
loginBtn.onclick = () => {
  const name = document.getElementById("username-input").value.trim();
  if (!name) return alert("Vui lòng nhập tên!");
  
  userName = name;
  showPanel("character");
};

// Google login button
const googleLoginBtn = document.getElementById("google-login-btn");
if (googleLoginBtn) {
  googleLoginBtn.onclick = googleLogin;
}

// Tiếp tục sau khi chọn nhân vật và vũ khí
const continueBtn = document.getElementById("continue-btn");
continueBtn.onclick = () => {
  // Validate character and weapon selection
  selectedCharacter = document.querySelector('.character-option.selected')?.dataset.char || 'warrior';
  selectedWeapon = document.querySelector('.weapon-option.selected')?.dataset.weapon || 'pistol';
  
  if (!selectedCharacter || !selectedWeapon) {
    return alert("Vui lòng chọn nhân vật và vũ khí!");
  }
  
  showPanel("room");
  loadRoomList();
  
  // Update current selection display in room panel
  updateCurrentSelection();
};

// Map definitions
const MAPS = [
  {
    id: 'classic',
    name: 'Classic Arena',
    background: '#222',
    obstacles: [
      { x: 100, y: 100, w: 60, h: 60 },
      { x: 640, y: 100, w: 60, h: 60 },
      { x: 370, y: 270, w: 60, h: 60 }
    ]
  },
  {
    id: 'desert',
    name: 'Desert Storm',
    background: '#a95',
    obstacles: [
      { x: 200, y: 150, w: 80, h: 40 },
      { x: 520, y: 150, w: 80, h: 40 },
      { x: 360, y: 300, w: 80, h: 40 }
    ]
  },
  {
    id: 'ice',
    name: 'Ice Field',
    background: '#adf',
    obstacles: [
      { x: 150, y: 80, w: 50, h: 100 },
      { x: 350, y: 200, w: 100, h: 50 },
      { x: 600, y: 120, w: 50, h: 80 },
      { x: 250, y: 350, w: 80, h: 50 },
      { x: 480, y: 80, w: 60, h: 60 }
    ]
  }
];

// Biến để lưu bản đồ được chọn
let selectedMap = null;

// Tạo phòng mới với map được chọn
const createRoomBtn = document.getElementById("create-room-btn");
createRoomBtn.onclick = () => {
  // Hiển thị giao diện chọn bản đồ
  showMapSelection();
};

// Hiển thị giao diện chọn bản đồ
function showMapSelection() {
  const mapSelect = document.querySelector('.map-select');
  mapSelect.style.display = 'block';
  
  // Thêm style cho map selection nếu chưa có
  if (!document.querySelector('.map-select-styles')) {
    const style = document.createElement('style');
    style.className = 'map-select-styles';
    style.textContent = `
      .map-select {
        display: none;
        margin: 20px 0;
        padding: 20px;
        border: 2px solid #555;
        border-radius: 10px;
        background: #333;
      }
      .map-option {
        margin: 10px 0;
        padding: 15px;
        border: 2px solid #666;
        border-radius: 8px;
        background: #444;
        cursor: pointer;
        transition: all 0.3s;
      }
      .map-option:hover {
        border-color: #0ff;
        background: #555;
        transform: scale(1.02);
      }
      .map-option.selected {
        border-color: #0f0;
        background: #464;
      }
      .map-option h3 {
        margin: 0 0 8px 0;
        color: #fff;
      }
      .map-option p {
        margin: 0;
        color: #ccc;
        font-size: 14px;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Thêm nút xác nhận và hủy
  let confirmBtn = document.getElementById('confirm-map-btn');
  let cancelBtn = document.getElementById('cancel-map-btn');
  
  if (!confirmBtn) {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.textAlign = 'center';
    
    confirmBtn = document.createElement('button');
    confirmBtn.id = 'confirm-map-btn';
    confirmBtn.textContent = 'Tạo phòng';
    confirmBtn.style.marginRight = '10px';
    confirmBtn.style.padding = '10px 20px';
    confirmBtn.style.backgroundColor = '#0a0';
    confirmBtn.style.color = 'white';
    confirmBtn.style.border = 'none';
    confirmBtn.style.borderRadius = '5px';
    confirmBtn.style.cursor = 'pointer';
    
    cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-map-btn';
    cancelBtn.textContent = 'Hủy';
    cancelBtn.style.padding = '10px 20px';
    cancelBtn.style.backgroundColor = '#a00';
    cancelBtn.style.color = 'white';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '5px';
    cancelBtn.style.cursor = 'pointer';
    
    buttonContainer.appendChild(confirmBtn);
    buttonContainer.appendChild(cancelBtn);
    mapSelect.appendChild(buttonContainer);
  }
  
  // Lắng nghe sự kiện chọn bản đồ
  const mapOptions = document.querySelectorAll('.map-option');
  mapOptions.forEach(option => {
    option.onclick = () => {
      // Bỏ selected từ tất cả options
      mapOptions.forEach(opt => opt.classList.remove('selected'));
      // Thêm selected cho option được chọn
      option.classList.add('selected');
      selectedMap = option.dataset.map;
    };
  });
  
  // Lắng nghe nút xác nhận
  confirmBtn.onclick = () => {
    if (!selectedMap) {
      alert('Vui lòng chọn bản đồ!');
      return;
    }
    createRoomWithSelectedMap();
  };
  
  // Lắng nghe nút hủy
  cancelBtn.onclick = () => {
    hideMapSelection();
  };
}

// Ẩn giao diện chọn bản đồ
function hideMapSelection() {
  const mapSelect = document.querySelector('.map-select');
  mapSelect.style.display = 'none';
  selectedMap = null;
  
  // Bỏ selected từ tất cả options
  const mapOptions = document.querySelectorAll('.map-option');
  mapOptions.forEach(opt => opt.classList.remove('selected'));
}

// Tạo phòng với bản đồ đã chọn
function createRoomWithSelectedMap() {
  const newRoomId = "room-" + Math.floor(Math.random() * 100000);
  
  // Lấy thông tin bản đồ được chọn
  const mapData = MAPS.find(m => m.id === selectedMap) || MAPS[0];
  const obstacles = JSON.parse(JSON.stringify(mapData.obstacles));
  
  // Tạo phòng với bản đồ đã chọn
  db.ref(`rooms/${newRoomId}`).set({ 
    created: Date.now(), 
    obstacles, 
    players: {},
    mapId: selectedMap,
    mapName: mapData.name
  });
  
  // Ẩn giao diện chọn bản đồ
  hideMapSelection();
  
  // Tham gia phòng
  joinRoom(newRoomId);
}

// Hiển thị danh sách phòng
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
  db.ref("rooms").once("value", snap => {
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
        <button onclick=\"joinRoom('${r}')\">Tham gia</button>
        <button onclick=\"deleteRoom('${r}')\" style='color:#fff;background:#c00;border:none;padding:4px 10px;border-radius:5px;margin-left:6px;cursor:pointer;'>Xóa phòng</button>
      </div>`
    ).join("");
  });
}

// Tham gia phòng
// Xóa phòng cũ không còn người chơi
function cleanupOldRooms() {
  db.ref('rooms').once('value', snap => {
    snap.forEach(room => {
      const roomData = room.val();
      if (!roomData.players || Object.keys(roomData.players).length === 0) {
        db.ref(`rooms/${room.key}`).remove();
      }
    });
  });
}

// Đăng ký listener xóa phòng khi không còn ai trong phòng
function setupRoomAutoCleanup(roomId) {
  const roomRef = db.ref(`rooms/${roomId}`);
  const playersRef = db.ref(`rooms/${roomId}/players`);
  
  // Cleanup khi không còn người chơi
  playersRef.on('value', snap => {
    if (snap.numChildren() === 0) {
      // Đợi 500ms để đảm bảo onDisconnect đã thực thi
      setTimeout(() => {
        playersRef.once('value', s2 => {
          if (s2.numChildren() === 0) {
            roomRef.remove();
          }
        });
      }, 500);
    }
  });

  // Dọn dẹp phòng cũ mỗi khi vào phòng mới
  cleanupOldRooms();
}

// Hàm thoát phòng
function leaveRoom() {
  if (playerRef) {
    // First, update room-id display to show we're leaving
    document.getElementById("room-id").textContent = "";

    // Remove all event listeners first
    if (window._playersListener) {
      window._playersListener.off();
      window._playersListener = null;
    }
    if (window._bulletsListener) {
      window._bulletsListener.off();
      window._bulletsListener = null;
    }

    // Remove the player data from Firebase and clear all handlers
    playerRef.onDisconnect().cancel(); // Hủy handler onDisconnect
    playerRef.remove()
      .then(() => {
        // Clear all local state
        roomId = null;
        playerId = null;
        playerRef = null;
        bullets = [];
        obstacles = [];
        isDead = false; // Reset trạng thái chết
        hp = 100; // Reset máu

        // Switch to room panel and refresh room list
        showPanel("room");
        loadRoomList();
      })
      .catch(error => {
        console.error("Lỗi khi thoát phòng:", error);
        // Still try to clean up UI even if Firebase fails
        showPanel("room");
        loadRoomList();
      });
  }
}

// Lắng nghe sự kiện click nút thoát
document.getElementById("leave-room-btn").onclick = leaveRoom;

window.joinRoom = function(rid) {
  // Reset các trạng thái
  isDead = false;
  roomId = rid;
  playerId = "player-" + Math.floor(Math.random() * 10000);
  x = Math.floor(Math.random() * 700);
  y = 0;
  
  // Áp dụng chỉ số theo nhân vật
  const charStats = CHARACTERS[selectedCharacter];
  hp = charStats.baseHp;
  maxHp = charStats.baseHp;
  energy = 0;
  baseSpeed = charStats.baseSpeed;
  direction = "right";
  currentWeapon = WEAPONS.findIndex(w => w.name.toLowerCase() === selectedWeapon);
  currentSkill = 0;
  
  // Tạo reference mới
  playerRef = db.ref(`rooms/${roomId}/players/${playerId}`);
  
  // Hiển thị ID phòng
  document.getElementById("room-id").textContent = roomId;
  
  // Cập nhật dữ liệu người chơi lên Firebase
  playerRef.set({ 
    x, y, 
    hp, maxHp,
    energy, 
    name: userName,
    character: selectedCharacter,
    weapon: selectedWeapon,
    attacking: false, 
    skill_ready: false, 
    direction,
    shield,
    baseSpeed,
    armorBonus: CHARACTERS[selectedCharacter].armorBonus || 0,
    speedBonus: CHARACTERS[selectedCharacter].speedBonus || 0,
    energyBonus: CHARACTERS[selectedCharacter].energyBonus || 0
  });
  
  // Thiết lập cleanup khi disconnect
  playerRef.onDisconnect().remove();
  setupRoomAutoCleanup(roomId);
  
  // Chuyển sang màn hình game
  showPanel("game");
  
  // Đăng ký lại các listener
  if (window._playersListener) window._playersListener.off();
  if (window._bulletsListener) window._bulletsListener.off();
  if (window._itemsListener) window._itemsListener.off();
  
  window._playersListener = db.ref(`rooms/${roomId}/players`);
  window._bulletsListener = db.ref(`rooms/${roomId}/bullets`);
  window._itemsListener = db.ref(`rooms/${roomId}/items`);
  
  window._playersListener.on("value", renderPlayers);
  window._bulletsListener.on("value", bulletsListener);
  window._itemsListener.on("value", renderItems);
  
  // Khởi động game loop nếu chưa chạy
  if (!window._gameStarted) { 
    window._gameStarted = true; 
    gameLoop(); 
  }
  
  // Thiết lập các event listener cho bàn phím
  setupKeyListeners();
  listenObstacles();
};

function renderPlayers(snap) {
  const container = document.getElementById("game-container");
  // Xóa chỉ các player cũ
  const oldPlayers = container.querySelectorAll('.player, .enemy');
  oldPlayers.forEach(p => p.remove());
  let currentPlayer = null;
  snap.forEach(p => {
    const data = p.val();
    let dirClass = data.direction === "left" ? " left" : " right";
    const div = document.createElement("div");
    div.className = (p.key === playerId ? "player" : "enemy") + (data.moving ? " moving" : "") + dirClass;
    div.id = p.key === playerId ? "player" : "";
    div.style.left = data.x + "px";
    div.style.bottom = data.y + "px";
    // Thêm các phần tử con để tạo hình người
    const head = document.createElement("div");
    head.className = "head";
    const eyeL = document.createElement("div");
    eyeL.className = "eye left";
    const eyeR = document.createElement("div");
    eyeR.className = "eye right";
    const body = document.createElement("div");
    body.className = "body";
    const armL = document.createElement("div");
    armL.className = "arm left";
    const gunL = document.createElement("div");
    gunL.className = "gun";
    armL.appendChild(gunL);
    const armR = document.createElement("div");
    armR.className = "arm right";
    const gunR = document.createElement("div");
    gunR.className = "gun";
    armR.appendChild(gunR);
    const legL = document.createElement("div");
    legL.className = "leg left";
    const legR = document.createElement("div");
    legR.className = "leg right";
    head.appendChild(eyeL);
    head.appendChild(eyeR);
    div.appendChild(head);
    div.appendChild(body);
    div.appendChild(armL);
    div.appendChild(armR);
    div.appendChild(legL);
    div.appendChild(legR);
    // Thêm wrapper cho tên và thanh máu
    const statsWrap = document.createElement("div");
    statsWrap.style.position = "absolute";
    statsWrap.style.left = "-5px";
    statsWrap.style.bottom = "54px";
    statsWrap.style.width = "60px";
    statsWrap.style.height = "26px";  // Tăng chiều cao để chứa tên
    statsWrap.style.pointerEvents = "none";
    statsWrap.style.display = "flex";
    statsWrap.style.flexDirection = "column";
    statsWrap.style.alignItems = "center";
    statsWrap.style.justifyContent = "flex-end";
    
    // Tên nhân vật
    const nameDiv = document.createElement("div");
    nameDiv.style.color = "#fff";
    nameDiv.style.fontSize = "10px";
    nameDiv.style.textAlign = "center";
    nameDiv.style.marginBottom = "2px";
    nameDiv.style.textShadow = "0 0 2px #000";
    nameDiv.textContent = data.name || "???";
    
    // Thanh máu và năng lượng
    const barWrap = document.createElement("div");
    barWrap.style.height = "16px";
    
    // Thanh máu
    const hpBar = document.createElement("div");
    hpBar.style.height = "7px";
    hpBar.style.width = Math.max(0, Math.min(1, data.hp/MAX_HP)) * 50 + "px";
    hpBar.style.background = "#f00";
    hpBar.style.border = "1px solid #fff3";
    hpBar.style.borderRadius = "4px";
    hpBar.style.marginBottom = "2px";
    
    // Thanh năng lượng
    const mnBar = document.createElement("div");
    mnBar.style.height = "5px";
    mnBar.style.width = Math.max(0, Math.min(1, (data.energy||0)/MAX_ENERGY)) * 50 + "px";
    mnBar.style.background = "#09f";
    mnBar.style.border = "1px solid #fff3";
    mnBar.style.borderRadius = "4px";
    
    barWrap.appendChild(hpBar);
    barWrap.appendChild(mnBar);
    statsWrap.appendChild(nameDiv);
    statsWrap.appendChild(barWrap);
    div.appendChild(statsWrap);
    container.appendChild(div);
    
    // Hiển thị số lớp giáp (cũ)
    // const shieldDiv = document.createElement("div");
    // shieldDiv.style.color = "#0ff";
    // shieldDiv.style.fontSize = "10px";
    // shieldDiv.style.textAlign = "center";
    // shieldDiv.style.marginBottom = "1px";
    // shieldDiv.style.textShadow = "0 0 2px #000";
    // shieldDiv.textContent = data.shield ? `🛡️ x${data.shield}` : "";
    // statsWrap.insertBefore(shieldDiv, nameDiv.nextSibling);

    // Vẽ giáp dạng vòng tròn bao quanh nhân vật
    if (data.shield && data.shield > 0) {
      for (let i = 0; i < data.shield; i++) {
        const shieldCircle = document.createElement("div");
        shieldCircle.className = "shield-circle";
        shieldCircle.style.position = "absolute";
        shieldCircle.style.left = "-10px";
        shieldCircle.style.top = "-10px";
        shieldCircle.style.width = "70px";
        shieldCircle.style.height = "70px";
        shieldCircle.style.borderRadius = "50%";
        shieldCircle.style.border = `2.5px solid #0ff`;
        shieldCircle.style.boxSizing = "border-box";
        shieldCircle.style.pointerEvents = "none";
        shieldCircle.style.opacity = (0.18 + 0.18 * i).toFixed(2); // Lớp ngoài cùng mờ nhất
        shieldCircle.style.zIndex = 10 + i;
        shieldCircle.style.filter = `blur(${2 * (data.shield - i - 1)}px)`;
        div.appendChild(shieldCircle);
      }
    }

    if (p.key === playerId) {
      currentPlayer = data;
      shield = data.shield || 0;
      // Kiểm tra nếu người chơi hết máu thì tự động thoát phòng
      if (data.hp <= 0 && !isDead) {
        isDead = true;
        // Xóa player khỏi Firebase ngay lập tức
        playerRef.remove().then(() => {
          setTimeout(() => {
            alert("Bạn đã chết!");
            leaveRoom();
            isDead = false;  // Reset trạng thái chết sau khi đã rời phòng
          }, 500);
        });
      }
    }
  });
}

function bulletsListener(snap) {
  bullets = [];
  snap.forEach(b => {
    const data = b.val();
    data._key = b.key;
    bullets.push(data);
  });
}

// Lưu obstacles hiện tại
let obstacles = [];

// Render obstacle
function renderObstacles(obsArr) {
  const container = document.getElementById("game-container");
  if (!container) return;
  // Xóa obstacle cũ
  const oldObs = container.querySelectorAll('.obstacle');
  oldObs.forEach(o => o.remove());
  // Vẽ obstacle mới
  obsArr.forEach(o => {
    const el = document.createElement('div');
    el.className = 'obstacle';
    el.style.left = o.x + 'px';
    el.style.bottom = o.y + 'px';
    el.style.width = o.w + 'px';
    el.style.height = o.h + 'px';
    el.style.background = '#444';
    el.style.border = '2px solid #888';
    el.style.position = 'absolute';
    el.style.borderRadius = '8px';
    el.style.opacity = 0.85;
    container.appendChild(el);
  });
}

// Lắng nghe obstacle khi vào phòng
function listenObstacles() {
  if (!roomId) return;
  
  // Lắng nghe thông tin phòng để lấy mapId
  db.ref(`rooms/${roomId}`).on('value', snap => {
    const roomData = snap.val();
    if (roomData) {
      obstacles = roomData.obstacles || [];
      renderObstacles(obstacles);
      
      // Áp dụng background theo bản đồ
      if (roomData.mapId) {
        const mapData = MAPS.find(m => m.id === roomData.mapId);
        if (mapData) {
          const gameContainer = document.getElementById('game-container');
          gameContainer.style.background = mapData.background;
        }
      }
    }
  });
}

// Đăng ký listener mặc định cho phòng đầu tiên nếu có
if (roomId && !window._playersListener) {
  window._playersListener = db.ref(`rooms/${roomId}/players`);
  window._playersListener.on("value", renderPlayers);
  window._bulletsListener = db.ref(`rooms/${roomId}/bullets`);
  window._bulletsListener.on("value", bulletsListener);
}

// Lắng nghe sự kiện nhấn và nhả phím (phải đăng ký lại sau khi vào phòng)
function setupKeyListeners() {
  window.onkeydown = e => {
    keys[e.key] = true;
    // Di chuyển cho mọi ngôn ngữ
    if (["a", "ArrowLeft", "ф", "Ф", "щ", "Щ"].includes(e.key)) direction = "left";
    if (["d", "ArrowRight", "в", "В"].includes(e.key)) direction = "right";
    if (["j", "0", "о", "О"].includes(e.key)) {
      attack();
      shoot();
    }
    if (["k", "1", "л", "Л"].includes(e.key)) useSkill();
    if (["l", "2", "д", "Д"].includes(e.key)) createShield();
    // Chuyển đổi vũ khí và skill
    if (e.key >= "1" && e.key <= "6") currentWeapon = parseInt(e.key) - 1;
    if (e.key === "Tab") {
      e.preventDefault();
      currentSkill = (currentSkill + 1) % SKILLS.length;
    }
  };
  window.onkeyup = e => {
    keys[e.key] = false;
  };
}

function createShield() {
  if (shield < MAX_SHIELD && energy >= 2) {
    shield++;
    energy -= 2;
    playerRef.update({ shield, energy });
  }
}

let lastSentX = x, lastSentY = y, lastSentDir = direction;
let lastUpdateTime = 0;

function gameLoop() {
  // Performance monitoring
  monitorPerformance();
  
  let moved = false;
  let nextX = x, nextY = y;
  const timestamp = Date.now();
  const baseSpeed = window._speedBoost ? 6 : 4;
  
  // Movement with anti-cheat validation
  if (keys["a"] || keys["ArrowLeft"] || keys["ф"] || keys["Ф"] || keys["щ"] || keys["Щ"]) { 
    nextX -= baseSpeed; 
    moved = true; 
    direction = "left"; 
  }
  if (keys["d"] || keys["ArrowRight"] || keys["в"] || keys["В"]) { 
    nextX += baseSpeed; 
    moved = true; 
    direction = "right"; 
  }
  if (keys["w"] || keys["ArrowUp"] || keys["ц"] || keys["Ц"]) { 
    nextY += baseSpeed; 
    moved = true; 
  }
  if (keys["s"] || keys["ArrowDown"] || keys["ы"] || keys["Ы"]) { 
    nextY -= baseSpeed; 
    moved = true; 
  }
  // Lấy kích thước động của game-container
  const container = document.getElementById("game-container");
  const maxX = container ? container.clientWidth - 50 : 750;
  const maxY = container ? container.clientHeight - 50 : 550;
  nextX = Math.max(0, Math.min(maxX, nextX));
  nextY = Math.max(0, Math.min(maxY, nextY));
  // Kiểm tra va chạm obstacle
  let blocked = false;
  for (const o of obstacles) {
    if (
      nextX + 40 > o.x && nextX < o.x + o.w &&
      nextY + 48 > o.y && nextY < o.y + o.h
    ) {
      blocked = true;
      break;
    }
  }
  if (moved && !blocked) {
    // Anti-cheat position validation
    const now = Date.now();
    const moveSpeed = window._speedBoost ? 6 : 4;
    const maxMove = moveSpeed * (now - lastUpdateTime) / 16; // Max move distance per frame
    
    const dx = nextX - x;
    const dy = nextY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= maxMove) {
      // Apply map effects
      if (window._slippery) {
        // Ice map: momentum
        x += dx * 1.2;
        y += dy * 1.2;
      } else if (window._sandstorm) {
        // Desert map: random drift
        x = nextX + (Math.random() - 0.5) * 2;
        y = nextY + (Math.random() - 0.5) * 2;
      } else {
        x = nextX;
        y = nextY;
      }
      
      // Keep player in bounds
      x = Math.max(0, Math.min(maxX, x));
      y = Math.max(0, Math.min(maxY, y));
      
      // Update position if enough time has passed
      if (now - lastUpdateTime > 50) {
        playerRef.update({ 
          x, y, 
          moving: moved, 
          direction,
          lastUpdate: now // For anti-cheat verification
        });
        lastSentX = x;
        lastSentY = y;
        lastSentDir = direction;
        lastUpdateTime = now;
      }
    }
  }
  
  // Apply speed boost if active
  if (window._speedBoost) {
    x = Math.max(0, Math.min(maxX, x + (direction === "right" ? 2 : -2)));
  }
  
  updateBullets();
  renderBullets();
  
  // Check for item pickups
  if (roomId && playerRef) {
    db.ref(`rooms/${roomId}/items`).once("value", snap => {
      snap.forEach(i => {
        const item = i.val();
        const dx = item.x - x;
        const dy = item.y - y;
        if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
          // Apply item effect
          switch(item.effect) {
            case 'heal':
              hp = Math.min(MAX_HP, hp + item.amount);
              playerRef.update({ hp });
              break;
            case 'energy':
              energy = Math.min(MAX_ENERGY, energy + item.amount);
              playerRef.update({ energy });
              break;
            case 'speed':
              window._speedBoost = true;
              setTimeout(() => window._speedBoost = false, item.duration);
              break;
            case 'shield':
              shield = Math.min(MAX_SHIELD, shield + item.amount);
              playerRef.update({ shield });
              break;
          }
          // Remove the item
          i.ref.remove();
        }
      });
    });
  }
  
  requestAnimationFrame(gameLoop);
}

function attack() {
  playerRef.update({ attacking: true });
  setTimeout(() => playerRef.update({ attacking: false }), 300);
  // Gọi checkHit nếu đã có định nghĩa
  if (typeof checkHit === 'function') checkHit();
}

// Thêm lại hàm checkHit nếu bị thiếu
function checkHit() {
  db.ref(`rooms/${roomId}/players`).once("value", snap => {
    snap.forEach(p => {
      if (p.key !== playerId && Math.abs(p.val().x - x) < 50) {
        // Shield logic for melee: mỗi lớp giáp chặn 10 damage, mất 1 lớp mỗi lần trúng, còn lại trừ vào máu
        let data = p.val();
        let dmg = 5;
        let shield = data.shield || 0;
        if (shield > 0) {
          dmg -= 10;
          shield -= 1;
          if (dmg < 0) dmg = 0;
          db.ref(`rooms/${roomId}/players/${p.key}`).update({ shield });
        }
        if (dmg > 0) {
          db.ref(`rooms/${roomId}/players/${p.key}/hp`).transaction(hp => Math.max(0, (hp || 0) - dmg));
        }
        playerRef.once("value", snap => {
          const e = (snap.val().energy || 0) + 1;
          playerRef.update({ energy: e, skill_ready: e >= 2 });
        });
      }
    });
  });
}

// Đẩy đạn lên Firebase thay vì lưu local
function shoot() {
  const weapon = WEAPONS[currentWeapon];
  if (!weapon) return;

  // Check cooldown modified by character type
  const now = Date.now();
  const modifiedCooldown = selectedCharacter === 'scout' ? 
    weapon.cooldown * 0.8 : weapon.cooldown;
  if (window._lastShot && now - window._lastShot < modifiedCooldown) return;
  window._lastShot = now;

  // Check energy cost with mage bonus
  const energyCost = selectedCharacter === 'mage' ? 
    Math.floor(weapon.energy * 0.7) : weapon.energy;
  if ((energy || 0) < energyCost) return;
  energy = Math.max(0, energy - energyCost);
  playerRef.update({ energy });
  
  const baseDamage = weapon.damage * (window._doubleDamage ? 2 : 1);
  
  const bullet = {
    x: direction === "right" ? x + 40 : x - 10,
    y: y + 20,
    dir: direction,
    owner: playerId,
    time: now,
    type: weapon.name.toLowerCase(),
    dmg: baseDamage,
    speed: weapon.speed
  };

  // Special weapon effects
  switch(weapon.name) {
    case "Shotgun":
      // Spread shot - 3 bullets with reduced damage
      for (let i = -1; i <= 1; i++) {
        const spread = { 
          ...bullet, 
          y: bullet.y + i * 15,
          dmg: Math.floor(baseDamage * 0.6)  // Each pellet does 60% damage
        };
        db.ref(`rooms/${roomId}/bullets`).push(spread);
      }
      break;
      
    case "Sniper":
      // Pierce through obstacles
      bullet.pierce = true;
      bullet.dmg *= 1.2; // 20% bonus damage
      db.ref(`rooms/${roomId}/bullets`).push(bullet);
      break;
      
    case "Plasma":
      // Energy weapon - does more damage with more energy
      bullet.dmg *= (1 + energy/MAX_ENERGY);
      bullet.energyWeapon = true;
      db.ref(`rooms/${roomId}/bullets`).push(bullet);
      break;
      
    case "Rocket":
      // Explosive damage in area
      bullet.explosive = true;
      bullet.radius = 80;
      db.ref(`rooms/${roomId}/bullets`).push(bullet);
      break;
      
    default:
      // Standard bullet
      db.ref(`rooms/${roomId}/bullets`).push(bullet);
  }

  // Gain some energy back from shooting
  playerRef.once("value", snap => {
    let e = energy + 1;
    if (e > MAX_ENERGY) e = MAX_ENERGY;
    energy = e;
    playerRef.update({ energy: e, skill_ready: e >= 2 });
  });
}

// Sử dụng kỹ năng đặc biệt
function useSkill() {
  playerRef.once("value", snap => {
    const data = snap.val();
    if ((data.energy || 0) >= 2) {
      const skill = SKILLS[currentSkill];
      if (skill) {
        skill.use(data);
        playerRef.update({ energy: data.energy - 2, skill_ready: false });
      }
    }
  });
}

function updateBullets() {
  const bulletsToRemove = [];

  bullets = bullets.filter(b => {
    if (b.owner === playerId) {
      // Use bullet's own speed
      b.x += b.dir === "right" ? b.speed : -b.speed;
      
      // Get bullet dimensions based on type
      const bulletWidth = b.type === 'rocket' ? 20 : (b.type === 'plasma' ? 12 : 8);
      const bulletHeight = b.type === 'rocket' ? 10 : (b.type === 'plasma' ? 12 : 8);
      
      // Check obstacle collisions
      for (const o of obstacles) {
        if (
          b.x < o.x + o.w &&
          b.x + bulletWidth > o.x &&
          b.y < o.y + o.h &&
          b.y + bulletHeight > o.y
        ) {
          // Pierce bullets ignore obstacles
          if (!b.pierce) {
            if (b.explosive) {
              createExplosion(b.x, b.y, b.radius || 80, b.dmg);
            }
            bulletsToRemove.push(b._key);
            return false;
          }
        }
      }
      // Xóa đạn nếu ra khỏi màn hình
      if (b.x < 0 || b.x > (document.getElementById("game-container")?.clientWidth || 800)) {
        bulletsToRemove.push(b._key);
        return false;
      }
      // Kiểm tra va chạm với đối thủ
      let hitPlayer = false;
      db.ref(`rooms/${roomId}/players`).once("value", snap => {
        snap.forEach(p => {
          if (p.key !== playerId) {
            const data = p.val();
            let hit = false;
            if (b.special) {
              if (Math.abs(b.x - data.x) < 60 && Math.abs(b.y - data.y) < 60) hit = true;
            } else {
              if (Math.abs(b.x - data.x) < 30 && Math.abs(b.y - data.y) < 40) hit = true;
            }
            if (hit) {
              // Shield logic: mỗi lớp giáp chặn 10 damage, mất 1 lớp mỗi lần trúng, còn lại trừ vào máu
              // Anti-cheat damage validation
              const now = Date.now();
              const timeSinceLastHit = now - (data.lastHitTime || 0);
              
              if (timeSinceLastHit < 100) {
                console.warn('Rapid damage detected');
                return;
              }
              
              let dmg = b.special ? 10 : 5;
              
              // Validate damage amount
              if (dmg > 50) {
                console.warn('Invalid damage amount detected');
                dmg = 50;
              }
              
              let shield = data.shield || 0;
              let hp = data.hp || 0;
              
              if (shield > 0) {
                dmg -= 10;
                shield -= 1;
                if (dmg < 0) dmg = 0;
                db.ref(`rooms/${roomId}/players/${p.key}`).update({ 
                  shield,
                  lastHitTime: now 
                });
              }
              
              if (dmg > 0) {
                db.ref(`rooms/${roomId}/players/${p.key}`).update({
                  hp: Math.max(0, hp - dmg),
                  lastHitTime: now
                });
              }
              hitPlayer = true;
            }
          }
        });
      });
      if (hitPlayer) {
        bulletsToRemove.push(b._key);
        return false;
      }

      // Update vị trí đạn
      db.ref(`rooms/${roomId}/bullets/${b._key}`).update({ x: b.x, y: b.y });
      return true;
    }
    return true;
  });
  bulletsToRemove.forEach(key => {
    db.ref(`rooms/${roomId}/bullets/${key}`).remove();
  });
}

function renderBullets() {
  const container = document.getElementById("game-container");
  if (!container) return;
  // Xóa đạn cũ
  const oldBullets = container.querySelectorAll('.bullet');
  oldBullets.forEach(b => b.remove());
  // Vẽ đạn mới
  bullets.forEach(b => {
    const el = document.createElement('div');
    el.className = 'bullet';
    
    // Style based on bullet type
    switch(b.type) {
      case "shotgun":
        el.style.width = '8px';
        el.style.height = '8px';
        el.style.borderRadius = '50%';
        el.style.background = '#fa0';
        el.style.boxShadow = '0 0 8px 2px #fa0';
        break;
        
      case "sniper":
        el.style.width = '16px';
        el.style.height = '4px';
        el.style.background = '#f00';
        el.style.boxShadow = '0 0 8px 2px #f00';
        break;
        
      case "plasma":
        el.style.width = '12px';
        el.style.height = '12px';
        el.style.borderRadius = '50%';
        el.style.background = '#0ff';
        el.style.boxShadow = '0 0 12px 4px #0ff';
        el.style.animation = 'pulse 0.5s infinite alternate';
        break;
        
      case "rocket":
        el.style.width = '20px';
        el.style.height = '10px';
        el.style.background = '#f44';
        el.style.boxShadow = '0 0 8px 2px #f44';
        el.style.borderRadius = '4px';
        // Add rocket trail
        const trail = document.createElement('div');
        trail.style.position = 'absolute';
        trail.style.right = '100%';
        trail.style.top = '50%';
        trail.style.width = '20px';
        trail.style.height = '2px';
        trail.style.background = 'linear-gradient(90deg, #ff0, transparent)';
        el.appendChild(trail);
        break;
        
      default: // Pistol and Rifle
        el.style.width = '12px';
        el.style.height = '6px';
        el.style.background = b.type === 'rifle' ? '#ff0' : '#fa0';
        el.style.boxShadow = `0 0 6px 2px ${b.type === 'rifle' ? '#ff0' : '#fa0'}`;
    }
    
    el.style.left = b.x + 'px';
    el.style.bottom = b.y + 'px';
    container.appendChild(el);
  });
}

// Thêm event listeners cho việc chọn character và weapon
document.addEventListener('DOMContentLoaded', () => {
  // Character selection - both in character panel and modals
  const setupCharacterSelection = () => {
    const characterOptions = document.querySelectorAll('.character-option');
    characterOptions.forEach(option => {
      option.onclick = () => {
        // Remove selected from all options in the same container
        const container = option.closest('.character-grid') || option.closest('.modal-grid');
        if (container) {
          container.querySelectorAll('.character-option').forEach(opt => opt.classList.remove('selected'));
        }
        // Add selected to clicked option
        option.classList.add('selected');
        
        // Update selection
        if (option.closest('.selection-modal')) {
          tempSelectedCharacter = option.dataset.char;
        } else {
          selectedCharacter = option.dataset.char || 'warrior';
        }
      };
    });
  };

  // Weapon selection - both in weapon panel and modals
  const setupWeaponSelection = () => {
    const weaponOptions = document.querySelectorAll('.weapon-option');
    weaponOptions.forEach(option => {
      option.onclick = () => {
        // Remove selected from all options in the same container
        const container = option.closest('.weapon-grid') || option.closest('.modal-grid');
        if (container) {
          container.querySelectorAll('.weapon-option').forEach(opt => opt.classList.remove('selected'));
        }
        // Add selected to clicked option
        option.classList.add('selected');
        
        // Update selection
        if (option.closest('.selection-modal')) {
          tempSelectedWeapon = option.dataset.weapon;
        } else {
          selectedWeapon = option.dataset.weapon || 'pistol';
        }
      };
    });
  };

  // Initialize selections
  setupCharacterSelection();
  setupWeaponSelection();
  
  // Re-setup when content changes
  setTimeout(() => {
    setupCharacterSelection();
    setupWeaponSelection();
  }, 100);
});

// Thêm đăng nhập Google Firebase
function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(result => {
      userName = result.user.displayName || result.user.email || "Người chơi";
      showPanel("character");
    })
    .catch(err => {
      console.log('Google login error:', err);
      alert("Đăng nhập Google thất bại!");
    });
}

// Kết nối nút Google với function
document.addEventListener('DOMContentLoaded', () => {
  const googleBtn = document.getElementById('google-login-btn');
  if (googleBtn) {
    googleBtn.onclick = googleLogin;
  }
});

// Tự động nhận diện đăng nhập Google nếu đã đăng nhập trước đó
firebase.auth().onAuthStateChanged(user => {
  if (user && !userName) {
    userName = user.displayName || user.email || "Người chơi";
    // Nếu đã đăng nhập Google, chuyển thẳng đến character selection
    showPanel("character");
  }
});

// Thêm hàm xóa phòng
window.deleteRoom = function(roomId) {
  if (confirm('Bạn có chắc muốn xóa phòng ' + roomId + ' không?')) {
    db.ref('rooms/' + roomId).remove().then(() => {
      loadRoomList();
    });
  }
};

// Áp dụng giảm sát thương nếu có giáp khi bị bắn hoặc đánh
function applyShieldDamage(hp, shield, dmg) {
  if (shield && shield > 0) {
    const reduced = Math.ceil(dmg * 0.9); // Giảm 10%
    return { hp: Math.max(0, hp - reduced), shield };
  }
  return { hp: Math.max(0, hp - dmg), shield };
}

// Character and weapon data for display
const CHARACTER_INFO = {
  warrior: { name: "Warrior", stats: "HP: 150, Giáp +20%" },
  scout: { name: "Scout", stats: "Tốc độ +20%, HP: 100" },
  mage: { name: "Mage", stats: "Năng lượng +30%, HP: 80" }
};

const WEAPON_INFO = {
  pistol: { name: "Pistol", stats: "Cân bằng" },
  shotgun: { name: "Shotgun", stats: "Sát thương gần" },
  rifle: { name: "Rifle", stats: "Tấn công xa" }
};

// Update current selection display
function updateCurrentSelection() {
  // Update character display
  const charPreview = document.getElementById('current-char-preview');
  const charName = document.getElementById('current-char-name');
  const charStats = document.getElementById('current-char-stats');
  
  charPreview.className = `selection-preview char-preview ${selectedCharacter}`;
  charName.textContent = CHARACTER_INFO[selectedCharacter].name;
  charStats.textContent = CHARACTER_INFO[selectedCharacter].stats;
  
  // Update weapon display
  const weaponPreview = document.getElementById('current-weapon-preview');
  const weaponName = document.getElementById('current-weapon-name');
  const weaponStats = document.getElementById('current-weapon-stats');
  
  weaponPreview.className = `selection-preview weapon-preview ${selectedWeapon}`;
  weaponName.textContent = WEAPON_INFO[selectedWeapon].name;
  weaponStats.textContent = WEAPON_INFO[selectedWeapon].stats;
}

// Modal functions
let tempSelectedCharacter = null;
let tempSelectedWeapon = null;

function openCharacterModal() {
  const modal = document.getElementById('character-modal');
  modal.classList.add('show');
  tempSelectedCharacter = selectedCharacter;
  
  // Update modal character options
  const options = modal.querySelectorAll('.character-option');
  options.forEach(option => {
    option.classList.remove('selected');
    if (option.dataset.char === selectedCharacter) {
      option.classList.add('selected');
    }
    
    // Add click event
    option.onclick = () => {
      options.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      tempSelectedCharacter = option.dataset.char;
    };
  });
}

function closeCharacterModal() {
  const modal = document.getElementById('character-modal');
  modal.classList.remove('show');
  tempSelectedCharacter = null;
}

function confirmCharacterChange() {
  if (tempSelectedCharacter && tempSelectedCharacter !== selectedCharacter) {
    selectedCharacter = tempSelectedCharacter;
    updateCurrentSelection();
    
    // Update login panel selection if still there
    const loginOptions = document.querySelectorAll('#login-panel .character-option');
    loginOptions.forEach(option => {
      option.classList.remove('selected');
      if (option.dataset.char === selectedCharacter) {
        option.classList.add('selected');
      }
    });
  }
  closeCharacterModal();
}

function openWeaponModal() {
  const modal = document.getElementById('weapon-modal');
  modal.classList.add('show');
  tempSelectedWeapon = selectedWeapon;
  
  // Update modal weapon options
  const options = modal.querySelectorAll('.weapon-option');
  options.forEach(option => {
    option.classList.remove('selected');
    if (option.dataset.weapon === selectedWeapon) {
      option.classList.add('selected');
    }
    
    // Add click event
    option.onclick = () => {
      options.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      tempSelectedWeapon = option.dataset.weapon;
    };
  });
}

function closeWeaponModal() {
  const modal = document.getElementById('weapon-modal');
  modal.classList.remove('show');
  tempSelectedWeapon = null;
}

function confirmWeaponChange() {
  if (tempSelectedWeapon && tempSelectedWeapon !== selectedWeapon) {
    selectedWeapon = tempSelectedWeapon;
    updateCurrentSelection();
    
    // Update login panel selection if still there
    const loginOptions = document.querySelectorAll('#login-panel .weapon-option');
    loginOptions.forEach(option => {
      option.classList.remove('selected');
      if (option.dataset.weapon === selectedWeapon) {
        option.classList.add('selected');
      }
    });
  }
  closeWeaponModal();
}

// Close modals when clicking outside
window.onclick = function(event) {
  const charModal = document.getElementById('character-modal');
  const weaponModal = document.getElementById('weapon-modal');
  
  if (event.target === charModal) {
    closeCharacterModal();
  }
  if (event.target === weaponModal) {
    closeWeaponModal();
  }
};

// Make functions global
window.openCharacterModal = openCharacterModal;
window.closeCharacterModal = closeCharacterModal;
window.confirmCharacterChange = confirmCharacterChange;
window.openWeaponModal = openWeaponModal;
window.closeWeaponModal = closeWeaponModal;
window.confirmWeaponChange = confirmWeaponChange;