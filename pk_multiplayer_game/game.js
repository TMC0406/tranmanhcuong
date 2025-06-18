let userName = "";
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

// Ẩn/hiện UI
function showPanel(panel) {
  document.getElementById("login-panel").style.display = panel === "login" ? "block" : "none";
  document.getElementById("room-panel").style.display = panel === "room" ? "block" : "none";
  document.getElementById("game-ui").style.display = panel === "game" ? "block" : "none";
}
showPanel("login");

// Đăng nhập
const loginBtn = document.getElementById("login-btn");
loginBtn.onclick = () => {
  const name = document.getElementById("username-input").value.trim();
  if (!name) return alert("Vui lòng nhập tên!");
  userName = name;
  showPanel("room");
  loadRoomList();
};

// Tạo phòng mới với obstacle random
const createRoomBtn = document.getElementById("create-room-btn");
createRoomBtn.onclick = () => {
  const newRoomId = "room-" + Math.floor(Math.random() * 100000);
  // Sinh 2-4 obstacle random, đảm bảo không sát nhau (cách nhau ít nhất 30px)
  const obstacles = [];
  const numObs = 2 + Math.floor(Math.random() * 3);
  let tries = 0;
  while (obstacles.length < numObs && tries < 1000) {
    tries++;
    const w = 40 + Math.floor(Math.random() * 60);
    const h = 40 + Math.floor(Math.random() * 60);
    const x = Math.floor(Math.random() * 600) + 50;
    const y = Math.floor(Math.random() * 300) + 50;
    // Không sát obstacle khác (cách nhau ít nhất 30px)
    let overlap = false;
    for (const o of obstacles) {
      if (
        x + w + 30 > o.x && x < o.x + o.w + 30 &&
        y + h + 30 > o.y && y < o.y + o.h + 30
      ) {
        overlap = true;
        break;
      }
    }
    if (!overlap) obstacles.push({ x, y, w, h });
  }
  db.ref(`rooms/${newRoomId}`).set({ created: Date.now(), obstacles, players: {} });
  joinRoom(newRoomId);
};

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
  hp = MAX_HP;  // Dùng hằng số máu tối đa
  energy = 0;
  direction = "right";
  
  // Tạo reference mới
  playerRef = db.ref(`rooms/${roomId}/players/${playerId}`);
  
  // Hiển thị ID phòng
  document.getElementById("room-id").textContent = roomId;
  
  // Cập nhật dữ liệu người chơi lên Firebase
  playerRef.set({ 
    x, y, hp, energy, 
    name: userName, 
    attacking: false, 
    skill_ready: false, 
    direction,
    shield // Lưu trạng thái giáp lên firebase
  });
  
  // Thiết lập cleanup khi disconnect
  playerRef.onDisconnect().remove();
  setupRoomAutoCleanup(roomId);
  
  // Chuyển sang màn hình game
  showPanel("game");
  
  // Đăng ký lại các listener
  if (window._playersListener) window._playersListener.off();
  if (window._bulletsListener) window._bulletsListener.off();
  
  window._playersListener = db.ref(`rooms/${roomId}/players`);
  window._bulletsListener = db.ref(`rooms/${roomId}/bullets`);
  window._playersListener.on("value", renderPlayers);
  window._bulletsListener.on("value", bulletsListener);
  
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
  db.ref(`rooms/${roomId}/obstacles`).on('value', snap => {
    obstacles = snap.val() || [];
    renderObstacles(obstacles);
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
    // Tạo giáp khi bấm l hoặc 2
    if (["l", "2", "д", "Д"].includes(e.key)) createShield();
  };
  window.onkeyup = e => {
    keys[e.key] = false;
  };
}

function createShield() {
  if (shield < MAX_SHIELD && hp > 2 && energy >= 2) {
    shield++;
    hp -= 2;
    energy -= 2;
    playerRef.update({ shield, hp, energy });
  }
}

let lastSentX = x, lastSentY = y, lastSentDir = direction;
let lastUpdateTime = 0;

function gameLoop() {
  let moved = false;
  let nextX = x, nextY = y;
  // Di chuyển cho mọi ngôn ngữ
  if (keys["a"] || keys["ArrowLeft"] || keys["ф"] || keys["Ф"] || keys["щ"] || keys["Щ"]) { nextX -= 4; moved = true; direction = "left"; }
  if (keys["d"] || keys["ArrowRight"] || keys["в"] || keys["В"]) { nextX += 4; moved = true; direction = "right"; }
  if (keys["w"] || keys["ArrowUp"] || keys["ц"] || keys["Ц"]) { nextY += 4; moved = true; }
  if (keys["s"] || keys["ArrowDown"] || keys["ы"] || keys["Ы"]) { nextY -= 4; moved = true; }
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
    x = nextX;
    y = nextY;
  }
  // Chỉ update Firebase nếu vị trí hoặc hướng thay đổi, và không quá 20ms/lần
  const now = Date.now();
  if ((x !== lastSentX || y !== lastSentY || direction !== lastSentDir || moved !== false) && now - lastUpdateTime > 20) {
    playerRef.update({ x, y, moving: moved, direction });
    lastSentX = x;
    lastSentY = y;
    lastSentDir = direction;
    lastUpdateTime = now;
  }
  updateBullets();
  renderBullets();
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
        db.ref(`rooms/${roomId}/players/${p.key}/hp`).transaction(hp => Math.max(0, hp - 5)); // Đòn đánh cận chiến cũng trừ 5hp
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
  // Đạn thường
  const bullet = {
    x: direction === "right" ? x + 40 : x - 10,
    y: y + 20,
    dir: direction,
    owner: playerId,
    time: Date.now(),
    type: "normal"
  };
  db.ref(`rooms/${roomId}/bullets`).push(bullet);
  // Tăng năng lượng khi bắn thường (1 điểm mỗi lần bắn)
  playerRef.once("value", snap => {
    let e = (snap.val().energy || 0) + 1;
    if (e > MAX_ENERGY) e = MAX_ENERGY;
    playerRef.update({ energy: e, skill_ready: e >= 2 });  // Chỉ cần 2 năng lượng để dùng skill
  });
}

// Bắn kỹ năng đặc biệt
function useSkill() {
  playerRef.once("value", snap => {
    const data = snap.val();
    if ((data.energy || 0) >= 2) {  // Chỉ cần 2 năng lượng để dùng skill
      // Đạn đặc biệt
      const bullet = {
        x: direction === "right" ? x + 40 : x - 10,
        y: y + 20,
        dir: direction,
        owner: playerId,
        time: Date.now(),
        special: true
      };
      db.ref(`rooms/${roomId}/bullets`).push(bullet);
      playerRef.update({ energy: data.energy - 2, skill_ready: false });  // Trừ 2 năng lượng
    }
  });
}

function updateBullets() {
  const speed = 10;
  const bulletsToRemove = [];

  bullets = bullets.filter(b => {
    if (b.owner === playerId) {
      b.x += b.dir === "right" ? speed : -speed;
      
      // Kiểm tra va chạm obstacle
      const bulletWidth = b.special ? 32 : 12;
      const bulletHeight = b.special ? 32 : 12;
      
      // Kiểm tra va chạm với chướng ngại vật
      for (const o of obstacles) {
        if (
          b.x < o.x + o.w &&
          b.x + bulletWidth > o.x &&
          b.y < o.y + o.h &&
          b.y + bulletHeight > o.y
        ) {
          bulletsToRemove.push(b._key);
          return false;
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
            if (b.special) {
              if (Math.abs(b.x - data.x) < 60 && Math.abs(b.y - data.y) < 60) {
                db.ref(`rooms/${roomId}/players/${p.key}/hp`).transaction(hp => Math.max(0, hp - 10)); // Skill trừ 10hp
                hitPlayer = true;
              }
            } else {
              if (Math.abs(b.x - data.x) < 30 && Math.abs(b.y - data.y) < 40) {
                db.ref(`rooms/${roomId}/players/${p.key}/hp`).transaction(hp => Math.max(0, hp - 5)); // Đạn thường trừ 5hp
                hitPlayer = true;
              }
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

  // Xóa tất cả đạn cần xóa một lần
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
    if (b.special) {
      el.className = 'bullet special-bullet';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.boxShadow = '0 0 16px 8px #0af8';
      el.style.background = 'radial-gradient(circle, #0af 60%, #fff0 100%)';
    } else {
      el.className = 'bullet';
    }
    el.style.left = b.x + 'px';
    el.style.bottom = b.y + 'px';
    container.appendChild(el);
  });
}

db.ref(`rooms/${roomId}/players`).on("value", snap => {
  const container = document.getElementById("game-container");
  // container.innerHTML = "";
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

    if (p.key === playerId) currentPlayer = data;
  });
});

// Thêm đăng nhập Google Firebase
function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(result => {
      userName = result.user.displayName || result.user.email || "Người chơi";
      showPanel("room");
      loadRoomList();
    })
    .catch(err => {
      console.log('Google login error:', err);
      alert("Đăng nhập Google thất bại!");
    });
}

// Thêm nút Google vào login-panel
const googleBtn = document.createElement("button");
googleBtn.innerText = "Đăng nhập với Google";
googleBtn.onclick = googleLogin;
document.getElementById("login-panel").appendChild(googleBtn);

// Tự động nhận diện đăng nhập Google nếu đã đăng nhập trước đó
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    userName = user.displayName || user.email || "Người chơi";
    showPanel("room");
    loadRoomList();
  } else {
    showPanel("login");
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

// Sửa các chỗ trừ máu khi bị bắn hoặc đánh
// Đạn thường
if (Math.abs(b.x - data.x) < 30 && Math.abs(b.y - data.y) < 40) {
  let newHp = data.hp;
  let newShield = data.shield || 0;
  if (newShield > 0) {
    if (5 <= 10) {
      newShield--;
      // Đạn thường 5 sát thương, giáp chặn hết, máu không giảm
    }
  } else {
    newHp = Math.max(0, newHp - 5);
  }
  db.ref(`rooms/${roomId}/players/${p.key}`).update({ hp: newHp, shield: newShield });
  hitPlayer = true;
}
// Đạn skill
if (Math.abs(b.x - data.x) < 60 && Math.abs(b.y - data.y) < 60) {
  let newHp = data.hp;
  let newShield = data.shield || 0;
  if (newShield > 0) {
    if (10 <= 10) {
      newShield--;
      // Skill 10 sát thương, giáp chặn hết, máu không giảm
    }
  } else {
    newHp = Math.max(0, newHp - 10);
  }
  db.ref(`rooms/${roomId}/players/${p.key}`).update({ hp: newHp, shield: newShield });
  hitPlayer = true;
}
// Đánh cận chiến
if (p.key !== playerId && Math.abs(p.val().x - x) < 50) {
  let newHp = p.val().hp;
  let newShield = p.val().shield || 0;
  if (newShield > 0) {
    if (5 <= 10) {
      newShield--;
      // Đánh cận chiến 5 sát thương, giáp chặn hết, máu không giảm
    }
  } else {
    newHp = Math.max(0, newHp - 5);
  }
  db.ref(`rooms/${roomId}/players/${p.key}`).update({ hp: newHp, shield: newShield });
}